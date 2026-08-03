import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { selectProfile } from "@/store/profileSlice";
import { selectActiveBatchId } from "@/store/activeBatchSlice";
import batchStudentService from "@/appwrite/batchStudentService";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";
import dailyDiaryService from "@/appwrite/dailyDiaryService";

import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/components/Loader";
import DiaryHeader from "./DiaryHeader";
import DiaryTable from "./DiaryTable";
import DiaryWeekView from "./DiaryWeekView";
import { useDiaryData } from "./hooks/useDiaryData";
import DiaryPageHeader from "./components/DiaryPageHeader";
import DiaryPeriodNav from "./components/DiaryPeriodNav";

function StudentDailyDiary() {
  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector(selectActiveBatchId);

  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ["monthly", "weekly", "daily"];
  const tabParam = searchParams.get("tab");
  const activeTab = validTabs.includes(tabParam) ? tabParam : "monthly";

  const handleTabChange = (newTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", newTab);
      return next;
    });
  };

  const [rollNumber, setRollNumber] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyDiaryData, setMonthlyDiaryData] = useState({});
  const [monthlyAttendance, setMonthlyAttendance] = useState(new Map());
  const [monthlyHolidays, setMonthlyHolidays] = useState(new Map());
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);

  useEffect(() => {
    if (profile?.userId) {
      batchStudentService
        .getStudentBatches(profile.userId)
        .then((res) => {
          if (res && res.length > 0) setRollNumber(res[0].rollNumber);
        })
        .catch(console.error);
    }
  }, [profile?.userId]);

  // Hook for Weekly and Daily views
  const {
    weekDays,
    weekNumber,
    diaryData: periodDiaryData,
    attendance: periodAttendance,
    holidays: periodHolidays,
    isLoading: isPeriodLoading,
    isError,
    handlePreviousWeek,
    handleNextWeek,
    dailyDateLabel,
    canGoPreviousPeriod,
    batchData,
    fetchData: fetchPeriodData,
  } = useDiaryData({
    viewType: activeTab === "daily" ? "daily" : "weekly",
    role: "student",
    enabled: activeTab !== "monthly",
  });

  // Fetch data for Monthly view
  const monthDays = useCallback(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth])();

  const fetchMonthlyData = useCallback(async () => {
    if (!profile?.userId || !activeBatchId || activeTab !== "monthly") return;
    setIsMonthlyLoading(true);
    try {
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const [attendanceRes, holidayData, diaryRes] = await Promise.all([
        newAttendanceService.getStudentAttendanceByDateRange(
          profile.userId,
          activeBatchId,
          startDate,
          endDate
        ),
        holidayService.getBatchHolidaysByDateRange(
          activeBatchId,
          startDate,
          endDate
        ),
        dailyDiaryService.getBatchInstructorDiary(
          activeBatchId,
          null,
          startDate,
          endDate
        ),
      ]);

      const attendanceMap = new Map();
      if (attendanceRes?.documents) {
        attendanceRes.documents.forEach((item) => {
          attendanceMap.set(item.date, item.status);
        });
      }
      setMonthlyAttendance(attendanceMap);

      const holidayMap = new Map();
      if (holidayData) {
        holidayData.forEach((holiday) => {
          holidayMap.set(holiday.date, holiday);
        });
      }
      setMonthlyHolidays(holidayMap);

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
          };
        });
      }
      setMonthlyDiaryData(diaryMap);
    } catch (error) {
      console.error("Error fetching student monthly diary:", error);
    } finally {
      setIsMonthlyLoading(false);
    }
  }, [profile?.userId, activeBatchId, currentMonth, activeTab]);

  useEffect(() => {
    if (activeTab === "monthly") {
      fetchMonthlyData();
    }
  }, [fetchMonthlyData, activeTab]);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600 dark:text-red-400">
              Failed to load diary data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="w-full px-2 sm:px-4 py-2">
        {/* Modular Header with Tab Switcher */}
        <DiaryPageHeader
          profile={profile}
          badgeText="Student Portal"
          title="My Diary"
          extraId={rollNumber ? `ID: ${rollNumber}` : null}
          batchName={batchData?.BatchName}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          gradient="from-emerald-600 to-teal-600"
        />

        {/* Content Render */}
        <div className="animate-in fade-in duration-300">
          {activeTab === "monthly" ? (
            <div className="w-full space-y-4">
              <DiaryHeader
                selectedMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                batchStartDate={batchData?.start_date}
              />
              <DiaryTable
                monthDays={monthDays}
                diaryData={monthlyDiaryData}
                holidays={monthlyHolidays}
                attendance={monthlyAttendance}
                isLoadingData={isMonthlyLoading}
                isTeacher={false}
                batchStartDate={batchData?.start_date}
              />
            </div>
          ) : (
            <div className="w-full space-y-4">
              {/* Floating Period Navigation */}
              <DiaryPeriodNav
                onPrevious={handlePreviousWeek}
                onNext={handleNextWeek}
                canPrevious={canGoPreviousPeriod}
                canNext={true}
                label={activeTab === "daily" ? dailyDateLabel : `Week ${weekNumber}`}
              />

              <DiaryWeekView
                weekDays={weekDays}
                diaryData={periodDiaryData}
                attendance={periodAttendance}
                holidays={periodHolidays}
                isLoading={isPeriodLoading}
                isTeacher={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDailyDiary;
