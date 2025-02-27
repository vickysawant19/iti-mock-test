import React, { useEffect, useState } from "react";
import {
  startOfWeek,
  addDays,
  format,
  differenceInCalendarWeeks,
  addWeeks,
  isAfter,
} from "date-fns";
import { Edit, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetBatchQuery } from "../../../../store/api/batchApi";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../../store/profileSlice";
import { selectUser } from "../../../../store/userSlice";

function DailyDiary() {
  // currentWeekStart is initialized to the Sunday of the current week.
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  // diaryData stores entries keyed by date (formatted as "yyyy-MM-dd")
  const [diaryData, setDiaryData] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState(new Map());

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isTeacher = user.labels.includes("Teacher");

  const {
    data: batchData,
    isLoading,
    isError,
  } = useGetBatchQuery(profile.batchId);

  console.log(batchData);

  useEffect(() => {
    if (!batchData) return;
    const map = new Map();
    batchData.attendanceHolidays.forEach((itm) => {
      const holiday = JSON.parse(itm);
      map.set(holiday.date, holiday);
    });
    setHolidays(map);
  }, [batchData]);

  // Calculate week number relative to the provided startDate.
  const weekNumber =
    differenceInCalendarWeeks(currentWeekStart, batchData?.start_date, {
      weekStartsOn: 0,
    }) + 1;
  // Navigate to the previous week, but prevent going below week 1
  const handlePreviousWeek = () => {
    if (weekNumber > 1) {
      setCurrentWeekStart((prev) => addWeeks(prev, -1));
    }
  };
  // Navigate to the next week.
  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  // Update a specific field for a given day's diary entry.
  const updateDiaryEntry = (dateKey, field, value) => {
    setDiaryData((prev) => ({
      ...prev,
      [dateKey]: {
        // If no entry exists yet, start with default values.
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

  // Toggle the editing mode (edit/save) for a given day.
  const toggleEditing = (dateKey) => {
    setDiaryData((prev) => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {
          theory: "",
          practical: "",
          practicalNumber: "",
          isEditing: true,
        }),
        isEditing: !((prev[dateKey] && prev[dateKey].isEditing) ?? true),
      },
    }));
  };

  // Generate an array of 7 days starting with the currentWeekStart (Sunday).
  const weekDays = Array.from({ length: 7 }).map((_, index) =>
    addDays(currentWeekStart, index)
  );

  // Determine if Previous button should be disabled
  const isPreviousDisabled = weekNumber <= 1;

  return (
    <div className=" w-full mx-auto my-6 px-2 md:px-4">
      <div className="flex items-center justify-between mb-6 w-full ">
        <button
          className={`flex items-center px-3 py-2 text-white rounded-l transition-colors ${
            isPreviousDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={handlePreviousWeek}
          disabled={isPreviousDisabled}
        >
          <ChevronLeft size={18} className="mr-1" />
          Previous
        </button>
        <span className="px-4 py-2 font-bold bg-gray-100">
          Week {weekNumber}
        </span>
        <button
          className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 transition-colors"
          onClick={handleNextWeek}
        >
          Next
          <ChevronRight size={18} className="ml-1" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-indigo-600 text-white">
              <th className="p-3 text-left border border-indigo-700 w-24">
                Date
              </th>
              <th className="p-3 text-left border border-indigo-700 w-20">
                Day
              </th>
              <th className="p-3 text-left border border-indigo-700">Theory</th>
              <th className="p-3 text-left border border-indigo-700">
                Practical
              </th>
              <th className="p-3 text-left border border-indigo-700 w-28">
                Practical #
              </th>
              {isTeacher && (
                <th className="p-3 text-center border border-indigo-700 w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              // If no diary entry exists for this day, use default values.
              const entry = diaryData[dateKey] || {
                theory: "",
                practical: "",
                practicalNumber: "",
                isEditing: true,
              };

              // Alternate row colors
              const isEvenRow = weekDays.indexOf(day) % 2 === 0;
              const rowBgClass = isEvenRow ? "bg-white" : "bg-gray-50";

              const isHoliday = holidays.has(dateKey);

              return (
                <tr
                  key={dateKey}
                  className={`${rowBgClass} ${
                    isHoliday ? "bg-red-300" : "hover:bg-blue-50"
                  }  transition-colors`}
                >
                  <td className="p-3 border border-gray-200 whitespace-nowrap">
                    {format(day, "MMM dd, yyyy")}
                  </td>
                  <td className="p-3 border border-gray-200 font-medium whitespace-nowrap">
                    {format(day, "EEEE")}
                  </td>
                  <td className="p-3 border border-gray-200">
                    {!isHoliday && isTeacher && entry.isEditing ? (
                      <textarea
                        disabled={isHoliday}
                        value={entry.practical}
                        onChange={(e) =>
                          updateDiaryEntry(dateKey, "theory", e.target.value)
                        }
                        className="w-full min-w-60 p-2 border border-gray-300 rounded min-h-20 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="Add theory notes..."
                      />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {isHoliday
                          ? holidays.get(dateKey).holidayText
                          : entry.theory || "-"}
                      </div>
                    )}
                  </td>
                  <td className="p-3 border border-gray-200">
                    {!isHoliday && isTeacher && entry.isEditing ? (
                      <textarea
                        disabled={isHoliday}
                        value={entry.practical}
                        onChange={(e) =>
                          updateDiaryEntry(dateKey, "practical", e.target.value)
                        }
                        className="w-full min-w-60 p-2 border border-gray-300 rounded min-h-20 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="Add practical notes..."
                      />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {isHoliday
                          ? holidays.get(dateKey).holidayText
                          : entry.practical || "-"}
                      </div>
                    )}
                  </td>
                  <td className="p-3 border border-gray-200">
                    {!isHoliday && isTeacher && entry.isEditing ? (
                      <input
                        type="number"
                        value={entry.practicalNumber}
                        onChange={(e) =>
                          updateDiaryEntry(
                            dateKey,
                            "practicalNumber",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="#"
                      />
                    ) : (
                      <span>
                        {isHoliday ? "" : entry.practicalNumber || "-"}
                      </span>
                    )}
                  </td>
                  {isTeacher && (
                    <td className="p-3 border border-gray-200">
                      <div className="flex justify-between w-full">
                        {isHoliday ? (
                          ""
                        ) : entry.isEditing ? (
                          <button
                            onClick={() => toggleEditing(dateKey)}
                            className="flex items-center justify-center w-full px-3 py-2 rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                          >
                            <Save size={16} className="mr-1" /> Save
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleEditing(dateKey)}
                            className="flex items-center justify-center w-full px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                          >
                            <Edit size={16} className="mr-1" /> Edit
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile responsive view */}
      <div className="md:hidden mt-4 text-sm text-gray-500">
        <p>Swipe left/right to view all columns</p>
      </div>
    </div>
  );
}

export default DailyDiary;
