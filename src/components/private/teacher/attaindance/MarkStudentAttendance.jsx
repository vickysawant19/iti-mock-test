import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
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
import userProfileService from "../../../../appwrite/userProfileService";
import batchService from "../../../../appwrite/batchService";
import LocationPicker from "../components/LocationPicker";
import AttendanceStatus from "./AttendanceStatus";
import { selectProfile } from "../../../../store/profileSlice";
import { selectUser } from "../../../../store/userSlice";
import { calculateStats } from "./CalculateStats";
import CustomSelectData from "../../../components/customSelectData";
import useLocationManager from "../../../../hooks/useLocationManager";
import { FaCalendar } from "react-icons/fa";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import holidayService from "@/appwrite/holidaysService";

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

  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
    attendancePercentage: 0,
    monthlyAttendance: {},
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
      const data = await newAttendanceService.getStudentAttendance(
        userId,
        profile.batchId
      );

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

      if (!data || data.length === 0) {
        setStudentAttendance({
          ...studentProfile,
          attendanceRecords: [],
          batchId: profile.batchId,
        });
      } else {
        const newMap = new Map();
        data.forEach((item) => newMap.set(item.date, item));
        setWorkingDays(newMap);

        setStudentAttendance({
          ...studentProfile,
          attendanceRecords: data,
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
      if (batchData) {
        fetchStudentAttendance(profile.userId);
      }
    }
  }, [batchData, profile, isTeacher]);

  useEffect(() => {
    const monthData = attendanceStats?.monthlyAttendance[currentMonth] || {
      presentDays: 0,
      absentDays: 0,
      holidayDays: 0,
    };
    setCurrentMonthData(monthData);
  }, [currentMonth, attendanceStats]);

  useEffect(() => {
    if (isTeacher && selectedStudent) {
      fetchStudentAttendance(selectedStudent.userId);
    }
  }, [selectedStudent, isTeacher]);

  const handleMonthChange = ({ activeStartDate }) => {
    const newMonth = format(activeStartDate, "MMMM yyyy");
    setCurrentMonth(newMonth);
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
      if (alreadyMarked.status === modalData.status && alreadyMarked.remarks === modalData.remarks) {
        toast.warn("Alredy marked with same status")
        return
      }
      if (alreadyMarked) {
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
        return "text-green-600";
      case "absent":
        return "text-red-600";
      case "late":
        return "text-amber-600";
      default:
        return "text-gray-600";
    }
  }

  return (
    <div className="w-full mx-auto dark:bg-black">
      {/* Top Actions Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-md p-5 mb-2">
        {isTeacher ? (
          <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4 sm:justify-between">
            <div className="w-full sm:w-1/3">
              <CustomSelectData
                label="Select Student"
                placeholder={
                  isLoading ? "Loading students..." : "Select student"
                }
                labelKey="userName"
                valueKey="$id"
                value={selectedStudent}
                onChange={setSelectedStudent}
                options={batchStudents}
                renderOptionLabel={(option) =>
                  option.studentId + "-" + option.userName
                }
                disabled={isLoading}
              />
            </div>

            {studentAttendance && (
              <div className="grow bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-xs">
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <User
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {studentAttendance.userName}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Hash
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Roll number: {studentAttendance.studentId}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4 sm:justify-between">
            {profile && (
              <div className="grow bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <User
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {profile.userName}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Hash
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Roll number: {profile.studentId}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Calendar
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Date: {format(selectedDate, "dd-MM-yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Clock
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Status:{" "}
                      <span
                        className={`font-medium ${getStatusColor(
                          workingDays.get(format(selectedDate, "yyyy-MM-dd"))
                            ?.status
                        )}`}
                      >
                        {workingDays.get(format(selectedDate, "yyyy-MM-dd"))
                          ?.status || "Not Marked"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col xs:flex-row gap-3">
              <button
                onClick={() => setIsShowMap((prev) => !prev)}
                className="w-full xs:w-auto min-w-32 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white rounded-lg px-4 py-2.5 font-medium transition-colors flex items-center justify-center gap-2"
              >
                {!isShowMap ? (
                  <>
                    <MapPin size={18} />
                    <span>Show Map</span>
                  </>
                ) : (
                  <>
                    <MapPinOff size={18} />
                    <span>Hide Map</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Section */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isShowMap ? "mb-6" : "h-0 overflow-hidden"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs overflow-hidden h-fit lg:h-80">
            {isShowMap && (
              <AttendanceStatus
                batchData={batchData}
                distance={distance}
                locationText={locationText}
              />
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 md:col-span-2 rounded-lg shadow-xs overflow-hidden h-80">
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

      {/* Attendance Section */}
      <div className="">
        {isLoadingAttendance ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 size={50} className="text-blue-500 animate-spin" />
          </div>
        ) : (
          studentAttendance && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
              <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-4 shadow-md">
                <h1 className="text-black dark:text-white flex gap-2 items-center mb-4 font-semibold text-lg">
                  <FaCalendar /> Attendance Calendar - {currentMonth}
                </h1>
                <CustomCalendar
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  startDate={
                    !isTeacher ? new Date(profile.enrolledAt) : undefined
                  }
                  handleActiveStartDateChange={handleMonthChange}
                  openModal={openModal}
                  distance={distance}
                  canMarkPrevious={!batchData.canMarkPrevious}
                  enableNextTiles={isTeacher}
                  attendanceTime={batchData.attendanceTime}
                  circleRadius={batchData.circleRadius}
                />
              </div>
              <div className="lg:col-span-5 space-y-2">
                <ShowStats
                  attendance={currentMonthData}
                  label={`Month Attendance - ${currentMonth}`}
                />

                <ShowStats
                  attendance={attendanceStats}
                  label="Total Attendance"
                />
              </div>
            </div>
          )
        )}
        {isTeacher && !studentAttendance && !isLoadingAttendance && (
          <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-gray-800 shadow-md">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Please select a student to view their attendance.
            </p>
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold dark:text-white">
                {modalData.$id ? "Edit Attendance" : "Mark Attendance"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isModalLoading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Calendar size={18} className="text-blue-500 mr-3" />
                <span className="text-md font-medium text-gray-800 dark:text-gray-200">
                  Date:{" "}
                  {format(new Date(modalData.date.replace(/-/g, "/")), "PPP")}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setModalData((prev) => ({
                        ...prev,
                        markedBy: profile.userId,
                        status: "present",
                      }))
                    }
                    disabled={isModalLoading}
                    className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      modalData.status === "present"
                        ? "bg-green-500 text-white shadow-md ring-2 ring-green-300"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200"
                    }`}
                  >
                    <CheckCircle size={16} /> Present
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
                    className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      modalData.status === "absent"
                        ? "bg-red-500 text-white shadow-md ring-2 ring-red-300"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200"
                    }`}
                  >
                    <XCircle size={16} /> Absent
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="remarks"
                  className="block text-sm font-medium mb-1 dark:text-gray-200"
                >
                  Remarks (Optional)
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
                  className="w-full p-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="e.g., Sick leave, half day..."
                />
              </div>
            </div>

            <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex items-center justify-between rounded-b-lg">
              {modalData.$id ? (
                <button
                  onClick={removeAttendance}
                  disabled={isModalLoading}
                  className="p-2.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isModalLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Trash2 size={16} /> Delete Entry
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
                  className="p-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAttendance}
                  disabled={isModalLoading}
                  className="p-2.5 px-6 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center min-w-[100px]"
                >
                  {isModalLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkStudentAttendance;
