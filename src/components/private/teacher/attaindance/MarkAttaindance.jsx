import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../../store/profileSlice";
import userProfileService from "../../../../appwrite/userProfileService";

import { format } from "date-fns";
import { ClipLoader } from "react-spinners";
import attendanceService from "../../../../appwrite/attaindanceService";

const MarkAttendance = () => {
  const profile = useSelector(selectProfile);

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [attendance, setAttendance] = useState({});

  const fetchBatchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await userProfileService.getBatchUserProfile({
        key: "batchId",
        value: profile.batchId,
      });
      setStudents(data);
      // Initialize attendance state
      const initialAttendance = data.reduce((acc, student) => {
        acc[student.userId] = {
          attendanceStatus: "Present",
          reason: "",
          inTime: "",
          outTime: "",
          isHoliday: false,
          remarks: "",
        };
        return acc;
      }, {});
      setAttendance(initialAttendance);
    } catch (error) {
      console.error("Error fetching batch students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceChange = (userId, key, value) => {
    setAttendance((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("attendance", attendance);

    try {
      await Promise.all(
        students.map((student) => {
          const studentAttendance = attendance[student.userId];
          const newRecord = {
            userId: student.userId,
            userName: student.userName,
            batchId: student.batchId,
            attendanceRecords: [
              JSON.stringify({
                date: selectedDate,
                ...studentAttendance,
              }),
            ],
            admissionDate: student.admissionDate,
          };
          return attendanceService.markUserAttendance(
            student.userId,
            newRecord
          );
        })
      );
      alert("Attendance marked successfully!");
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Failed to mark attendance.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchStudents();
  }, []);

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <ClipLoader color="#123abc" size={50} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Mark Attendance</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Picker */}
        <div>
          <label
            htmlFor="date"
            className="block text-lg font-medium text-gray-700"
          >
            Select Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
          />
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 p-2">Student ID</th>
                <th className="border border-gray-300 p-2">Name</th>
                <th className="border border-gray-300 p-2">
                  Attendance Status
                </th>
                <th className="border border-gray-300 p-2">In Time</th>
                <th className="border border-gray-300 p-2">Out Time</th>
                <th className="border border-gray-300 p-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.userId} className="hover:bg-gray-100">
                  <td className="border border-gray-300 p-2">
                    {student.studentId}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {student.userName}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <select
                      value={
                        attendance[student.studentId]?.attendanceStatus ||
                        "Present"
                      }
                      onChange={(e) =>
                        handleAttendanceChange(
                          student.studentId,
                          "attendanceStatus",
                          e.target.value
                        )
                      }
                      className="p-2 border border-gray-300 rounded-md w-full"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Leave">Leave</option>
                      <option value="Holiday">Holiday</option>
                    </select>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="time"
                      value={attendance[student.userId]?.inTime || ""}
                      onChange={(e) =>
                        handleAttendanceChange(
                          student.userId,
                          "inTime",
                          e.target.value
                        )
                      }
                      className="p-2 border border-gray-300 rounded-md w-full"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="time"
                      value={attendance[student.userId]?.outTime || ""}
                      onChange={(e) =>
                        handleAttendanceChange(
                          student.userId,
                          "outTime",
                          e.target.value
                        )
                      }
                      className="p-2 border border-gray-300 rounded-md w-full"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={attendance[student.userId]?.reason || ""}
                      onChange={(e) =>
                        handleAttendanceChange(
                          student.userId,
                          "reason",
                          e.target.value
                        )
                      }
                      placeholder="Reason (if any)"
                      className="p-2 border border-gray-300 rounded-md w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Submit Attendance
        </button>
      </form>
    </div>
  );
};

export default MarkAttendance;
