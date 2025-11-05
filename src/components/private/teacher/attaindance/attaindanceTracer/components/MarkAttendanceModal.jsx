import React, { useState, useEffect } from "react";
import { X, Check, UserX, Calendar, Users, Save } from "lucide-react";

const MarkAttendanceModal = ({
  isOpen,
  onClose,
  students,
  date,
  batchId,
  onSave,
  existingAttendance,
}) => {
  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const statuses = {};
    students.forEach((student) => {
      const record = existingAttendance.find(
        (att) => att.userId === student.userId
      );
      const dayRecord = record?.attendanceRecords.find(
        (rec) => rec.date.split("T")[0] === date
      );
      statuses[student.userId] = dayRecord?.attendanceStatus || "Absent";
    });
    setAttendanceStatuses(statuses);
  }, [isOpen, students, date, existingAttendance]);

  if (!isOpen) return null;

  const handleStatusChange = (userId, status) => {
    setAttendanceStatuses((prev) => ({ ...prev, [userId]: status }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(attendanceStatuses);
      onClose();
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const presentCount = Object.values(attendanceStatuses).filter(
    (s) => s === "Present"
  ).length;
  const absentCount = Object.values(attendanceStatuses).filter(
    (s) => s === "Absent"
  ).length;

  const filteredStudents = students.filter((student) => {
    if (filter === "present")
      return attendanceStatuses[student.userId] === "Present";
    if (filter === "absent")
      return attendanceStatuses[student.userId] === "Absent";
    return true;
  });

  const markAllPresent = () => {
    const newStatuses = {};
    students.forEach((student) => {
      newStatuses[student.userId] = "Present";
    });
    setAttendanceStatuses(newStatuses);
  };

  const markAllAbsent = () => {
    const newStatuses = {};
    students.forEach((student) => {
      newStatuses[student.userId] = "Absent";
    });
    setAttendanceStatuses(newStatuses);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Mark Attendance</h2>
              <p className="text-indigo-100 text-xs">{formatDate(date)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-50 px-4 py-3 border-b flex gap-3">
          <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Users className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="flex-1 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-600">
                Present
              </span>
            </div>
            <p className="text-xl font-bold text-green-700">{presentCount}</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
            <div className="flex items-center gap-1.5 mb-0.5">
              <UserX className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-medium text-red-600">Absent</span>
            </div>
            <p className="text-xl font-bold text-red-700">{absentCount}</p>
          </div>
        </div>

        {/* Filters & Quick Actions */}
        <div className="px-4 py-2 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setFilter("present")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === "present"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              onClick={() => setFilter("absent")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === "absent"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Absent ({absentCount})
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={markAllPresent}
              className="flex-1 px-2 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="flex-1 px-2 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-2">
            {filteredStudents.map((student, index) => (
              <div
                key={student.userId}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {student.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate text-sm">
                        {student.userName}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleStatusChange(student.userId, "Present")
                      }
                      className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 ${
                        attendanceStatuses[student.userId] === "Present"
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Present</span>
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(student.userId, "Absent")
                      }
                      className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 ${
                        attendanceStatuses[student.userId] === "Absent"
                          ? "bg-red-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700"
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Absent</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;
