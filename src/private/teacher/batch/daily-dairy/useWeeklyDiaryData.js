import { useMemo, useState, useCallback, useEffect } from "react";
import {
  startOfWeek,
  addDays,
  format,
  differenceInCalendarWeeks,
  addWeeks,
  parseISO,
} from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Query } from "node-appwrite";

import { useGetBatchQuery } from "@/store/api/batchApi";
import { selectProfile } from "@/store/profileSlice";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";

export const useWeeklyDiaryData = () => {
  const currentWeekStartInitial = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    []
  );

  const [currentWeekStart, setCurrentWeekStart] = useState(
    currentWeekStartInitial
  );
  const [diaryData, setDiaryData] = useState({});
  const [attendance, setAttendance] = useState(new Map());
  const [holidays, setHolidays] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const profile = useSelector(selectProfile);
  const navigate = useNavigate();

  const {
    data: batchData,
    isLoading: isBatchLoading,
    isError,
  } = useGetBatchQuery({ batchId: profile.batchId });

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, index) =>
        addDays(currentWeekStart, index)
      ),
    [currentWeekStart]
  );

  const weekNumber = useMemo(() => {
    if (!batchData?.start_date) return 1;

    const startDate =
      typeof batchData.start_date === "string"
        ? parseISO(batchData.start_date)
        : batchData.start_date;

    return (
      differenceInCalendarWeeks(currentWeekStart, startDate, {
        weekStartsOn: 0,
      }) + 1
    );
  }, [batchData, currentWeekStart]);

  const fetchData = useCallback(async () => {
    if (!profile?.userId || !profile?.batchId) return;

    setIsLoading(true);
    try {
      const startDate = format(currentWeekStart, "yyyy-MM-dd");
      const endDate = format(addWeeks(currentWeekStart, 1), "yyyy-MM-dd");
      
      const [attendanceRes, holidayData] = await Promise.all([
        newAttendanceService.getStudentAttendanceByDateRange(
          profile.userId,
          profile.batchId,
          startDate,
          endDate,
          [Query.select(["date", "status"])]
        ),
        holidayService.getBatchHolidaysByDateRange(
          profile.batchId,
          startDate,
          endDate
        ),
      ]);

      const attendanceMap = new Map();
      attendanceRes.documents.forEach((item) =>
        attendanceMap.set(item.date, item.status)
      );
      setAttendance(attendanceMap);

      const holidayMap = new Map();
      holidayData.forEach((item) => holidayMap.set(item.date, item));
      setHolidays(holidayMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [profile, currentWeekStart]);

  useEffect(() => {
    if (profile && !profile.batchId) {
      toast.error("You need to Create/Select a batch");
      navigate("/profile");
      return;
    }
    fetchData();
  }, [profile, currentWeekStart, fetchData, navigate]);

  useEffect(() => {
    if (batchData?.dailyDairy) {
      const data = Object.fromEntries(
        batchData.dailyDairy.map((itm) => JSON.parse(itm))
      );
      setDiaryData(data);
    }
  }, [batchData]);

  const handlePreviousWeek = useCallback(() => {
    if (weekNumber > 1) {
      setCurrentWeekStart((prev) => addWeeks(prev, -1));
    }
  }, [weekNumber]);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  return {
    weekDays,
    weekNumber,
    diaryData,
    attendance,
    holidays,
    isLoading: isLoading || isBatchLoading,
    isError,
    handlePreviousWeek,
    handleNextWeek,
    setDiaryData,
  };
};
