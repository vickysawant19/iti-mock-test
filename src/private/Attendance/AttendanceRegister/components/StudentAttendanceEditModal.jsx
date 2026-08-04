import React, { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import {
  CalendarDays,
  User,
  X,
  BriefcaseBusiness,
  LoaderCircle,
  History,
  Palmtree,
  ShieldAlert,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { attendanceAnalyticsService } from "@/services/attendanceAnalyticsService";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const StudentAttendanceEditModal = ({
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
  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);

  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  );

  const leadingBlankDays = getDay(monthStart);

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
    return attendanceAnalyticsService.calculateLeaveQuota(userRecords, targetYear);
  }, [student, existingAttendance, selectedMonth]);

  const monthStats = useMemo(() => {
    const today = new Date();

    let workingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let holidaysCount = 0;
    let leaveDays = 0;

    monthDays.forEach((date) => {
      const key = format(date, "yyyy-MM-dd");
      const isHoliday = holidays.has(key);

      if (isHoliday && !student?.isTeacher) {
        holidaysCount += 1;
        return;
      }

      if (isSameMonth(date, today) && isAfter(date, today)) {
        return;
      }

      if (batchStartDate && isBefore(date, batchStartDate)) {
        return;
      }

      if (batchEndDate && isAfter(date, batchEndDate)) {
        return;
      }

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
    const s = String(statusStr || "").toLowerCase();
    if (["present", "p"].includes(s)) {
      return { label: "Present", badge: "P", cls: "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300" };
    }
    if (["absent", "a"].includes(s)) {
      return { label: "Absent", badge: "A", cls: "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300" };
    }
    if (["casual", "cl"].includes(s)) {
      return { label: "Casual Leave", badge: "CL", cls: "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300" };
    }
    if (["sick", "sl"].includes(s)) {
      return { label: "Sick Leave", badge: "SL", cls: "bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-950/60 dark:border-sky-800 dark:text-sky-300" };
    }
    if (["special", "spl"].includes(s)) {
      return { label: "Special Leave", badge: "SPL", cls: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950/60 dark:border-purple-800 dark:text-purple-300" };
    }
    if (["on_duty", "od"].includes(s)) {
      return { label: "On Duty", badge: "OD", cls: "bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-300" };
    }
    if (["half_day", "halfday", "hd"].includes(s)) {
      return { label: "Half Day", badge: "HD", cls: "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-950/60 dark:border-yellow-800 dark:text-yellow-300" };
    }
    if (["late", "l"].includes(s)) {
      return { label: "Late", badge: "L", cls: "bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300" };
    }
    return { label: "Unmarked", badge: "-", cls: "bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400" };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-3 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-6xl max-h-[92vh] overflow-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-slate-200 dark:border-slate-600">
              <AvatarImage src={student.profileImage || ""} alt={student.userName} />
              <AvatarFallback>{studentInitial}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-300">Attendance Management</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{student.userName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{format(selectedMonth, "MMMM - yyyy")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" /> Close
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 p-4 sm:p-5">
          <div>
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: leadingBlankDays }).map((_, index) => (
                <div key={`blank-${index}`} className="h-[68px] rounded-md bg-slate-50 dark:bg-slate-800/40" />
              ))}

              {monthDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const isHoliday = holidays.has(dateKey);
                const isFuture = isAfter(day, new Date());
                const isBeforeBatch = batchStartDate ? isBefore(day, batchStartDate) : false;
                const isAfterBatch = batchEndDate ? isAfter(day, batchEndDate) : false;
                const status = attendanceMap.get(dateKey);
                const isUpdating = updatingAttendance.get(`${student.userId}-${dateKey}`);

                const canEdit = (student.isTeacher || !isHoliday) && !isFuture && !isBeforeBatch && !isAfterBatch;
                const badgeInfo = getStatusBadge(status);

                if (!status && canEdit) {
                  return (
                    <div
                      key={dateKey}
                      className="h-[68px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 flex flex-col justify-between transition shadow-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{format(day, "d")}</span>
                        {isUpdating && <LoaderCircle className="h-3 w-3 animate-spin text-indigo-500" />}
                      </div>
                      <div className="flex gap-0.5 mt-0.5">
                        <button
                          disabled={isUpdating}
                          onClick={() => onAttendanceStatusChange(student.userId, dateKey, "present")}
                          title="Present"
                          className="flex-1 py-0.5 rounded bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[10px] font-black border border-emerald-200 transition-all dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 disabled:opacity-50"
                        >
                          P
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => onAttendanceStatusChange(student.userId, dateKey, "absent")}
                          title="Absent"
                          className="flex-1 py-0.5 rounded bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 text-[10px] font-black border border-rose-200 transition-all dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 disabled:opacity-50"
                        >
                          A
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => onAttendanceStatusChange(student.userId, dateKey, "casual")}
                          title="Casual Leave (CL)"
                          className="flex-1 py-0.5 rounded bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 text-[9px] font-black border border-amber-200 transition-all dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 disabled:opacity-50"
                        >
                          CL
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => onAttendanceStatusChange(student.userId, dateKey, "sick")}
                          title="Sick Leave (SL)"
                          className="flex-1 py-0.5 rounded bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 text-[9px] font-black border border-sky-200 transition-all dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-400 disabled:opacity-50"
                        >
                          SL
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={dateKey}
                    disabled={!canEdit || isUpdating}
                    onClick={() => {
                      const s = String(status || "").toLowerCase();
                      const cycle = ["present", "absent", "casual", "sick", "special", "on_duty"];
                      let idx = cycle.indexOf(s);
                      if (idx === -1) {
                        if (s === "p") idx = 0;
                        else if (s === "a") idx = 1;
                        else if (s === "cl") idx = 2;
                        else if (s === "sl") idx = 3;
                        else if (s === "spl") idx = 4;
                        else if (s === "od") idx = 5;
                        else idx = 0;
                      }
                      const next = cycle[(idx + 1) % cycle.length];
                      onAttendanceStatusChange(student.userId, dateKey, next);
                    }}
                    className={`h-[68px] rounded-md border text-left p-1.5 transition disabled:cursor-not-allowed disabled:opacity-60 flex flex-col justify-between ${
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
                        : `${badgeInfo.label} - Click to cycle status`
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

          <aside className="space-y-4">
            {/* Annual Leave Quota & Remaining Balance Card */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 p-4 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-2.5 flex items-center gap-1.5">
                <Palmtree className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Annual Leave Quotas
              </h3>

              <div className="space-y-2 text-xs">
                {/* Casual Leaves */}
                <div className={`p-2 rounded-lg border bg-white dark:bg-slate-900 ${
                  leaveQuota.isClExceeded ? "border-rose-300 dark:border-rose-800" : "border-amber-200 dark:border-amber-900"
                }`}>
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>Casual Leave (CL)</span>
                    <span className={leaveQuota.isClExceeded ? "text-rose-600" : "text-amber-700 dark:text-amber-400"}>
                      {leaveQuota.clRemaining} / 12 left
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Used: {leaveQuota.clUsed} days
                  </p>
                </div>

                {/* Sick Leaves */}
                <div className={`p-2 rounded-lg border bg-white dark:bg-slate-900 ${
                  leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded ? "border-rose-300 dark:border-rose-800" : "border-sky-200 dark:border-sky-900"
                }`}>
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>Sick Leave (SL)</span>
                    <span className={leaveQuota.isSlDaysExceeded ? "text-rose-600" : "text-sky-700 dark:text-sky-400"}>
                      {leaveQuota.slDaysRemaining}d left
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Used: {leaveQuota.slDaysUsed} days | Spells: {leaveQuota.slSpellsUsed}/2 (Max 2 spells)
                  </p>
                </div>

                {/* Special & On Duty */}
                <div className="p-2 rounded-lg border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-900">
                  <div className="flex justify-between font-bold text-purple-900 dark:text-purple-300">
                    <span>Special & On Duty</span>
                    <span className="text-purple-600 dark:text-purple-400">Excluded</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    SPL Taken: {leaveQuota.splUsed} | OD Taken: {leaveQuota.odUsed}
                  </p>
                </div>
              </div>
            </div>

            {/* Month Stats */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/40">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Month Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 p-2">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><BriefcaseBusiness className="h-4 w-4 text-indigo-500" /> Working Days</span>
                  <strong className="text-slate-900 dark:text-slate-100">{monthStats.workingDays}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 p-2">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Present Days</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">{monthStats.presentDays}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 p-2">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><User className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Absent Days</span>
                  <strong className="text-rose-700 dark:text-rose-400">{monthStats.absentDays}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 p-2">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><Palmtree className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Leave Days</span>
                  <strong className="text-amber-700 dark:text-amber-400">{monthStats.leaveDays}</strong>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-indigo-500" /> Cumulative Overview
                </h3>
                
                {!studentStats ? (
                  <button
                    onClick={() => onFetchStats(student.userId)}
                    disabled={loadingStats}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-all dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800 disabled:opacity-50"
                  >
                    {loadingStats ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      "Show Cumulative Percentage"
                    )}
                  </button>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-indigo-600 p-2 text-white shadow-xs">
                      <span className="font-medium">Overall %</span>
                      <strong className="text-sm">{studentStats.percentage}%</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceEditModal;
