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

const MarkStudentAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchData, setBatchData] = useState({});
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState({ lat: null, lon: null });
  const [distance , setDistance] = useState(null)

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


  const [locationText, setLocationText] = React.useState({ device: "", batch: ""});

  React.useEffect(() => {
    if (deviceLocation && batchData?.location) {
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
          setLocationText( { device: data1.locality || data1.city || "Unknown location", batch: data2.locality || data2.city || "Unknown location" });
        } catch (error) {
          console.error("Error fetching location text:", error);
          setLocationText("Error fetching location");
        }
      };
      fetchLocationText();
      const dist = haversineDistance(deviceLocation, batchData.location)
      setDistance(dist) 
    }
  }, [deviceLocation]);

  const fetchBatchData = async (batchId) => {
    try {
      const data = await batchService.getBatch(batchId);
      setBatchData(data);
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
        setStudentAttendance({ ...data, userName: selectedStudent?.userName });
        calculateStats({
          data,
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
    fetchBatchData(profile.batchId);
    if (isTeacher) {
      fetchBatchStudents();
    } else {
      fetchStudentAttendance(profile.userId);
    }

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
        isHoliday: false,
        holidayText: "",
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
    setIsModalOpen(false);
  };

  const handleSelectChange = (e) => {
    fetchStudentAttendance(e.target.value);
  };

  const markUserAttendance = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.markUserAttendance(
        studentAttendance
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
    const selectedDateData = studentAttendance.attendanceRecords.find(
      (item) => item.date === formattedDate
    );

    const handleClick = (e) => {
      if (e.type === "click" && e.detail === 2) {
        openModal(date);
      }
    };

    return (
      <div
        className="w-full h-full flex flex-col cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex flex-col justify-center items-center text-center text-xs p-1">
          {!selectedDateData?.isHoliday && selectedDateData?.inTime && (
            <div className="italic text-gray-600 mb-1">
              {`In: ${selectedDateData.inTime} Out: ${selectedDateData.outTime}`}
            </div>
          )}
          {selectedDateData?.reason && (
            <div className="italic text-gray-600">
              {selectedDateData.reason}
            </div>
          )}
          {selectedDateData?.isHoliday && (
            <div className="italic text-gray-600">
              {selectedDateData.holidayText}
            </div>
          )}
        </div>
      </div>
    );
  };

  const tileClassName = ({ date }) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const selectedDateData = studentAttendance.attendanceRecords.find(
      (item) => item.date === formattedDate
    );

    if (!selectedDateData) return null;
    if (selectedDateData.isHoliday) return "holiday-tile";
    if (selectedDateData.attendanceStatus === "Present") return "present-tile";
    return "absent-tile";
  };

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

  return (
    <div className="w-full">
      <div className="w-full flex justify-end gap-4 px-4">
        {isTeacher && (
          <select
            className="p-2 text-black  rounded mt-6 flex items-center justify-center"
            onChange={handleSelectChange}
            disabled={isLoading}
          >
            <option value="">Select User</option>
            {batchStudents.map((item) => (
              <option key={item.userId} value={item.userId}>
                {item.studentId
                  ? item.studentId.toString().padStart(2, "0")
                  : "00"}{" "}
                {item.userName}
              </option>
            ))}
          </select>
        )}
        {studentAttendance && (
          <button
            onClick={markUserAttendance}
            className="p-2 bg-blue-500 text-white rounded mt-6 flex items-center justify-center w-40"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Mark Attendance"
            )}
          </button>
        )}
      </div>

      {!isTeacher && (
        <div
          className={`text-center my-2 p-1 rounded text-sm mx-auto max-w-fit ${
            distance > 1000 ? "bg-red-500" : "bg-green-500"
          }`}
        >
          <p>
            Device Location: {deviceLocation.lat}, {deviceLocation.lon}
          </p>
          <p>
            Batch Location: {batchData?.location?.lat}, {batchData?.location?.lon}
          </p>
          <p>
            You are {distance} meters away from the {locationText.batch} location.{" "}
            {distance > 1000
              ? "You cannot mark attendance."
              : "You can mark attendance."}
          </p>
        </div>
      )}

      <div className="">
        {isLoadingAttendance ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          studentAttendance && (
            <div className="w-full max-w-6xl mx-auto px-4 py-4">
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
                canMarkPrevious = {batchData.canMarkPrevious}
                attendanceTime= {batchData.attendanceTime}
              />
              <ShowStats
                attendance={currentMonthData}
                label={`Month Attendance - ${currentMonth}`}
              />
              <ShowStats
                attendance={attendanceStats}
                label={`Total Attendance `}
              />
            </div>
          )
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl mb-4">
              {modalData.isMarked ? "Edit Attendance" : "Mark Attendance"}
            </h2>

            <div className="flex flex-col justify-between mb-2 gap-2 text-sm">
              {!modalData.isHoliday && (
                <>
                  <button
                    onClick={() =>
                      setModalData((prev) => ({
                        ...prev,
                        inTime: "09:30",
                        outTime: "17:00",
                        attendanceStatus: "Present",
                      }))
                    }
                    className={`p-2 rounded ${
                      modalData.attendanceStatus === "Present"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200"
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
                    className={`p-2 rounded ${
                      modalData.attendanceStatus === "Absent"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    Absent
                  </button>{" "}
                </>
              )}
              <button
                onClick={() =>
                  setModalData((prev) => ({
                    ...prev,
                    inTime: "",
                    outTime: "",
                    isHoliday: prev.isHoliday ? false : true,
                  }))
                }
                className={`p-2 rounded ${
                  modalData.isHoliday
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                Holiday
              </button>
            </div>
            {!modalData.isHoliday && (
              <>
                <label className="block mb-2">
                  In Time:
                  <input
                    type="time"
                    value={modalData.inTime}
                    onChange={(e) =>
                      setModalData((prev) => ({
                        ...prev,
                        inTime: e.target.value,
                      }))
                    }
                    className="block w-full p-2 border"
                  />
                </label>
                <label className="block mb-2">
                  Out Time:
                  <input
                    type="time"
                    value={modalData.outTime}
                    onChange={(e) =>
                      setModalData((prev) => ({
                        ...prev,
                        outTime: e.target.value,
                      }))
                    }
                    className="block w-full p-2 border"
                  />
                </label>
              </>
            )}
            {!modalData.isHoliday ? (
              <label className="block mb-2">
                Reason:
                <textarea
                  value={modalData.reason}
                  onChange={(e) =>
                    setModalData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="block w-full p-2 border"
                />
              </label>
            ) : (
              <label className="block mb-2">
                Holiday Type:
                <textarea
                  value={modalData.holidayText}
                  onChange={(e) =>
                    setModalData((prev) => ({
                      ...prev,
                      holidayText: e.target.value,
                    }))
                  }
                  className="block w-full p-2 border"
                  placeholder="e.g., Sunday, 2nd Saturday, 4th Saturday"
                />
                <div className="flex flex-wrap w-full justify-evenly gap-2 my-2 text-sm">
                  <button
                    onClick={() =>
                      setModalData((prev) => ({
                        ...prev,
                        holidayText: "Sunday",
                      }))
                    }
                    className="p-2 bg-gray-200 rounded"
                  >
                    Sunday
                  </button>
                  <button
                    onClick={() =>
                      setModalData((prev) => ({
                        ...prev,
                        holidayText: "2nd Saturday",
                      }))
                    }
                    className="p-2 bg-gray-200 rounded"
                  >
                    2nd Saturday
                  </button>
                  <button
                    onClick={() =>
                      setModalData((prev) => ({
                        ...prev,
                        holidayText: "4th Saturday",
                      }))
                    }
                    className="p-2 bg-gray-200 rounded"
                  >
                    4th Saturday
                  </button>
                </div>
              </label>
            )}
            <div className=" flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-red-500 text-white rounded mt-4 w-full"
              >
                Cancel
              </button>
              <button
                onClick={saveAttendance}
                className="p-2 bg-blue-500 text-white rounded mt-4 w-full"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkStudentAttendance;
