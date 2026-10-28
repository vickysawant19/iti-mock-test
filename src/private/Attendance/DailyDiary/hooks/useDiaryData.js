import { useMemo, useState, useCallback, useEffect } from "react";
import {
  startOfWeek,
  addDays,
  format,
  differenceInCalendarWeeks,
  addWeeks,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  isBefore,
} from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";

import { useGetBatchQuery } from "@/store/api/batchApi";
import { selectProfile } from "@/store/profileSlice";
import { newAttendanceService } from "@/services/attendance/newAttendanceService";
import holidayService from "@/services/attendance/holidaysService";
import dailyDiaryService from "@/services/attendance/dailyDiaryService";
import { selectActiveBatchId } from "@/store/activeBatchSlice";
import { attendanceTrackingService } from "@/services/attendance/attendanceTrackingService";

/**
 * @param {Object} options
 * @param {'daily'|'weekly'} [options.viewType='weekly']
 * @param {'student'|'teacher'} [options.role='student']
 * @param {string} [options.userId]
 * @param {boolean} [options.enabled=true]
 * @param {Date} [options.initialMonth]
 */
export function useDiaryData({
  viewType = "weekly",
  role = "student",
  userId: userIdOverride,
  enabled = true,
  initialMonth,
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
  } = useGetBatchQuery({ batchId: resolvedBatchId }, { skip: !resolvedBatchId });

  // Sync initial period with initialMonth and batch start date
  useEffect(() => {
    if (!batchData?.start_date) return;
    const rawStart = typeof batchData.start_date === "string" ? batchData.start_date.split("T")[0] : format(batchData.start_date, "yyyy-MM-dd");
    const [by, bm, bd] = rawStart.split("-").map(Number);
    const batchStartDay = new Date(by, bm - 1, bd);
    const batchStartWeek = startOfWeek(batchStartDay, { weekStartsOn: 0 });

    if (initialMonth) {
      const monthStart = startOfMonth(initialMonth);
      const isStartMonth = initialMonth.getFullYear() === by && initialMonth.getMonth() === (bm - 1);
      const targetWeek = isStartMonth ? batchStartWeek : startOfWeek(monthStart, { weekStartsOn: 0 });
      const targetDay = isStartMonth ? batchStartDay : startOfDay(monthStart);

      setCurrentWeekStart(targetWeek);
      setCurrentDay(targetDay);
      return;
    }

    setCurrentWeekStart((prev) => (isBefore(prev, batchStartWeek) ? batchStartWeek : prev));
    setCurrentDay((prev) => (isBefore(prev, batchStartDay) ? batchStartDay : prev));
  }, [batchData?.start_date, initialMonth]);

  const periodAnchor = viewType === "daily" ? currentDay : currentWeekStart;

  const weekNumber = useMemo(() => {
    if (!batchData?.start_date) return 1;
    const rawStart = typeof batchData.start_date === "string" ? batchData.start_date.split("T")[0] : format(batchData.start_date, "yyyy-MM-dd");
    const [by, bm, bd] = rawStart.split("-").map(Number);
    const batchStartDay = new Date(by, bm - 1, bd);
    const batchStart = startOfWeek(batchStartDay, {
      weekStartsOn: 0,
    });
    const weekDiff = differenceInCalendarWeeks(currentWeekStart, batchStart, {
      weekStartsOn: 0,
    });
    if (weekDiff < 0) return 1;
    return weekDiff + 1;
  }, [batchData?.start_date, currentWeekStart]);

  const canGoPreviousPeriod = useMemo(() => {
    if (!batchData?.start_date) return true;
    const rawStart = typeof batchData.start_date === "string" ? batchData.start_date.split("T")[0] : format(batchData.start_date, "yyyy-MM-dd");
    const [by, bm, bd] = rawStart.split("-").map(Number);
    const batchStartDay = new Date(by, bm - 1, bd);
    if (viewType === "daily") {
      return !isBefore(subDays(currentDay, 1), batchStartDay);
    }
    const batchStartWeek = startOfWeek(batchStartDay, { weekStartsOn: 0 });
    return !isBefore(addWeeks(currentWeekStart, -1), batchStartWeek);
  }, [batchData?.start_date, currentDay, currentWeekStart, viewType]);

  const periodDays = useMemo(() => {
    if (viewType === "daily") {
      return [currentDay];
    }
    const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
    if (!batchData?.start_date) return days;
    const rawStart = typeof batchData.start_date === "string" ? batchData.start_date.split("T")[0] : format(batchData.start_date, "yyyy-MM-dd");
    const [by, bm, bd] = rawStart.split("-").map(Number);
    const batchStartDay = new Date(by, bm - 1, bd);
    return days.filter((day) => !isBefore(day, batchStartDay));
  }, [viewType, currentDay, currentWeekStart, batchData?.start_date]);

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
          [Query.select(["$id", "date", "status", "attendanceStatus", "leaveType"])]
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
          const { attendanceStatus, leaveType } = attendanceTrackingService.resolveStatusPair(
            item.attendanceStatus || item.status,
            item.leaveType
          );
          let rawStatus = item.status ? String(item.status).toLowerCase() : "absent";
          if (leaveType) {
            rawStatus = String(leaveType).toLowerCase();
          } else if (attendanceStatus) {
            rawStatus = String(attendanceStatus).toLowerCase();
          }
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
