import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";

import CustomCalendar from "./Calender";
import ShowStats from "./ShowStats";
import userProfileService from "../../../../appwrite/userProfileService";
import attendanceService from "../../../../appwrite/attaindanceService";
import { selectProfile } from "../../../../store/profileSlice";
import { selectUser } from "../../../../store/userSlice";
import { calculateStats } from "./CalculateStats";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";
import batchService from "../../../../appwrite/batchService";
import { haversineDistance } from "./calculateDistance";
import LocationPicker from "../components/LocationPicker";
import AttendanceStatus from "./AttendanceStatus";

const MarkStudentAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchData, setBatchData] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [holidays, setHolidays] = useState(new Map());
  const [workingDays, setWorkingDays] = useState(new Map());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShowMap, setIsShowMap] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState({
    lat: 0,
    lon: 0,
  });
  const [distance, setDistance] = useState(Infinity);

  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
    attendancePercentage: 0,
    monthlyAttendance: {},
  });
  const [modalData, setModalData] = useState({
    date: "",
    attendanceStatus: "Present", // Default status
    inTime: "09:30",
    outTime: "17:00",
    reason: "",
    isHoliday: false,
    holidayText: "",
  });
  const [currentMonthData, setCurrentMonthData] = useState({
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
  });
  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), "MMMM yyyy")
  );

  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);

  const navigate = useNavigate();

  const isTeacher = user.labels.includes("Teacher");

  const [locationText, setLocationText] = React.useState({
    device: "",
    batch: "",
  });

  React.useEffect(() => {
    if (!isTeacher && deviceLocation && batchData?.location) {
      const fetchLocationText = async () => {
        try {
          const device = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${deviceLocation.lat}&longitude=${deviceLocation.lon}&localityLanguage=en`
          );
          const batch = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${batchData?.location.lat}&longitude=${batchData?.location.lon}&localityLanguage=en`
          );
          const data1 = await device.json();
          const data2 = await batch.json();

          setLocationText({
            device: data1.locality || data1.city || "Unknown location",
            batch: data2.locality || data2.city || "Unknown location",
          });
        } catch (error) {
          console.error("Error fetching location text:", error);
          setLocationText("Error fetching location");
        }
      };
      fetchLocationText();
      const dist = haversineDistance(deviceLocation, batchData.location);
      setDistance(dist);
    }
  }, [deviceLocation]);

  const fetchBatchData = async (batchId) => {
    try {
      const data = await batchService.getBatch(batchId);
      const parsedData = data?.attendanceHolidays.map((item) =>
        JSON.parse(item)
      );
      const newMap = new Map();
      parsedData.forEach((item) => newMap.set(item.date, item.holidayText));
      setHolidays(newMap);
      setBatchData({ ...data, attendanceHolidays: parsedData || [] });
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBatchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await userProfileService.getBatchUserProfile([
        Query.equal("batchId", profile.batchId),
        Query.orderDesc("studentId"),
      ]);
      // Convert string numbers to integers and sort
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
    setIsLoadingAttendance(true);
    try {
      const data = await attendanceService.getUserAttendance(
        userId,
        profile?.batchId
      );

      const selectedStudent = batchStudents?.find(
        (item) => item.userId === userId
      );

      if (
        !data ||
        !data.attendanceRecords ||
        data.attendanceRecords.length === 0
      ) {
        // Set dummy fields if no attendance records are found
        setStudentAttendance({
          userId,
          userName: !isTeacher ? user.name : selectedStudent?.userName,
          batchId: profile.batchId,
          attendanceRecords: [],
        });
      } else {
        const newMap = new Map();
        data.attendanceRecords.forEach((item) => newMap.set(item.date, item));
        setWorkingDays(newMap);

        const filterWithoutHolidays = data.attendanceRecords.filter(
          (item) =>
            !batchData.attendanceHolidays.some(
              (holiday) => holiday.date === item.date
            )
        );
        setStudentAttendance({
          ...data,
          attendanceRecords: filterWithoutHolidays,
          userName: selectedStudent?.userName,
        });
        calculateStats({
          data: {
            ...data,
            attendanceRecords: filterWithoutHolidays,
            userName: selectedStudent?.userName,
          },
          setAttendanceStats,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (!profile.batchId) {
      toast.error("You need to Create/Select a batch");
      // Navigate to create-batch page
      navigate("/profile");
      return;
    }
    if (!batchData) {
      fetchBatchData(profile.batchId);
    } else {
      if (isTeacher) {
        fetchBatchStudents();
      } else {
        fetchStudentAttendance(profile.userId);
      }
    }
  }, [batchData]);

  useEffect(() => {
    if (isTeacher) return;

    // Get current location and watch for changes
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setDeviceLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location", error);
      },
      { enableHighAccuracy: true }
    );

    // Cleanup function to clear the watch when the component unmounts
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    const monthData = attendanceStats?.monthlyAttendance[currentMonth] || {
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

  const openModal = (date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    let existingRecord = studentAttendance?.attendanceRecords?.find(
      (record) => record.date === formattedDate
    );

    if (existingRecord) {
      existingRecord = { ...existingRecord, isMarked: true };
    } else {
      existingRecord = {
        date: formattedDate,
        attendanceStatus: "Present", // Default when attendance isn't marked
        inTime: "09:30",
        outTime: "17:00",
        reason: "",
        isMarked: false,
      };
    }
    setModalData(existingRecord);
    setIsModalOpen(true);
  };

  const saveAttendance = () => {
    setStudentAttendance((prev) => {
      const updatedRecords = prev.attendanceRecords.some(
        (record) => record.date === modalData.date
      )
        ? prev.attendanceRecords.map((record) =>
            record.date === modalData.date ? modalData : record
          )
        : [...prev.attendanceRecords, modalData];

      return {
        ...prev,
        attendanceRecords: updatedRecords,
      };
    });
    setWorkingDays((prevMap) => prevMap.set(modalData.date, modalData));
    setIsModalOpen(false);
  };

  const removeAttendance = () => {
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
  };

  const handleSelectChange = (e) => {
    fetchStudentAttendance(e.target.value);
  };

  const markUserAttendance = async () => {
    setIsLoading(true);
    const filterOutHolidays = studentAttendance.attendanceRecords.filter(
      (item) => typeof item === "object" && !holidays.has(item.date)
    );

    try {
      const data = await attendanceService.markUserAttendance(
        {
          ...studentAttendance,
          attendanceRecords: filterOutHolidays,
        },
        false
      );
      setStudentAttendance(data || []);
      calculateStats({ data, setAttendanceStats });
      toast.success("Attendance marked successfully!");
    } catch (error) {
      console.error("Error marking attendance", error);
      toast.error("Failed to mark attendance.");
    } finally {
      setIsLoading(false);
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

    return (
      <div
        className="w-full h-full flex flex-col cursor-pointer"
        onDoubleClick={() => openModal(date)}
      >
        <div className="flex flex-col justify-center items-center text-center text-xs p-1">
          {selectedDateData?.inTime && (
            <div className="italic text-gray-600 mb-1">
              {`In: ${selectedDateData.inTime} Out: ${selectedDateData.outTime}`}
            </div>
          )}
          {selectedDateData?.reason && (
            <div className="italic text-gray-600">
              {selectedDateData.reason}
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
    if (selectedDateData.attendanceStatus === "Present") return "present-tile";
    return "absent-tile";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Top Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-end">
          {isTeacher ? (
            <select
              className="min-w-[160px] p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleSelectChange}
              disabled={isLoading}
            >
              <option value="">Select User</option>
              {batchStudents.map((item) => (
                <option key={item.userId} value={item.userId}>
                  {item.studentId?.toString().padStart(2, "0") || "00"}{" "}
                  {item.userName}
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={() => setIsShowMap((prev) => !prev)}
              className="min-w-[160px] bg-teal-500 hover:bg-teal-600 text-white rounded-lg p-2.5 text-sm transition-colors"
            >
              {!isShowMap ? "Show Map" : "Hide Map"}
            </button>
          )}

          {(isTeacher || distance < batchData?.circleRadius) &&
            studentAttendance && (
              <button
                onClick={markUserAttendance}
                disabled={isLoading}
                className="min-w-[160px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2.5 text-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  "Mark Attendance"
                )}
              </button>
            )}
        </div>
      </div>

      {/* Map Section */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isShowMap ? "mb-6" : "h-0 overflow-hidden"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white  rounded-lg shadow-sm overflow-hidden h-fit lg:h-80 ">
            {isShowMap && (
              <AttendanceStatus
                batchData={batchData}
                distance={distance}
                locationText={locationText}
              />
            )}
          </div>
          <div className="bg-white md:col-span-2 rounded-lg shadow-sm overflow-hidden h-80">
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
      <div className="bg-white rounded-lg shadow-sm">
        {isLoadingAttendance ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : (
          studentAttendance && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
              <div className="lg:col-span-7">
                <CustomCalendar
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  startDate={
                    !isTeacher ? new Date(profile.enrolledAt) : undefined
                  }
                  handleActiveStartDateChange={handleMonthChange}
                  distance={distance}
                  canMarkPrevious={batchData.canMarkPrevious}
                  attendanceTime={batchData.attendanceTime}
                  circleRadius={batchData.circleRadius}
                />
              </div>
              <div className="lg:col-span-5 space-y-6">
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
      </div>

      {/* Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {modalData.isMarked ? "Edit Attendance" : "Mark Attendance"}
            </h2>

            <div className="space-y-3">
              {/* Attendance Type Buttons */}
              {!modalData.isHoliday && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setModalData((prev) => ({
                        ...prev,
                        inTime: "09:30",
                        outTime: "17:00",
                        attendanceStatus: "Present",
                      }))
                    }
                    className={`p-2.5 rounded-lg text-sm font-medium transition-colors ${
                      modalData.attendanceStatus === "Present"
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() =>
                      setModalData((prev) => ({
                        ...prev,
                        inTime: "",
                        outTime: "",
                        attendanceStatus: "Absent",
                      }))
                    }
                    className={`p-2.5 rounded-lg text-sm font-medium transition-colors ${
                      modalData.attendanceStatus === "Absent"
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Absent
                  </button>
                </div>
              )}

              {/* Time Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    In Time:
                  </label>
                  <input
                    type="time"
                    value={modalData.inTime}
                    onChange={(e) =>
                      setModalData((prev) => ({
                        ...prev,
                        inTime: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Out Time:
                  </label>
                  <input
                    type="time"
                    value={modalData.outTime}
                    onChange={(e) =>
                      setModalData((prev) => ({
                        ...prev,
                        outTime: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Reason  Text Input */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Reason:
                </label>
                <textarea
                  value={modalData.reason}
                  onChange={(e) =>
                    setModalData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 bg-red-100 hover:bg-red-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={removeAttendance}
                  className="p-2.5 bg-purple-100 hover:bg-purple-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Undo marking
                </button>
                <button
                  onClick={saveAttendance}
                  className="p-2.5 bg-blue-500 col-span-2 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Save
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
