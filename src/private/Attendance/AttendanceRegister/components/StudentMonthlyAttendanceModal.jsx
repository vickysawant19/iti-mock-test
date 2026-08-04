import React, { useState, useEffect, useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  startOfMonth,
  parseISO,
} from "date-fns";
import {
  CalendarDays,
  X,
  LoaderCircle,
  History,
  Palmtree,
  ShieldAlert,
  Calendar as CalendarIcon,
  Check,
  UserX,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { attendanceTrackingService } from "@/services/attendanceTrackingService";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Student Monthly Attendance Calendar & Leave Quotas Modal
 * Opened when clicking a student's row in the Attendance Register.
 * Displays calendar attendance status, annual leave quota breakdown (CL, SL, SPL, OD),
 * and direct action buttons to switch Present, Absent, CL, SL, SPL, OD for any selected date.
 */
export const StudentMonthlyAttendanceModal = ({
  isOpen,
  onClose,
  student,
  selectedMonth,
  attendanceMap,
  holidays,
  onAttendanceStatusChange,
  updatingAttendance,
  studentStats,
  onFetchStats,
  loadingStats,
  batchStartDate,
  batchEndDate,
  existingAttendance = [],
}) => {
  const [selectedDateKey, setSelectedDateKey] = useState(format(new Date(), "yyyy-MM-dd"));

  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);

  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  );

  const leadingBlankDays = getDay(monthStart);

  // Set default selected date when modal opens or selectedMonth changes
  useEffect(() => {
    if (isOpen) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const monthStartStr = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
      const monthEndStr = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

      if (todayStr >= monthStartStr && todayStr <= monthEndStr) {
        setSelectedDateKey(todayStr);
      } else {
        setSelectedDateKey(monthStartStr);
      }
    }
  }, [isOpen, selectedMonth]);

  // Calculate annual leave quota for student
  const leaveQuota = useMemo(() => {
    if (!student || !existingAttendance) {
      return {
        clTotal: 12,
        clUsed: 0,
        clRemaining: 12,
        slTotalDays: 15,
        slDaysUsed: 0,
        slDaysRemaining: 15,
        slMaxSpells: 2,
        slSpellsUsed: 0,
        slSpellsRemaining: 2,
        splUsed: 0,
        odUsed: 0,
        isClExceeded: false,
        isSlDaysExceeded: false,
        isSlSpellsExceeded: false,
      };
    }
    const targetYear = selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear();
    const userRecords = (existingAttendance || []).filter((r) => r.userId === student.userId);
    return attendanceTrackingService.calculateLeaveQuotas(userRecords, targetYear);
  }, [student, existingAttendance, selectedMonth]);

  const monthStats = useMemo(() => {
    const today = new Date();

    let workingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let holidaysCount = 0;
    let leaveDays = 0;

    monthDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      const isFuture = isAfter(day, today);

      if (holidays.has(key)) {
        holidaysCount += 1;
        return;
      }

      if (isFuture) return;

      workingDays += 1;
      const status = String(attendanceMap.get(key) || "").toLowerCase();
      if (status === "present" || status === "p") presentDays += 1;
      else if (status === "absent" || status === "a") absentDays += 1;
      else if (["casual", "sick", "special", "on_duty", "leave", "cl", "sl", "spl", "od"].includes(status)) {
        leaveDays += 1;
        presentDays += 1; // Count leaves in present days total
      }
    });

    return { workingDays, presentDays, absentDays, holidaysCount, leaveDays };
  }, [monthDays, holidays, attendanceMap, batchStartDate, batchEndDate, student?.isTeacher]);

  if (!isOpen || !student) return null;

  const studentInitial = student.userName?.charAt(0)?.toUpperCase() || "S";

  const getStatusBadge = (statusStr) => {
    const config = attendanceTrackingService.getStatusConfig(statusStr);
    return {
      label: config.label,
      badge: config.code,
      cls: config.badgeClass,
    };
  };

  const selectedDateObj = parseISO(selectedDateKey);
  const selectedStatus = attendanceMap.get(selectedDateKey);
  const isSelectedHoliday = holidays.has(selectedDateKey);
  const isSelectedFuture = isAfter(selectedDateObj, new Date());
  const isSelectedBeforeBatch = batchStartDate && isBefore(selectedDateObj, new Date(batchStartDate));
  const isSelectedAfterBatch = batchEndDate && isAfter(selectedDateObj, new Date(batchEndDate));
  const canEditSelected = !isSelectedHoliday && !isSelectedFuture && !isSelectedBeforeBatch && !isSelectedAfterBatch;
  const isSelectedUpdating = updatingAttendance.get(`${student.userId}-${selectedDateKey}`);
  const selectedBadgeInfo = getStatusBadge(selectedStatus);

  const handleApplyStatus = (newStatus) => {
    if (!canEditSelected || isSelectedUpdating) return;
    onAttendanceStatusChange(student.userId, selectedDateKey, newStatus);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white dark:from-slate-950 dark:to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border-2 border-indigo-400/40">
              <AvatarImage src={student.profileImage} alt={student.userName} />
              <AvatarFallback className="bg-indigo-600 text-white font-bold text-lg">
                {studentInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {student.userName || "Student"}
                </h3>
                {student.isTeacher && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Instructor
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200/80 font-mono mt-0.5">
                Roll No: {student.studentId || "N/A"} • Monthly Attendance Calendar & Leave Quotas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Annual Leave Quotas Card Banner */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20 p-3.5 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Palmtree className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Annual Leave Quotas & Balances ({selectedMonth ? format(selectedMonth, "yyyy") : "Year"})
              </span>
              {(leaveQuota.isClExceeded || leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Exceeded Limit
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Casual Leave Quota */}
              <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-amber-200 dark:border-amber-900">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Casual Leave (CL)</p>
                <p className="text-sm sm:text-base font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
                  {leaveQuota.clRemaining} <span className="text-[10px] font-normal text-slate-500">/ 12 left</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Used: {leaveQuota.clUsed} days</p>
              </div>

              {/* Sick Leave Quota */}
              <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-sky-200 dark:border-sky-900">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Sick Leave (SL)</p>
                <p className="text-sm sm:text-base font-extrabold text-sky-700 dark:text-sky-300 mt-0.5">
                  {leaveQuota.slDaysRemaining}d <span className="text-[10px] font-normal text-slate-500">({leaveQuota.slSpellsRemaining}/2 spells left)</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Used: {leaveQuota.slDaysUsed}d ({leaveQuota.slSpellsUsed} spells)</p>
              </div>

              {/* Special Leave (SPL) */}
              <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-purple-200 dark:border-purple-900">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Special Leave (SPL)</p>
                <p className="text-sm sm:text-base font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
                  {leaveQuota.splUsed} <span className="text-[10px] font-normal text-slate-500">taken</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Not deducted from quota</p>
              </div>

              {/* On Duty (OD) */}
              <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-teal-200 dark:border-teal-900">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">On Duty (OD)</p>
                <p className="text-sm sm:text-base font-extrabold text-teal-700 dark:text-teal-300 mt-0.5">
                  {leaveQuota.odUsed} <span className="text-[10px] font-normal text-slate-500">taken</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Official duty leave</p>
              </div>
            </div>
          </div>

          {/* Month Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Working Days</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-100">{monthStats.workingDays}</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <p className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">Present Days</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{monthStats.presentDays}</p>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-900/60 dark:bg-rose-950/30">
              <p className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300 tracking-wider">Absent Days</p>
              <p className="text-lg font-black text-rose-700 dark:text-rose-300">{monthStats.absentDays}</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
              <p className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 tracking-wider">Holidays</p>
              <p className="text-lg font-black text-amber-700 dark:text-amber-300">{monthStats.holidaysCount}</p>
            </div>
          </div>

          {/* Previous Months Cumulative Stats Drawer */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <History className="h-4 w-4 text-indigo-500" />
                Cumulative Performance (Batch Inception to Previous Month)
              </span>
              <button
                onClick={() => onFetchStats && onFetchStats(student.userId)}
                disabled={loadingStats}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
              >
                {loadingStats ? (
                  <LoaderCircle className="h-3 w-3 animate-spin" />
                ) : (
                  "Refresh Stats"
                )}
              </button>
            </div>

            {studentStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 text-[10px] block">Prev Working</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{studentStats.workingDays || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-emerald-600 dark:text-emerald-400 text-[10px] block">Prev Present</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{studentStats.presentDays || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-rose-600 dark:text-rose-400 text-[10px] block">Prev Absent</span>
                  <span className="font-bold text-rose-700 dark:text-rose-300">{studentStats.absentDays || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-indigo-600 dark:text-indigo-400 text-[10px] block">Prev Attendance %</span>
                  <span className="font-black text-indigo-700 dark:text-indigo-300">{studentStats.percentage || 0}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Click 'Refresh Stats' to view cumulative attendance statistics up to previous month.
              </p>
            )}
          </div>

          {/* ── DIRECT ACTION CONTROL STRIP FOR SELECTED DATE ── */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/60 dark:bg-indigo-950/40 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Selected Date: {format(parseISO(selectedDateKey), "EEEE, MMM d, yyyy")}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${selectedBadgeInfo.cls}`}>
                  {selectedBadgeInfo.label} ({selectedBadgeInfo.badge})
                </span>
              </div>
              {isSelectedUpdating && (
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving...
                </span>
              )}
            </div>

            {/* Direct Action Buttons */}
            {canEditSelected ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">Switch Status:</span>
                
                {/* Present */}
                <button
                  type="button"
                  onClick={() => handleApplyStatus("present")}
                  disabled={isSelectedUpdating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    String(selectedStatus || "").toLowerCase() === "present" || String(selectedStatus || "").toLowerCase() === "p"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-105"
                      : "bg-white text-emerald-800 hover:bg-emerald-100 border-emerald-300 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-800"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" /> Present (P)
                </button>

                {/* Absent */}
                <button
                  type="button"
                  onClick={() => handleApplyStatus("absent")}
                  disabled={isSelectedUpdating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    String(selectedStatus || "").toLowerCase() === "absent" || String(selectedStatus || "").toLowerCase() === "a"
                      ? "bg-rose-600 text-white border-rose-600 shadow-md scale-105"
                      : "bg-white text-rose-800 hover:bg-rose-100 border-rose-300 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-800"
                  }`}
                >
                  <UserX className="h-3.5 w-3.5" /> Absent (A)
                </button>

                {/* Casual Leave */}
                <button
                  type="button"
                  onClick={() => handleApplyStatus("casual")}
                  disabled={isSelectedUpdating}
                  title={leaveQuota.isClExceeded ? "Warning: CL Quota Exceeded (12/yr)" : "Casual Leave"}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    String(selectedStatus || "").toLowerCase() === "casual" || String(selectedStatus || "").toLowerCase() === "cl"
                      ? "bg-amber-500 text-white border-amber-500 shadow-md scale-105"
                      : "bg-white text-amber-800 hover:bg-amber-100 border-amber-300 dark:bg-slate-900 dark:text-amber-300 dark:border-amber-800"
                  }`}
                >
                  <span>CL ({leaveQuota.clRemaining} left)</span>
                  {leaveQuota.isClExceeded && <AlertCircle className="w-3.5 h-3.5 text-rose-300" />}
                </button>

                {/* Sick Leave */}
                <button
                  type="button"
                  onClick={() => handleApplyStatus("sick")}
                  disabled={isSelectedUpdating}
                  title={leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded ? "Warning: SL Limit Exceeded" : "Sick Leave"}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    String(selectedStatus || "").toLowerCase() === "sick" || String(selectedStatus || "").toLowerCase() === "sl"
                      ? "bg-sky-600 text-white border-sky-600 shadow-md scale-105"
                      : "bg-white text-sky-800 hover:bg-sky-100 border-sky-300 dark:bg-slate-900 dark:text-sky-300 dark:border-sky-800"
                  }`}
                >
                  <span>SL ({leaveQuota.slDaysRemaining}d left)</span>
                  {(leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded) && <AlertCircle className="w-3.5 h-3.5 text-rose-300" />}
                </button>

                {/* Special Leave */}
                <button
                  type="button"
                  onClick={() => handleApplyStatus("special")}
                  disabled={isSelectedUpdating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    String(selectedStatus || "").toLowerCase() === "special" || String(selectedStatus || "").toLowerCase() === "spl"
                      ? "bg-purple-600 text-white border-purple-600 shadow-md scale-105"
                      : "bg-white text-purple-800 hover:bg-purple-100 border-purple-300 dark:bg-slate-900 dark:text-purple-300 dark:border-purple-800"
                  }`}
                >
                  <span>SPL (Special)</span>
                </button>

                {/* On Duty */}
                <button
                  type="button"
                  onClick={() => handleApplyStatus("on_duty")}
                  disabled={isSelectedUpdating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    String(selectedStatus || "").toLowerCase() === "on_duty" || String(selectedStatus || "").toLowerCase() === "od"
                      ? "bg-teal-600 text-white border-teal-600 shadow-md scale-105"
                      : "bg-white text-teal-800 hover:bg-teal-100 border-teal-300 dark:bg-slate-900 dark:text-teal-300 dark:border-teal-800"
                  }`}
                >
                  <span>OD (On Duty)</span>
                </button>
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                {isSelectedHoliday
                  ? `Exempted: ${holidays.get(selectedDateKey)?.holidayText || "Holiday"}`
                  : isSelectedFuture
                  ? "Future date — Attendance marking disabled."
                  : "Date outside batch operational period."}
              </p>
            )}
          </div>

          {/* Calendar Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-indigo-500" />
                {format(selectedMonth, "MMMM yyyy")} Calendar Grid (Select a day cell, then use buttons above)
              </h4>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 dark:text-slate-400 py-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
              {WEEK_DAYS.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: leadingBlankDays }).map((_, idx) => (
                <div
                  key={`blank-${idx}`}
                  className="h-[68px] rounded-md bg-slate-50/50 dark:bg-slate-900/30 border border-transparent"
                />
              ))}

              {monthDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const status = attendanceMap.get(dateKey);
                const isHoliday = holidays.has(dateKey);
                const isFuture = isAfter(day, new Date());

                const isBeforeBatch = batchStartDate && isBefore(day, new Date(batchStartDate));
                const isAfterBatch = batchEndDate && isAfter(day, new Date(batchEndDate));
                const canEdit = !isHoliday && !isFuture && !isBeforeBatch && !isAfterBatch;

                const isUpdating = updatingAttendance.get(`${student.userId}-${dateKey}`);
                const badgeInfo = getStatusBadge(status);
                const isSelected = selectedDateKey === dateKey;

                return (
                  <button
                    key={dateKey}
                    disabled={!canEdit || isUpdating}
                    onClick={() => {
                      setSelectedDateKey(dateKey);
                    }}
                    className={`h-[68px] rounded-md border text-left p-1.5 transition disabled:cursor-not-allowed disabled:opacity-60 flex flex-col justify-between relative ${
                      isSelected ? "ring-2 ring-indigo-500 border-indigo-500 shadow-md scale-[1.02] z-10" : ""
                    } ${
                      isHoliday && !student.isTeacher
                        ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                        : isBeforeBatch || isAfterBatch
                        ? "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700"
                        : badgeInfo.cls
                    }`}
                    title={
                      isHoliday && !student.isTeacher
                        ? holidays.get(dateKey)?.holidayText || "Holiday"
                        : isBeforeBatch
                        ? "Date is before batch start"
                        : isAfterBatch
                        ? "Date is after batch end"
                        : `${badgeInfo.label} - Click to select date`
                    }
                  >
                    <div className="flex justify-between items-start">
                      <p className={`text-xs font-semibold ${isAfterBatch ? "line-through opacity-50" : ""}`}>
                        {format(day, "d")}
                      </p>
                      {isUpdating && <LoaderCircle className="h-3 w-3 animate-spin text-indigo-500" />}
                    </div>

                    <p className="text-[10px] uppercase tracking-wide font-black truncate">
                      {isHoliday && !student.isTeacher
                        ? "Holiday"
                        : isBeforeBatch
                        ? "Pre-Batch"
                        : isAfterBatch
                        ? "Post-Batch"
                        : isFuture
                        ? "Future"
                        : badgeInfo.badge}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Select a date on the calendar grid, then click any status button (Present, Absent, CL, SL, SPL, OD) to apply changes.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs hover:opacity-90 transition ml-auto"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
};

export { StudentMonthlyAttendanceModal as StudentAttendanceEditModal };
export default StudentMonthlyAttendanceModal;
