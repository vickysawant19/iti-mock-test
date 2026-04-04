import { useMemo, useState, useCallback, useEffect } from "react";
import {
  startOfWeek,
  addDays,
  format,
  differenceInCalendarWeeks,
  addWeeks,
  parseISO,
  startOfDay,
  subDays,
  isBefore,
} from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";

import { useGetBatchQuery } from "@/store/api/batchApi";
import { selectProfile } from "@/store/profileSlice";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";
import dailyDiaryService from "@/appwrite/dailyDiaryService";

/**
 * @param {Object} options
 * @param {'daily'|'weekly'} [options.viewType='weekly']
 * @param {'student'|'teacher'} [options.role='student'] — attendance is loaded for this user's id (maps to collection `userId`; for teachers this is their account id / teacherId)
 * @param {string} [options.userId] — override profile.userId for attendance + diary context
 * @param {boolean} [options.enabled=true] — when false, skips fetch (e.g. teacher on monthly tab)
 */
export function useDiaryData({
  viewType = "weekly",
  role = "student",
  userId: userIdOverride,
  enabled = true,
} = {}) {
  const currentWeekStartInitial = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    []
  );
  const currentDayInitial = useMemo(() => startOfDay(new Date()), []);

  const [currentWeekStart, setCurrentWeekStart] = useState(
    currentWeekStartInitial
  );
  const [currentDay, setCurrentDay] = useState(currentDayInitial);

  const [diaryData, setDiaryData] = useState({});
  const [attendance, setAttendance] = useState(new Map());
  const [holidays, setHolidays] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const profile = useSelector(selectProfile);
  const navigate = useNavigate();

  const effectiveUserId = userIdOverride ?? profile?.userId;

  const {
    data: batchData,
    isLoading: isBatchLoading,
    isError,
  } = useGetBatchQuery({ batchId: profile?.batchId });

  const periodAnchor = viewType === "daily" ? currentDay : currentWeekStart;

  const weekDays = useMemo(() => {
    if (viewType === "daily") {
      return [startOfDay(currentDay)];
    }
    return Array.from({ length: 7 }).map((_, index) =>
      addDays(currentWeekStart, index)
    );
  }, [viewType, currentDay, currentWeekStart]);

  const weekNumber = useMemo(() => {
    if (!batchData?.start_date) return 1;

    const startDate =
      typeof batchData.start_date === "string"
        ? parseISO(batchData.start_date)
        : batchData.start_date;

    return (
      differenceInCalendarWeeks(periodAnchor, startDate, {
        weekStartsOn: 0,
      }) + 1
    );
  }, [batchData, periodAnchor]);

  const canGoPreviousPeriod = useMemo(() => {
    if (!batchData?.start_date) return weekNumber > 1;
    const batchStart = startOfDay(
      typeof batchData.start_date === "string"
        ? parseISO(batchData.start_date)
        : batchData.start_date
    );
    if (viewType === "daily") {
      const prev = subDays(startOfDay(currentDay), 1);
      return !isBefore(prev, batchStart);
    }
    return weekNumber > 1;
  }, [batchData, viewType, currentDay, weekNumber]);

  const fetchData = useCallback(async () => {
    if (!enabled || !effectiveUserId || !profile?.batchId) return;

    setIsLoading(true);
    try {
      let startDate;
      let endDate;
      if (viewType === "daily") {
        const d0 = startOfDay(currentDay);
        startDate = format(d0, "yyyy-MM-dd");
        endDate = format(addDays(d0, 1), "yyyy-MM-dd");
      } else {
        startDate = format(currentWeekStart, "yyyy-MM-dd");
        endDate = format(addWeeks(currentWeekStart, 1), "yyyy-MM-dd");
      }

      const attendancePromise =
        role === "teacher"
          ? newAttendanceService.getTeacherAttendanceByDateRange(
              effectiveUserId,
              profile.batchId,
              startDate,
              endDate,
              [Query.select(["date", "status"])]
            )
          : newAttendanceService.getStudentAttendanceByDateRange(
              effectiveUserId,
              profile.batchId,
              startDate,
              endDate,
              [Query.select(["date", "status"])]
            );

      const [attendanceRes, holidayData, diaryRes] = await Promise.all([
        attendancePromise,
        holidayService.getBatchHolidaysByDateRange(
          profile.batchId,
          startDate,
          endDate
        ),
        dailyDiaryService.getBatchInstructorDiary(
          profile.batchId,
          null,
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

      let docs = diaryRes || [];
      if (role === "teacher" && effectiveUserId) {
        docs = docs.filter((doc) => doc.instructorId === effectiveUserId);
      }

      const formattedDiary = {};
      if (docs.length > 0) {
        docs.forEach((doc) => {
          const dateKey = format(parseISO(doc.date), "yyyy-MM-dd");
          formattedDiary[dateKey] = doc;
        });
      }
      setDiaryData(formattedDiary);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, profile, effectiveUserId, viewType, role, currentWeekStart, currentDay]);

  useEffect(() => {
    if (!enabled) return;
    if (profile && !profile.batchId) {
      toast.error("You need to Create/Select a batch");
      navigate("/profile");
      return;
    }
    fetchData();
  }, [enabled, profile, fetchData, navigate]);

  const handlePreviousWeek = useCallback(() => {
    if (!enabled || !canGoPreviousPeriod) return;
    if (viewType === "daily") {
      setCurrentDay((prev) => subDays(startOfDay(prev), 1));
    } else if (weekNumber > 1) {
      setCurrentWeekStart((prev) => addWeeks(prev, -1));
    }
  }, [enabled, canGoPreviousPeriod, viewType, weekNumber]);

  const handleNextWeek = useCallback(() => {
    if (!enabled) return;
    if (viewType === "daily") {
      setCurrentDay((prev) => addDays(startOfDay(prev), 1));
    } else {
      setCurrentWeekStart((prev) => addWeeks(prev, 1));
    }
  }, [enabled, viewType]);

  return {
    viewType,
    role,
    weekDays,
    weekNumber,
    diaryData,
    attendance,
    holidays,
    isLoading: enabled ? isLoading || isBatchLoading : false,
    isError,
    handlePreviousWeek,
    handleNextWeek,
    setDiaryData,
    /** Daily view: formatted label for the header */
    dailyDateLabel:
      viewType === "daily" ? format(startOfDay(currentDay), "EEEE, MMM d, yyyy") : null,
    canGoPreviousPeriod,
  };
}
