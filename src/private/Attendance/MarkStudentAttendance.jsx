import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toast } from "react-toastify";
import {
  Calendar,
  CheckCircle,
  Clock,
  Hash,
  Loader2,
  MapPin,
  MapPinOff,
  User,
  X,
  XCircle,
  Trash2,
} from "lucide-react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Query } from "appwrite";

import CustomCalendar from "./Calender";
import ShowStats from "./ShowStats";
import userProfileService from "@/appwrite/userProfileService";
import batchService from "@/appwrite/batchService";
import LocationPicker from "../teacher/components/LocationPicker";
import AttendanceStatus from "./AttendanceStatus";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import { calculateStats } from "./CalculateStats";
import customSelectData from "@/components/components/customSelectData";
import useLocationManager from "@/hooks/useLocationManager";
import { FaCalendar } from "react-icons/fa";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";
import CustomSelectData from "@/components/components/customSelectData";

const MarkStudentAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [batchStudents, setBatchStudents] = useState([]);
  const [batchData, setBatchData] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState(null);

  const [holidays, setHolidays] = useState(new Map());
  const [workingDays, setWorkingDays] = useState(new Map());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShowMap, setIsShowMap] = useState(false);

  const [refreshStats, setRefreshStats] = useState(0);

  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
    attendancePercentage: 0,
    monthlyAttendance: {},
  });

  const [totalAttendance, setTotalAttendance] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
    attendancePercentage: 0,
  });

  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);

  const [modalData, setModalData] = useState({
    date: "",
    status: "present",
    markedBy: profile.userId,
    remarks: "",
  });
  const [currentMonthData, setCurrentMonthData] = useState({
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
  });

  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), "MMMM yyyy")
  );

  const navigate = useNavigate();

  const isTeacher = user.labels.includes("Teacher");

  const {
    deviceLocation,
    locationText,
    loading,
    error,
    getDeviceLocation,
    calculateDistance,
  } = useLocationManager(isTeacher); // Enable location tracking for students only

  // Memoize distance calculation to prevent multiple re-renders
  const distance = useMemo(() => {
    if (!deviceLocation || !batchData?.location) return Infinity;

    return calculateDistance(
      deviceLocation.lat,
      deviceLocation.lon,
      batchData.location.lat,
      batchData.location.lon
    );
  }, [deviceLocation, batchData?.location, calculateDistance]);

  const isMarkingAllowed = useMemo(() => {
    return distance < batchData?.circleRadius || isTeacher;
  }, [distance, batchData?.circleRadius, isTeacher]);

  const fetchBatchData = async (batchId) => {
    try {
      const data = await batchService.getBatch(batchId);
      const holidayData = await holidayService.getBatchHolidays(batchId);
      const newMap = new Map();
      holidayData.forEach((item) => newMap.set(item.date, item.holidayText));
      setHolidays(newMap);
      setBatchData(data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBatchStudents = async () => {
    if (!batchData?.studentIds) return;
    setIsLoading(true);
    try {
      let studentIds = batchData?.studentIds.map(
        (student) => JSON.parse(student)?.userId
      );
      studentIds.push(profile?.userId);
      const data = await userProfileService.getBatchUserProfile([
        Query.equal("userId", studentIds),
        Query.orderDesc("studentId"),
        Query.equal("status", "Active"),
      ]);
      setBatchStudents(
        data.sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId))
      );
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentAttendance = async (userId) => {
    if (!profile.batchId) return;
    setIsLoadingAttendance(true);
    setStudentAttendance(null);
    setWorkingDays(new Map());
    try {
      const parsedDate = parse(currentMonth, "MMMM yyyy", new Date());

      // Start & end of month
      const startDate = format(
        startOfWeek(startOfMonth(parsedDate), { weekStartsOn: 0 }), // 1 = Monday, 0 = Sunday
        "yyyy-MM-dd"
      );

      // End of the last week that includes the month end
      const endDate = format(
        endOfWeek(endOfMonth(parsedDate), { weekStartsOn: 0 }),
        "yyyy-MM-dd"
      );

      const data = await newAttendanceService.getStudentAttendanceByDateRange(
        userId,
        profile.batchId,
        startDate,
        endDate
      );

      const holidayData = await holidayService.getBatchHolidaysByDateRange(
        profile.batchId,
        startDate,
        endDate
      );

      const newMap = new Map();
      holidayData.forEach((item) => newMap.set(item.date, item.holidayText));
      setHolidays(newMap);

      let studentProfile;
      if (isTeacher) {
        studentProfile = batchStudents?.find((item) => item.userId === userId);
      } else {
        studentProfile = profile;
      }

      if (!studentProfile) {
        console.warn("Student profile not found, retrying...");
        if (!isTeacher) studentProfile = profile;
        else {
          const fallbackProfile = await userProfileService.getUserProfile(
            userId
          );
          studentProfile = fallbackProfile;
        }
      }

      if (!data.documents || data.documents.length === 0) {
        setStudentAttendance({
          ...studentProfile,
          attendanceRecords: [],
          batchId: profile.batchId,
        });
      } else {
        const newMap = new Map();
        data.documents.forEach((item) => newMap.set(item.date, item));
        setWorkingDays(newMap);

        setStudentAttendance({
          ...studentProfile,
          attendanceRecords: data.documents,
          batchId: profile.batchId,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch attendance.");
      setStudentAttendance(null);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (studentAttendance && studentAttendance.attendanceRecords) {
      calculateStats({
        data: studentAttendance.attendanceRecords,
        setAttendanceStats,
      });
    } else {
      setAttendanceStats({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        holidayDays: 0,
        attendancePercentage: 0,
        monthlyAttendance: {},
      });
    }
  }, [studentAttendance]);

  useEffect(() => {
    if (!profile.batchId) {
      toast.error("You need to Create/Select a batch");
      navigate("/profile");
      return;
    }
    if (!batchData) {
      fetchBatchData(profile.batchId);
    }
  }, [batchData, profile?.batchId, navigate]);

  useEffect(() => {
    if (isTeacher) {
      fetchBatchStudents();
    } else {
      setSelectedStudent(profile);
      if (batchData) {
        fetchStudentAttendance(profile.userId);
      }
    }
  }, [batchData, profile, isTeacher]);

  useEffect(() => {
    const fetchTotalAttendanceStats = async () => {
      if (!selectedStudent || !batchData) return;

      try {
        const res = await newAttendanceService.getStudentAttendanceStats(
          selectedStudent.userId,
          profile.batchId,
          batchData.start_date,
          batchData.end_date
        );

        setTotalAttendance(res);
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch attendance stats.");
      }
    };

    fetchTotalAttendanceStats();
  }, [selectedStudent, batchData, profile.batchId, refreshStats]);

  useEffect(() => {
    const monthData = attendanceStats?.monthlyAttendance[currentMonth] || {
      presentDays: 0,
      absentDays: 0,
      holidayDays: 0,
    };
    setCurrentMonthData(monthData);
  }, [currentMonth, attendanceStats]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentAttendance(selectedStudent.userId);
    }
  }, [selectedStudent, isTeacher, currentMonth]);

  const handleMonthChange = ({ activeStartDate }) => {
    const newMonth = format(activeStartDate, "MMMM yyyy");
    setCurrentMonth(newMonth);
    setSelectedDate(activeStartDate);
  };

  const openModal = (date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    let existingRecord = studentAttendance?.attendanceRecords?.find(
      (record) => record.date === formattedDate
    );
    if (!existingRecord) {
      existingRecord = {
        date: formattedDate,
        status: "present",
        markedBy: profile.userId,
        remarks: "",
      };
    }
    setModalData(existingRecord);
    setIsModalOpen(true);
  };

  const saveAttendance = async () => {
    setIsModalLoading(true);
    try {
      const alreadyMarked = studentAttendance?.attendanceRecords?.find(
        (record) => record.date === modalData.date
      );
      let markedRes = null;

      if (alreadyMarked) {
        if (
          alreadyMarked?.status === modalData.status &&
          alreadyMarked?.remarks === modalData.remarks
        ) {
          toast.warn("Alredy marked with same status");
          return;
        }
        markedRes = await newAttendanceService.updateAttendance(
          alreadyMarked.$id,
          {
            status: modalData.status,
            remarks: modalData.remarks,
            markedBy: profile.userId,
          }
        );

        toast.success("Attendance updated successfully!");
      } else {
        markedRes = await newAttendanceService.createAttendance({
          userId: studentAttendance.userId,
          batchId: studentAttendance.batchId,
          tradeId: studentAttendance.tradeId,
          date: modalData.date,
          status: modalData.status,
          remarks: modalData.remarks,
          markedBy: profile.userId,
        });
        toast.success("Attendance marked successfully!");
      }

      setRefreshStats((prev) => prev + 1);

      setStudentAttendance((prev) => {
        const updatedRecords = prev.attendanceRecords.some(
          (record) => record.date === modalData.date
        )
          ? prev.attendanceRecords.map((record) =>
              record.date === modalData.date ? markedRes : record
            )
          : [...prev.attendanceRecords, markedRes];
        return {
          ...prev,
          attendanceRecords: updatedRecords,
        };
      });
      setWorkingDays((prevMap) =>
        new Map(prevMap).set(markedRes.date, markedRes)
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance.");
    } finally {
      setIsModalLoading(false);
    }
  };

  const removeAttendance = async () => {
    const recordToDelete = studentAttendance.attendanceRecords.find(
      (record) => record.date === modalData.date
    );

    if (!recordToDelete || !recordToDelete.$id) {
      toast.error("Cannot remove an unsaved record.");
      return;
    }

    setIsModalLoading(true);
    try {
      await newAttendanceService.deleteAttendance(recordToDelete.$id);

      toast.success("Attendance removed successfully!");
      setRefreshStats((prev) => prev + 1);
      setStudentAttendance((prev) => {
        const updatedRecords = prev.attendanceRecords.filter(
          (record) => record.date !== modalData.date
        );

        return {
          ...prev,
          attendanceRecords: updatedRecords,
        };
      });
      setWorkingDays((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.delete(modalData.date);
        return newMap;
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error removing attendance:", error);
      toast.error("Failed to remove attendance.");
    } finally {
      setIsModalLoading(false);
    }
  };

  const tileContent = ({ date }) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const holiday = holidays.get(formattedDate);
    if (holiday) {
      return (
        <div className="w-full h-full flex flex-col cursor-pointer">
          <div className="flex flex-col justify-center items-center text-center text-xs p-1">
            <div className="italic text-red-600 mb-1">
              {holiday || "Holiday"}
            </div>
          </div>
        </div>
      );
    }
    const selectedDateData = workingDays.get(formattedDate);

    if (!isMarkingAllowed) {
      return null;
    }

    return (
      <div
        className="w-full h-full flex flex-col cursor-pointer"
        onDoubleClick={() => openModal(date)}
      >
        <div className="flex flex-col justify-center items-center text-center text-xs p-1">
          {selectedDateData?.markedAt ? (
            <div className="italic text-gray-600 mb-1">
              {`Marked At: ${format(
                new Date(selectedDateData.markedAt),
                "hh:mm a"
              )}`}
            </div>
          ) : (
            <div className="italic text-gray-600 mb-1">
              {selectedDateData
                ? `Marked At: ${format(
                    new Date(selectedDateData.$updatedAt),
                    "hh:mm a"
                  )}`
                : "-"}
            </div>
          )}
          {selectedDateData?.remarks && (
            <div className="italic text-gray-600">
              {selectedDateData.remarks}
            </div>
          )}
        </div>
      </div>
    );
  };

  const tileClassName = ({ date }) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const holiday = holidays.get(formattedDate);
    if (holiday) {
      return "holiday-tile";
    }
    const selectedDateData = workingDays.get(formattedDate);
    if (!selectedDateData) return null;
    if (selectedDateData.status === "present") return "present-tile";
    return "absent-tile";
  };

  if (!isTeacher && profile.batchId === "") {
    return (
      <div>
        No profile Found. Add Batch to view this page <Link to={"/profile"} />
      </div>
    );
  }

  function getStatusColor(status) {
    switch (status) {
      case "present":
        return "text-green-600 dark:text-green-400";
      case "absent":
        return "text-red-600 dark:text-red-400";
      case "late":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Top Profile/Actions Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          {isTeacher ? (
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="w-full md:w-1/3">
                <CustomSelectData
                  label="Select Student"
                  placeholder={isLoading ? "Loading students..." : "Search student..."}
                  labelKey="userName"
                  valueKey="$id"
                  value={selectedStudent}
                  onChange={setSelectedStudent}
                  options={batchStudents}
                  renderOptionLabel={(option) => `${option.studentId} - ${option.userName}`}
                  disabled={isLoading}
                />
              </div>

              {studentAttendance && (
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Student Name</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{studentAttendance.userName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                      <Hash size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Roll Number</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{studentAttendance.studentId}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              {profile && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Student</p>
                      <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{profile.userName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 shadow-sm">
                      <Hash size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Roll No</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{profile.studentId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 shadow-sm">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Date</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{format(selectedDate, "dd MMM yyyy")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-sm">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Today's Status</p>
                      <p className={`font-bold ${getStatusColor(workingDays.get(format(selectedDate, "yyyy-MM-dd"))?.status)}`}>
                        {workingDays.get(format(selectedDate, "yyyy-MM-dd"))?.status || "Not Marked"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsShowMap((prev) => !prev)}
                className={`shrink-0 w-full lg:w-auto px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                  isShowMap 
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700" 
                    : "bg-teal-600 text-white hover:bg-teal-700 active:scale-95 hover:shadow-md"
                }`}
              >
                {isShowMap ? <MapPinOff size={18} /> : <MapPin size={18} />}
                <span>{isShowMap ? "Hide Map" : "View Map"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Map Section */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isShowMap ? "max-h-[800px] opacity-100 mb-6" : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[350px]">
              {isShowMap && (
                <AttendanceStatus
                  batchData={batchData}
                  distance={distance}
                  locationText={locationText}
                />
              )}
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[350px]">
              {isShowMap && (
                <LocationPicker
                  deviceLocation={deviceLocation}
                  batchLocation={batchData?.location}
                  disableSelection={true}
                  circleRadius={batchData?.circleRadius}
                />
              )}
            </div>
          </div>
        </div>

        {/* Attendance Content */}
        <div className="">
          {isLoadingAttendance ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading attendance records...</p>
            </div>
          ) : (
            batchData &&
            (isTeacher ? studentAttendance : true) && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Calendar Section */}
                <div className="xl:col-span-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <FaCalendar size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Attendance Calendar
                      <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {currentMonth}
                      </span>
                    </h2>
                  </div>
                  
                  <CustomCalendar
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                    startDate={!isTeacher ? new Date(profile.enrolledAt) : undefined}
                    handleActiveStartDateChange={handleMonthChange}
                    openModal={openModal}
                    distance={distance}
                    canMarkPrevious={batchData?.canMarkPrevious || false}
                    enableNextTiles={isTeacher}
                    attendanceTime={batchData?.attendanceTime}
                    circleRadius={batchData?.circleRadius}
                  />
                </div>

                {/* Stats Section */}
                <div className="xl:col-span-4 space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-1 overflow-hidden">
                    <ShowStats
                      attendance={currentMonthData}
                      label={`Month Overview`}
                      subLabel={currentMonth}
                    />
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-1 overflow-hidden">
                    <ShowStats
                      attendance={totalAttendance}
                      label="Overall Performance"
                      subLabel="All Time"
                    />
                  </div>
                </div>
              </div>
            )
          )}
          
          {isTeacher && !studentAttendance && !isLoadingAttendance && (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <User size={40} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Student Selected</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Please select a student from the dropdown above to view and manage their attendance records.
              </p>
            </div>
          )}
        </div>

        {/* Attendance Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {modalData.$id ? "Edit Attendance" : "Mark Attendance"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isModalLoading}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-xl text-blue-600 dark:text-blue-300 mr-4">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Selected Date</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {format(new Date(modalData.date.replace(/-/g, "/")), "EEEE, MMMM do, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Attendance Status
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        setModalData((prev) => ({
                          ...prev,
                          markedBy: profile.userId,
                          status: "present",
                        }))
                      }
                      disabled={isModalLoading}
                      className={`p-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border-2 ${
                        modalData.status === "present"
                          ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-green-200 hover:bg-green-50/50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${modalData.status === "present" ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                        {modalData.status === "present" && <CheckCircle size={12} />}
                      </div>
                      Present
                    </button>
                    <button
                      onClick={() =>
                        setModalData((prev) => ({
                          ...prev,
                          markedBy: profile.userId,
                          status: "absent",
                        }))
                      }
                      disabled={isModalLoading}
                      className={`p-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border-2 ${
                        modalData.status === "absent"
                          ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-200 hover:bg-red-50/50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${modalData.status === "absent" ? "bg-red-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                        {modalData.status === "absent" && <XCircle size={12} />}
                      </div>
                      Absent
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="remarks"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Remarks <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="remarks"
                    value={modalData?.remarks || ""}
                    onChange={(e) =>
                      setModalData((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                    disabled={isModalLoading}
                    className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white transition-all resize-none"
                    rows={3}
                    placeholder="Add any notes about this attendance record..."
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                {modalData.$id ? (
                  <button
                    onClick={removeAttendance}
                    disabled={isModalLoading}
                    className="p-3 px-4 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isModalLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Trash2 size={18} /> Delete
                      </>
                    )}
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    disabled={isModalLoading}
                    className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAttendance}
                    disabled={isModalLoading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {isModalLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkStudentAttendance;
