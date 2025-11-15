import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { Edit, Save, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useGetBatchQuery } from "../../../../../store/api/batchApi";
import { selectProfile } from "../../../../../store/profileSlice";
import { selectUser } from "../../../../../store/userSlice";
import batchService from "../../../../../appwrite/batchService";
import Loader from "@/components/components/Loader";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import { Query } from "node-appwrite";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import holidayService from "@/appwrite/holidaysService";

function DailyDiary() {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isTeacher = user.labels.includes("Teacher");

  const {
    data: batchData,
    isLoading,
    isError,
  } = useGetBatchQuery(profile.batchId);

  const navigate = useNavigate();

  // Memoize week days calculation
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, index) =>
        addDays(currentWeekStart, index)
      ),
    [currentWeekStart]
  );

  // Calculate week number with useMemo
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

  // Fetch attendance without caching
  const fetchAttendanceAndHolidays = useCallback(async () => {
    if (!profile?.userId || !profile?.batchId) return;

    setIsLoadingAttendance(true);
    try {
      const newAttendanceRes =
        await newAttendanceService.getStudentAttendanceByDateRange(
          profile.userId,
          profile.batchId,
          format(currentWeekStart, "yyyy-MM-dd"),
          format(addWeeks(currentWeekStart, 1), "yyyy-MM-dd"),
          [Query.select(["date", "status"])]
        );

      const map = new Map();
      newAttendanceRes.documents.forEach((item) =>
        map.set(item.date, item.status)
      );

      const data = await holidayService.getBatchHolidaysByDateRange(
        profile.batchId,
        format(currentWeekStart, "yyyy-MM-dd"),
        format(addWeeks(currentWeekStart, 1), "yyyy-MM-dd")
      );
      const newMap = new Map();
      data.forEach((item) => newMap.set(item.date, item));

      setHolidays(newMap);
      setAttendance(map);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [profile, currentWeekStart]);

  useEffect(() => {
    if (profile && !profile.batchId) {
      toast.error("You need to Create/Select a batch");
      navigate("/profile");
      return;
    }
    fetchAttendanceAndHolidays();
  }, [profile, currentWeekStart, fetchAttendanceAndHolidays, navigate]);

  useEffect(() => {
    if (!batchData) return;

    // Load diary entries
    if (batchData.dailyDairy) {
      const data = Object.fromEntries(
        batchData.dailyDairy.map((itm) => JSON.parse(itm))
      );
      setDiaryData(data);
    }
  }, [batchData]);

  // Navigation functions
  const handlePreviousWeek = useCallback(() => {
    if (weekNumber > 1) {
      setCurrentWeekStart((prev) => addWeeks(prev, -1));
    }
  }, [weekNumber]);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  // Update a specific field for a given day's diary entry
  const updateDiaryField = useCallback((dateKey, field, value) => {
    setDiaryData((prev) => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {
          theory: "",
          practical: "",
          practicalNumber: "",
          isEditing: true,
        }),
        [field]: value,
      },
    }));
  }, []);

  // Toggle editing mode for a specific day
  const toggleEditing = useCallback(
    (dateKey) => {
      const currentEntry = diaryData[dateKey] || {
        theory: "",
        practical: "",
        practicalNumber: "",
        isEditing: true,
      };

      if (currentEntry.isEditing) {
        setDiaryData((prev) => ({
          ...prev,
          [dateKey]: {
            ...currentEntry,
            isEditing: false,
          },
        }));
        handleSubmit(dateKey);
      } else {
        setDiaryData((prev) => ({
          ...prev,
          [dateKey]: {
            ...currentEntry,
            isEditing: true,
          },
        }));
      }
    },
    [diaryData]
  );

  // Submit diary entry to backend
  const handleSubmit = async (dateKey) => {
    const entry = diaryData[dateKey];
    if (!entry) return;

    const updateData = {
      ...diaryData,
      [dateKey]: { ...entry, isEditing: false },
    };
    setIsSubmitting(true);

    try {
      const stringyfiedData = Object.entries(updateData).map((itm) =>
        JSON.stringify(itm)
      );
      const res = await batchService.updateBatch(profile.batchId, {
        dailyDairy: stringyfiedData,
      });
      setDiaryData(
        Object.fromEntries(res.dailyDairy.map((item) => JSON.parse(item)))
      );
      toast.success("Diary entry saved successfully");
    } catch (error) {
      console.error("Failed to save diary entry:", error);
      toast.error("Failed to save diary entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                disabled={weekNumber <= 1}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Badge variant="secondary" className="text-base px-4 py-2">
                Week {weekNumber}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                className="w-full sm:w-auto"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Diary Cards - Mobile View */}
        <div className="block lg:hidden space-y-4">
          {isLoadingAttendance
            ? Array.from({ length: 7 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            : weekDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const entry = diaryData[dateKey] || {
                  theory: "",
                  practical: "",
                  practicalNumber: "",
                  isEditing: true,
                };

                const isAbsent = attendance.get(dateKey) === "absent";
                const isHoliday = holidays.has(dateKey);
                const isWeekend =
                  format(day, "E") === "Sat" || format(day, "E") === "Sun";

                return (
                  <Card
                    key={dateKey}
                    className={`
                    ${
                      isHoliday
                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                        : ""
                    }
                    ${
                      isAbsent
                        ? "border-pink-500 bg-pink-50 dark:bg-pink-950"
                        : ""
                    }
                    ${
                      isWeekend && !isHoliday && !isAbsent
                        ? "bg-gray-100 dark:bg-gray-900"
                        : ""
                    }
                  `}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {format(day, "EEEE")}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(day, "MMM dd, yyyy")}
                          </p>
                        </div>
                        {isAbsent && (
                          <Badge variant="destructive">Absent</Badge>
                        )}
                        {isHoliday && (
                          <Badge variant="destructive">Holiday</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isHoliday ? (
                        <p className="text-center py-4 text-muted-foreground">
                          {holidays.get(dateKey)?.holidayText || "Holiday"}
                        </p>
                      ) : isAbsent ? (
                        <p className="text-center py-4 text-muted-foreground">
                          No entries for absent day
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Theory
                            </label>
                            {isTeacher && entry.isEditing ? (
                              <Textarea
                                value={entry.theory || ""}
                                onChange={(e) =>
                                  updateDiaryField(
                                    dateKey,
                                    "theory",
                                    e.target.value
                                  )
                                }
                                placeholder="Add theory notes..."
                                className="min-h-[80px]"
                              />
                            ) : (
                              <div className="p-3 bg-muted rounded-md min-h-[60px] whitespace-pre-wrap">
                                {entry.theory || "-"}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Practical
                            </label>
                            {isTeacher && entry.isEditing ? (
                              <Textarea
                                value={entry.practical || ""}
                                onChange={(e) =>
                                  updateDiaryField(
                                    dateKey,
                                    "practical",
                                    e.target.value
                                  )
                                }
                                placeholder="Add practical notes..."
                                className="min-h-[80px]"
                              />
                            ) : (
                              <div className="p-3 bg-muted rounded-md min-h-[60px] whitespace-pre-wrap">
                                {entry.practical || "-"}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Practical #
                            </label>
                            {isTeacher && entry.isEditing ? (
                              <Input
                                type="number"
                                value={entry.practicalNumber || ""}
                                onChange={(e) =>
                                  updateDiaryField(
                                    dateKey,
                                    "practicalNumber",
                                    e.target.value
                                  )
                                }
                                placeholder="#"
                              />
                            ) : (
                              <div className="p-3 bg-muted rounded-md">
                                {entry.practicalNumber || "-"}
                              </div>
                            )}
                          </div>

                          {isTeacher && (
                            <Button
                              onClick={() => toggleEditing(dateKey)}
                              disabled={isSubmitting}
                              className="w-full"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : entry.isEditing ? (
                                <Save className="h-4 w-4 mr-2" />
                              ) : (
                                <Edit className="h-4 w-4 mr-2" />
                              )}
                              {entry.isEditing ? "Save" : "Edit"}
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Table View - Desktop */}
        <Card className="hidden lg:block">
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
                    {isTeacher && (
                      <th className="p-4 text-center font-medium w-32">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isLoadingAttendance
                    ? Array.from({ length: 7 }).map((_, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-4">
                            <Skeleton className="h-6 w-32" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-6 w-24" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-20 w-full" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-20 w-full" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-10 w-20" />
                          </td>
                          {isTeacher && (
                            <td className="p-4">
                              <Skeleton className="h-10 w-20" />
                            </td>
                          )}
                        </tr>
                      ))
                    : weekDays.map((day) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const entry = diaryData[dateKey] || {
                          theory: "",
                          practical: "",
                          practicalNumber: "",
                          isEditing: true,
                        };

                        const isAbsent = attendance.get(dateKey) === "absent";
                        const isHoliday = holidays.has(dateKey);
                        const isWeekend =
                          format(day, "E") === "Sat" ||
                          format(day, "E") === "Sun";

                        return (
                          <tr
                            key={dateKey}
                            className={`
                            border-b transition-colors
                            ${isHoliday ? "bg-red-50 dark:bg-red-950" : ""}
                            ${isAbsent ? "bg-pink-50 dark:bg-pink-950" : ""}
                            ${
                              isWeekend && !isHoliday && !isAbsent
                                ? "bg-muted/30"
                                : ""
                            }
                          `}
                          >
                            <td className="p-4 font-medium whitespace-nowrap">
                              {format(day, "MMM dd, yyyy")}
                            </td>
                            <td className="p-4 font-medium">
                              {format(day, "EEEE")}
                            </td>
                            <td colSpan={isHoliday ? 3 : 1} className="p-4">
                              {isHoliday ? (
                                <div className="text-center text-muted-foreground">
                                  {holidays.get(dateKey)?.holidayText ||
                                    "Holiday"}
                                </div>
                              ) : isAbsent ? (
                                <div className="text-muted-foreground">
                                  Absent
                                </div>
                              ) : isTeacher && entry.isEditing ? (
                                <Textarea
                                  value={entry.theory || ""}
                                  onChange={(e) =>
                                    updateDiaryField(
                                      dateKey,
                                      "theory",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Add theory notes..."
                                  className="min-h-[80px]"
                                />
                              ) : (
                                <div className="whitespace-pre-wrap">
                                  {entry.theory || "-"}
                                </div>
                              )}
                            </td>
                            {!isHoliday && (
                              <>
                                <td className="p-4">
                                  {isAbsent ? (
                                    <div className="text-muted-foreground">
                                      Absent
                                    </div>
                                  ) : isTeacher && entry.isEditing ? (
                                    <Textarea
                                      value={entry.practical || ""}
                                      onChange={(e) =>
                                        updateDiaryField(
                                          dateKey,
                                          "practical",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Add practical notes..."
                                      className="min-h-[80px]"
                                    />
                                  ) : (
                                    <div className="whitespace-pre-wrap">
                                      {entry.practical || "-"}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  {isAbsent ? (
                                    <div className="text-muted-foreground">
                                      -
                                    </div>
                                  ) : isTeacher && entry.isEditing ? (
                                    <Input
                                      type="number"
                                      value={entry.practicalNumber || ""}
                                      onChange={(e) =>
                                        updateDiaryField(
                                          dateKey,
                                          "practicalNumber",
                                          e.target.value
                                        )
                                      }
                                      placeholder="#"
                                    />
                                  ) : (
                                    <span>{entry.practicalNumber || "-"}</span>
                                  )}
                                </td>
                              </>
                            )}
                            {isTeacher && (
                              <td className="p-4">
                                {!isHoliday && (
                                  <Button
                                    onClick={() => toggleEditing(dateKey)}
                                    disabled={isSubmitting}
                                    size="sm"
                                    className="w-full"
                                  >
                                    {isSubmitting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : entry.isEditing ? (
                                      <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                      </>
                                    ) : (
                                      <>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </>
                                    )}
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DailyDiary;
