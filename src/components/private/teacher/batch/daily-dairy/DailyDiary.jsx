import React, { useEffect, useMemo, useState } from "react";
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
import { Edit, Save, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";

import { useGetBatchQuery } from "../../../../../store/api/batchApi";
import { selectProfile } from "../../../../../store/profileSlice";
import { selectUser } from "../../../../../store/userSlice";
import batchService from "../../../../../appwrite/batchService";
import attendanceService from "../../../../../appwrite/attaindanceService";

function DailyDiary() {
  const currentWeekStartInitial = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    []
  );

  const [currentWeekStart, setCurrentWeekStart] = useState(
    currentWeekStartInitial
  );

  // Store entries by date (formatted as "yyyy-MM-dd")
  const [diaryData, setDiaryData] = useState({});
  const [attendance, setAttendance] = useState(new Map());
  const [holidays, setHolidays] = useState(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isTeacher = user.labels.includes("Teacher");

  const {
    data: batchData,
    isLoading,
    isError,
  } = useGetBatchQuery(profile.batchId);

  const navigate = useNavigate();

  // const [updateDiaryEntry] = useUpdateDiaryEntryMutation();

  const fetchAttendance = async () => {
    try {
      const data = await attendanceService.getUserAttendance(
        profile.userId,
        profile.batchId
      );
      let map = new Map();
      data.attendanceRecords.forEach((item) =>
        map.set(item.date, item.attendanceStatus)
      );
      setAttendance(map);
    } catch (error) {
      console.log("Error batch daily dairy ", error);
    }
  };

  useEffect(() => {
    if (profile && !profile.batchId) {
      toast.error("You need to Create/Select a batch");
      // Navigate to create-batch page
      navigate("/profile");
      return;
    }
    fetchAttendance();
  }, [profile]);

  useEffect(() => {
    if (!batchData) return;

    // Load diary entries from API if available
    if (batchData.dailyDairy) {
      const data = Object.fromEntries(
        batchData.dailyDairy.map((itm) => JSON.parse(itm))
      );
      setDiaryData(data);
    }

    // Set holidays
    const map = new Map();
    if (batchData.attendanceHolidays) {
      batchData.attendanceHolidays.forEach((itm) => {
        try {
          const holiday = typeof itm === "string" ? JSON.parse(itm) : itm;
          map.set(holiday.date, holiday);
        } catch (e) {
          console.error("Error parsing holiday:", e);
        }
      });
    }
    setHolidays(map);
  }, [batchData]);

  // Calculate week number with useMemo to avoid calculations during render
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

  // Navigation functions
  const handlePreviousWeek = () => {
    if (weekNumber > 1) {
      setCurrentWeekStart((prev) => addWeeks(prev, -1));
    }
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  // Update a specific field for a given day's diary entry
  const updateDiaryField = (dateKey, field, value) => {
    setDiaryData((prev) => ({
      ...prev,
      [dateKey]: {
        // If no entry exists yet, start with default values
        ...(prev[dateKey] || {
          theory: "",
          practical: "",
          practicalNumber: "",
          isEditing: true,
        }),
        [field]: value,
      },
    }));
  };

  // Toggle editing mode for a specific day
  const toggleEditing = (dateKey) => {
    // Get the current entry from diaryData or initialize it
    const currentEntry = diaryData[dateKey] || {
      theory: "",
      practical: "",
      practicalNumber: "",
      isEditing: true,
    };

    // If currently editing, update state first to set isEditing to false and then submit
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
      // Otherwise, simply toggle into editing mode
      setDiaryData((prev) => ({
        ...prev,
        [dateKey]: {
          ...currentEntry,
          isEditing: true,
        },
      }));
    }
  };

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

  // Generate array of 7 days starting with currentWeekStart
  const weekDays = Array.from({ length: 7 }).map((_, index) =>
    addDays(currentWeekStart, index)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-600">
        Failed to load diary data. Please try again later.
      </div>
    );
  }

  return (
    <div className="w-full mx-auto my-6 px-2 md:px-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6 w-full">
        <button
          className={`flex items-center px-3 py-2 text-white rounded-md transition-colors ${
            weekNumber <= 1
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          onClick={handlePreviousWeek}
          disabled={weekNumber <= 1}
          aria-label="Previous Week"
        >
          <ChevronLeft size={18} className="mr-1" />
          Previous
        </button>
        <div className="px-4 py-2 font-bold bg-gray-100 rounded-md border border-gray-300">
          Week {weekNumber}
        </div>
        <button
          className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          onClick={handleNextWeek}
          aria-label="Next Week"
        >
          Next
          <ChevronRight size={18} className="ml-1" />
        </button>
      </div>

      {/* Diary table */}
      <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-indigo-700 text-white">
              <th className="p-2 text-center  border border-indigo-800 w-24">
                Date
              </th>
              <th className="p-2 text-center border border-indigo-800 w-20">
                Day
              </th>
              <th className="p-2 text-center border border-indigo-800">
                Theory
              </th>
              <th className="p-2 text-center border border-indigo-800">
                Practical
              </th>
              <th className="p-2 text-center border border-indigo-800 w-28">
                Practical #
              </th>
              {isTeacher && (
                <th className="p-2 text-center border border-indigo-800 w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const entry = diaryData[dateKey] || {
                theory: "",
                practical: "",
                practicalNumber: "",
                isEditing: true,
              };

              const isAbsent =
                !isTeacher && attendance.get(dateKey) === "Absent";
              const isHoliday = holidays.has(dateKey);
              const isWeekend =
                format(day, "E") === "Sat" || format(day, "E") === "Sun";

              return (
                <tr
                  key={dateKey}
                  className={`
                    ${
                      isHoliday
                        ? "bg-red-100"
                        : isAbsent
                        ? "bg-pink-200"
                        : isWeekend
                        ? "bg-gray-50"
                        : "bg-white"
                    } 
                     transition-colors
                  `}
                >
                  <td className="p-2 border border-gray-300 whitespace-nowrap font-medium text-wrap text-center">
                    {format(day, "MMM dd, yyyy")}
                  </td>
                  <td className="p-2 border border-gray-300 font-medium whitespace-nowrap text-center">
                    {format(day, "EEEE")}
                  </td>
                  <td
                    colSpan={isHoliday ? 3 : 1}
                    className={`p-2 border border-gray-300 ${
                      isHoliday ? "text-center" : "text-left"
                    }`}
                  >
                    {!isAbsent && !isHoliday && isTeacher && entry.isEditing ? (
                      <textarea
                        disabled={isHoliday}
                        value={entry.theory || ""}
                        onChange={(e) =>
                          updateDiaryField(dateKey, "theory", e.target.value)
                        }
                        className="w-full min-w-40 p-2 border border-gray-300 rounded-sm min-h-20 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-200 focus:ring-opacity-50"
                        placeholder="Add theory notes..."
                      />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {isHoliday
                          ? holidays.get(dateKey)?.holidayText || "Holiday"
                          : isAbsent
                          ? "Absent"
                          : entry.theory || "-"}
                      </div>
                    )}
                  </td>
                  <td
                    className={`${
                      isHoliday ? "hidden" : "p-2 border border-gray-300"
                    }`}
                  >
                    {!isAbsent && !isHoliday && isTeacher && entry.isEditing ? (
                      <textarea
                        disabled={isHoliday}
                        value={entry.practical || ""}
                        onChange={(e) =>
                          updateDiaryField(dateKey, "practical", e.target.value)
                        }
                        className={`w-full min-w-40 p-2  ${
                          isHoliday ? "border-none" : "border border-gray-300"
                        }   rounded min-h-20 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-200 focus:ring-opacity-50`}
                        placeholder="Add practical notes..."
                      />
                    ) : (
                      <div className="whitespace-pre-wrap break-words ">
                        {isHoliday
                          ? holidays.get(dateKey)?.holidayText || "Holiday"
                          : isAbsent
                          ? "Absent"
                          : entry.practical || "-"}
                      </div>
                    )}
                  </td>
                  <td
                    className={
                      isHoliday ? "hidden" : "p-2 border border-gray-300"
                    }
                  >
                    {!isAbsent && !isHoliday && isTeacher && entry.isEditing ? (
                      <input
                        type="number"
                        value={entry.practicalNumber || ""}
                        onChange={(e) =>
                          updateDiaryField(
                            dateKey,
                            "practicalNumber",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border border-gray-300 rounded-sm focus:border-indigo-500 focus:ring-3 focus:ring-indigo-200 focus:ring-opacity-50"
                        placeholder="#"
                      />
                    ) : (
                      <span>
                        {isHoliday
                          ? ""
                          : isAbsent
                          ? "Absent"
                          : entry.practicalNumber || "-"}
                      </span>
                    )}
                  </td>
                  {isTeacher && (
                    <td className="p-3 border border-gray-300">
                      {!isHoliday && (
                        <div className="flex flex-col gap-2">
                          {entry.isEditing ? (
                            <button
                              disabled={isSubmitting}
                              onClick={() => toggleEditing(dateKey)}
                              className="flex items-center justify-center px-3 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                              <Save size={16} className="mr-1" />
                              Save
                            </button>
                          ) : (
                            <button
                              disabled={isSubmitting}
                              onClick={() => toggleEditing(dateKey)}
                              className="flex items-center justify-center px-3 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                              <Edit size={16} className="mr-1" />
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile helper text */}
      <div className="md:hidden mt-4 text-sm text-gray-600 text-center">
        <p>Swipe left/right to view all columns</p>
      </div>
    </div>
  );
}

export default DailyDiary;
