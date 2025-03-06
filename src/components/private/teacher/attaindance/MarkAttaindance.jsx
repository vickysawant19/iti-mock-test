import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Link as Linkto } from "react-router-dom";
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

  const [datesWithAttendance, setDatesWithAttendance] = useState(new Map());
  const [dateWithHoliday, setDateWithHoliday] = useState(new Map());

  const [batchData, setBatchData] = useState(null);

  const DEFAULT_IN_TIME = "09:30";
  const DEFAULT_OUT_TIME = "17:00";

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const isTeacher = user?.labels.includes("Teacher");
  const isHoliday = dateWithHoliday.has(format(selectedDate, "yyyy-MM-dd"));

  const navigate = useNavigate();

  const fetchBatchData = async (batchId) => {
    try {
      const data = await batchService.getBatch(batchId);
      const parsedData = data?.attendanceHolidays.map((item) =>
        JSON.parse(item)
      );
      const holidays = new Map();
      parsedData.forEach((item) => holidays.set(item.date, item));
      setDateWithHoliday(holidays);
      setBatchData({ ...data, attendanceHolidays: parsedData || [] });
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBatchStudents = async () => {
    setIsLoading(true);
    try {
      const [batchStudentsProfiles, batchStudentsAttendance] = await Promise.all([
        userProfileService.getBatchUserProfile([
          Query.equal("batchId", profile.batchId),
          Query.equal("status", "Active"),
          Query.notEqual("userId", profile.userId),
        ]),
        attendanceService.getBatchAttendance(profile.batchId, [
          Query.notEqual("userId", profile.userId),
        ]),
      ]);
  
      // Create a set of valid user IDs from the student profiles
      const validUserIds = new Set(batchStudentsProfiles.map(student => student.userId));
  
      // Filter attendance records to include only those from valid student profiles
      const filteredAttendance = batchStudentsAttendance.filter(record =>
        validUserIds.has(record.userId)
      );
  
      // Extract unique dates with attendance counts from the filtered records
      const dates = new Map();
      filteredAttendance.forEach(record => {
        record.attendanceRecords.forEach(attendance => {
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
      setBatchAttendance(filteredAttendance);
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
    if (dateWithHoliday.get(formattedDate)) {
      return;
    }

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
          isMarked: true,
          attendanceStatus: "Absent", // default status when unmarked
          inTime: "",
          outTime: "",
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
        isMarked: true,
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
        toast.warn("Cant mark attendace on holiday! ");
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
              {dateWithHoliday.get(formatedDate)?.holidayText || "Holiday"}
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
  const StatCard = ({ title, value, bgColor, textColor, valueColor }) => (
    <div
      className={`${bgColor} rounded-lg p-2   flex flex-col items-center justify-center shadow-md `}
    >
      <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
      <p className={`text-xs opacity-50 ${textColor} font-medium`}>{title}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1  lg:grid-cols-3 gap-6 text-sm">
        {/* Calendar Section */}
        <div className="lg:col-span-2 row-span-1">
          {/* Stats Cards Row */}
          <div className="grid lg:col-span-1 lg:grid-cols-5 grid-cols-5 gap-2">
            <StatCard
              title="Total"
              value={attendance?.stats?.totalCount ?? "-"}
              bgColor="bg-blue-50"
              textColor="text-blue-600"
              valueColor="text-blue-700"
            />
            <StatCard
              title="Marked"
              value={attendance?.stats?.markedCount ?? "-"}
              bgColor="bg-green-50"
              textColor="text-green-600"
              valueColor="text-green-700"
            />
            <StatCard
              title="Unmarked"
              value={attendance?.stats?.unmarkCount ?? "-"}
              bgColor="bg-yellow-50"
              textColor="text-yellow-600"
              valueColor="text-yellow-700"
            />
            <StatCard
              title="Present"
              value={attendance?.stats?.presentCount ?? "-"}
              bgColor="bg-purple-50"
              textColor="text-purple-600"
              valueColor="text-purple-700"
            />
            <StatCard
              title="Absent"
              value={attendance?.stats?.absentCount ?? "-"}
              bgColor="bg-red-50"
              textColor="text-red-600"
              valueColor="text-red-700"
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm mt-5">
            <div className="p-2 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium">
                Date: {format(selectedDate, "dd MMMM yyyy")}
              </h2>
              <Linkto
                to="/attaindance/mark-holidays"
                className=" px-6 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all shadow-sm text-center"
              >
                Edit Holidays
              </Linkto>
            </div>
            <div className="p-4">
              <CustomCalendar
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                tileClassName={tileClassName}
                tileContent={tileContent}
                enableNextTiles={isTeacher}
                startDate={
                  batchData?.start_date
                    ? new Date(batchData.start_date)
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Attendance List Section */}
        <div className="lg:col-span-1 row-span-1">
          <div className="bg-white rounded-lg shadow-sm  ">
            <div className="p-2 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium">Student List</h2>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className=" px-6 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Submit Attendance"
                )}
              </button>
            </div>
            <div className="p-4 h-[calc(100vh-4rem)] overflow-y-auto">
              {!isHoliday && (
                <div className="space-y-4">
                  {students
                    .sort(
                      (a, b) => parseInt(a.studentId) - parseInt(b.studentId)
                    )
                    .map((student) => (
                      <div
                        key={student.userId}
                        className={`border rounded-lg p-4 border-l-4  transition-colors text-sm ${
                          attendance[student.userId]?.isMarked
                            ? attendance[student.userId]?.attendanceStatus ===
                              "Present"
                              ? "border-green-400 hover:border-green-500"
                              : "border-red-400 hover:border-red-500"
                            : "border-gray-400 hover:border-gray-500"
                        }  `}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3  ">
                          <div
                            type={"button"}
                            onClick={() => toggleOptions(student.userId)}
                            className="flex items-center gap-3 "
                          >
                            <span className="font-bold text-lg text-gray-700">
                              {student.studentId || 0}
                            </span>
                            <span className="font-medium text-gray-800">
                              {student.userName}
                            </span>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickMark(student.userId, "Present")
                              }
                              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                attendance[student.userId]?.isMarked
                                  ? attendance[student.userId]
                                      ?.attendanceStatus === "Present"
                                    ? "bg-green-400 hover:bg-green-500"
                                    : "bg-gray-100 hover:bg-gray-200"
                                  : "bg-green-100 hover:bg-green-200"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickMark(student.userId, "Absent")
                              }
                              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                attendance[student.userId]?.isMarked
                                  ? attendance[student.userId]
                                      ?.attendanceStatus === "Absent"
                                    ? "bg-red-400 hover:bg-red-500"
                                    : "bg-gray-100 hover:bg-gray-200"
                                  : "bg-red-100 hover:bg-red-200"
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>

                        {expandedRows[student.userId] && (
                          <div className="mt-4 space-y-4">
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
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
  );
};

export default MarkAttendance;
