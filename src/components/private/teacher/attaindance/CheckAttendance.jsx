import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import React, { useEffect, useState } from "react";
import {
  Loader2,
  Award,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../store/userSlice";
import { selectProfile } from "../../../../store/profileSlice";
import attendanceService from "../../../../appwrite/attaindanceService";
import { format } from "date-fns";
import CustomCalendar from "./Calender";

const CheckAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
    attendancePercentage: 0,
  });

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getUserAttendance(profile.userId);
      setAttendance(data.attendanceRecords);

      const workingDays = data.attendanceRecords.filter(
        (record) => !record.isHoliday
      );
      // Calculate attendance statistics
      const totalDays = workingDays.length;
      const presentDays = workingDays.filter(
        (record) => record.attendanceStatus === "Present"
      ).length;
      const absentDays = workingDays.filter(
        (record) => record.attendanceStatus === "Absent"
      ).length;
      const holidayDays = data.attendanceRecords.filter(
        (record) => record.isHoliday
      ).length;
      const attendancePercentage =
        totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

      setAttendanceStats({
        totalDays,
        presentDays,
        absentDays,
        holidayDays,
        attendancePercentage,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const tileClassName = ({ date }) => {
    const formatedDate = format(date, "yyyy-MM-dd");
    const selectedDateData = attendance.find(
      (item) => item.date === formatedDate
    );

    if (!selectedDateData) return "default-tile";
    if (selectedDateData.isHoliday) return "holiday-tile";
    if (selectedDateData.attendanceStatus === "Present") return "present-tile";
    return "absent-tile";
  };

  const tileContent = ({ date }) => {
    const formatedDate = format(date, "yyyy-MM-dd");
    const selectedDateData = attendance.find(
      (item) => item.date === formatedDate
    );

    if (!selectedDateData) return null;

    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex flex-col justify-center items-center text-center text-xs p-1">
          {!selectedDateData.isHoliday && (
            <div className="italic text-gray-600 mb-1">
              {selectedDateData.inTime && `In: ${selectedDateData.inTime} `}
              {selectedDateData.outTime && `Out: ${selectedDateData.outTime}`}
            </div>
          )}
          {selectedDateData.reason && (
            <div className="italic text-gray-600">
              {selectedDateData.reason}
            </div>
          )}
          {selectedDateData.isHoliday && (
            <div className="italic text-gray-600">
              {selectedDateData.holidayText}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-10">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: <CalendarIcon className="text-blue-500" />,
            label: "Total Days",
            value: attendanceStats.totalDays,
          },
          {
            icon: <CheckCircle className="text-green-500" />,
            label: "Present Days",
            value: attendanceStats.presentDays,
          },
          {
            icon: <XCircle className="text-red-500" />,
            label: "Absent Days",
            value: attendanceStats.absentDays,
          },
          {
            icon: <Award className="text-purple-500" />,
            label: "Attendance %",
            value: `${attendanceStats.attendancePercentage}%`,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-4 flex items-center hover:scale-105 transition-transform duration-300"
          >
            <div className="mr-4">
              {React.cloneElement(stat.icon, { size: 40 })}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <span className="text-xl font-bold">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>
      <CustomCalendar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        tileClassName={tileClassName}
        tileContent={tileContent}
      />
    </div>
  );
};

export default CheckAttendance;
