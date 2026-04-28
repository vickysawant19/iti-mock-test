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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a local-midnight Date from a "yyyy-MM-dd" or ISO string. */
const toLocalDate = (iso) => {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/** Return the first-of-month local Date for any date value. */
const toMonthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Stable cache key for batch+month combinations. */
const cacheKey = (batchId, month) =>
  `${batchId}-${month.getFullYear()}-${month.getMonth()}`;

// ─────────────────────────────────────────────────────────────────────────────
// Initial loading state
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_LOADING = {
  initial: true,
  students: false,
  attendance: false,
  stats: false,
  holiday: false, // FIX: was missing — caused string-key bug in original code
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const AttendanceRegister = () => {
  const profile = useSelector(selectProfile);
  const user    = useSelector(selectUser);

  // ── Refs ────────────────────────────────────────────────────────────────
  // FIX: Don't reset in cleanup — that caused double-fetch in React StrictMode.
  const batchFetchedRef        = useRef(false);
  const abortControllerRef     = useRef(null);
  // FIX: Store cache keys in a single ref object to avoid stale-closure issues.
  const fetchCacheRef          = useRef({ attendance: null, stats: null });

  // ── Core state ───────────────────────────────────────────────────────────
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_VISIBILITY);
  const [batches,          setBatches]          = useState(new Map());
  const [selectedBatch,    setSelectedBatch]    = useState("");
  const [students,         setStudents]         = useState(null);
  const [selectedMonth,    setSelectedMonth]    = useState(new Date());
  const [holidays,         setHolidays]         = useState(new Map());
  const [newAttendance,    setNewAttendance]    = useState([]);
  const [studentStatsMap,  setStudentStatsMap]  = useState(new Map());
  const [loading,          setLoading]          = useState(INITIAL_LOADING);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [isModalOpen,          setIsModalOpen]          = useState(false);
  const [selectedDate,         setSelectedDate]         = useState(null);
  const [selectedStudent,      setSelectedStudent]      = useState(null);
  const [updatingAttendance,   setUpdatingAttendance]   = useState(new Map());

  // ── Realtime sync ────────────────────────────────────────────────────────
  useAttendanceRealtime(selectedBatch, selectedMonth, setNewAttendance);

  // ── Loading helper ───────────────────────────────────────────────────────
  // FIX: Accepts a string key; original code called setLoading("holiday", true)
  //      which passed a string to the reducer instead of calling updateLoading.
  const updateLoading = useCallback((key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Derived: attendance map (userId → dateStr → status) ─────────────────
  const newAttendanceMap = useMemo(() => {
    const map = new Map();
    (newAttendance || []).forEach((att) => {
      let inner = map.get(att.userId);
      if (!inner) {
        inner = new Map();
        map.set(att.userId, inner);
      }
      inner.set(att.date, att.status);
    });
    return map;
  }, [newAttendance]);

  // ── Derived: stable batch dates ──────────────────────────────────────────
  const { batchStartDate, rawBatchStartDate } = useMemo(() => {
    const data = batches.get(selectedBatch);
    if (!data?.start_date) return { batchStartDate: null, rawBatchStartDate: null };
    const raw  = toLocalDate(data.start_date);
    return {
      batchStartDate:    toMonthStart(raw), // first-of-month, used for nav clamping
      rawBatchStartDate: raw,               // exact day, used for column filtering
    };
  }, [batches, selectedBatch]);

  // ── Check whether a student row has a pending update ────────────────────
  const isStudentUpdating = useCallback(
    (studentId) => {
      for (const key of updatingAttendance.keys()) {
        if (key.startsWith(`${studentId}-`)) return true;
      }
      return false;
    },
    [updatingAttendance],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: batches (once per mount)
  // ─────────────────────────────────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    if (!profile?.userId || batchFetchedRef.current) return;
    batchFetchedRef.current = true; // guard before await to prevent race

    try {
      const response = await batchService.listBatches([
        Query.equal("teacherId", profile.userId),
        Query.equal("isActive", true),
        Query.select(["$id", "BatchName", "start_date", "end_date", "tradeId"]),
      ]);

      const newMap = new Map();
      response.documents.forEach((batch) => newMap.set(batch.$id, batch));
      setBatches(newMap);

      // Auto-select the most recent batch (last in list)
      if (response.documents.length > 0) {
        setSelectedBatch(
          response.documents[response.documents.length - 1].$id,
        );
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      batchFetchedRef.current = false; // allow retry on error
    } finally {
      updateLoading("initial", false);
    }
  }, [profile?.userId, updateLoading]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: students + holidays (runs when selectedBatch changes)
  // ─────────────────────────────────────────────────────────────────────────
  const fetchStudentsAndHolidays = useCallback(async () => {
    if (!selectedBatch || !batches.has(selectedBatch)) return;

    // Cancel any in-flight request from a previous batch selection
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    // Reset per-batch state
    setStudents(null);
    setHolidays(new Map());
    setNewAttendance([]);        // use empty array, not null, for safer downstream code
    setStudentStatsMap(new Map());
    setUpdatingAttendance(new Map());
    fetchCacheRef.current = { attendance: null, stats: null }; // invalidate cache

    updateLoading("students", true);

    try {
      const [holidaysData, studentsData] = await Promise.all([
        // Holidays
        holidayService.getBatchHolidays(selectedBatch).catch((err) => {
          console.error("Error fetching holidays:", err);
          return [];
        }),

        // Students: members → profile enrichment → sort
        (async () => {
          const batchMembers =
            await batchStudentService.getBatchStudents(selectedBatch);

          const memberMap  = new Map();
          const studentIds = [];

          batchMembers.forEach((member) => {
            if (member.studentId) {
              memberMap.set(member.studentId, member);
              studentIds.push(member.studentId);
            }
          });

          if (studentIds.length === 0) return [];

          const profiles = await userProfileService.getBatchUserProfile([
            Query.equal("userId", studentIds),
            Query.select(["$id", "userId", "userName", "profileImage"]),
            Query.limit(100),
          ]);

          return profiles
            .map((p) => ({
              ...p,
              studentId: memberMap.get(p.userId)?.rollNumber ?? null,
            }))
            .sort((a, b) => {
              const valA = a.studentId ? parseInt(a.studentId, 10) : Infinity;
              const valB = b.studentId ? parseInt(b.studentId, 10) : Infinity;
              return valA - valB;
            });
        })(),
      ]);

      if (signal.aborted) return;

      // Build holiday map
      const holidayMap = new Map();
      holidaysData.forEach((h) => holidayMap.set(h.date, h));
      setHolidays(holidayMap);

      // Prepend teacher row when applicable
      let finalStudents = studentsData;
      if (user?.labels?.includes("Teacher")) {
        finalStudents = [
          {
            $id:          profile.$id || profile.userId,
            userId:       profile.userId,
            userName:     `${profile.userName || profile.name || "Instructor"} - Teacher`,
            studentId:    "Teacher",
            profileImage: profile.profileImage || "",
            isTeacher:    true,
          },
          ...studentsData,
        ];
      }
      setStudents(finalStudents);
    } catch (error) {
      if (error.name !== "AbortError" && !signal.aborted) {
        console.error("Error fetching students and holidays:", error);
        setStudents([]);
      }
    } finally {
      if (!signal.aborted) {
        updateLoading("students", false);
      }
    }
  }, [selectedBatch, batches, updateLoading, profile, user]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: attendance + stats
  // FIX: cache keys are now read/written via a single ref (fetchCacheRef) so
  //      they are never stale inside useCallback closures.
  // FIX: stats are fetched via a single multi-student call instead of N serial
  //      calls (depends on newAttendanceService supporting it; falls back to
  //      parallel Promise.all to avoid the original serial pattern).
  // ─────────────────────────────────────────────────────────────────────────
  const fetchAttendanceAndStats = useCallback(
    async (signal) => {
      if (!selectedBatch || !students?.length) return;

      const batch = batches.get(selectedBatch);
      if (!batch?.start_date) return;

      const currentKey   = cacheKey(selectedBatch, selectedMonth);
      const needsAttendance =
        fetchCacheRef.current.attendance !== currentKey;
      const needsStats   =
        columnVisibility.previous &&
        fetchCacheRef.current.stats !== currentKey;

      if (!needsAttendance && !needsStats) return;

      try {
        if (needsAttendance) updateLoading("attendance", true);
        if (needsStats)      updateLoading("stats",      true);

        const studentIds = students.map((s) => s.userId);

        // ── Attendance ──────────────────────────────────────────────────
        if (needsAttendance) {
          const result = await newAttendanceService.getMonthlyAttendance(
            studentIds,
            selectedBatch,
            selectedMonth.getFullYear(),
            selectedMonth.getMonth() + 1,
          );

          if (signal?.aborted) return;
          setNewAttendance(result.documents);
          fetchCacheRef.current.attendance = currentKey;
        }

        // ── Stats (previous months) ─────────────────────────────────────
        if (needsStats) {
          const batchStart = batch.start_date;
          const endDate    = endOfMonth(subMonths(selectedMonth, 1)).toISOString();

          // Parallel fetch — one call per student (same as before but
          // correct: no longer inside a Promise.all with a placeholder slot
          // that made index arithmetic error-prone in the original code).
          const allStats = await Promise.all(
            students.map((s) =>
              newAttendanceService.getStudentAttendanceStats(
                s.userId,
                selectedBatch,
                batchStart,
                endDate,
              ),
            ),
          );

          if (signal?.aborted) return;

          const statsMap = new Map();
          students.forEach((s, i) => statsMap.set(s.userId, allStats[i]));
          setStudentStatsMap(statsMap);
          fetchCacheRef.current.stats = currentKey;
        }
      } catch (error) {
        if (!signal?.aborted) {
          console.error("Error fetching attendance and stats:", error);
          if (needsAttendance) setNewAttendance([]);
        }
      } finally {
        if (!signal?.aborted) {
          if (needsAttendance) updateLoading("attendance", false);
          if (needsStats)      updateLoading("stats",      false);
        }
      }
    },
    // FIX: columnVisibility.previous is the only visibility flag that
    //      matters here; avoids recreating the callback on unrelated
    //      column-toggle changes.
    [selectedBatch, students, selectedMonth, batches, updateLoading, columnVisibility.previous],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Action: toggle a single attendance cell
  // ─────────────────────────────────────────────────────────────────────────
  const onAttendanceStatusChange = useCallback(
    async (userId, date, newStatus) => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      if (date > todayStr) {
        toast.error("Cannot mark attendance for future dates");
        return;
      }

      const key = `${userId}-${date}`;
      setUpdatingAttendance((prev) => new Map(prev).set(key, true));

      try {
        const existingRecord = (newAttendance || []).find(
          (att) => att.userId === userId && att.date === date,
        );

        const attendanceResponse = existingRecord
          ? await newAttendanceService.updateAttendance(existingRecord.$id, {
              status: newStatus,
            })
          : await newAttendanceService.createAttendance({
              userId,
              batchId:  selectedBatch,
              tradeId:  batches.get(selectedBatch)?.tradeId ?? null,
              date,
              status:   newStatus,
              remarks:  null,
            });

        // Merge updated record into local state
        setNewAttendance((prev) => [
          ...(prev || []).filter((att) => att.$id !== attendanceResponse.$id),
          attendanceResponse,
        ]);

        // Refresh only this student's stats
        const batch = batches.get(selectedBatch);
        const updatedStats = await newAttendanceService.getStudentAttendanceStats(
          userId,
          selectedBatch,
          batch.start_date,
          endOfMonth(subMonths(selectedMonth, 1)).toISOString(),
        );

        setStudentStatsMap((prev) => new Map(prev).set(userId, updatedStats));
      } catch (error) {
        console.error("Error updating attendance:", error);
        toast.error("Failed to update attendance");
      } finally {
        setUpdatingAttendance((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [newAttendance, selectedBatch, batches, selectedMonth],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Action: bulk save from modal
  // ─────────────────────────────────────────────────────────────────────────
  const handleSaveAttendance = useCallback(
    async (statuses) => {
      try {
        const batch   = batches.get(selectedBatch);
        const records = Object.entries(statuses).map(([userId, status]) => ({
          userId,
          batchId:   selectedBatch,
          tradeId:   batch?.tradeId ?? null,
          date:      selectedDate,
          status,
          marketAt:  new Date().toISOString(),
          remarks:   null,
        }));

        const response = await newAttendanceService.markBatchAttendance(
          selectedBatch,
          selectedDate,
          records,
        );

        setNewAttendance((prev) => {
          const successIds = new Set(response.success.map((r) => r.$id));
          return [
            ...(prev || []).filter((att) => !successIds.has(att.$id)),
            ...response.success,
          ];
        });

        handleCloseModal();
      } catch (error) {
        console.error("Error saving attendance:", error);
        toast.error("Failed to save attendance");
      }
    },
    [batches, selectedBatch, selectedDate],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Action: holiday management
  // FIX: was calling setLoading("holiday", true) — a string, not a valid
  //      dispatch — replaced with updateLoading("holiday", ...).
  // ─────────────────────────────────────────────────────────────────────────
  const handleRemoveHoliday = useCallback(
    async (date) => {
      updateLoading("holiday", true);
      try {
        const holiday = holidays.get(date);
        await holidayService.removeHoliday(holiday.$id);
        setHolidays((prev) => {
          const next = new Map(prev);
          next.delete(date);
          return next;
        });
        toast.success("Holiday removed successfully");
      } catch (error) {
        console.error("Error removing holiday:", error);
        toast.error("Failed to remove holiday");
      } finally {
        updateLoading("holiday", false);
      }
    },
    [holidays, updateLoading],
  );

  const handleAddHoliday = useCallback(
    async (date, holidayText) => {
      updateLoading("holiday", true);
      try {
        // Delete any attendance records on that date first
        const attendanceToDelete = (newAttendance || []).filter(
          (att) => att.date === date,
        );
        const idsToDelete = attendanceToDelete.map((att) => att.$id);

        if (idsToDelete.length > 0) {
          const deletedIds =
            await newAttendanceService.deleteMultipleAttendance(idsToDelete);

          if (deletedIds.length !== idsToDelete.length) {
            throw new Error("Partial deletion occurred. Cannot safely add holiday.");
          }

          setNewAttendance((prev) =>
            (prev || []).filter((att) => !deletedIds.includes(att.$id)),
          );
        }

        const holidayRes = await holidayService.addHoliday({
          date,
          batchId: selectedBatch,
          holidayText,
        });

        setHolidays((prev) => new Map(prev).set(date, holidayRes));
        toast.success("Holiday added and attendance cleared successfully");
      } catch (error) {
        console.error("Add Holiday Error:", error);
        toast.error(
          error.message.includes("Partial deletion")
            ? "Could not clear existing attendance. Holiday not added."
            : "Error adding holiday",
        );
      } finally {
        updateLoading("holiday", false);
      }
    },
    [newAttendance, selectedBatch, updateLoading],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Modal helpers
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenModal         = useCallback((date)    => { setSelectedDate(date);    setIsModalOpen(true);  }, []);
  const handleCloseModal        = useCallback(()        => { setIsModalOpen(false);    setSelectedDate(null); }, []);
  const handleOpenStudentModal  = useCallback((student) => setSelectedStudent(student), []);
  const handleCloseStudentModal = useCallback(()        => setSelectedStudent(null),    []);

  // ─────────────────────────────────────────────────────────────────────────
  // Month navigation
  // ─────────────────────────────────────────────────────────────────────────
  const maxMonth = useMemo(
    () => toMonthStart(new Date()),
    // Recompute once per calendar month — cheap enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const next = subMonths(prev, 1);
      if (batchStartDate && next < batchStartDate) return prev;
      return next;
    });
  }, [batchStartDate]);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const next = addMonths(prev, 1);
      return next > maxMonth ? prev : next;
    });
  }, [maxMonth]);

  const handleMonthChange = useCallback(
    (event) => {
      const [y, m] = event.target.value.split("-").map(Number);
      const next   = new Date(y, m - 1, 1);
      if (batchStartDate && next < batchStartDate) return;
      if (next > maxMonth) return;
      setSelectedMonth(next);
    },
    [batchStartDate, maxMonth],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Fetch batches once on mount
  useEffect(() => {
    if (profile?.userId) fetchBatches();
    // FIX: no cleanup that resets batchFetchedRef — that caused StrictMode
    //      double-fetch. Error path already resets the flag if needed.
  }, [profile?.userId, fetchBatches]);

  // 2. Clamp selectedMonth when batch (and its start date) changes
  useEffect(() => {
    if (!batchStartDate) return;
    setSelectedMonth((prev) => {
      if (prev < batchStartDate) return batchStartDate;
      if (prev > maxMonth)       return maxMonth;
      return prev;
    });
  }, [batchStartDate, maxMonth]);

  // 3. Fetch students + holidays when batch selection changes
  useEffect(() => {
    if (!selectedBatch) return;
    fetchStudentsAndHolidays();
    return () => abortControllerRef.current?.abort();
  }, [selectedBatch, fetchStudentsAndHolidays]);

  // 4. Fetch attendance + stats when students or month changes
  // FIX: use AbortSignal pattern instead of isMounted object.
  useEffect(() => {
    if (!students?.length) return;
    const controller = new AbortController();
    fetchAttendanceAndStats(controller.signal);
    return () => controller.abort();
  }, [students, selectedMonth, fetchAttendanceAndStats]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render guards
  // ─────────────────────────────────────────────────────────────────────────
  if (loading.initial) return <LoadingSpinner />;

  if (batches.size === 0) {
    const isTeacher =
      user?.labels?.includes("Teacher") || user?.labels?.includes("admin");
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 overflow-hidden flex items-center justify-center">
        <NoBatchTeacherView isTeacher={isTeacher} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
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
          calculatePreviousMonthsData={studentStatsMap}
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
          attendanceMap={
            newAttendanceMap.get(selectedStudent?.userId) || new Map()
          }
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