import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Query } from "appwrite";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { selectProfile } from "../../../../store/profileSlice";
import attendanceService from "../../../../appwrite/attaindanceService";
import userProfileService from "../../../../appwrite/userProfileService";
import CustomCalendar from "./Calender";
import CustomInput from "../../../components/CustomInput";

const MarkAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [students, setStudents] = useState([]);
  const [batchAttendance, setBatchAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [expandedRows, setExpandedRows] = useState({});

  const [datesWithAttendance, setDatesWithAttendance] = useState(new Set());
  const [dateWithHoliday, setDateWithHoliday] = useState(new Set());
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayText, setHolidayText] = useState("");

  const DEFAULT_IN_TIME = "09:30";
  const DEFAULT_OUT_TIME = "17:00";

  const profile = useSelector(selectProfile);

  const navigate = useNavigate();

  const updateInitialData = () => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    let markedCount = 0;
    let unmarkCount = 0;
    let presentCount = 0;
    let absentCount = 0;
    let totalCount = students.length;

    const initialAttendance = students.reduce((acc, student) => {
      // Pre-filter batchAttendance for the specific date to avoid repeated searches
      const dateRecords = batchAttendance
        .map((record) =>
          record.attendanceRecords.find((r) => r.date === formattedDate)
        )
        .filter(Boolean);

      const existingRecord = batchAttendance.find(
        (record) => record.userId === student.userId
      );

      const attendanceRecord = existingRecord?.attendanceRecords.find(
        (record) => record.date === formattedDate
      );

      if (attendanceRecord) {
        acc[student.userId] = {
          isMarked: true,
          attendanceStatus: attendanceRecord.attendanceStatus,
          inTime: attendanceRecord.inTime,
          outTime: attendanceRecord.outTime,
          reason: attendanceRecord.reason || "",
          isHoliday: attendanceRecord.isHoliday || false,
          holidayText: attendanceRecord.holidayText || "",
        };
        markedCount++;
        attendanceRecord.attendanceStatus === "Present"
          ? presentCount++
          : absentCount++;

        // Check holiday status
        const holidayCount = dateRecords.filter((r) => r.isHoliday).length;
        const shouldBeHoliday = holidayCount > dateRecords.length / 2;

        setIsHoliday(shouldBeHoliday);
        setHolidayText(
          shouldBeHoliday ? attendanceRecord.holidayText || "" : ""
        );
      } else {
        acc[student.userId] = {
          isMarked: false,
          attendanceStatus: "Present",
          inTime: DEFAULT_IN_TIME,
          outTime: DEFAULT_OUT_TIME,
          reason: "",
          isHoliday: false,
          holidayText: "",
        };
        unmarkCount++;
      }
      return acc;
    }, {});

    // You can store these stats in state if needed
    const stats = {
      markedCount,
      unmarkCount,
      presentCount,
      absentCount,
      totalCount,
    };
    setAttendance({ ...initialAttendance, stats });
  };

  const fetchBatchStudents = async () => {
    setIsLoading(true);
    try {
      const [data, response] = await Promise.all([
        userProfileService.getBatchUserProfile([
          Query.equal("batchId", profile.batchId),
        ]),
        attendanceService.getBatchAttendance(profile.batchId),
      ]);

      setStudents(data);

      // Extract unique dates with attendance
      const dates = new Set();
      const holidays = new Set();
      response.forEach((record) => {
        record.attendanceRecords.forEach((attendance) => {
          dates.add(attendance.date);
          attendance.isHoliday ? holidays.add(attendance.date) : "";
        });
      });
      setDateWithHoliday(holidays);
      setDatesWithAttendance(dates);
      setBatchAttendance(response);
    } catch (error) {
      console.error("Error fetching batch students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!profile.batchId) {
      toast.error("You need to Create/Select a batch");
      // Navigate to create-batch page
      navigate("/profile");
      return;
    }

    fetchBatchStudents();
  }, []);

  useEffect(() => {
    updateInitialData();
  }, [selectedDate, batchAttendance, students]);

  const handleQuickMark = (userId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        attendanceStatus: status,
        inTime: status === "Present" ? DEFAULT_IN_TIME : "",
        outTime: status === "Present" ? DEFAULT_OUT_TIME : "",
      },
    }));
  };

  const toggleOptions = (userId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleAttendanceChange = (userId, field, value) => {
    setAttendance((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const response = await Promise.all(
        students.map((student) => {
          const studentAttendance = attendance[student.userId];
          const newRecord = {
            userId: student.userId,
            userName: student.userName,
            batchId: student.batchId,
            attendanceRecords: [
              {
                date: formattedDate,
                ...studentAttendance,
                isHoliday,
                holidayText,
              },
            ],
            admissionDate: student.enrolledAt,
          };
          return attendanceService.markUserAttendance(newRecord);
        })
      );

      setBatchAttendance(response);
      // Add the new date to dates with attendance
      isHoliday
        ? setDateWithHoliday((prev) => new Set([...prev, formattedDate]))
        : "";
      setDatesWithAttendance((prev) => new Set([...prev, formattedDate]));
      alert("Attendance marked successfully!");
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Failed to mark attendance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tileClassName = ({ date }) => {
    const formattedDate = format(date, "yyyy-MM-dd");

    if (dateWithHoliday.has(formattedDate)) {
      return "holiday-tile";
    }

    if (datesWithAttendance.has(formattedDate)) {
      return "attendance-tile";
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-10">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4 flex justify-center">
          <div className="flex flex-col md:flex-row items-center w-full max-w-4xl space-y-4 md:space-y-0 md:space-x-6">
            {/* Calendar Section */}
            <div className="w-full max-w-md">
              <CustomCalendar
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                tileClassName={tileClassName}
              />
              <style>
                {`
          .react-calendar__month-view__days__day {
            height: auto !important;
            padding: 0.5rem !important;
          }
        `}
              </style>
            </div>

            {/* Stats Card Section */}
            <div className="w-full md:w-auto">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center md:text-left">
                  Day Statistics {format(selectedDate, "dd-MM-yy")}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Total - Full width row */}
                  <div className="col-span-2 sm:col-span-4 p-2 sm:p-3 rounded-lg text-center border-b pb-4 mb-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      Total Students
                    </p>
                    <p className="text-base sm:text-lg font-bold text-blue-600">
                      {attendance?.stats?.totalCount ?? "-"}
                    </p>
                  </div>

                  {/* Marked/Unmarked Pair */}
                  <div className="col-span-2 sm:col-span-2 flex gap-3 sm:gap-4">
                    <div className="flex-1 p-2 sm:p-3 rounded-lg text-center bg-gray-50/50">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Marked
                      </p>
                      <p className="text-base sm:text-lg font-bold text-green-600">
                        {attendance?.stats?.markedCount ?? "-"}
                      </p>
                    </div>
                    <div className="flex-1 p-2 sm:p-3 rounded-lg text-center bg-gray-50/50">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Unmarked
                      </p>
                      <p className="text-base sm:text-lg font-bold text-yellow-600">
                        {attendance?.stats?.unmarkCount ?? "-"}
                      </p>
                    </div>
                  </div>

                  {/* Present/Absent Pair */}
                  <div className="col-span-2 sm:col-span-2 flex gap-3 sm:gap-4">
                    <div className="flex-1 p-2 sm:p-3 rounded-lg text-center bg-gray-50/50">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Present
                      </p>
                      <p className="text-base sm:text-lg font-bold text-purple-600">
                        {attendance?.stats?.presentCount ?? "-"}
                      </p>
                    </div>
                    <div className="flex-1 p-2 sm:p-3 rounded-lg text-center bg-gray-50/50">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Absent
                      </p>
                      <p className="text-base sm:text-lg font-bold text-red-600">
                        {attendance?.stats?.absentCount ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isHoliday}
              onChange={(e) => setIsHoliday(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Mark as Holiday</span>
          </label>
          {isHoliday && (
            <input
              type="text"
              value={holidayText}
              onChange={(e) => setHolidayText(e.target.value)}
              placeholder="Holiday reason"
              className="border rounded-md px-3 py-1 w-1/2"
            />
          )}
        </div>

        {!isHoliday && (
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.userId}
                className="bg-white rounded-lg shadow-sm"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {student?.isMarked ? <></> : <></>}
                      {student.userName}
                    </span>
                    {attendance[student.userId]?.isMarked ? (
                      <span className="text-green-500/90 text-sm">
                        ✓ Marked
                      </span>
                    ) : (
                      <span className="text-orange-500/90 text-sm opacity-50">
                        ⚠ Unmarked
                      </span>
                    )}
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickMark(student.userId, "Present")
                        }
                        className={`px-3 py-1 rounded-md text-sm ${
                          attendance[student.userId]?.attendanceStatus ===
                          "Present"
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickMark(student.userId, "Absent")
                        }
                        className={`px-3 py-1 rounded-md text-sm ${
                          attendance[student.userId]?.attendanceStatus ===
                          "Absent"
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleOptions(student.userId)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    {expandedRows[student.userId] ? (
                      <ChevronUp className="w-4 h-4 mr-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 mr-1" />
                    )}
                    More options
                  </button>

                  {expandedRows[student.userId] && (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3 ">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason
                          </label>
                          <input
                            type="text"
                            value={attendance[student.userId]?.reason || ""}
                            onChange={(e) =>
                              handleAttendanceChange(
                                student.userId,
                                "reason",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border-gray-300 text-sm p-2"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            In Time
                          </label>
                          <input
                            type="time"
                            value={attendance[student.userId]?.inTime || ""}
                            onChange={(e) =>
                              handleAttendanceChange(
                                student.userId,
                                "inTime",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border-gray-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Out Time
                          </label>
                          <input
                            type="time"
                            value={attendance[student.userId]?.outTime || ""}
                            onChange={(e) =>
                              handleAttendanceChange(
                                student.userId,
                                "outTime",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border-gray-300 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Attendance"
          )}
        </button>
      </form>
    </div>
  );
};

export default MarkAttendance;
