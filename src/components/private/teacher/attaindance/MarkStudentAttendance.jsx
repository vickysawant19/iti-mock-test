import React, { useEffect, useState } from "react";
import CustomCalendar from "./Calender";
import userProfileService from "../../../../appwrite/userProfileService";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../../store/profileSlice";
import attendanceService from "../../../../appwrite/attaindanceService";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const MarkStudentAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [batchStudents, setBatchStudents] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState(null);


  const profile = useSelector(selectProfile);

  const fetchBatchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await userProfileService.getBatchUserProfile({
        key: "batchId",
        value: profile.batchId,
      });
      console.log("student profile", data);
      setBatchStudents(data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentAttendance = async (userId) => {
    setIsLoadingAttendance(true)
    try {
      const data = await attendanceService.getUserAttendance(userId);
      console.log("student Attendance", data);
      setStudentAttendance(data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingAttendance(true);
    }
  };

  useEffect(() => {
    fetchBatchStudents();
  }, []);

  const handleSelectChange = (e) => {
    fetchStudentAttendance(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-10">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const tileContent = ({ date }) => {
    const formatedDate = format(date, "yyyy-MM-dd");
    const selectedDateData = studentAttendance.attendanceRecords.find(
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

  const tileClassName = ({ date }) => {
    const formatedDate = format(date, "yyyy-MM-dd");
    const selectedDateData = studentAttendance.attendanceRecords.find(
      (item) => item.date === formatedDate
    );

    if (!selectedDateData) return null;
    if (selectedDateData.isHoliday) return "holiday-tile";
    if (selectedDateData.attendanceStatus === "Present") return "present-tile";
    return "absent-tile";
  };


  return (
    <div className="w-full">
      <select className="p-5 text-black m-10 " onChange={handleSelectChange}>
        <option value="">Select User</option>
        {batchStudents.map((item) => (
          <option key={item.userId} value={item.userId}>
            {item.userName}
          </option>
        ))}
      </select>

      <div className="p-5">
        {studentAttendance && (
          <CustomCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
          />
        )}
      </div>
      <div className="w-full"></div>
    </div>
  );
};

export default MarkStudentAttendance;
