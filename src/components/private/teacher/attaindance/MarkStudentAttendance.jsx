import React, { useEffect, useState } from "react";
import CustomCalendar from "./Calender";
import userProfileService from "../../../../appwrite/userProfileService";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../../store/profileSlice";
import attendanceService from "../../../../appwrite/attaindanceService";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { selectUser } from "../../../../store/userSlice";
import { Loader2 } from "lucide-react";

const MarkStudentAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [batchStudents, setBatchStudents] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    date: "",
    attendanceStatus: "Present", // Default status
    inTime: "09:30",
    outTime: "17:00",
    reason: "",
    isHoliday: false,
    holidayText: "",
  });

  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);

  const isTeacher = user.labels.includes("Teacher");

  const fetchBatchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await userProfileService.getBatchUserProfile({
        key: "batchId",
        value: profile.batchId,
      });
      setBatchStudents(data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentAttendance = async (userId) => {
    setIsLoadingAttendance(true);
    try {
      const data = await attendanceService.getUserAttendance(userId);
      if (!data || !data.attendanceRecords || data.attendanceRecords.length === 0) {
        // Set dummy fields if no attendance records are found
        setStudentAttendance({
          userId,
          batchId: profile.batchId,
          attendanceRecords: [
            // {
            //   date: format(new Date(), "yyyy-MM-dd"),
            //   attendanceStatus: "Present",
            //   inTime: "09:30",
            //   outTime: "17:00",
            //   reason: "",
            //   isHoliday: false,
            //   holidayText: "",
            // },
          ],
        });
      } else {
        setStudentAttendance(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (isTeacher) {
      fetchBatchStudents();
    } else {
      fetchStudentAttendance(profile.userId);
    }
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
      setStudentAttendance(data);
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

    return (
      <div
        className="w-full h-full flex flex-col cursor-pointer"
        onClick={() => openModal(date)}
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

  return (
    <div className="w-full">
      <div className="w-full flex justify-end">
        {isTeacher && (
          <select
            className="p-2 text-black m-6 rounded"
            onChange={handleSelectChange}
            disabled={isLoading}
          >
            <option value="">Select User</option>
            {batchStudents.map((item) => (
              <option key={item.userId} value={item.userId}>
                {item.userName}
              </option>
            ))}
          </select>
        )}
        {studentAttendance && (
          <button
            onClick={markUserAttendance}
            className="p-2 bg-blue-500 text-white rounded m-6 flex items-center justify-center"
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

      <div className="p-5">
        {isLoadingAttendance ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          studentAttendance && (
            <CustomCalendar
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              tileContent={tileContent}
              tileClassName={tileClassName}
            />
          )
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl mb-4">
              {modalData.isMarked ? "Edit Attendance" : "Mark Attendance"}
            </h2>

            <div className="flex flex-col justify-between mb-2 gap-2">
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
              </button>
            </div>
            <label className="block mb-2">
              In Time:
              <input
                type="time"
                value={modalData.inTime}
                onChange={(e) =>
                  setModalData((prev) => ({ ...prev, inTime: e.target.value }))
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
                  setModalData((prev) => ({ ...prev, outTime: e.target.value }))
                }
                className="block w-full p-2 border"
              />
            </label>
            <label className="block mb-2">
              Reason:
              <textarea
                value={modalData.reason}
                onChange={(e) =>
                  setModalData((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="block w-full p-2 border"
              />
            </label>
            <button
              onClick={saveAttendance}
              className="p-2 bg-blue-500 text-white rounded mt-4"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkStudentAttendance;
