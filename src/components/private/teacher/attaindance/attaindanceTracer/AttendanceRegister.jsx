import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import batchService from "@/appwrite/batchService";
import attendanceService from "@/appwrite/attaindanceService";
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
  startOfMonth,
  addMonths,
  subMonths,
  isBefore,
  parseISO,
  set,
  endOfMonth,
} from "date-fns";

import MarkAttendanceModal from "./components/MarkAttendanceModal";
import { newAttendanceService } from "@/appwrite/newAttendanceService";

const AttendanceRegister = () => {
  const profile = useSelector(selectProfile);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [holidays, setHolidays] = useState(new Map());

  // Enhanced loading states
  const [loading, setLoading] = useState(true); // Initial load
  const [loadingAttendance, setLoadingAttendance] = useState(false); // Month change
  const [loadingBatch, setLoadingBatch] = useState(false); // Batch change
  const [loadingStats, setLoadingStats] = useState(false); // Student stats loading

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editStudentId, setEditStudentId] = useState(null);
  const [updatingAttendance, setUpdatingAttendance] = useState(new Map());

  const [newStudentStatsMap, setStudentStatsMap] = useState(new Map());

  const [newAttendance, setNewAttendance] = useState([]);

  const handleOpenModal = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  // Extract stats fetching logic into a separate function
  const fetchStudentStats = useCallback(async () => {
    if (students.length === 0) return;
    const currentBatchStartDate = batches.find(
      (bt) => bt.$id === selectedBatch
    )?.start_date;
    if (!currentBatchStartDate) return;
    
    setLoadingStats(true);
    try {
      // Fetch stats for all students in parallel
      const statsPromises = students.map((student) =>
        newAttendanceService.getStudentAttendanceStats(
          student.userId,
          selectedBatch,
          currentBatchStartDate,
          endOfMonth(subMonths(selectedMonth, 1)).toISOString()
        )
      );
      const allStats = await Promise.all(statsPromises);
      // Create a map of userId to stats for easy lookup
      const statsMap = new Map();
      students.forEach((student, index) => {
        statsMap.set(student.userId, allStats[index]);
      });

      setStudentStatsMap(statsMap);
    } catch (error) {
      console.log("fetching stats error ", error);
    } finally {
      setLoadingStats(false);
    }
  }, [students, selectedBatch, selectedMonth, batches]);

  // Handle attendance status change
  const onAttendanceStatusChange = async (userId, date, newStatus) => {
    setUpdatingAttendance((prev) =>
      new Map(prev).set(`${userId}-${date}`, true)
    );
    try {
      const existingAttendanceRecord = newAttendance.find(
        (att) => att.userId === userId && att.date === date
      );

      let attendanceResponse;

      if (existingAttendanceRecord) {
        attendanceResponse = await newAttendanceService.updateAttendance(
          existingAttendanceRecord.$id,
          {
            status: newStatus,
          }
        );
      } else {
        attendanceResponse = await newAttendanceService.createAttendance({
          userId,
          batchId: selectedBatch,
          tradeId: profile.tradeId,
          date: date,
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

      // Recalculate stats after successful update
      await fetchStudentStats();
    } catch (error) {
      console.error("Error updating attendance:", error);
    } finally {
      setUpdatingAttendance((prev) => {
        const newMap = new Map(prev);
        newMap.delete(`${userId}-${date}`);
        return newMap;
      });
    }
  };

  const handleSaveAttendance = async (statuses) => {
    try {
      const records = Object.entries(statuses).map(([userId, status]) => {
        const record = {
          userId,
          batchId: selectedBatch,
          tradeId:
            batches.find((b) => b.$id === selectedBatch)?.tradeId ||
            profile.tradeId,
          date: selectedDate,
          status,
          marketAt: new Date().toISOString(),
          remarks: null,
        };
        return record;
      });

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

      // Recalculate stats after successful batch save
      await fetchStudentStats();
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  // Initial batch fetch
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await batchService.listBatches([
          Query.equal("teacherId", profile.userId),
        ]);
        setBatches(response.documents);
        if (response.documents.reverse().length > 0) {
          setSelectedBatch(response.documents[0].$id);
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
      }
    };
    fetchBatches();
  }, [profile.userId]);

  // Fetch students and old attendance when batch changes
  useEffect(() => {
    if (!selectedBatch) return;

    const fetchStudentsAndAttendance = async () => {
      setLoadingBatch(true);
      setLoading(true);
      try {
        const batch = await batchService.getBatch(selectedBatch);
        const holidays =
          (batch.attendanceHolidays || []).map((itm) => JSON.parse(itm)) || [];
        const holidayMap = new Map();
        holidays.forEach((holiday) => {
          holidayMap.set(holiday.date, holiday);
        });
        setHolidays(holidayMap);

        const studentIds = batch.studentIds.map(
          (ids) => JSON.parse(ids).userId
        );

        if (studentIds.length === 0) {
          setStudents([]);
          setLoading(false);
          setLoadingBatch(false);
          return;
        }

        const students = await userProfileService.getBatchUserProfile([
          Query.equal("userId", studentIds),
          Query.orderAsc("studentId"),
          Query.select(["$id", "userId", "userName", "studentId"]),
        ]);
        setStudents(
          students.sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId))
        );
      } catch (error) {
        console.error("Error fetching students and attendance:", error);
      } finally {
        setLoading(false);
        setLoadingBatch(false);
      }
    };
    fetchStudentsAndAttendance();
  }, [selectedBatch]);

  // Fetch new attendance when month changes
  useEffect(() => {
    const fetchNewAttendance = async () => {
      if (!selectedBatch) return;
      if (!students || students.length === 0) return;

      setLoadingAttendance(true);
      const studentIds = students.map((student) => student.userId);

      try {
        const newAttendance = await newAttendanceService.getMonthlyAttendance(
          studentIds,
          selectedBatch,
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1
        );
        setNewAttendance(newAttendance.documents);
      } catch (error) {
        console.error("Error fetching new attendance:", error);
      } finally {
        setLoadingAttendance(false);
      }
    };
    fetchNewAttendance();
  }, [students, selectedMonth, selectedBatch]);

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

  // Fetch stats initially and when dependencies change
  useEffect(() => {
    fetchStudentStats();
  }, [fetchStudentStats]);

  const handlePrevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(new Date(event.target.value));
  };

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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-full mx-auto">
        <AttendanceHeader
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          batches={batches}
          selectedMonth={selectedMonth}
          handlePrevMonth={handlePrevMonth}
          handleNextMonth={handleNextMonth}
          handleMonthChange={handleMonthChange}
          formatDate={format}
          loadingBatch={loadingBatch}
          loadingAttendance={loadingAttendance}
        />
        {loading ? (
          <LoadingSpinner />
        ) : students.length === 0 ? (
          <EmptyState message="No students found in this batch." />
        ) : (
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
            loadingAttendance={loadingAttendance}
            loadingStats={loadingStats}
          />
        )}
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