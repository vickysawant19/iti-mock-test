import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { useSelector } from "react-redux";
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
  const [holidays, setHolidays] = useState(new Map());
  const [workingDays, setWorkingDays] = useState(new Map());

  const profile = useSelector(selectProfile);

  const fetchBatchData = async (batchId) => {
    try {
      const data = await batchService.getBatch(batchId);
      const parsedData = data?.attendanceHolidays.map((item) =>
        JSON.parse(item)
      );
      const holiday = new Map();
      parsedData.forEach((item) => holiday.set(item.date, item.holidayText));
      setHolidays(holiday);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getUserAttendance(profile.userId);
      const working = new Map();
      data?.attendanceRecords.forEach((item) => working.set(item.date, item));
      setWorkingDays(working);
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
    if (holidays.has(formatedDate)) {
      return "holiday-tile";
    }
    const selectedDateData = workingDays.get(formatedDate);
    if (!selectedDateData) return null;
    if (selectedDateData.attendanceStatus === "Present") return "present-tile";
    return "absent-tile";
  };

  const tileContent = ({ date }) => {
    const formatedDate = format(date, "yyyy-MM-dd");
    if (holidays.has(formatedDate)) {
      return (
        <div className="w-full h-full flex flex-col cursor-pointer">
          <div className="flex flex-col justify-center items-center text-center text-xs p-1">
            <div className="italic text-red-600 mb-1">
              {holidays.get(formatedDate) || "Holiday"}
            </div>
          </div>
        </div>
      );
    }
    const selectedDateData = workingDays.get(formatedDate);

    if (!selectedDateData) return null;
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex flex-col justify-center items-center text-center text-xs p-1">
          <div className="italic text-gray-600 mb-1">
            {selectedDateData.inTime && `In: ${selectedDateData.inTime} `}
            {selectedDateData.outTime && `Out: ${selectedDateData.outTime}`}
          </div>
          <div className="italic text-gray-600">{selectedDateData.reason}</div>
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
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Profile Info */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Name:</strong> {profile.userName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {profile.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Phone:</strong> {profile.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Section - Takes up 7 columns on desktop */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <CustomCalendar
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              tileClassName={tileClassName}
              tileContent={tileContent}
              handleActiveStartDateChange={handleMonthChange}
            />
          </div>
        </div>

        {/* Stats Section - Takes up 5 columns on desktop */}
        <div className="lg:col-span-5 space-y-6">
          {/* Monthly Stats */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <ShowStats
              attendance={currentMonthData}
              label={`Month Attendance - ${currentMonth}`}
            />
          </div>

          {/* Total Stats */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <ShowStats attendance={attendanceStats} label="Total Attendance" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckAttendance;
