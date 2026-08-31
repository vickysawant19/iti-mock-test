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
  AlertCircle,
  Search,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown
} from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { attendanceAnalyticsService } from "@/services/attendance/attendanceAnalyticsService";
import { attendanceTrackingService } from "@/services/attendance/attendanceTrackingService";
import StudentLeaveQuotaBadges from "@/private/Attendance/components/StudentLeaveQuotaBadges";

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
  handleClearDayAttendance,
  initialMode = "attendance",
}) => {
  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id_asc");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isFuture = date > todayStr;

  const isExistingHoliday =
    holidays instanceof Map || holidays instanceof Set
      ? holidays.has(date)
      : !!holidays[date];

  const hasExistingRecords = useMemo(() => {
    if (!Array.isArray(existingAttendance) || !date) return false;
    return existingAttendance.some((att) => att.date === date);
  }, [existingAttendance, date]);

  const [isMarkingHoliday, setIsMarkingHoliday] = useState(false);
  const [holidayReason, setHolidayReason] = useState("");

  const safeStudents = useMemo(() => (Array.isArray(students) ? students : []), [students]);

  // Calculate annual leave quota per student
  const studentQuotas = useMemo(() => {
    const map = new Map();
    if (!safeStudents.length || !existingAttendance) return map;
    const targetYear = date ? new Date(date).getFullYear() : new Date().getFullYear();

    safeStudents.forEach((student) => {
      if (!student) return;
      const userRecords = (existingAttendance || []).filter(
        (r) => r.userId === student.userId
      );
      const quota = attendanceTrackingService.calculateLeaveQuotas(userRecords, targetYear);
      map.set(student.userId, quota);
    });
    return map;
  }, [safeStudents, existingAttendance, date]);

  // Reset state when modal opens or date changes
  useEffect(() => {
    if (isOpen) {
      setShowClearConfirm(false);
      setSearchQuery("");
      setFilter("all");
      setRoleFilter("all");
      setSortBy("id_asc");
      const statuses = {};
      safeStudents.forEach((student) => {
        if (!student) return;
        const record = (existingAttendance || []).filter(
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
  }, [isOpen, safeStudents, date, existingAttendance, initialMode, isFuture, isExistingHoliday]);

  const handleStatusChange = (userId, targetStatus) => {
    setAttendanceStatuses((prev) => {
      const current = prev[userId];
      const nextStatus = current === targetStatus ? "absent" : targetStatus;
      return { ...prev, [userId]: nextStatus };
    });
  };

  const isBlockedByEnrollment = (student, targetDate) => {
    if (!student || student.isTeacher || !student.enrollmentDate || !targetDate) return false;
    try {
      const enrollStr = String(student.enrollmentDate).substring(0, 10);
      return targetDate < enrollStr;
    } catch {
      return false;
    }
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
        // Filter out students blocked by enrollment date before saving
        const validStatuses = {};
        Object.entries(attendanceStatuses).forEach(([uid, st]) => {
          const s = students.find((stud) => stud.userId === uid);
          if (s && !isBlockedByEnrollment(s, date)) {
            validStatuses[uid] = st;
          }
        });
        await onSave(validStatuses);
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

  const handleClearAttendanceInternal = async () => {
    if (!handleClearDayAttendance) return;
    setIsLoading(true);
    try {
      await handleClearDayAttendance(date);
      setShowClearConfirm(false);
      onClose();
    } catch (error) {
      console.error("Error clearing daily attendance:", error);
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

  const actualStudents = safeStudents.filter((s) => !s?.isTeacher);
  const teachersCount = safeStudents.filter((s) => s?.isTeacher).length;

  const presentCount = Object.keys(attendanceStatuses).filter(
    (userId) => {
      const s = safeStudents.find((stud) => stud?.userId === userId);
      return (
        attendanceStatuses[userId] === "present" &&
        !s?.isTeacher &&
        !isBlockedByEnrollment(s, date)
      );
    }
  ).length;

  const absentCount = Object.keys(attendanceStatuses).filter(
    (userId) => {
      const s = safeStudents.find((stud) => stud?.userId === userId);
      return (
        attendanceStatuses[userId] === "absent" &&
        !s?.isTeacher &&
        !isBlockedByEnrollment(s, date)
      );
    }
  ).length;

  const leaveCount = Object.keys(attendanceStatuses).filter(
    (userId) => {
      const s = safeStudents.find((stud) => stud?.userId === userId);
      return (
        ["casual", "sick", "special", "on_duty", "leave", "cl", "sl", "spl", "od"].includes(
          attendanceStatuses[userId]
        ) &&
        !s?.isTeacher &&
        !isBlockedByEnrollment(s, date)
      );
    }
  ).length;

  const clCount = Object.keys(attendanceStatuses).filter((userId) => {
    const s = safeStudents.find((stud) => stud?.userId === userId);
    return (
      (attendanceStatuses[userId] === "casual" || attendanceStatuses[userId] === "cl") &&
      !s?.isTeacher &&
      !isBlockedByEnrollment(s, date)
    );
  }).length;

  const slCount = Object.keys(attendanceStatuses).filter((userId) => {
    const s = safeStudents.find((stud) => stud?.userId === userId);
    return (
      (attendanceStatuses[userId] === "sick" || attendanceStatuses[userId] === "sl") &&
      !s?.isTeacher &&
      !isBlockedByEnrollment(s, date)
    );
  }).length;

  const splCount = Object.keys(attendanceStatuses).filter((userId) => {
    const s = safeStudents.find((stud) => stud?.userId === userId);
    return (
      (attendanceStatuses[userId] === "special" || attendanceStatuses[userId] === "spl") &&
      !s?.isTeacher &&
      !isBlockedByEnrollment(s, date)
    );
  }).length;

  const odCount = Object.keys(attendanceStatuses).filter((userId) => {
    const s = safeStudents.find((stud) => stud?.userId === userId);
    return (
      (attendanceStatuses[userId] === "on_duty" || attendanceStatuses[userId] === "od") &&
      !s?.isTeacher &&
      !isBlockedByEnrollment(s, date)
    );
  }).length;

  const notEnrolledCount = actualStudents.filter((s) => isBlockedByEnrollment(s, date)).length;

  const filteredStudents = useMemo(() => {
    return safeStudents
      .filter((student) => {
        if (!student) return false;
        const isBlocked = isBlockedByEnrollment(student, date);
        const status = attendanceStatuses[student.userId] || "absent";
        const isTeacher = !!student.isTeacher;

        // Role filter
        if (roleFilter === "students" && isTeacher) return false;
        if (roleFilter === "teachers" && !isTeacher) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const name = (student.userName || student.name || "").toLowerCase();
          const id = (student.studentId || student.rollNo || "").toLowerCase();
          if (!name.includes(q) && !id.includes(q)) return false;
        }

        // Status filter
        if (filter === "present") return status === "present" && !isBlocked;
        if (filter === "absent") return status === "absent" && !isBlocked;
        if (filter === "leave") {
          return (
            ["casual", "sick", "special", "on_duty", "leave", "cl", "sl", "spl", "od"].includes(status) &&
            !isBlocked
          );
        }
        if (filter === "casual") return (status === "casual" || status === "cl") && !isBlocked;
        if (filter === "sick") return (status === "sick" || status === "sl") && !isBlocked;
        if (filter === "special") return (status === "special" || status === "spl") && !isBlocked;
        if (filter === "on_duty") return (status === "on_duty" || status === "od") && !isBlocked;
        if (filter === "not_enrolled") return isBlocked;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "id_asc") {
          const idA = String(a.studentId || a.rollNo || "");
          const idB = String(b.studentId || b.rollNo || "");
          return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
        }
        if (sortBy === "name_asc") {
          return (a.userName || "").localeCompare(b.userName || "");
        }
        if (sortBy === "name_desc") {
          return (b.userName || "").localeCompare(a.userName || "");
        }
        if (sortBy === "status") {
          const stA = attendanceStatuses[a.userId] || "absent";
          const stB = attendanceStatuses[b.userId] || "absent";
          return stA.localeCompare(stB);
        }
        return 0;
      });
  }, [safeStudents, attendanceStatuses, filter, roleFilter, searchQuery, sortBy, date]);

  const teachersList = filteredStudents.filter((s) => s?.isTeacher);
  const studentsList = filteredStudents.filter((s) => !s?.isTeacher);

  const markAllPresent = () => {
    const newStatuses = { ...attendanceStatuses };
    safeStudents.forEach((student) => {
      if (student && !isBlockedByEnrollment(student, date)) {
        newStatuses[student.userId] = "present";
      }
    });
    setAttendanceStatuses(newStatuses);
  };

  const markAllAbsent = () => {
    const newStatuses = { ...attendanceStatuses };
    safeStudents.forEach((student) => {
      if (student && !isBlockedByEnrollment(student, date)) {
        newStatuses[student.userId] = "absent";
      }
    });
    setAttendanceStatuses(newStatuses);
  };


  const showHolidayInput = isMarkingHoliday && !isExistingHoliday;
  const showAttendanceList = !isExistingHoliday && !isMarkingHoliday;
  const showExistingHolidayView = isExistingHoliday;

  const renderStudentRow = (student) => {
    const currentStatus = attendanceStatuses[student.userId] || "absent";
    const isBlocked = isBlockedByEnrollment(student, date);
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
          student.isTeacher ? "border-l-4 border-l-purple-500" : isBlocked ? "opacity-60 bg-slate-50 dark:bg-slate-900/60" : ""
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
                {isBlocked && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    Not Enrolled Yet
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                ID: {student.studentId || "N/A"}
              </p>

              {/* Leave Quotas Badge Row */}
              {!isBlocked && <StudentLeaveQuotaBadges quota={quota} className="mt-1" />}
            </div>
          </div>

          {/* Right: Status Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:self-center">
            {isBlocked ? (
              <span
                className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-1 select-none"
                title={`Enrolled on ${String(student.enrollmentDate).substring(0, 10)}`}
              >
                <span className="font-extrabold text-slate-400">X</span> Not Enrolled Yet
              </span>
            ) : (
              <>
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
            </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

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

            {/* Enhanced Filters & Search Toolbar */}
            <div className="px-4 py-3 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/90 space-y-2.5">
              
              {/* Row 1: Live Search + Role Selector + Sort Dropdown */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name or ID..."
                    className="w-full pl-8.5 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Role Switcher & Sort Selector */}
                <div className="flex items-center gap-2">
                  {/* Role Selector */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="all">All Members ({students.length})</option>
                    <option value="students">Students ({actualStudents.length})</option>
                    {teachersCount > 0 && (
                      <option value="teachers">Instructors ({teachersCount})</option>
                    )}
                  </select>

                  {/* Sort Selector */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="id_asc">Student ID (Default)</option>
                    <option value="name_asc">Name (A → Z)</option>
                    <option value="name_desc">Name (Z → A)</option>
                    <option value="status">Status</option>
                  </select>

                  {/* Reset Filters button if any active */}
                  {(filter !== "all" || searchQuery || roleFilter !== "all" || sortBy !== "id_asc") && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilter("all");
                        setSearchQuery("");
                        setRoleFilter("all");
                        setSortBy("id_asc");
                      }}
                      className="px-2 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 shrink-0"
                      title="Reset all filters"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Status Filter Pills Carousel */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {/* All */}
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all shrink-0 ${
                    filter === "all"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  All ({actualStudents.length})
                </button>

                {/* Present */}
                <button
                  type="button"
                  onClick={() => setFilter("present")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all shrink-0 ${
                    filter === "present"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-emerald-700 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                  }`}
                >
                  Present ({presentCount})
                </button>

                {/* Absent */}
                <button
                  type="button"
                  onClick={() => setFilter("absent")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all shrink-0 ${
                    filter === "absent"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-white text-rose-700 hover:bg-rose-50 dark:bg-slate-900 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                  }`}
                >
                  Absent ({absentCount})
                </button>

                {/* All Leaves */}
                <button
                  type="button"
                  onClick={() => setFilter("leave")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all shrink-0 ${
                    filter === "leave"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-white text-amber-700 hover:bg-amber-50 dark:bg-slate-900 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                  }`}
                >
                  All Leaves ({leaveCount})
                </button>

                {/* CL */}
                <button
                  type="button"
                  onClick={() => setFilter("casual")}
                  className={`px-2 py-1 rounded-md font-bold transition-all shrink-0 ${
                    filter === "casual"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white text-amber-600 hover:bg-amber-50 dark:bg-slate-900 dark:text-amber-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  CL ({clCount})
                </button>

                {/* SL */}
                <button
                  type="button"
                  onClick={() => setFilter("sick")}
                  className={`px-2 py-1 rounded-md font-bold transition-all shrink-0 ${
                    filter === "sick"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white text-sky-600 hover:bg-sky-50 dark:bg-slate-900 dark:text-sky-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  SL ({slCount})
                </button>

                {/* SPL */}
                <button
                  type="button"
                  onClick={() => setFilter("special")}
                  className={`px-2 py-1 rounded-md font-bold transition-all shrink-0 ${
                    filter === "special"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white text-purple-600 hover:bg-purple-50 dark:bg-slate-900 dark:text-purple-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  SPL ({splCount})
                </button>

                {/* OD */}
                <button
                  type="button"
                  onClick={() => setFilter("on_duty")}
                  className={`px-2 py-1 rounded-md font-bold transition-all shrink-0 ${
                    filter === "on_duty"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-white text-teal-600 hover:bg-teal-50 dark:bg-slate-900 dark:text-teal-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  OD ({odCount})
                </button>

                {/* Not Enrolled */}
                {notEnrolledCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter("not_enrolled")}
                    className={`px-2 py-1 rounded-md font-bold transition-all shrink-0 ${
                      filter === "not_enrolled"
                        ? "bg-slate-600 text-white shadow-xs"
                        : "bg-white text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Not Enrolled ({notEnrolledCount})
                  </button>
                )}
              </div>

              {/* Row 3: Quick Batch Marking Actions */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                <button
                  onClick={markAllPresent}
                  className="flex-1 min-w-[120px] px-2 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="flex-1 min-w-[120px] px-2 py-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-md text-xs font-semibold hover:bg-rose-200 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 transition-colors"
                >
                  Mark All Absent
                </button>
                <button
                  onClick={handleHolidayToggle}
                  className="flex-1 min-w-[120px] px-2 py-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Palmtree className="w-3.5 h-3.5" />
                  Mark Holiday
                </button>
                {hasExistingRecords && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="flex-1 min-w-[120px] px-2 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Clear all attendance records for this date"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Clear Records
                  </button>
                )}
              </div>

              {showClearConfirm && (
                <div className="mt-2.5 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <p className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                      Are you sure you want to clear all attendance records for {formatDate(date)}?
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      disabled={isLoading}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAttendanceInternal}
                      disabled={isLoading}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                    >
                      {isLoading ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Yes, Clear
                    </button>
                  </div>
                </div>
              )}
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
                <div className="text-center py-10 px-4 flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No members match your filter criteria.
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Try adjusting your search query or selecting a different status filter.
                  </p>
                  {(filter !== "all" || searchQuery || roleFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilter("all");
                        setSearchQuery("");
                        setRoleFilter("all");
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  )}
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

export { DailyBatchAttendanceModal as MarkAttendanceModal };
export default DailyBatchAttendanceModal;
