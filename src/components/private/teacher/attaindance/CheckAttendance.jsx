import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { useSelector } from "react-redux";
import { selectUser } from "../../../../store/userSlice";
import { selectProfile } from "../../../../store/profileSlice";
import attendanceService from "../../../../appwrite/attaindanceService";
import CustomCalendar from "./Calender";
import ShowStats from "./ShowStats";
import { calculateStats } from "./CalculateStats";

const CheckAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
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
      calculateStats({ data, setAttendance, setAttendanceStats });
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
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <CustomCalendar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        tileClassName={tileClassName}
        tileContent={tileContent}
      />
      <ShowStats attendance={attendanceStats} label={`Total Attendance`} />
      <ShowStats
        attendance={currentMonthData}
        label={`Month Attendance - ${currentMonth}`}
      />
    </div>
  );
};

export default CheckAttendance;
