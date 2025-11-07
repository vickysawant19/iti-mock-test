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
      const existingAttendanceRecord = attendance.find(
        (att) => att.userId === userId
      );

      if (existingAttendanceRecord) {
        const updatedRecords = existingAttendanceRecord.attendanceRecords.map(
          (record) =>
            record.date.split("T")[0] === date
              ? { ...record, attendanceStatus: newStatus }
              : record
        );

        // If the date doesn't exist, add a new record
        if (
          !updatedRecords.some((record) => record.date.split("T")[0] === date)
        ) {
          updatedRecords.push({
            date: date,
            attendanceStatus: newStatus,
            inTime: "09:30", // Default in-time
            outTime: "17:00", // Default out-time
            isMarked: true,
          });
        }
        // Update the attendance record in the database
        const attendanceResponse = await attendanceService.markUserAttendance({
          userId,
          userName: existingAttendanceRecord.userName,
          batchId: selectedBatch,
          attendanceRecords: updatedRecords,
        });

        // Update the attendance state with the new record
        setAttendance((prev) =>
          prev.map((att) =>
            att.userId === userId
              ? {
                  ...att,
                  attendanceRecords: attendanceResponse.attendanceRecords,
                }
              : att
          )
        );
      } else {
        // Create a new attendance record if none exists for the student
        const student = students.find((s) => s.userId === userId);
        const newRecord = {
          userId,
          userName: student.userName,
          batchId: selectedBatch,
          attendanceRecords: [
            {
              date: date,
              attendanceStatus: newStatus,
              inTime: "09:30", // Default in-time
              outTime: "17:00", // Default out-time
              isMarked: true,
            },
          ],
        };
        const response = await attendanceService.markUserAttendance(newRecord);
        setAttendance((prev) => [...prev, response]);
      }

      // After updating a single student's attendance, we need to re-fetch all students' attendance
      // for the current batch to ensure the attendanceMap is up-to-date.
      const updatedAttendanceData =
        await attendanceService.getStudentsAttendance([
          Query.equal("batchId", selectedBatch),
          Query.equal(
            "userId",
            students.map((s) => s.userId)
          ),
          Query.orderDesc("$updatedAt"),
          Query.select(["$id", "userId", "attendanceRecords"]),
        ]);
      setAttendance(updatedAttendanceData);
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
    const promises = Object.entries(statuses).map(async ([userId, status]) => {
      const student = students.find((s) => s.userId === userId);
      const record = {
        userId,
        userName: student.userName,
        batchId: selectedBatch,
        attendanceRecords: [
          {
            date: selectedDate,
            attendanceStatus: status,
            inTime: "09:30", // Default in-time
            outTime: "17:00", // Default out-time
            isMarked: true,
          },
        ],
      };
      return attendanceService.markUserAttendance(record);
    });

    await Promise.all(promises);

    // Refresh attendance data
    const attendanceResponse = await attendanceService.getStudentsAttendance([
      Query.equal("batchId", selectedBatch),
      Query.equal(
        "userId",
        students.map((s) => s.userId)
      ),
      Query.orderDesc("$updatedAt"),
      Query.select(["$id", "userId", "attendanceRecords"]),
    ]);
    setAttendance(attendanceResponse);
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
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-indigo-50 p-4 sm:p-6">
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
            attendanceMap={attendanceMap}
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
          existingAttendance={attendance}
        />
      </div>
    </div>
  );
};

export default AttendanceRegister;
