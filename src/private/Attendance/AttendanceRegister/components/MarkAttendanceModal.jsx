import React, { useState, useEffect } from "react";
import { format } from "date-fns";
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
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

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
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isFuture = date > todayStr;

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
      setIsMarkingHoliday(isFuture && !isExistingHoliday);
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
        // Save teacher's attendance if present in existing holiday
        const teacherStatuses = {};
        students.forEach((student) => {
          if (student.isTeacher) {
            teacherStatuses[student.userId] = attendanceStatuses[student.userId];
          }
        });
        if (Object.keys(teacherStatuses).length > 0) {
          await onSave(teacherStatuses);
        }
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
    if (isFuture) return; // Block toggling off if it's the future
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

  const actualStudents = students.filter(s => !s.isTeacher);

  const presentCount = Object.keys(attendanceStatuses).filter(
    (userId) => attendanceStatuses[userId] === "present" && !students.find(s => s.userId === userId)?.isTeacher
  ).length;
  
  const absentCount = Object.keys(attendanceStatuses).filter(
    (userId) => attendanceStatuses[userId] === "absent" && !students.find(s => s.userId === userId)?.isTeacher
  ).length;

  const filteredStudents = students.filter((student) => {
    if (filter === "present")
      return attendanceStatuses[student.userId] === "present";
    if (filter === "absent")
      return attendanceStatuses[student.userId] === "absent";
    return true;
  });

  const teachersList = filteredStudents.filter(s => s.isTeacher);
  const studentsList = filteredStudents.filter(s => !s.isTeacher);

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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800">
        
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

        {/* Quick Actions / Stats (Only show if NOT a holiday and NOT a future date) */}
        {!isExistingHoliday && !isMarkingHoliday && !isFuture && (
          <>
            {/* Stats Bar */}
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b dark:border-slate-800 flex gap-3">
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-medium text-slate-650 dark:text-slate-400">
                    Total
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {actualStudents.length}
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
            <div className="px-4 py-2 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <div className="flex flex-wrap gap-2 mb-2">
                {["all", "present", "absent"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                      filter === f
                        ? "bg-indigo-600 text-white dark:bg-indigo-800"
                        : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {f} {f === "all" ? `(${actualStudents.length})` : f === "present" ? `(${presentCount})` : `(${absentCount})`}
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
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center text-center py-6 animate-fadeIn">
                <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-4 mb-3">
                  <Palmtree className="w-10 h-10 text-amber-600 dark:text-amber-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-1 animate-pulse">
                  Holiday Marked
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md text-xs mb-3">
                  This date is currently marked as a holiday. Students are exempted.
                </p>
                
                {/* If holidays Map stores strings, we can display the reason here */}
                {typeof holidays.get === 'function' && holidays.get(date) && (
                   <div className="bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 px-4 py-2 rounded-lg mb-4">
                      <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                          "{holidays.get(date)?.holidayText}"
                      </p>
                   </div>
                )}

                <button
                  onClick={handleRemoveHolidayInternal}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                     <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                     <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Remove Holiday
                </button>
              </div>

              {/* Show Teacher Attendance Selection if Teacher exists */}
              {teachersList.length > 0 && (
                <div className="border-t dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Teacher Attendance</h4>
                  <div className="space-y-2">
                    {teachersList.map((student) => (
                      <div
                        key={student.userId}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:shadow-sm transition-shadow border-l-4 border-l-purple-500"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                               <InteractiveAvatar
                                  src={student.profileImage}
                                  fallbackText={student.userName ? student.userName.charAt(0).toUpperCase() : "U"}
                                  userId={student.userId}
                                  editable={false}
                                  className="w-9 h-9"
                               />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                                {student.userName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
                                  ? "bg-green-600 text-white dark:bg-green-800 animate-in zoom-in-95 duration-200"
                                  : "bg-slate-100 text-slate-650 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
                                  ? "bg-red-600 text-white dark:bg-red-800 animate-in zoom-in-95 duration-200"
                                  : "bg-slate-100 text-slate-650 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
              )}
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
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-2 text-center">
                  Set as Holiday
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
                  {isFuture 
                    ? "Attendance marking is restricted to today or earlier. You may still set this future date as a holiday."
                    : "This will mark all students as exempted for today."}
                </p>
                <textarea
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                  placeholder="e.g., National Festival, Heavy Rain, etc."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-750 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500"
                  rows="3"
                  autoFocus
                />
                {!isFuture && (
                  <div className="mt-4 flex justify-end">
                      <button 
                          onClick={() => setIsMarkingHoliday(false)}
                          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                      >
                          Back to Attendance
                      </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: Student List */}
          {showAttendanceList && (
            <div className="space-y-4 animate-fadeIn">
              {teachersList.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-2">Instructor</h4>
                  <div className="space-y-2">
                    {teachersList.map((student) => (
                      <div
                        key={student.userId}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                               <InteractiveAvatar
                                  src={student.profileImage}
                                  fallbackText={student.userName ? student.userName.charAt(0).toUpperCase() : "U"}
                                  userId={student.userId}
                                  editable={false}
                                  className="w-9 h-9"
                               />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {student.userName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
                                  : "bg-slate-100 text-slate-650 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
                                  : "bg-slate-100 text-slate-650 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
              )}

              {studentsList.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-2">Students</h4>
                  <div className="space-y-2">
                    {studentsList.map((student) => (
                      <div
                        key={student.userId}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                               <InteractiveAvatar
                                  src={student.profileImage}
                                  fallbackText={student.userName ? student.userName.charAt(0).toUpperCase() : "U"}
                                  userId={student.userId}
                                  editable={false}
                                  className="w-9 h-9"
                               />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {student.userName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
                                  : "bg-slate-100 text-slate-650 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
                                  : "bg-slate-100 text-slate-650 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
              )}

              {filteredStudents.length === 0 && (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                      No students found with this filter.
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Close
            </button>
            
            {/* Smart Save Button: Context aware based on isMarkingHoliday */}
            {(!isExistingHoliday || teachersList.length > 0) && (
                <button
                  onClick={handleMainSave}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2
                    ${isMarkingHoliday || isFuture
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
                      {isMarkingHoliday || isFuture ? <Palmtree className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>
                        {isExistingHoliday 
                          ? "Save Teacher Attendance" 
                          : (isMarkingHoliday || isFuture ? "Save Holiday" : "Save Attendance")}
                      </span>
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