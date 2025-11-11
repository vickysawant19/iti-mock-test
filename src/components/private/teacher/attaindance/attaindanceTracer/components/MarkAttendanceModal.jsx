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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn dark:bg-opacity-80">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 dark:from-indigo-800 dark:to-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Mark Attendance</h2>
              <p className="text-indigo-100 text-xs dark:text-indigo-200">{formatDate(date)}</p>
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
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 flex gap-3">
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Users className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{students.length}</p>
          </div>
          <div className="flex-1 bg-green-50 dark:bg-green-900 rounded-lg px-3 py-2 border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-300" />
              <span className="text-xs font-medium text-green-600 dark:text-green-300">
                Present
              </span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-200">{presentCount}</p>
          </div>
          <div className="flex-1 bg-red-50 dark:bg-red-900 rounded-lg px-3 py-2 border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-1.5 mb-0.5">
              <UserX className="w-3.5 h-3.5 text-red-600 dark:text-red-300" />
              <span className="text-xs font-medium text-red-600 dark:text-red-300">Absent</span>
            </div>
            <p className="text-xl font-bold text-red-700 dark:text-red-200">{absentCount}</p>
          </div>
        </div>

        {/* Filters & Quick Actions */}
        <div className="px-4 py-2 border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-indigo-600 text-white dark:bg-indigo-800"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setFilter("present")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === "present"
                  ? "bg-green-600 text-white dark:bg-green-800"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              onClick={() => setFilter("absent")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === "absent"
                  ? "bg-red-600 text-white dark:bg-red-800"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Absent ({absentCount})
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={markAllPresent}
              className="flex-1 px-2 py-1.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded-md text-xs font-medium hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="flex-1 px-2 py-1.5 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md text-xs font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
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
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {student.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {student.userName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        ID: {student.studentId}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleStatusChange(student.userId, "Present")
                      }
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        attendanceStatuses[student.userId] === "Present"
                          ? "bg-green-600 text-white dark:bg-green-800"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(student.userId, "Absent")
                      }
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        attendanceStatuses[student.userId] === "Absent"
                          ? "bg-red-600 text-white dark:bg-red-800"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:from-indigo-800 dark:to-purple-800 dark:hover:from-indigo-900 dark:hover:to-purple-900"
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
