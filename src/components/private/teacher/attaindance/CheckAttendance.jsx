import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Query } from "appwrite";

import { selectProfile } from "../../../../store/profileSlice";
import attendanceService from "../../../../appwrite/attaindanceService";
import batchService from "../../../../appwrite/batchService";
import CustomCalendar from "./Calender";
import ShowStats from "./ShowStats";
import { calculateStats } from "./CalculateStats";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipLoader } from "react-spinners";
import Loader from "@/components/components/Loader";
import { newAttendanceService } from "@/appwrite/newAttendanceService";

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
  const navigate = useNavigate();

  const profile = useSelector(selectProfile);

  const fetchBatchData = async (batchId) => {
    try {
      const data = await batchService.getBatch(batchId, [
        Query.select(["attendanceHolidays"]),
      ]);
      const parsed = data?.attendanceHolidays.map((item) => JSON.parse(item));
      const holidayMap = new Map();
      parsed.forEach((h) => holidayMap.set(h.date, h.holidayText));
      setHolidays(holidayMap);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const data = await newAttendanceService.getStudentAttendance(
        profile.userId,
        profile.batchId
      );
      console.log("new attendance", data);
      const workMap = new Map();
      data.forEach((rec) => workMap.set(rec.date, rec));
      setWorkingDays(workMap);
      calculateStats({ data, setAttendance, setAttendanceStats });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!profile.batchId) {
      toast.error("You need to create or select a batch");
      navigate("/profile");
      return;
    }
    fetchAttendance();
    fetchBatchData(profile.batchId);
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
    setCurrentMonth(format(activeStartDate, "MMMM yyyy"));
  };

  // Tile styling with dark mode support
  const tileClassName = ({ date }) => {
    const key = format(date, "yyyy-MM-dd");
    if (holidays.has(key)) return " holiday-tile ";
    const rec = workingDays.get(key);
    if (!rec) return null;
    return rec.status === "present" ? "present-tile" : "absent-tile";
  };

  // Tile content with dark mode text
  const tileContent = ({ date }) => {
    const key = format(date, "yyyy-MM-dd");
    if (holidays.has(key)) {
      return (
        <div className="flex items-center justify-center p-1">
          <span className="text-xs italic text-rose-600 dark:text-rose-400">
            {holidays.get(key) || "Holiday"}
          </span>
        </div>
      );
    }
    const rec = workingDays.get(key);
    if (!rec) return null;
    return (
      <div className="flex flex-col items-center justify-center p-1">
        {rec.inTime && (
          <span className="text-xs text-gray-700 dark:text-gray-700">
            In: {rec?.markedAt}
          </span>
        )}
        {rec.outTime && (
          <span className="text-xs text-gray-700 dark:text-gray-700">
            Out: {rec?.markedBy}
          </span>
        )}
        {rec.reason && (
          <span className="text-xs italic text-gray-600 dark:text-gray-400">
            {rec?.remarks}
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

  if (!attendance.length) {
    return (
      <div className="flex items-center justify-center h-full p-10 bg-white dark:bg-black">
        <Card>
          <CardContent>
            <p className="text-center text-muted-foreground">
              No attendance records found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white dark:bg-black p-4">
      {/* Profile Info */}
      <Card className={"bg-white dark:bg-gray-800 "}>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              <strong>Name:</strong> {profile.userName}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> {profile.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              <strong>Phone:</strong> {profile.phone}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-7">
          <Card className={"bg-white dark:bg-gray-800 "}>
            <CardHeader>
              <CardTitle>Attendance Calendar - {currentMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomCalendar
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                tileClassName={tileClassName}
                tileContent={tileContent}
                handleActiveStartDateChange={handleMonthChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="lg:col-span-5 space-y-6 ">
          <ShowStats
            attendance={currentMonthData}
            label={`Month Attendance - ${currentMonth}`}
          />
          <ShowStats attendance={attendanceStats} label="Total Attendance" />
        </div>
      </div>
    </div>
  );
};

export default CheckAttendance;
