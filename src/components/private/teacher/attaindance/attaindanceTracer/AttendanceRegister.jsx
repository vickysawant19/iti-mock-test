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
} from "date-fns";

import MarkAttendanceModal from "./components/MarkAttendanceModal";
import { newAttendanceService } from "@/appwrite/newAttendanceService";

const AttendanceRegister = () => {
  const profile = useSelector(selectProfile);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [holidays, setHolidays] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editStudentId, setEditStudentId] = useState(null);
  const [updatingAttendance, setUpdatingAttendance] = useState(new Map()); // New state for loading spinner

  const [newAttendance, setNewAttendance] = useState([]);

  const handleOpenModal = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  // Handle attendance status change
  const onAttendanceStatusChange = async (userId, date, newStatus) => {
    setUpdatingAttendance((prev) =>
      new Map(prev).set(`${userId}-${date}`, true)
    );
    try {
      const existingAttendanceRecord = newAttendance.find(
        (att) => att.userId === userId && att.date === date
      );
      console.log("new attaendance", newAttendance);

      console.log("existingAttendanceRecord", existingAttendanceRecord);
      let attendanceResponse;

      if (existingAttendanceRecord) {
        attendanceResponse = await newAttendanceService.updateAttendance(
          existingAttendanceRecord.$id,
          {
            status: newStatus,
          }
        );
      } else {
        // Update the attendance record in the database
        attendanceResponse = await newAttendanceService.createAttendance({
          userId,
          batchId: selectedBatch,
          tradeId: profile.tradeId,
          date: date,
          status: newStatus,
          remarks: null,
        });
      }

      // Update the attendance state with the new record
      setNewAttendance((prev) => {
        return [
          ...prev.filter((att) => att.$id !== attendanceResponse.$id),
          attendanceResponse,
        ];
      });
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
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await batchService.listBatches([
          Query.equal("teacherId", profile.userId),
        ]);
        setBatches(response.documents);
        if (response.documents.length > 0) {
          setSelectedBatch(response.documents[0].$id);
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
      }
    };
    fetchBatches();
  }, [profile.userId]);

  useEffect(() => {
    if (!selectedBatch) return;
    const fetchStudentsAndAttendance = async () => {
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
          setAttendance([]);
          setLoading(false);
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

        const attendanceResponse =
          await attendanceService.getStudentsAttendance([
            Query.equal("batchId", selectedBatch),
            Query.equal("userId", studentIds),
            Query.orderDesc("$updatedAt"),
            Query.select(["$id", "userId", "attendanceRecords"]),
          ]);

        setAttendance(attendanceResponse);
      } catch (error) {
        console.error("Error fetching students and attendance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsAndAttendance();
  }, [selectedBatch]);

  useEffect(() => {
    const fetchNewAttendance = async () => {
      if (!selectedBatch) return;
      if (!students || students.length === 0) return;
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
      }
    };
    fetchNewAttendance();
  }, [students, selectedMonth]);

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
    console.log("new attendance map", map);
    return map;
  }, [newAttendance]);

  // Memoized attendance map for O(1) lookups
  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendance.forEach((att) => {
      const recordMap = new Map();
      att.attendanceRecords?.forEach((record) => {
        recordMap.set(record.date.split("T")[0], record.attendanceStatus);
      });
      map.set(att.userId, recordMap);
    });
    return map;
  }, [attendance]);

  // Calculate cumulative attendance from all previous months
  const calculatePreviousMonthsData = useMemo(() => {
    const currentMonthStart = startOfMonth(selectedMonth);
    const result = new Map();

    students.forEach((student) => {
      const studentRecords = attendanceMap.get(student.userId);
      if (!studentRecords) {
        result.set(student.userId, {
          workingDays: 0,
          presentDays: 0,
          absentDays: 0,
        });
        return;
      }

      let workingDays = 0;
      let presentDays = 0;
      let absentDays = 0;

      // Iterate through all attendance records before current month
      studentRecords.forEach((status, dateStr) => {
        const recordDate = parseISO(dateStr);
        if (isBefore(recordDate, currentMonthStart)) {
          if (!holidays.has(dateStr)) {
            workingDays++;
            if (status === "Present") presentDays++;
            else if (status === "Absent") absentDays++;
          }
        }
      });

      result.set(student.userId, { workingDays, presentDays, absentDays });
    });

    return result;
  }, [students, attendanceMap, selectedMonth, holidays]);

  const handlePrevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(new Date(event.target.value));
  };

  // Helper function to check if any attendance for a student is currently updating
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
            attendanceMap={newAttendanceMap} // Use newAttendanceMap here
            calculatePreviousMonthsData={calculatePreviousMonthsData}
            formatDate={format}
            getDaysInMonth={getDaysInMonth}
            onMarkAttendance={handleOpenModal}
            setEditStudentId={setEditStudentId}
            editStudentId={editStudentId}
            onAttendanceStatusChange={onAttendanceStatusChange} // Pass new prop
            updatingAttendance={updatingAttendance} // Pass new prop
            isStudentUpdating={isStudentUpdating} // Pass new prop
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
