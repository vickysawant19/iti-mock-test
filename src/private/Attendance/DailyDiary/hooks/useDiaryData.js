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
import { selectActiveBatchId } from "@/store/activeBatchSlice";

/**
 * @param {Object} options
 * @param {'daily'|'weekly'} [options.viewType='weekly']
 * @param {'student'|'teacher'} [options.role='student']
 * @param {string} [options.userId]
 * @param {boolean} [options.enabled=true]
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

  const profile = useSelector(selectProfile);
  const navigate = useNavigate();
  const activeBatchId = useSelector(selectActiveBatchId);
  const resolvedBatchId = activeBatchId;

  const [diaryData, setDiaryData] = useState({});
  const [attendance, setAttendance] = useState(new Map());
  const [attendanceDocIds, setAttendanceDocIds] = useState(new Map());
  const [holidays, setHolidays] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const effectiveUserId = userIdOverride ?? profile?.userId;

  const {
    data: batchData,
    isLoading: isBatchLoading,
    isError,
  } = useGetBatchQuery({ batchId: resolvedBatchId }, { skip: !resolvedBatchId || !enabled });

  const periodAnchor = viewType === "daily" ? currentDay : currentWeekStart;

  const weekNumber = useMemo(() => {
    if (!batchData?.start_date) return 1;
    const batchStart = startOfWeek(parseISO(batchData.start_date), {
      weekStartsOn: 0,
    });
    return Math.max(
      1,
      differenceInCalendarWeeks(currentWeekStart, batchStart, {
        weekStartsOn: 0,
      }) + 1
    );
  }, [batchData, currentWeekStart]);

  const canGoPreviousPeriod = useMemo(() => {
    if (!batchData?.start_date) return true;
    const batchStartDay = startOfDay(parseISO(batchData.start_date));
    if (viewType === "daily") {
      return !isBefore(subDays(currentDay, 1), batchStartDay);
    }
    const batchStartWeek = startOfWeek(batchStartDay, { weekStartsOn: 0 });
    return !isBefore(addWeeks(currentWeekStart, -1), batchStartWeek);
  }, [batchData, currentDay, currentWeekStart, viewType]);

  const periodDays = useMemo(() => {
    if (viewType === "daily") {
      return [currentDay];
    }
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [viewType, currentDay, currentWeekStart]);

  const dailyDateLabel = useMemo(
    () => format(currentDay, "EEEE, MMM dd, yyyy"),
    [currentDay]
  );

  const handlePreviousPeriod = useCallback(() => {
    if (!canGoPreviousPeriod) return;
    if (viewType === "daily") {
      setCurrentDay((prev) => subDays(prev, 1));
    } else {
      setCurrentWeekStart((prev) => addWeeks(prev, -1));
    }
  }, [canGoPreviousPeriod, viewType]);

  const handleNextPeriod = useCallback(() => {
    if (viewType === "daily") {
      setCurrentDay((prev) => addDays(prev, 1));
    } else {
      setCurrentWeekStart((prev) => addWeeks(prev, 1));
    }
  }, [viewType]);

  const fetchData = useCallback(async () => {
    if (!effectiveUserId || !resolvedBatchId || !enabled) return;

    setIsLoading(true);
    try {
      let startDateStr;
      let endDateStr;
      if (viewType === "daily") {
        startDateStr = format(currentDay, "yyyy-MM-dd");
        endDateStr = startDateStr;
      } else {
        startDateStr = format(currentWeekStart, "yyyy-MM-dd");
        endDateStr = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");
      }

      let attendancePromise;
      if (role === "teacher") {
        attendancePromise = newAttendanceService.getTeacherAttendanceByDateRange(
          effectiveUserId,
          resolvedBatchId,
          startDateStr,
          endDateStr,
          [Query.select(["$id", "date", "status"])]
        );
      } else {
        attendancePromise = newAttendanceService.getStudentAttendanceByDateRange(
          effectiveUserId,
          resolvedBatchId,
          startDateStr,
          endDateStr
        );
      }

      const [attendanceRes, holidayData, diaryRes] = await Promise.all([
        attendancePromise,
        holidayService.getBatchHolidaysByDateRange(
          resolvedBatchId,
          startDateStr,
          endDateStr
        ),
        dailyDiaryService.getBatchInstructorDiary(
          resolvedBatchId,
          null,
          startDateStr,
          endDateStr
        ),
      ]);

      const attendanceMap = new Map();
      const docIdsMap = new Map();
      if (attendanceRes?.documents) {
        attendanceRes.documents.forEach((item) => {
          const rawStatus = item.attendanceStatus ? item.attendanceStatus.toLowerCase() : item.status;
          attendanceMap.set(item.date, rawStatus);
          if (item.$id) docIdsMap.set(item.date, item.$id);
        });
      }
      setAttendance(attendanceMap);
      setAttendanceDocIds(docIdsMap);

      const holidayMap = new Map();
      if (holidayData) {
        holidayData.forEach((holiday) => {
          holidayMap.set(holiday.date, holiday);
        });
      }
      setHolidays(holidayMap);

      const diaryMap = {};
      if (diaryRes) {
        diaryRes.forEach((entry) => {
          const dateKey = format(parseISO(entry.date), "yyyy-MM-dd");
          diaryMap[dateKey] = {
            $id: entry.$id,
            theoryWork: entry.theoryWork || "",
            practicalWork: entry.practicalWork || "",
            practicalNumbers: Array.isArray(entry.practicalNumbers)
              ? entry.practicalNumbers
              : [],
            extraWork: entry.extraWork || "",
            hours: entry.hours || "",
            remarks: entry.remarks || "",
            instructorId: entry.instructorId,
            isEditing: false,
          };
        });
      }

      periodDays.forEach((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        if (!diaryMap[dateKey]) {
          diaryMap[dateKey] = {
            theoryWork: "",
            practicalWork: "",
            practicalNumbers: [],
            extraWork: "",
            hours: "",
            remarks: "",
            isEditing: false,
          };
        }
      });

      setDiaryData(diaryMap);
    } catch (error) {
      console.error("Error fetching diary data:", error);
      toast.error("Failed to load diary data");
    } finally {
      setIsLoading(false);
    }
  }, [
    effectiveUserId,
    resolvedBatchId,
    enabled,
    viewType,
    currentDay,
    currentWeekStart,
    role,
    periodDays,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    weekDays: periodDays,
    weekNumber,
    diaryData,
    attendance,
    attendanceDocIds,
    holidays,
    isLoading: isLoading || isBatchLoading,
    isError,
    handlePreviousWeek: handlePreviousPeriod,
    handleNextWeek: handleNextPeriod,
    setDiaryData,
    setAttendance,
    setAttendanceDocIds,
    dailyDateLabel,
    canGoPreviousPeriod,
    batchData,
    fetchData,
  };
}
