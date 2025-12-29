import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useGetBatchQuery } from "@/store/api/batchApi";
import { selectProfile } from "@/store/profileSlice";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import { Query } from "node-appwrite";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import holidayService from "@/appwrite/holidaysService";
import Loader from "@/components/components/Loader";

function InstructorDailyDiary() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [diaryData, setDiaryData] = useState({});
  const [attendance, setAttendance] = useState(new Map());
  const [holidays, setHolidays] = useState(new Map());
  const [isLoadingData, setIsLoadingData] = useState(false);

  const profile = useSelector(selectProfile);

  const {
    data: batchData,
    isLoading: isBatchLoading,
    isError,
  } = useGetBatchQuery({ batchId: profile.batchId });

  const monthDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  const fetchDataForMonth = useCallback(async () => {
    if (!profile?.userId || !profile?.batchId) return;

    setIsLoadingData(true);
    try {
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      // Fetch attendance
      const attendanceRes =
        await newAttendanceService.getStudentAttendanceByDateRange(
          profile.userId,
          profile.batchId,
          startDate,
          endDate,
          [Query.select(["date", "status"])]
        );
      const attendanceMap = new Map();
      attendanceRes.documents.forEach((item) =>
        attendanceMap.set(item.date, item.status)
      );
      setAttendance(attendanceMap);

      // Fetch holidays
      const holidayData = await holidayService.getBatchHolidaysByDateRange(
        profile.batchId,
        startDate,
        endDate
      );
      const holidayMap = new Map();
      holidayData.forEach((item) => holidayMap.set(item.date, item));
      setHolidays(holidayMap);
    } catch (error) {
      console.error("Error fetching month data:", error);
      toast.error("Failed to load monthly data");
    } finally {
      setIsLoadingData(false);
    }
  }, [profile, currentMonth]);

  useEffect(() => {
    fetchDataForMonth();
  }, [fetchDataForMonth]);

  useEffect(() => {
    if (batchData?.dailyDairy) {
      const data = Object.fromEntries(
        batchData.dailyDairy.map((itm) => JSON.parse(itm))
      );
      setDiaryData(data);
    }
  }, [batchData]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  if (isBatchLoading) {
    return <Loader isLoading={isBatchLoading} />;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        Failed to load batch data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="w-full sm:w-auto"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Date</th>
                  <th className="p-4 text-left font-medium">Day</th>
                  <th className="p-4 text-left font-medium">Theory</th>
                  <th className="p-4 text-left font-medium">Practical</th>
                  <th className="p-4 text-left font-medium w-32">
                    Practical #
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingData
                  ? Array.from({ length: 10 }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">
                          <Skeleton className="h-6 w-32" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-6 w-24" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-10 w-full" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-10 w-full" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-10 w-20" />
                        </td>
                      </tr>
                    ))
                  : monthDays.map((day) => {
                      const dateKey = format(day, "yyyy-MM-dd");
                      const entry = diaryData[dateKey] || {};
                      const isHoliday = holidays.has(dateKey);
                      const isAbsent = attendance.get(dateKey) === "absent";
                      const dayOfWeek = format(day, "E");
                      const isWeekend =
                        dayOfWeek === "Sat" || dayOfWeek === "Sun";

                      return (
                        <tr
                          key={dateKey}
                          className={`border-b ${
                            isHoliday
                              ? "bg-red-50 dark:bg-red-950"
                              : isAbsent
                              ? "bg-pink-50 dark:bg-pink-950"
                              : isWeekend
                              ? "bg-gray-100 dark:bg-gray-900"
                              : ""
                          }`}
                        >
                          <td className="p-4">
                            {format(day, "MMM dd, yyyy")}
                          </td>
                          <td className="p-4">{format(day, "EEEE")}</td>
                          <td className="p-4 whitespace-pre-wrap">
                            {isHoliday
                              ? holidays.get(dateKey)?.holidayText
                              : isAbsent
                              ? "Absent"
                              : entry.theory || "-"}
                          </td>
                          <td className="p-4 whitespace-pre-wrap">
                            {!isHoliday && !isAbsent
                              ? entry.practical || "-"
                              : ""}
                          </td>
                          <td className="p-4">
                            {!isHoliday && !isAbsent
                              ? entry.practicalNumber || "-"
                              : ""}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InstructorDailyDiary;
