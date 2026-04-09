import { useState, useEffect, useCallback } from "react";
import { format, endOfMonth, endOfWeek, parse, startOfMonth, startOfWeek } from "date-fns";
import { toast } from "react-toastify";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";
import { calculateStats } from "@/private/Attendance/CalculateStats";
import batchService from "@/appwrite/batchService";

export const useStudentAttendance = (profile) => {
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [batchData, setBatchData] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [holidays, setHolidays] = useState(new Map());
  const [workingDays, setWorkingDays] = useState(new Map());
  
  const [refreshStats, setRefreshStats] = useState(0);
  
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
    attendancePercentage: 0,
    monthlyAttendance: {},
  });

  const [totalAttendance, setTotalAttendance] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
    attendancePercentage: 0,
  });

  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "MMMM yyyy"));
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch Batch Data
  const fetchBatchData = useCallback(async (batchId) => {
    try {
      const data = await batchService.getBatch(batchId);
      setBatchData(data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    if (profile?.batchId) {
      fetchBatchData(profile.batchId);
    }
  }, [profile?.batchId, fetchBatchData]);

  // Fetch Monthly Attendance
  const fetchMonthlyAttendance = useCallback(async () => {
    if (!profile?.batchId || !profile?.userId) return;
    
    setIsLoadingAttendance(true);
    setStudentAttendance(null);
    setWorkingDays(new Map());
    
    try {
      const parsedDate = parse(currentMonth, "MMMM yyyy", new Date());

      const startDate = format(
        startOfWeek(startOfMonth(parsedDate), { weekStartsOn: 0 }),
        "yyyy-MM-dd"
      );
      const endDate = format(
        endOfWeek(endOfMonth(parsedDate), { weekStartsOn: 0 }),
        "yyyy-MM-dd"
      );

      const [data, holidayData] = await Promise.all([
        newAttendanceService.getStudentAttendanceByDateRange(
          profile.userId,
          profile.batchId,
          startDate,
          endDate
        ),
        holidayService.getBatchHolidaysByDateRange(
          profile.batchId,
          startDate,
          endDate
        )
      ]);

      const newHolMap = new Map();
      holidayData.forEach((item) => newHolMap.set(item.date, item.holidayText));
      setHolidays(newHolMap);

      if (!data.documents || data.documents.length === 0) {
        setStudentAttendance({
          ...profile,
          attendanceRecords: [],
          batchId: profile.batchId,
        });
      } else {
        const newWorkMap = new Map();
        data.documents.forEach((item) => newWorkMap.set(item.date, item));
        setWorkingDays(newWorkMap);

        setStudentAttendance({
          ...profile,
          attendanceRecords: data.documents,
          batchId: profile.batchId,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch attendance.");
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [profile, currentMonth]);

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [fetchMonthlyAttendance, refreshStats]);

  // Fetch Total Stats
  useEffect(() => {
    const fetchTotalAttendanceStats = async () => {
      if (!profile?.userId || !batchData) return;

      try {
        const res = await newAttendanceService.getStudentAttendanceStats(
          profile.userId,
          profile.batchId,
          batchData.start_date,
          batchData.end_date
        );
        setTotalAttendance(res);
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch attendance stats.");
      }
    };
    fetchTotalAttendanceStats();
  }, [profile, batchData, refreshStats]);

  // Calc Month Stats
  useEffect(() => {
    if (studentAttendance && studentAttendance.attendanceRecords) {
      calculateStats({
        data: studentAttendance.attendanceRecords,
        setAttendanceStats,
      });
    }
  }, [studentAttendance]);

  const handleMonthChange = (dateOrStr) => {
    const newMonth = typeof dateOrStr === "string" ? dateOrStr : format(dateOrStr, "MMMM yyyy");
    setCurrentMonth(newMonth);
    if (typeof dateOrStr !== "string") {
      setSelectedDate(dateOrStr);
    }
  };

  const markAttendance = async (dateStr, status = "present", remarks = "") => {
    try {
      const alreadyMarked = studentAttendance?.attendanceRecords?.find(
        (record) => record.date === dateStr
      );
      
      let markedRes = null;
      if (alreadyMarked) {
        if (alreadyMarked.status === status && alreadyMarked.remarks === remarks) {
          toast.warn("Already marked with same status");
          return;
        }
        markedRes = await newAttendanceService.updateAttendance(
          alreadyMarked.$id,
          { status, remarks, markedBy: profile.userId }
        );
        toast.success("Attendance updated successfully!");
      } else {
        markedRes = await newAttendanceService.createAttendance({
          userId: profile.userId,
          batchId: profile.batchId,
          tradeId: profile.tradeId || null,
          date: dateStr,
          status,
          remarks,
          markedBy: profile.userId,
        });
        toast.success("Attendance marked successfully!");
      }

      setRefreshStats((prev) => prev + 1);
      return markedRes;
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance.");
      throw error;
    }
  };

  return {
    isLoadingAttendance,
    batchData,
    studentAttendance,
    holidays,
    workingDays,
    attendanceStats,
    totalAttendance,
    currentMonth,
    selectedDate,
    setSelectedDate,
    handleMonthChange,
    markAttendance,
    refreshStats: () => setRefreshStats(prev => prev + 1)
  };
};
