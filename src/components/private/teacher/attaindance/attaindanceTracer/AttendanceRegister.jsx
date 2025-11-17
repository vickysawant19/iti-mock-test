import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import batchService from "@/appwrite/batchService";
import { Query } from "appwrite";
import { selectProfile } from "@/store/profileSlice";
import userProfileService from "@/appwrite/userProfileService";
import AttendanceHeader from "./components/AttendanceHeader";
import AttendanceTable from "./components/AttendanceTable";
import LoadingSpinner from "./components/LoadingSpinner";
import EmptyState from "./components/EmptyState";
import {
  format,
  getDaysInMonth,
  addMonths,
  subMonths,
  endOfMonth,
} from "date-fns";
import MarkAttendanceModal from "./components/MarkAttendanceModal";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";
import Legent from "./components/Legent";

const AttendanceRegister = () => {
  const profile = useSelector(selectProfile);
  
  // Use ref to track if initial fetch is done to prevent double fetching
  const initialFetchDone = useRef(false);
  const abortControllerRef = useRef(null);

  // State management
  const [batches, setBatches] = useState(new Map());
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [holidays, setHolidays] = useState(new Map());
  const [newAttendance, setNewAttendance] = useState([]);
  const [newStudentStatsMap, setStudentStatsMap] = useState(new Map());

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
  const [editStudentId, setEditStudentId] = useState(null);
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
    [updatingAttendance]
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
        Query.select([
          "$id",
          "BatchName",
          "start_date",
          "end_date",
          "tradeId",
          "studentIds",
        ]),
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

      const batch = batches.get(selectedBatch);

      // Fetch holidays and students in parallel
      const [holidaysData, studentsData] = await Promise.all([
        holidayService.getBatchHolidays(selectedBatch).catch((err) => {
          console.error("Error fetching holidays:", err);
          return [];
        }),
        (async () => {
          if (!batch.studentIds || batch.studentIds.length === 0) {
            return [];
          }

          const studentIds = batch.studentIds.map(
            (ids) => JSON.parse(ids).userId
          );

          const students = await userProfileService.getBatchUserProfile([
            Query.equal("userId", studentIds),
            Query.orderAsc("studentId"),
            Query.select(["$id", "userId", "userName", "studentId"]),
          ]);

          return students.sort(
            (a, b) => parseInt(a.studentId) - parseInt(b.studentId)
          );
        })(),
      ]);

      // Process holidays
      const holidayMap = new Map();
      holidaysData.forEach((holiday) => {
        holidayMap.set(holiday.date, holiday);
      });
      setHolidays(holidayMap);

      // Set students
      setStudents(studentsData);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching students and holidays:", error);
        setStudents([]);
      }
    } finally {
      updateLoading("students", false);
    }
  }, [selectedBatch, batches, updateLoading]);

  // Fetch attendance and student statistics together
  const fetchAttendanceAndStats = useCallback(async () => {
    if (!selectedBatch || !students || students.length === 0) {
      updateLoading("attendance", false);
      updateLoading("stats", false);
      return;
    }

    const batch = batches.get(selectedBatch);
    if (!batch?.start_date) return;

    console.log("loading attendance and stats");
    
    try {
      updateLoading("attendance", true);
      updateLoading("stats", true);

      const studentIds = students.map((student) => student.userId);
      const currentBatchStartDate = batch.start_date;
      const endDate = endOfMonth(subMonths(selectedMonth, 1)).toISOString();

      // Fetch attendance and all stats in parallel
      const [attendanceData, ...allStats] = await Promise.all([
        newAttendanceService.getMonthlyAttendance(
          studentIds,
          selectedBatch,
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1
        ),
        ...students.map((student) =>
          newAttendanceService.getStudentAttendanceStats(
            student.userId,
            selectedBatch,
            currentBatchStartDate,
            endDate
          )
        ),
      ]);

      // Update attendance
      setNewAttendance(attendanceData.documents);
      
      // Create stats map
      const statsMap = new Map();
      students.forEach((student, index) => {
        statsMap.set(student.userId, allStats[index]);
      });
      setStudentStatsMap(statsMap);
    } catch (error) {
      console.error("Error fetching attendance and stats:", error);
      setNewAttendance([]);
    } finally {
      updateLoading("attendance", false);
      updateLoading("stats", false);
    }
  }, [selectedBatch, students, selectedMonth, batches, updateLoading]);

  // Handle attendance status change
  const onAttendanceStatusChange = async (userId, date, newStatus) => {
    const key = `${userId}-${date}`;
    setUpdatingAttendance((prev) => new Map(prev).set(key, true));

    try {
      const existingRecord = newAttendance.find(
        (att) => att.userId === userId && att.date === date
      );

      let attendanceResponse;
      if (existingRecord) {
        attendanceResponse = await newAttendanceService.updateAttendance(
          existingRecord.$id,
          { status: newStatus }
        );
      } else {
        attendanceResponse = await newAttendanceService.createAttendance({
          userId,
          batchId: selectedBatch,
          tradeId: profile.tradeId,
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
        endDate
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
        tradeId: batch?.tradeId || profile.tradeId,
        date: selectedDate,
        status,
        marketAt: new Date().toISOString(),
        remarks: null,
      }));

      const response = await newAttendanceService.markBatchAttendance(
        selectedBatch,
        selectedDate,
        records
      );

      setNewAttendance((prev) => {
        const successIds = new Set(
          response.success.map((record) => record.$id)
        );
        return [
          ...prev.filter((att) => !successIds.has(att.$id)),
          ...response.success,
        ];
      });

      handleCloseModal();
      await fetchAttendanceAndStats();
    } catch (error) {
      console.error("Error saving attendance:", error);
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

  // Month navigation
  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));
  const handleMonthChange = (event) =>
    setSelectedMonth(new Date(event.target.value));

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
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center">
        <EmptyState message="No batches available. Please create a batch first." />
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
          setEditStudentId={setEditStudentId}
          editStudentId={editStudentId}
          onAttendanceStatusChange={onAttendanceStatusChange}
          updatingAttendance={updatingAttendance}
          isStudentUpdating={isStudentUpdating}
          loading={loading}
          selectedBatch={selectedBatch}
        />
        
        <Legent />

        <MarkAttendanceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          students={students}
          date={selectedDate}
          batchId={selectedBatch}
          onSave={handleSaveAttendance}
          existingAttendance={newAttendance}
        />
      </div>
    </div>
  );
};

export default AttendanceRegister;