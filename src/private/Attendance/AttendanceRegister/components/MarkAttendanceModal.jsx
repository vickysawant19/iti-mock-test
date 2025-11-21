import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  UserX,
  Users,
  Save,
  Palmtree,
  Trash2,
  Calendar
} from "lucide-react";

const MarkAttendanceModal = ({
  isOpen,
  onClose,
  students,
  date,
  batchId,
  onSave,
  existingAttendance,
  holidays, // Assuming this is a Map or Object where key is dateString
  handleAddHoliday,
  handleRemoveHoliday,
}) => {
  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  // Holiday States
  // Check if current date exists in holidays (support Map, Set, or Object)
  const isExistingHoliday = holidays instanceof Map || holidays instanceof Set 
    ? holidays.has(date) 
    : !!holidays[date];
    
  const [isMarkingHoliday, setIsMarkingHoliday] = useState(false);
  const [holidayReason, setHolidayReason] = useState("");

  // Reset state when modal opens or date changes
  useEffect(() => {
    if (isOpen) {
      // 1. Load existing attendance
      const statuses = {};
      students.forEach((student) => {
        const record = existingAttendance.filter(
          (att) => att.userId === student.userId
        );
        const dayRecord = record?.find((rec) => rec.date === date);
        statuses[student.userId] = dayRecord?.status || "absent";
      });
      setAttendanceStatuses(statuses);

      // 2. Reset holiday form
      setIsMarkingHoliday(false);
      setHolidayReason("");
    }
  }, [isOpen, students, date, existingAttendance]);

  if (!isOpen) return null;

  // --- Handlers ---

  const handleStatusChange = (userId, status) => {
    setAttendanceStatuses((prev) => ({ ...prev, [userId]: status }));
  };

  const handleMainSave = async () => {
    setIsLoading(true);
    try {
      if (isExistingHoliday) {
        // If it's already a holiday, we likely just want to close or do nothing unless removing
        onClose();
      } else if (isMarkingHoliday) {
        // Logic: Save as Holiday
        if (!holidayReason.trim()) {
          alert("Please enter a reason for the holiday.");
          setIsLoading(false);
          return;
        }
        await handleAddHoliday(date, holidayReason);
        setIsMarkingHoliday(false); // Reset mode
      } else {
        // Logic: Save Attendance
        await onSave(attendanceStatuses);
        onClose();
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveHolidayInternal = async () => {
    setIsLoading(true);
    try {
      await handleRemoveHoliday(date);
      // After removing, we are back to normal attendance mode
    } catch (error) {
      console.error("Error removing holiday:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHolidayToggle = () => {
    setIsMarkingHoliday(!isMarkingHoliday);
    setHolidayReason(""); // Reset text on toggle
  };

  // --- Helpers ---

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
    (s) => s === "present"
  ).length;
  const absentCount = Object.values(attendanceStatuses).filter(
    (s) => s === "absent"
  ).length;

  const filteredStudents = students.filter((student) => {
    if (filter === "present")
      return attendanceStatuses[student.userId] === "present";
    if (filter === "absent")
      return attendanceStatuses[student.userId] === "absent";
    return true;
  });

  const markAllPresent = () => {
    const newStatuses = {};
    students.forEach((student) => {
      newStatuses[student.userId] = "present";
    });
    setAttendanceStatuses(newStatuses);
  };

  const markAllAbsent = () => {
    const newStatuses = {};
    students.forEach((student) => {
      newStatuses[student.userId] = "absent";
    });
    setAttendanceStatuses(newStatuses);
  };

  // --- Render Logic ---

  // Determine what view to show in the body
  const showHolidayInput = isMarkingHoliday && !isExistingHoliday;
  const showAttendanceList = !isExistingHoliday && !isMarkingHoliday;
  const showExistingHolidayView = isExistingHoliday;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn dark:bg-opacity-80">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 dark:from-indigo-800 dark:to-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {isExistingHoliday || isMarkingHoliday ? (
                    <>
                        <Palmtree className="w-5 h-5" />
                        {isExistingHoliday ? "Holiday Details" : "Set Holiday"}
                    </>
                ) : (
                    "Mark Attendance"
                )}
              </h2>
              <p className="text-indigo-100 text-xs dark:text-indigo-200 flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {formatDate(date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions / Stats (Only show if NOT a holiday) */}
        {!isExistingHoliday && !isMarkingHoliday && (
          <>
            {/* Stats Bar */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 flex gap-3">
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Users className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Total
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {students.length}
                </p>
              </div>
              <div className="flex-1 bg-green-50 dark:bg-green-900 rounded-lg px-3 py-2 border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-300" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-300">
                    Present
                  </span>
                </div>
                <p className="text-xl font-bold text-green-700 dark:text-green-200">
                  {presentCount}
                </p>
              </div>
              <div className="flex-1 bg-red-50 dark:bg-red-900 rounded-lg px-3 py-2 border border-red-200 dark:border-red-700">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <UserX className="w-3.5 h-3.5 text-red-600 dark:text-red-300" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-300">
                    Absent
                  </span>
                </div>
                <p className="text-xl font-bold text-red-700 dark:text-red-200">
                  {absentCount}
                </p>
              </div>
            </div>

            {/* Filters & Actions */}
            <div className="px-4 py-2 border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="flex flex-wrap gap-2 mb-2">
                {["all", "present", "absent"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                      filter === f
                        ? "bg-indigo-600 text-white dark:bg-indigo-800"
                        : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {f} {f === "all" ? `(${students.length})` : f === "present" ? `(${presentCount})` : `(${absentCount})`}
                  </button>
                ))}
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
                <button
                  onClick={handleHolidayToggle}
                  className="flex-1 px-2 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-800 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Palmtree className="w-3.5 h-3.5" />
                  Mark Holiday
                </button>
              </div>
            </div>
          </>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 relative">
          
          {/* VIEW 1: Existing Holiday */}
          {showExistingHolidayView && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fadeIn">
              <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-6 mb-4">
                <Palmtree className="w-16 h-16 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Holiday Marked
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                This date is currently marked as a holiday. Attendance is disabled.
              </p>
              
              {/* If holidays Map stores strings, we can display the reason here */}
              {typeof holidays.get === 'function' && holidays.get(date) && (
                 <div className="bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 px-4 py-2 rounded-lg mb-6">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">
                        "{holidays.get(date)?.holidayText}"
                    </p>
                 </div>
              )}

              <button
                onClick={handleRemoveHolidayInternal}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                   <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                   <Trash2 className="w-4 h-4" />
                )}
                Remove Holiday
              </button>
            </div>
          )}

          {/* VIEW 2: Add Holiday Form */}
          {showHolidayInput && (
            <div className="flex flex-col items-center justify-center h-full py-4 animate-fadeIn">
              <div className="w-full max-w-md bg-amber-50 dark:bg-amber-900 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-amber-100 dark:bg-amber-800 rounded-full p-3">
                    <Palmtree className="w-8 h-8 text-amber-600 dark:text-amber-300" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
                  Set as Holiday
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                  This will mark all students as exempted for today.
                </p>
                <textarea
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                  placeholder="e.g., National Festival, Heavy Rain, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  rows="3"
                  autoFocus
                />
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={() => setIsMarkingHoliday(false)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                    >
                        Back to Attendance
                    </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: Student List */}
          {showAttendanceList && (
            <div className="space-y-2 animate-fadeIn">
              {filteredStudents.map((student) => (
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
                          handleStatusChange(student.userId, "present")
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          attendanceStatuses[student.userId] === "present"
                            ? "bg-green-600 text-white dark:bg-green-800"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(student.userId, "absent")
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          attendanceStatuses[student.userId] === "absent"
                            ? "bg-red-600 text-white dark:bg-red-800"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                      No students found with this filter.
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Close
            </button>
            
            {/* Smart Save Button: Context aware based on isMarkingHoliday */}
            {!isExistingHoliday && (
                <button
                  onClick={handleMainSave}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2
                    ${isMarkingHoliday 
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" 
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {isMarkingHoliday ? <Palmtree className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{isMarkingHoliday ? "Save Holiday" : "Save Attendance"}</span>
                    </>
                  )}
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;