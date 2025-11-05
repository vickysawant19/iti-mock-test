import React, { useState, useEffect, useMemo } from "react";
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
} from "date-fns";

const AttendanceTracer = () => {
  const profile = useSelector(selectProfile);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [holidays, setHolidays] = useState(new Map());
  const [loading, setLoading] = useState(true);

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
          />
        )}
      </div>
    </div>
  );
};

export default AttendanceTracer;
