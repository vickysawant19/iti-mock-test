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
import batchService from "../../../../appwrite/batchService";

const CheckAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), "MMMM yyyy")
  );
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
    attendancePercentage: 0,
    monthlyAttendance: {},
  });
  const [currentMonthData, setCurrentMonthData] = useState({
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
  });
  const [batchData, setBatchData] = useState(null);

  const profile = useSelector(selectProfile);

  const fetchBatchData = async (batchId) => {
    try {
      const data = await batchService.getBatch(batchId);
      const parsedData = data?.attendanceHolidays.map((item) =>
        JSON.parse(item)
      );
      setBatchData({ ...data, attendanceHolidays: parsedData || [] });
    } catch (error) {
      console.log(error);
    }
  };

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
    if (profile) {
      fetchAttendance();
      fetchBatchData(profile.batchId);
    }
  }, [profile]);

  useEffect(() => {
    const monthData = attendanceStats.monthlyAttendance[currentMonth] || {
      presentDays: 0,
      absentDays: 0,
      holidayDays: 0,
    };
    setCurrentMonthData(monthData);
  }, [currentMonth, attendanceStats]);

  const handleMonthChange = ({ activeStartDate }) => {
    const newMonth = format(activeStartDate, "MMMM yyyy");
    setCurrentMonth(newMonth);
  };

  const tileClassName = ({ date }) => {
    const formatedDate = format(date, "yyyy-MM-dd");

    const holiday = batchData?.attendanceHolidays.find(
      (item) => item.date === formatedDate
    );
    if (holiday) {
      return "holiday-tile";
    }

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

    const holiday = batchData.attendanceHolidays.find(
      (holiday) => holiday.date === formatedDate
    );
    if (holiday) {
      return (
        <div className="w-full h-full flex flex-col cursor-pointer">
          <div className="flex flex-col justify-center items-center text-center text-xs p-1">
            <div className="italic text-red-600 mb-1">
              {holiday?.holidayText || "Holiday"}
            </div>
          </div>
        </div>
      );
    }

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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>
              <strong>Name:</strong> {profile.userName}
            </p>
            <p>
              <strong>Email:</strong> {profile.email}
            </p>
            <p>
              <strong>Phone:</strong> {profile.phone}
            </p>
          </div>
        </div>
      </div>
      <CustomCalendar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        tileClassName={tileClassName}
        tileContent={tileContent}
        handleActiveStartDateChange={handleMonthChange}
      />
      <ShowStats
        attendance={currentMonthData}
        label={`Month Attendance - ${currentMonth}`}
      />
      <ShowStats attendance={attendanceStats} label={`Total Attendance`} />
    </div>
  );
};

export default CheckAttendance;
