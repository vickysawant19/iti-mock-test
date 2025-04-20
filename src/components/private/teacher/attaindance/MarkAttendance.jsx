import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { Link as Linkto } from "react-router-dom";
import { Query } from "appwrite";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import CustomCalendar from "./Calender";
import { selectProfile } from "../../../../store/profileSlice";
import attendanceService from "../../../../appwrite/attaindanceService";
import userProfileService from "../../../../appwrite/userProfileService";
import batchService from "../../../../appwrite/batchService";
import { selectUser } from "../../../../store/userSlice";
import { ClipLoader } from "react-spinners";

const MarkAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [studentProfileMap, setStudentProfileMap] = useState(new Map());
  const [batchAttendanceMap, setBatchAttendanceMap] = useState(new Map());

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
      const batchStudentsProfiles =
        await userProfileService.getBatchUserProfile([
          Query.equal("batchId", profile.batchId),
          Query.equal("status", "Active"),
          Query.notEqual("userId", profile.userId),
        ]);

      const profileIds = batchStudentsProfiles.map((student) => student.userId);

      const batchStudentsAttendance =
        await attendanceService.getStudentsAttendance([
          Query.equal("userId", profileIds),
        ]);

      // Extract unique dates with attendance counts from the filtered records
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
      setStudentProfileMap(
        new Map(
          batchStudentsProfiles.map((profile) => [profile.userId, profile])
        )
      );
      setBatchAttendanceMap(
        new Map(batchStudentsAttendance.map((item) => [item.userId, item]))
      );
      setDatesWithAttendance(dates);
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
    const totalCount = studentProfileMap.size;

    const initialAttendance = [...studentProfileMap.values()].reduce(
      (acc, student) => {
        // Get the attendance records for the student
        const records = batchAttendanceMap.get(student.userId) || {};
        // Find the record that matches the formatted date

        const attendanceRecord = records?.attendanceRecords?.find(
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
            attendanceStatus: "Absent", // default status when unmarked
            inTime: "",
            outTime: "",
            reason: "",
          };
          unmarkCount++;
        }
        return acc;
      },
      {}
    );
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
  }, [selectedDate, studentProfileMap, batchAttendanceMap]);

  const saveAttendance = async (userId, status) => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    if (dateWithHoliday.has(formattedDate)) {
      toast.warn("Cant mark attendace on holiday! ");
      return;
    }
    try {
      const student = studentProfileMap.get(userId);
      const newRecord = {
        userId: student.userId,
        userName: student.userName,
        batchId: student.batchId,
        attendanceRecords: [
          {
            date: formattedDate,
            attendanceStatus: status,
            inTime: status === "Present" ? DEFAULT_IN_TIME : "",
            outTime: status === "Present" ? DEFAULT_OUT_TIME : "",
            isMarked: true,
          },
        ],
      };
      const res = await attendanceService.markUserAttendance(newRecord);
      setBatchAttendanceMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(res.userId, res);
        return newMap;
      });

      setDatesWithAttendance((prev) => {
        const newMap = new Map(prev);
        const oldCount = newMap.get(formattedDate) || { P: 0, A: 0 };
        // Get the current attendance status for the user
        const currentRecord = batchAttendanceMap.get(userId);
        const wasPresent = currentRecord?.attendanceRecords.some(
          (record) =>
            record.date === formattedDate &&
            record.attendanceStatus === "Present"
        );
        // Update counts correctly
        const newP =
          status === "Present"
            ? wasPresent
              ? oldCount.P
              : oldCount.P + 1
            : wasPresent
            ? oldCount.P - 1
            : oldCount.P;

        const newA =
          status === "Present"
            ? wasPresent
              ? oldCount.A
              : oldCount.A - 1
            : wasPresent
            ? oldCount.A + 1
            : oldCount.A;

        newMap.set(formattedDate, { P: newP, A: newA });
        return newMap;
      });
      toast.success(`${student.userName}:${status}`);
      return res;
    } catch (error) {
      console.log("Error: saving attendance", error);
      return false;
    }
  };

  const handleQuickMark = async (userId, status) => {
    const previousStatus = attendance[userId];

    if (
      previousStatus &&
      (!previousStatus.isMarked || previousStatus.attendanceStatus !== status)
    ) {
      // new attendace status update
      saveAttendance(userId, status);
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
    }

    return;
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

  const StatCard = ({
    title,
    value,
    bgColor,
    textColor,
    valueColor,
    borderColor,
    icon,
  }) => {
    const getIcon = () => {
      switch (icon) {
        case "Users":
          return <Users className={`${textColor} h-4 w-4`} />;
        case "CheckCircle":
          return <CheckCircle className={`${textColor} h-4 w-4`} />;
        case "AlertCircle":
          return <AlertCircle className={`${textColor} h-4 w-4`} />;
        case "UserCheck":
          return <UserCheck className={`${textColor} h-4 w-4`} />;
        case "UserX":
          return <UserX className={`${textColor} h-4 w-4`} />;
        default:
          return null;
      }
    };

    return (
      <div className={`${bgColor} ${borderColor} p-2 rounded-md shadow-sm`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`${textColor} font-medium text-xs`}>{title}</h3>
          {getIcon()}
        </div>
        <div className={`${valueColor} text-lg font-bold`}>{value}</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Main Content Grid */}
      <div
        className={` grid grid-cols-1 lg:grid-cols-5 gap-6 text-sm transition-all duration-300`}
      >
        {/* Calendar Section */}
        <div className="lg:col-span-3 row-span-1">
          {/* Stats Cards Row */}
          <div className="grid lg:grid-cols-5 grid-cols-2 md:grid-cols-3 gap-2 p-2 bg-gray-50 rounded-md shadow-sm">
            <StatCard
              title="Total"
              value={attendance?.stats?.totalCount ?? "-"}
              bgColor="bg-blue-50"
              icon="Users"
              textColor="text-blue-700"
              valueColor="text-blue-800"
              borderColor="border-l-2 border-blue-400"
            />
            <StatCard
              title="Marked"
              value={attendance?.stats?.markedCount ?? "-"}
              bgColor="bg-green-50"
              icon="CheckCircle"
              textColor="text-green-700"
              valueColor="text-green-800"
              borderColor="border-l-2 border-green-400"
            />
            <StatCard
              title="Unmarked"
              value={attendance?.stats?.unmarkCount ?? "-"}
              bgColor="bg-amber-50"
              icon="AlertCircle"
              textColor="text-amber-700"
              valueColor="text-amber-800"
              borderColor="border-l-2 border-amber-400"
            />
            <StatCard
              title="Present"
              value={attendance?.stats?.presentCount ?? "-"}
              bgColor="bg-indigo-50"
              icon="UserCheck"
              textColor="text-indigo-700"
              valueColor="text-indigo-800"
              borderColor="border-l-2 border-indigo-400"
            />
            <StatCard
              title="Absent"
              value={attendance?.stats?.absentCount ?? "-"}
              bgColor="bg-rose-50"
              icon="UserX"
              textColor="text-rose-700"
              valueColor="text-rose-800"
              borderColor="border-l-2 border-rose-400"
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

        {/* Attendance List Section */}
        {!isHoliday && (
          <div className="lg:col-span-2 row-span-1">
            <div className="bg-white rounded-lg shadow-sm  ">
              <div className="p-2 border-b flex justify-between items-center">
                <h2 className="text-lg font-medium">Student List</h2>
              </div>
              <div className="p-4 h-[calc(100vh-4rem)] overflow-y-auto">
                {
                  <div className="space-y-4">
                    {Array.from(studentProfileMap.values())
                      .sort(
                        (a, b) => parseInt(a.studentId) - parseInt(b.studentId)
                      )
                      .map((student) => (
                        <div
                          key={student.userId}
                          className={`border rounded-lg  border-l-4  transition-colors text-sm ${
                            attendance[student.userId]?.isMarked
                              ? attendance[student.userId]?.attendanceStatus ===
                                "Present"
                                ? "border-green-400 hover:border-green-500"
                                : "border-red-400 hover:border-red-500"
                              : "border-gray-400 hover:border-gray-500"
                          }  `}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between w-full p-2  rounded-lg">
                            {/* Student Name and ID */}
                            <div
                              type={"button"}
                              onClick={() => toggleOptions(student.userId)}
                              className="flex items-center gap-2 mb-2 sm:mb-0"
                            >
                              <span className="font-bold text-lg text-gray-700">
                                {student.studentId || 0}
                              </span>
                              <span className="font-medium text-gray-800">
                                {student.userName}
                              </span>
                            </div>

                            {/* Buttons of Attendance Absent and Present */}
                            <div className="flex gap-2 items-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickMark(student.userId, "Present")
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;
