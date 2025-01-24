import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../../store/profileSlice";
import { format } from "date-fns";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import attendanceService from "../../../../appwrite/attaindanceService";
import userProfileService from "../../../../appwrite/userProfileService";
import CustomCalendar from "./Calender";

const MarkAttendance = () => {
  const [students, setStudents] = useState([]);
  const [batchAttendance, setBatchAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const updateInitialData = () => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const initialAttendance = students.reduce((acc, student) => {
      const existingRecord = batchAttendance.find(
        (record) => record.userId === student.userId
      );
      if (existingRecord) {
        const attendanceRecord = existingRecord.attendanceRecords.find(
          (record) => record.date === formattedDate
        );
        if (attendanceRecord) {
          acc[student.userId] = {
            attendanceStatus: attendanceRecord.attendanceStatus,
            inTime: attendanceRecord.inTime,
            outTime: attendanceRecord.outTime,
            reason: attendanceRecord.reason || "",
            isHoliday: attendanceRecord.isHoliday || false,
            holidayText: attendanceRecord.holidayText || "",
          };
          setIsHoliday(attendanceRecord.isHoliday || false);
          setHolidayText(attendanceRecord.holidayText || "");
        } else {
          acc[student.userId] = {
            attendanceStatus: "Present",
            inTime: DEFAULT_IN_TIME,
            outTime: DEFAULT_OUT_TIME,
            reason: "",
            isHoliday: false,
            holidayText: "",
          };
        }
      } else {
        acc[student.userId] = {
          attendanceStatus: "Present",
          inTime: DEFAULT_IN_TIME,
          outTime: DEFAULT_OUT_TIME,
          reason: "",
          isHoliday: false,
          holidayText: "",
        };
      }
      return acc;
    }, {});
    setAttendance(initialAttendance);
  };

  const fetchBatchStudents = async () => {
    setIsLoading(true);
    try {
      const [data, response] = await Promise.all([
        userProfileService.getBatchUserProfile({
          key: "batchId",
          value: profile.batchId,
        }),
        attendanceService.getBatchAttendance(profile.batchId),
      ]);

      setStudents(data);
      const parsedResponse = response.map((item) => ({
        ...item,
        attendanceRecords: item.attendanceRecords.map((a) => JSON.parse(a)),
      }));

      // Extract unique dates with attendance
      const dates = new Set();
      const holidays = new Set();
      parsedResponse.forEach((record) => {
        record.attendanceRecords.forEach((attendance) => {
          dates.add(attendance.date);
          attendance.isHoliday ? holidays.add(attendance.date) : "";
        });
      });
      setDateWithHoliday(holidays);
      setDatesWithAttendance(dates);
      setBatchAttendance(parsedResponse);
    } catch (error) {
      console.error("Error fetching batch students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
    setIsLoading(true);
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
      setIsLoading(false);
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
          <div className="flex justify-center">
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
                    <span className="font-medium">{student.userName}</span>
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
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={attendance[student.userId]?.attendanceStatus}
                            onChange={(e) =>
                              handleAttendanceChange(
                                student.userId,
                                "attendanceStatus",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border-gray-300 text-sm"
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            {/* TODO :Add leves */}
                            <option value="Holiday">Holiday</option>
                          </select>
                        </div>
                        <div>
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
                            className="w-full rounded-md border-gray-300 text-sm"
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
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit Attendance
        </button>
      </form>
    </div>
  );
};

export default MarkAttendance;
