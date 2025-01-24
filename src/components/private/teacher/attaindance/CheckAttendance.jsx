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
    monthlyAttendance: {},
  });

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getUserAttendance(profile.userId);
      console.log("data",data)
      if (data.attendanceRecords.length === 0) {
        setAttendance([]);
        setAttendanceStats({
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          holidayDays: 0,
          attendancePercentage: 0,
          monthlyAttendance: {},
        });
        return;
      }

      setAttendance(data.attendanceRecords);

      const workingDays = data.attendanceRecords.filter(
        (record) => !record.isHoliday
      );
      // Calculate attendance statistics
      const totalDays = workingDays.length;
      let presentDays = 0;
      let absentDays = 0;
      let holidayDays = 0;
      const monthlyAttendance = {};

      data.attendanceRecords.forEach((record) => {
        if(typeof record === "string") return
        const month = format(new Date(record.date), "MMMM yyyy");

        if (!monthlyAttendance[month]) {
          monthlyAttendance[month] = { present: 0, absent: 0, holidays: 0 };
        }

        if (record.isHoliday) {
          holidayDays++;
          monthlyAttendance[month].holidays++;
        } else if (record.attendanceStatus === "Present") {
          presentDays++;
          monthlyAttendance[month].present++;
        } else if (record.attendanceStatus === "Absent") {
          absentDays++;
          monthlyAttendance[month].absent++;
        }
      });

      const attendancePercentage =
        totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

      setAttendanceStats({
        totalDays,
        presentDays,
        absentDays,
        holidayDays,
        attendancePercentage,
        monthlyAttendance,
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

    if (!selectedDateData) return null;
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

  if (attendance.length === 0) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-10">
        <p>No attendance records found.</p>
      </div>
    );
  }

  const currentMonth = format(selectedDate, "MMMM yyyy");
  const currentMonthData = attendanceStats.monthlyAttendance[currentMonth] || {
    present: 0,
    absent: 0,
    holidays: 0,
  };
  const totalDays = currentMonthData.present + currentMonthData.absent;
  const currentMonthAttendancePercentage =
    totalDays > 0
      ? ((currentMonthData.present / totalDays) * 100).toFixed(2)
      : 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <CalendarIcon className="mr-2 text-blue-600" size={24} />
        Total Attendance
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <CalendarIcon className="mr-2 text-blue-600" size={24} />
        Current Month Attendance - {currentMonth}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: <CalendarIcon className="text-blue-500" />,
            label: "Total Days",
            value: currentMonthData.present + currentMonthData.absent,
          },
          {
            icon: <CheckCircle className="text-green-500" />,
            label: "Present Days",
            value: currentMonthData.present,
          },
          {
            icon: <XCircle className="text-red-500" />,
            label: "Absent Days",
            value: currentMonthData.absent,
          },
          {
            icon: <Award className="text-purple-500" />,
            label: "Attendance %",
            value: `${currentMonthAttendancePercentage}%`,
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
