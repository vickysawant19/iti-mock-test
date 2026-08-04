import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  X,
  Check,
  UserX,
  Users,
  Save,
  Palmtree,
  Trash2,
  Calendar,
  AlertCircle
} from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { attendanceAnalyticsService } from "@/services/attendanceAnalyticsService";
import { attendanceTrackingService } from "@/services/attendanceTrackingService";

/**
 * Daily Batch Attendance & Holiday Modal
 * Opened when clicking a specific date column in the Attendance Register.
 * Allows marking/editing attendance or setting a holiday for all students in the batch for that single day.
 */
export const DailyBatchAttendanceModal = ({
  isOpen,
  onClose,
  students = [],
  date,
  batchId,
  onSave,
  existingAttendance = [],
  holidays,
  handleAddHoliday,
  handleRemoveHoliday,
  initialMode = "attendance",
}) => {
  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isFuture = date > todayStr;

  const isExistingHoliday =
    holidays instanceof Map || holidays instanceof Set
      ? holidays.has(date)
      : !!holidays[date];

  const [isMarkingHoliday, setIsMarkingHoliday] = useState(false);
  const [holidayReason, setHolidayReason] = useState("");

  // Calculate annual leave quota per student
  const studentQuotas = useMemo(() => {
    const map = new Map();
    if (!students || !existingAttendance) return map;
    const targetYear = date ? new Date(date).getFullYear() : new Date().getFullYear();

    students.forEach((student) => {
      const userRecords = (existingAttendance || []).filter(
        (r) => r.userId === student.userId
      );
      const quota = attendanceTrackingService.calculateLeaveQuotas(userRecords, targetYear);
      map.set(student.userId, quota);
    });
    return map;
  }, [students, existingAttendance, date]);

  // Reset state when modal opens or date changes
  useEffect(() => {
    if (isOpen) {
      const statuses = {};
      students.forEach((student) => {
        const record = existingAttendance.filter(
          (att) => att.userId === student.userId
        );
        const dayRecord = record?.find((rec) => rec.date === date);
        let rawStatus = dayRecord?.attendanceStatus
          ? dayRecord.attendanceStatus.toLowerCase()
          : dayRecord?.status || "absent";

        if (rawStatus === "leave" && dayRecord?.leaveType) {
          rawStatus = String(dayRecord.leaveType).toLowerCase();
        }
        statuses[student.userId] = rawStatus;
      });
      setAttendanceStatuses(statuses);

      if (initialMode === "holiday") {
        setIsMarkingHoliday(true);
      } else {
        setIsMarkingHoliday(isFuture && !isExistingHoliday);
      }
      setHolidayReason("");
    }
  }, [isOpen, students, date, existingAttendance, initialMode, isFuture, isExistingHoliday]);

  if (!isOpen) return null;

  const handleStatusChange = (userId, targetStatus) => {
    setAttendanceStatuses((prev) => {
      const current = prev[userId];
      const nextStatus = current === targetStatus ? "absent" : targetStatus;
      return { ...prev, [userId]: nextStatus };
    });
  };

  const handleMainSave = async () => {
    setIsLoading(true);
    try {
      if (isExistingHoliday) {
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
        if (!holidayReason.trim()) {
          alert("Please enter a reason for the holiday.");
          setIsLoading(false);
          return;
        }
        await handleAddHoliday(date, holidayReason);
        setIsMarkingHoliday(false);
      } else {
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
    } catch (error) {
      console.error("Error removing holiday:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHolidayToggle = () => {
    if (isFuture) return;
    setIsMarkingHoliday(!isMarkingHoliday);
    setHolidayReason("");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const actualStudents = students.filter((s) => !s.isTeacher);

  const presentCount = Object.keys(attendanceStatuses).filter(
    (userId) =>
      attendanceStatuses[userId] === "present" &&
      !students.find((s) => s.userId === userId)?.isTeacher
  ).length;

  const absentCount = Object.keys(attendanceStatuses).filter(
    (userId) =>
      attendanceStatuses[userId] === "absent" &&
      !students.find((s) => s.userId === userId)?.isTeacher
  ).length;

  const leaveCount = Object.keys(attendanceStatuses).filter(
    (userId) =>
      ["casual", "sick", "special", "on_duty", "leave", "cl", "sl", "spl", "od"].includes(
        attendanceStatuses[userId]
      ) && !students.find((s) => s.userId === userId)?.isTeacher
  ).length;

  const filteredStudents = students.filter((student) => {
    const status = attendanceStatuses[student.userId];
    if (filter === "present") return status === "present";
    if (filter === "absent") return status === "absent";
    if (filter === "leave")
      return ["casual", "sick", "special", "on_duty", "leave", "cl", "sl", "spl", "od"].includes(status);
    return true;
  });

  const teachersList = filteredStudents.filter((s) => s.isTeacher);
  const studentsList = filteredStudents.filter((s) => !s.isTeacher);

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

  const showHolidayInput = isMarkingHoliday && !isExistingHoliday;
  const showAttendanceList = !isExistingHoliday && !isMarkingHoliday;
  const showExistingHolidayView = isExistingHoliday;

  const renderStudentRow = (student) => {
    const currentStatus = attendanceStatuses[student.userId] || "absent";
    const quota = studentQuotas.get(student.userId) || {
      clRemaining: 12,
      slDaysRemaining: 15,
      slSpellsRemaining: 2,
      splUsed: 0,
      isClExceeded: false,
      isSlDaysExceeded: false,
      isSlSpellsExceeded: false,
    };

    return (
      <div
        key={student.userId}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 hover:shadow-md transition-all ${
          student.isTeacher ? "border-l-4 border-l-purple-500" : ""
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Info & Quota Badges */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <InteractiveAvatar
                src={student.profileImage}
                fallbackText={
                  student.userName
                    ? student.userName.charAt(0).toUpperCase()
                    : "U"
                }
                userId={student.userId}
                editable={false}
                className="w-9 h-9"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                  {student.userName}
                </p>
                {student.isTeacher && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Teacher
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                ID: {student.studentId || "N/A"}
              </p>

              {/* Leave Quotas Badge Row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                <span
                  title="Casual Leave Quota (12 / year)"
                  className={`px-2 py-0.5 rounded-md font-semibold border transition-colors ${
                    quota.isClExceeded
                      ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300"
                      : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  CL: {quota.clRemaining}/12 left
                </span>

                <span
                  title="Sick Leave Quota (15 days / max 2 spells per year)"
                  className={`px-2 py-0.5 rounded-md font-semibold border transition-colors ${
                    quota.isSlDaysExceeded || quota.isSlSpellsExceeded
                      ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300"
                      : "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300"
                  }`}
                >
                  SL: {quota.slDaysRemaining}d ({quota.slSpellsRemaining}/2 spells left)
                </span>

                <span
                  title="Special Leave (Not deducted from quota)"
                  className="px-2 py-0.5 rounded-md font-semibold border bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                >
                  SPL: Excluded
                </span>
              </div>
            </div>
          </div>

          {/* Right: Status Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:self-center">
            {/* Present */}
            <button
              type="button"
              onClick={() => handleStatusChange(student.userId, "present")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                currentStatus === "present"
                  ? "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-700 dark:border-emerald-700 shadow-sm scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
              }`}
            >
              Present
            </button>

            {/* Absent */}
            <button
              type="button"
              onClick={() => handleStatusChange(student.userId, "absent")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                currentStatus === "absent"
                  ? "bg-rose-600 text-white border-rose-600 dark:bg-rose-700 dark:border-rose-700 shadow-sm scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
              }`}
            >
              Absent
            </button>

            {/* Casual Leave (CL) */}
            <button
              type="button"
              onClick={() => handleStatusChange(student.userId, "casual")}
              title={quota.isClExceeded ? "Warning: CL Quota Exceeded (12/yr)" : "Casual Leave"}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                currentStatus === "casual" || currentStatus === "cl"
                  ? "bg-amber-500 text-white border-amber-500 dark:bg-amber-600 dark:border-amber-600 shadow-sm scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
              }`}
            >
              <span>CL</span>
              {quota.isClExceeded && (
                <AlertCircle className="w-3 h-3 text-rose-300" />
              )}
            </button>

            {/* Sick Leave (SL) */}
            <button
              type="button"
              onClick={() => handleStatusChange(student.userId, "sick")}
              title={
                quota.isSlDaysExceeded || quota.isSlSpellsExceeded
                  ? "Warning: SL Limit/Spell Exceeded (15d / 2 spells)"
                  : "Sick Leave"
              }
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                currentStatus === "sick" || currentStatus === "sl"
                  ? "bg-sky-600 text-white border-sky-600 dark:bg-sky-700 dark:border-sky-700 shadow-sm scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
              }`}
            >
              <span>SL</span>
              {(quota.isSlDaysExceeded || quota.isSlSpellsExceeded) && (
                <AlertCircle className="w-3 h-3 text-rose-300" />
              )}
            </button>

            {/* Special Leave (SPL) */}
            <button
              type="button"
              onClick={() => handleStatusChange(student.userId, "special")}
              title="Special Leave (Not counted against quota)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                currentStatus === "special" || currentStatus === "spl"
                  ? "bg-purple-600 text-white border-purple-600 dark:bg-purple-700 dark:border-purple-700 shadow-sm scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
              }`}
            >
              SPL
            </button>

            {/* On Duty (OD) */}
            <button
              type="button"
              onClick={() => handleStatusChange(student.userId, "on_duty")}
              title="On Duty Leave"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                currentStatus === "on_duty" || currentStatus === "od"
                  ? "bg-teal-600 text-white border-teal-600 dark:bg-teal-700 dark:border-teal-700 shadow-sm scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
              }`}
            >
              OD
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn dark:bg-opacity-80">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800">
        
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
                  "Mark Daily Batch Attendance"
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

        {/* Stats & Quick Action Bar */}
        {!isExistingHoliday && !isMarkingHoliday && !isFuture && (
          <>
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

              <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Present
                  </span>
                </div>
                <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                  {presentCount}
                </p>
              </div>

              <div className="flex-1 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-3 py-2 border border-rose-200 dark:border-rose-800">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                    Absent
                  </span>
                </div>
                <p className="text-xl font-bold text-rose-800 dark:text-rose-200">
                  {absentCount}
                </p>
              </div>

              <div className="flex-1 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Palmtree className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    On Leave
                  </span>
                </div>
                <p className="text-xl font-bold text-amber-800 dark:text-amber-200">
                  {leaveCount}
                </p>
              </div>
            </div>

            {/* Filters & Actions */}
            <div className="px-4 py-2 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <div className="flex flex-wrap gap-2 mb-2">
                {["all", "present", "absent", "leave"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                      filter === f
                        ? "bg-indigo-600 text-white dark:bg-indigo-700"
                        : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {f}{" "}
                    {f === "all"
                      ? `(${actualStudents.length})`
                      : f === "present"
                      ? `(${presentCount})`
                      : f === "absent"
                      ? `(${absentCount})`
                      : `(${leaveCount})`}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={markAllPresent}
                  className="flex-1 px-2 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="flex-1 px-2 py-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-md text-xs font-semibold hover:bg-rose-200 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 transition-colors"
                >
                  Mark All Absent
                </button>
                <button
                  onClick={handleHolidayToggle}
                  className="flex-1 px-2 py-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
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
                
                {typeof holidays.get === "function" && holidays.get(date) && (
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

              {teachersList.length > 0 && (
                <div className="border-t dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Teacher Attendance
                  </h4>
                  <div className="space-y-2">
                    {teachersList.map((t) => renderStudentRow(t))}
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
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["Sunday", "Second Saturday", "Fourth Saturday"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHolidayReason(preset)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
                        holidayReason === preset
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
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

          {/* VIEW 3: Student & Instructor Attendance List */}
          {showAttendanceList && (
            <div className="space-y-4 animate-fadeIn">
              {teachersList.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-2">
                    Instructor
                  </h4>
                  <div className="space-y-2">
                    {teachersList.map((teacher) => renderStudentRow(teacher))}
                  </div>
                </div>
              )}

              {studentsList.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-2">
                    Students
                  </h4>
                  <div className="space-y-2">
                    {studentsList.map((student) => renderStudentRow(student))}
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

            {(!isExistingHoliday || teachersList.length > 0) && (
              <button
                onClick={handleMainSave}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2
                  ${
                    isMarkingHoliday || isFuture
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
                    {isMarkingHoliday || isFuture ? (
                      <Palmtree className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>
                      {isExistingHoliday
                        ? "Save Teacher Attendance"
                        : isMarkingHoliday || isFuture
                        ? "Save Holiday"
                        : "Save Attendance"}
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

export default DailyBatchAttendanceModal;
