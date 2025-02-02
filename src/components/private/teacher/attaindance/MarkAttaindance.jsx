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
import batchService from "../../../../appwrite/batchService";
import { selectUser } from "../../../../store/userSlice";

const MarkAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [students, setStudents] = useState([]);
  const [batchAttendance, setBatchAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [expandedRows, setExpandedRows] = useState({});

  const [datesWithAttendance, setDatesWithAttendance] = useState(new Set());
  const [dateWithHoliday, setDateWithHoliday] = useState(new Map());

  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayText, setHolidayText] = useState("");

  const [batchData, setBatchData] = useState(null);

  const DEFAULT_IN_TIME = "09:30";
  const DEFAULT_OUT_TIME = "17:00";

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isTeacher = user?.labels.includes("Teacher");

  const navigate = useNavigate();

  const fetchBatchData = async (batchId) => {
    try {
      const data = await batchService.getBatch(batchId);
      const parsedData = data?.attendanceHolidays.map((item) =>
        JSON.parse(item)
      );
      const holidays = new Map();
      parsedData.forEach((item) => holidays.set(item.date, item.holidayText));
      setDateWithHoliday(holidays);
      setBatchData({ ...data, attendanceHolidays: parsedData || [] });
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBatchStudents = async () => {
    setIsLoading(true);
    try {
      const [batchStudentsProfiles, batchStudentsAttendance] =
        await Promise.all([
          userProfileService.getBatchUserProfile([
            Query.equal("batchId", profile.batchId),
          ]),
          attendanceService.getBatchAttendance(profile.batchId),
        ]);
      // Extract unique dates with attendance
      const dates = new Map();
      batchStudentsAttendance.forEach((record) => {
        record.attendanceRecords.forEach((attendance) => {
          if (attendance.attendanceStatus === "Present") {
            dates.set(attendance.date, {
              ...dates.get(attendance.date),
              P: (dates.get(attendance.date)?.P || 0) + 1,
            });
          } else if (attendance.attendanceStatus === "Absent") {
            dates.set(attendance.date, {
              ...dates.get(attendance.date),
              A: (dates.get(attendance.date)?.A || 0) + 1,
            });
          }
        });
      });
      setDatesWithAttendance(dates);
      setStudents(batchStudentsProfiles);
      setBatchAttendance(batchStudentsAttendance);
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
    fetchBatchData(profile.batchId);
    fetchBatchStudents();
  }, []);

  const updateInitialData = () => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    // Directly set holiday flag
    setIsHoliday(dateWithHoliday.has(formattedDate));

    let markedCount = 0;
    let unmarkCount = 0;
    let presentCount = 0;
    let absentCount = 0;
    const totalCount = students.length;

    // Preprocess batchAttendance into a Map for O(1) lookups by userId
    const attendanceMap = new Map();
    batchAttendance.forEach((record) => {
      attendanceMap.set(record.userId, record.attendanceRecords);
    });

    const initialAttendance = students.reduce((acc, student) => {
      // Get the attendance records for the student
      const records = attendanceMap.get(student.userId) || [];
      // Find the record that matches the formatted date
      const attendanceRecord = records.find(
        (record) => record.date === formattedDate
      );

      if (attendanceRecord && !dateWithHoliday.has(formattedDate)) {
        acc[student.userId] = {
          isMarked: true,
          attendanceStatus: attendanceRecord.attendanceStatus,
          inTime: attendanceRecord.inTime,
          outTime: attendanceRecord.outTime,
          reason: attendanceRecord.reason || "",
        };
        markedCount++;
        if (attendanceRecord.attendanceStatus === "Present") {
          presentCount++;
        } else {
          absentCount++;
        }
      } else {
        acc[student.userId] = {
          isMarked: false,
          attendanceStatus: "Present", // default status when unmarked
          inTime: DEFAULT_IN_TIME,
          outTime: DEFAULT_OUT_TIME,
          reason: "",
        };
        unmarkCount++;
      }
      return acc;
    }, {});

    // Consolidate stats
    const stats = {
      markedCount,
      unmarkCount,
      presentCount,
      absentCount,
      totalCount,
    };

    // Merge attendance records with stats
    setAttendance({ ...initialAttendance, stats });
  };

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
      if (dateWithHoliday.has(formattedDate)) {
        toast.error("Cant mark attendance Its a Holiday");
        return;
      }

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
              },
            ],
          };
          return attendanceService.markUserAttendance(newRecord);
        })
      );
      setBatchAttendance(response);
      setDatesWithAttendance((prev) => {
        const newMap = new Map(prev); // Clone previous Map
        const temp = new Map();
        temp.set(formattedDate, { P: 0, A: 0 });
        Object.values(attendance).forEach((record) => {
          if (!record.attendanceStatus) return;
          // Get or initialize the data for the given date
          const existingData = temp.get(formattedDate);
          const updatedData = {
            P: existingData.P + (record.attendanceStatus === "Present" ? 1 : 0),
            A: existingData.A + (record.attendanceStatus === "Absent" ? 1 : 0),
          };
          temp.set(formattedDate, updatedData);
        });
        newMap.set(formattedDate, temp.get(formattedDate));
        return newMap;
      });

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
    if (dateWithHoliday.has(formattedDate)) return "holiday-tile";
    if (datesWithAttendance.has(formattedDate)) {
      return "attendance-tile";
    }
    return null;
  };

  const tileContent = ({ date }) => {
    const formatedDate = format(date, "yyyy-MM-dd");
    if (dateWithHoliday.has(formatedDate)) {
      return (
        <div className="w-full h-full flex flex-col cursor-pointer">
          <div className="flex flex-col justify-center items-center text-center text-xs p-1">
            <div className="italic text-red-600 mb-1">
              {dateWithHoliday.get(formatedDate) || "Holiday"}
            </div>
          </div>
        </div>
      );
    }
    if (datesWithAttendance.has(formatedDate)) {
      const data = datesWithAttendance.get(formatedDate);
      return (
        <div className="w-full h-full flex flex-col cursor-pointer">
          <div className="flex flex-col justify-center items-center text-center text-xs p-1">
            <div className="italic text-white font-bold mb-1 text-xs ">
              {data ? `P:${data.P || 0} A:${data.A || 0}` : "Holiday"}
            </div>
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-10">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="grid grid-cols-1 gap-4">
        {/* Top Section with Stats and Submit Button in one container */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Stats in a single line on desktop */}
            <div className="grid grid-cols-5 sm:flex sm:flex-row sm:space-x-4 gap-2 sm:gap-0 flex-1">
              <div className="bg-blue-50 p-2 rounded-lg flex flex-col justify-center items-center">
                <p className="text-xs text-blue-600 font-medium">Total</p>
                <p className="text-sm font-bold text-blue-700">
                  {attendance?.stats?.totalCount ?? "-"}
                </p>
              </div>
              <div className="bg-green-50 p-2 rounded-lg flex flex-col justify-center items-center">
                <p className="text-xs text-green-600 font-medium">Marked</p>
                <p className="text-sm font-bold text-green-700">
                  {attendance?.stats?.markedCount ?? "-"}
                </p>
              </div>
              <div className="bg-yellow-50 p-2 rounded-lg flex flex-col justify-center items-center">
                <p className="text-xs text-yellow-600 font-medium">Unmarked</p>
                <p className="text-sm font-bold text-yellow-700">
                  {attendance?.stats?.unmarkCount ?? "-"}
                </p>
              </div>
              <div className="bg-purple-50 p-2 rounded-lg flex flex-col justify-center items-center">
                <p className="text-xs text-purple-600 font-medium">Present</p>
                <p className="text-sm font-bold text-purple-700">
                  {attendance?.stats?.presentCount ?? "-"}
                </p>
              </div>
              <div className="bg-red-50 p-2 rounded-lg flex flex-col justify-center items-center">
                <p className="text-xs text-red-600 font-medium">Absent</p>
                <p className="text-sm font-bold text-red-700">
                  {attendance?.stats?.absentCount ?? "-"}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <form
              onSubmit={handleSubmit}
              className="w-full sm:w-auto flex items-center"
            >
              <div className="mr-10 font-bold text-center text-nowrap">
                {format(selectedDate, "dd-MM-yyyy")}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        </div>

        {/* Bottom Section with Calendar and Attendance List */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Calendar Section - 2/3 width on desktop */}
          <div className="lg:col-span-3  bg-white rounded-lg shadow-sm p-4">
            <CustomCalendar
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              tileClassName={tileClassName}
              tileContent={tileContent}
              enableNextTiles={isTeacher}
              startDate={((d) => (d ? new Date(d) : undefined))(
                batchData?.start_date
              )}
            />
          </div>

          {/* Attendance List Section - 1/3 width on desktop */}
          <div className="lg:col-span-2  flex flex-col h-[calc(100vh-76px)] ">
            {/* Holiday Toggle */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isHoliday}
                    onChange={(e) => setIsHoliday(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Mark as Holiday</span>
                </label>
                {isHoliday && (
                  <input
                    type="text"
                    value={holidayText}
                    onChange={(e) => setHolidayText(e.target.value)}
                    placeholder="Holiday reason"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* Scrollable Student List */}
            <div className="bg-white rounded-lg shadow-sm flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-4">
                {!isHoliday && (
                  <div className="space-y-4">
                    {students
                      .sort(
                        (a, b) => parseInt(a.studentId) - parseInt(b.studentId)
                      )
                      .map((student) => (
                        <div
                          key={student.userId}
                          className="border rounded-lg p-4"
                        >
                          {/* Student card content remains the same */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">
                                {student.studentId || 0}
                              </span>
                              <span className="font-medium text-gray-800">
                                {student.userName}
                              </span>
                              {attendance[student.userId]?.isMarked ? (
                                <span className="text-green-500 text-sm">
                                  ✓ Marked
                                </span>
                              ) : (
                                <span className="text-orange-500 text-sm">
                                  ⚠ Unmarked
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickMark(student.userId, "Present")
                                }
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                  attendance[student.userId]
                                    ?.attendanceStatus === "Present"
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickMark(student.userId, "Absent")
                                }
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                  attendance[student.userId]
                                    ?.attendanceStatus === "Absent"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </div>

                          {/* More options section remains the same */}
                          <button
                            type="button"
                            onClick={() => toggleOptions(student.userId)}
                            className="mt-4 flex items-center text-sm text-gray-500 hover:text-gray-700"
                          >
                            {expandedRows[student.userId] ? (
                              <ChevronUp className="w-4 h-4 mr-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 mr-1" />
                            )}
                            More options
                          </button>

                          {expandedRows[student.userId] && (
                            <div className="mt-4 space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Reason
                                </label>
                                <input
                                  type="text"
                                  value={
                                    attendance[student.userId]?.reason || ""
                                  }
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      student.userId,
                                      "reason",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border rounded-lg"
                                  placeholder="Optional"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    In Time
                                  </label>
                                  <input
                                    type="time"
                                    value={
                                      attendance[student.userId]?.inTime || ""
                                    }
                                    onChange={(e) =>
                                      handleAttendanceChange(
                                        student.userId,
                                        "inTime",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Out Time
                                  </label>
                                  <input
                                    type="time"
                                    value={
                                      attendance[student.userId]?.outTime || ""
                                    }
                                    onChange={(e) =>
                                      handleAttendanceChange(
                                        student.userId,
                                        "outTime",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border rounded-lg"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
