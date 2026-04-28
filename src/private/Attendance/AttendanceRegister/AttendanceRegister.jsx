import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSelector } from "react-redux";
import batchService from "@/appwrite/batchService";
import batchStudentService from "@/appwrite/batchStudentService";
import { Query } from "appwrite";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import userProfileService from "@/appwrite/userProfileService";
import AttendanceHeader from "./components/AttendanceHeader";
import AttendanceTable from "./components/AttendanceTable";
import LoadingSpinner from "./components/LoadingSpinner";
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";
import {
  format,
  getDaysInMonth,
  addMonths,
  subMonths,
  endOfMonth,
} from "date-fns";
import MarkAttendanceModal from "./components/MarkAttendanceModal";
import StudentAttendanceEditModal from "./components/StudentAttendanceEditModal";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";
import Legent from "./components/Legent";
import { useAttendanceRealtime } from "./hooks/useAttendanceRealtime";
import { toast } from "react-toastify";
import { DEFAULT_VISIBILITY } from "./components/ColumnGroupConfig";

const AttendanceRegister = () => {
  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);

  // Use ref to track if initial fetch is done to prevent double fetching
  const initialFetchDone = useRef(false);
  const abortControllerRef = useRef(null);

  // State management
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_VISIBILITY);
  const [batches, setBatches] = useState(new Map());
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [holidays, setHolidays] = useState(new Map());
  const [newAttendance, setNewAttendance] = useState([]);
  const [newStudentStatsMap, setStudentStatsMap] = useState(new Map());

  // Initialize Realtime Sync
  useAttendanceRealtime(selectedBatch, selectedMonth, setNewAttendance);

  // Simplified loading states
  const [loading, setLoading] = useState({
    initial: true, // For first load only
    students: false,
    attendance: false,
    stats: false,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updatingAttendance, setUpdatingAttendance] = useState(new Map());

  // Helper to update loading states
  const updateLoading = useCallback((key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Memoized attendance map
  const newAttendanceMap = useMemo(() => {
    const map = new Map();
    newAttendance.forEach((att) => {
      const existedMap = map.get(att.userId);
      if (existedMap) {
        existedMap.set(att.date, att.status);
      } else {
        const newMap = new Map();
        newMap.set(att.date, att.status);
        map.set(att.userId, newMap);
      }
    });
    return map;
  }, [newAttendance]);

  // Check if student is being updated
  const isStudentUpdating = useCallback(
    (studentId) => {
      for (const key of updatingAttendance.keys()) {
        if (key.startsWith(`${studentId}-`)) {
          return true;
        }
      }
      return false;
    },
    [updatingAttendance],
  );

  // Fetch batches - fixed to prevent double fetching
  const fetchBatches = useCallback(async () => {
    if (!profile?.userId) {
      updateLoading("initial", false);
      return;
    }

    // Prevent double fetching
    if (initialFetchDone.current) return;

    console.log("loading batches");

    try {
      const response = await batchService.listBatches([
        Query.equal("teacherId", profile.userId),
        Query.equal("isActive", true),
        Query.select(["$id", "BatchName", "start_date", "end_date", "tradeId"]),
      ]);

      const newMap = new Map();
      response.documents.forEach((batch) => {
        newMap.set(batch.$id, batch);
      });

      setBatches(newMap);

      // Auto-select first batch
      if (response.documents.length > 0) {
        setSelectedBatch(response.documents[response.documents.length - 1].$id);
      }

      initialFetchDone.current = true;
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      updateLoading("initial", false);
    }
  }, [profile?.userId, updateLoading]);

  // Fetch students and holidays for selected batch
  const fetchStudentsAndHolidays = useCallback(async () => {
    if (!selectedBatch || !batches.has(selectedBatch)) return;

    console.log("loading students and holidays");

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      updateLoading("students", true);
      setStudents([]);
      setHolidays(new Map());
      setNewAttendance([]);
      setStudentStatsMap(new Map());
      setUpdatingAttendance(new Map());
      lastFetchedAttendanceKey.current = null;
      lastFetchedStatsKey.current = null;

      const batch = batches.get(selectedBatch);

      // Fetch holidays and students in parallel
      const [holidaysData, studentsData] = await Promise.all([
        holidayService.getBatchHolidays(selectedBatch).catch((err) => {
          console.error("Error fetching holidays:", err);
          return [];
        }),
        (async () => {
          const batchMembers =
            await batchStudentService.getBatchStudents(selectedBatch);
            
          const memberMap = new Map();
          const studentIds = [];
          
          batchMembers.forEach((member) => {
            if (member.studentId) {
              memberMap.set(member.studentId, member);
              studentIds.push(member.studentId);
            }
          });

          if (studentIds.length === 0) {
            return [];
          }

          const profiles = await userProfileService.getBatchUserProfile([
            Query.equal("userId", studentIds),
            Query.select(["$id", "userId", "userName", "profileImage"]),
            Query.limit(100),
          ]);

          const mappedStudents = profiles.map(profile => ({
             ...profile,
             studentId: memberMap.get(profile.userId)?.rollNumber || null
          }));

          return mappedStudents.sort((a, b) => {
             const valA = a.studentId ? parseInt(a.studentId) : Infinity;
             const valB = b.studentId ? parseInt(b.studentId) : Infinity;
             return valA - valB;
          });
        })(),
      ]);

      // Process holidays
      const holidayMap = new Map();
      holidaysData.forEach((holiday) => {
        holidayMap.set(holiday.date, holiday);
      });
      setHolidays(holidayMap);

      // Set students
      let finalStudents = studentsData;
      if (user?.labels?.includes("Teacher")) {
        const teacherProfile = {
          $id: profile.$id || profile.userId,
          userId: profile.userId,
          userName: `${profile.userName || profile.name || "Instructor"} - Teacher`,
          studentId: "Teacher",
          profileImage: profile.profileImage || "",
          isTeacher: true,
        };
        finalStudents = [teacherProfile, ...studentsData];
      }
      setStudents(finalStudents);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching students and holidays:", error);
        setStudents([]);
      }
    } finally {
      updateLoading("students", false);
    }
  }, [selectedBatch, batches, updateLoading, profile, user]);

  // Cache refs to prevent re-fetching
  const lastFetchedAttendanceKey = useRef(null);
  const lastFetchedStatsKey = useRef(null);

  // Fetch attendance and student statistics together
  const fetchAttendanceAndStats = useCallback(async () => {
    if (!selectedBatch || !students || students.length === 0) {
      updateLoading("attendance", false);
      updateLoading("stats", false);
      return;
    }

    const batch = batches.get(selectedBatch);
    if (!batch?.start_date) return;

    const currentKey = `${selectedBatch}-${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`;
    const needsAttendance = lastFetchedAttendanceKey.current !== currentKey;
    const needsStats = columnVisibility.previous && lastFetchedStatsKey.current !== currentKey;

    if (!needsAttendance && !needsStats) return;

    console.log("loading attendance and/or stats");

    try {
      if (needsAttendance) updateLoading("attendance", true);
      if (needsStats) updateLoading("stats", true);

      const studentIds = students.map((student) => student.userId);
      const currentBatchStartDate = batch.start_date;
      const endDate = endOfMonth(subMonths(selectedMonth, 1)).toISOString();

      const promises = [];
      
      if (needsAttendance) {
        promises.push(
          newAttendanceService.getMonthlyAttendance(
            studentIds,
            selectedBatch,
            selectedMonth.getFullYear(),
            selectedMonth.getMonth() + 1,
          )
        );
      } else {
        promises.push(Promise.resolve(null)); // Placeholder to keep array index aligned
      }

      if (needsStats) {
        promises.push(
          ...students.map((student) =>
            newAttendanceService.getStudentAttendanceStats(
              student.userId,
              selectedBatch,
              currentBatchStartDate,
              endDate,
            ),
          )
        );
      }

      const results = await Promise.all(promises);

      // Update attendance if fetched
      if (needsAttendance) {
        setNewAttendance(results[0].documents);
        lastFetchedAttendanceKey.current = currentKey;
      }

      // Update stats if fetched
      if (needsStats) {
        const allStats = results.slice(1);
        const statsMap = new Map();
        students.forEach((student, index) => {
          statsMap.set(student.userId, allStats[index]);
        });
        setStudentStatsMap(statsMap);
        lastFetchedStatsKey.current = currentKey;
      }
    } catch (error) {
      console.error("Error fetching attendance and stats:", error);
      if (needsAttendance) setNewAttendance([]);
    } finally {
      updateLoading("attendance", false);
      updateLoading("stats", false);
    }
  }, [selectedBatch, students, selectedMonth, batches, updateLoading, columnVisibility.previous]);

  // Handle attendance status change
  const onAttendanceStatusChange = async (userId, date, newStatus) => {
    // Block marking for future dates
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (date > todayStr) {
      toast.error("Cannot mark attendance for future dates");
      return;
    }

    const key = `${userId}-${date}`;
    setUpdatingAttendance((prev) => new Map(prev).set(key, true));

    try {
      const existingRecord = newAttendance.find(
        (att) => att.userId === userId && att.date === date,
      );

      let attendanceResponse;
      if (existingRecord) {
        attendanceResponse = await newAttendanceService.updateAttendance(
          existingRecord.$id,
          { status: newStatus },
        );
      } else {
        const batch = batches.get(selectedBatch);
        attendanceResponse = await newAttendanceService.createAttendance({
          userId,
          batchId: selectedBatch,
          tradeId: batch?.tradeId || null,
          date,
          status: newStatus,
          remarks: null,
        });
      }

      setNewAttendance((prev) => {
        return [
          ...prev.filter((att) => att.$id !== attendanceResponse.$id),
          attendanceResponse,
        ];
      });

      // Refresh stats only, not attendance
      const batch = batches.get(selectedBatch);
      const currentBatchStartDate = batch.start_date;
      const endDate = endOfMonth(subMonths(selectedMonth, 1)).toISOString();

      const updatedStats = await newAttendanceService.getStudentAttendanceStats(
        userId,
        selectedBatch,
        currentBatchStartDate,
        endDate,
      );

      setStudentStatsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, updatedStats);
        return newMap;
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
    } finally {
      setUpdatingAttendance((prev) => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    }
  };

  // Handle batch attendance save
  const handleSaveAttendance = async (statuses) => {
    try {
      const batch = batches.get(selectedBatch);
      const records = Object.entries(statuses).map(([userId, status]) => ({
        userId,
        batchId: selectedBatch,
        tradeId: batch?.tradeId || null,
        date: selectedDate,
        status,
        marketAt: new Date().toISOString(),
        remarks: null,
      }));

      const response = await newAttendanceService.markBatchAttendance(
        selectedBatch,
        selectedDate,
        records,
      );

      setNewAttendance((prev) => {
        const successIds = new Set(
          response.success.map((record) => record.$id),
        );
        return [
          ...prev.filter((att) => !successIds.has(att.$id)),
          ...response.success,
        ];
      });

      handleCloseModal();
      // await fetchAttendanceAndStats();
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  const handleRemoveHoliday = async (date) => {
    setLoading("holiday", true);
    try {
      const holiday = holidays.get(date);
      const res = await holidayService.removeHoliday(holiday.$id);
      setHolidays((prev) => {
        const newMap = new Map(prev);
        newMap.delete(date);
        return newMap;
      });
      toast.success("Holiday removed successfully");
    } catch (error) {
      console.error("Error removing holiday:", error);
    } finally {
      setLoading("holiday", false);
    }
  };

  const handleAddHoliday = async (date, holidayText) => {
    setLoading("holiday", true);

    try {
      // 1. Identify attendance records that need to be removed
      const attendanceToDelete = newAttendance.filter(
        (att) => att.date === date,
      );

      const idsToDelete = attendanceToDelete.map((att) => att.$id);
      let deletionSuccess = true;

      // 2. If there are records, attempt to delete them
      if (idsToDelete.length > 0) {
        const deletedIds =
          await newAttendanceService.deleteMultipleAttendance(idsToDelete);

        console.log("Requested delete count:", idsToDelete.length);
        console.log("Actual deleted count:", deletedIds.length);

        // STRICT CHECK: Only proceed if deleted count matches requested count
        if (deletedIds.length !== idsToDelete.length) {
          deletionSuccess = false;
          throw new Error(
            "Partial deletion occurred. Cannot safely add holiday.",
          );
        }

        // 3. Update local attendance state (remove deleted records)
        setNewAttendance((prev) =>
          prev.filter((att) => !deletedIds.includes(att.$id)),
        );
      }

      // 4. Only add Holiday if deletion was successful (or if there was nothing to delete)
      if (deletionSuccess) {
        const holidayRes = await holidayService.addHoliday({
          date,
          batchId: selectedBatch,
          holidayText,
        });

        // Update Holiday State
        setHolidays((prev) => {
          const newMap = new Map(prev);
          newMap.set(date, holidayRes);
          return newMap;
        });

        toast.success("Holiday added and attendance cleared successfully");
      }
    } catch (error) {
      console.error("Add Holiday Error:", error);
      // If the error came from the deletion check, show specific message
      if (error.message.includes("Partial deletion")) {
        toast.error("Could not clear existing attendance. Holiday not added.");
      } else {
        toast.error("Error adding holiday");
      }
    } finally {
      setLoading("holiday", false);
    }
  };

  // Modal handlers
  const handleOpenModal = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleOpenStudentModal = (student) => {
    setSelectedStudent(student);
  };

  const handleCloseStudentModal = () => {
    setSelectedStudent(null);
  };

  // ── Stable batch start date ──────────────────────────────────────────────
  const batchStartDate = useMemo(() => {
    const data = batches.get(selectedBatch);
    if (!data?.start_date) return null;
    const d = new Date(data.start_date);
    // Normalise to local midnight of the 1st of that month (used for nav clamping)
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [batches, selectedBatch]);

  // Raw start date preserving the actual day — used for column filtering
  const rawBatchStartDate = useMemo(() => {
    const data = batches.get(selectedBatch);
    if (!data?.start_date) return null;
    const d = new Date(data.start_date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, [batches, selectedBatch]);

  // When batch changes, clamp selectedMonth into the valid window
  // (batchStart → current month). This prevents the header from ever
  // showing a month that pre-dates the batch.
  useEffect(() => {
    if (!batchStartDate) return;
    const now = new Date();
    const maxMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (selectedMonth < batchStartDate) {
      setSelectedMonth(batchStartDate);
    } else if (selectedMonth > maxMonth) {
      setSelectedMonth(maxMonth);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchStartDate]); // only run when the batch (and its start) changes

  // ── Month navigation ─────────────────────────────────────────────────────
  const handlePrevMonth = useCallback(() => {
    const prev = subMonths(selectedMonth, 1);
    if (batchStartDate && prev < batchStartDate) return;
    setSelectedMonth(prev);
  }, [selectedMonth, batchStartDate]);

  const handleNextMonth = useCallback(() => {
    const next = addMonths(selectedMonth, 1);
    const maxMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (next > maxMonth) return;
    setSelectedMonth(next);
  }, [selectedMonth]);

  const handleMonthChange = useCallback((event) => {
    // Called from AttendanceHeader with { target: { value: "yyyy-MM" } }
    const raw   = event.target.value; // "yyyy-MM"
    const parts = raw.split("-");
    // Build a LOCAL midnight date to avoid UTC parse surprises
    const next  = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    const maxMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (batchStartDate && next < batchStartDate) return;
    if (next > maxMonth) return;
    setSelectedMonth(next);
  }, [batchStartDate]);

  // Effect: Fetch batches only once on mount
  useEffect(() => {
    if (profile?.userId && !initialFetchDone.current) {
      fetchBatches();
    }

    return () => {
      initialFetchDone.current = false;
    };
  }, [profile?.userId, fetchBatches]);

  // Effect: Fetch students when batch changes
  useEffect(() => {
    if (selectedBatch) {
      fetchStudentsAndHolidays();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedBatch, fetchStudentsAndHolidays]);

  // Effect: Fetch attendance and stats when students or month changes
  useEffect(() => {
    if (students.length > 0) {
      fetchAttendanceAndStats();
    }
  }, [students, selectedMonth, fetchAttendanceAndStats]);

  // Check if initial load is complete
  if (loading.initial) {
    return <LoadingSpinner />;
  }

  // Check if no batches
  if (batches.size === 0) {
    const isTeacher = user?.labels?.includes("Teacher") || user?.labels?.includes("admin");
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 overflow-hidden flex items-center justify-center">
         <NoBatchTeacherView isTeacher={isTeacher} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-full mx-auto">
        <AttendanceHeader
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          batches={[...batches.values()]}
          selectedMonth={selectedMonth}
          handlePrevMonth={handlePrevMonth}
          handleNextMonth={handleNextMonth}
          handleMonthChange={handleMonthChange}
          formatDate={format}
          loading={loading}
          holidays={holidays}
          handleAddHoliday={handleAddHoliday}
          handleRemoveHoliday={handleRemoveHoliday}
          batchStartDate={batchStartDate}
        />

        <AttendanceTable
          students={students}
          selectedMonth={selectedMonth}
          holidays={holidays}
          attendanceMap={newAttendanceMap}
          calculatePreviousMonthsData={newStudentStatsMap}
          formatDate={format}
          getDaysInMonth={getDaysInMonth}
          onMarkAttendance={handleOpenModal}
          onAttendanceStatusChange={onAttendanceStatusChange}
          updatingAttendance={updatingAttendance}
          isStudentUpdating={isStudentUpdating}
          loading={loading}
          selectedBatch={selectedBatch}
          batchStartDate={rawBatchStartDate}
          onOpenStudentAttendanceModal={handleOpenStudentModal}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />

        <Legent />

        <StudentAttendanceEditModal
          isOpen={!!selectedStudent}
          onClose={handleCloseStudentModal}
          student={selectedStudent}
          selectedMonth={selectedMonth}
          attendanceMap={newAttendanceMap.get(selectedStudent?.userId) || new Map()}
          holidays={holidays}
          onAttendanceStatusChange={onAttendanceStatusChange}
          updatingAttendance={updatingAttendance}
        />

        <MarkAttendanceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          students={students}
          date={selectedDate}
          batchId={selectedBatch}
          onSave={handleSaveAttendance}
          existingAttendance={newAttendance}
          holidays={holidays}
          handleAddHoliday={handleAddHoliday}
          handleRemoveHoliday={handleRemoveHoliday}
        />
      </div>
    </div>
  );
};

export default AttendanceRegister;
