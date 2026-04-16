import React, { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { CalendarDays, User, X, BriefcaseBusiness } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
}) => {
  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);

  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  );

  const leadingBlankDays = getDay(monthStart);

  const monthStats = useMemo(() => {
    const today = new Date();

    let workingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let holidaysCount = 0;

    monthDays.forEach((date) => {
      const key = format(date, "yyyy-MM-dd");
      const isHoliday = holidays.has(key);

      if (isHoliday) {
        holidaysCount += 1;
        return;
      }

      if (isSameMonth(date, today) && isAfter(date, today)) {
        return;
      }

      workingDays += 1;
      const status = attendanceMap.get(key);
      if (status === "present") presentDays += 1;
      if (status === "absent") absentDays += 1;
    });

    return { workingDays, presentDays, absentDays, holidaysCount };
  }, [monthDays, holidays, attendanceMap]);

  if (!isOpen || !student) return null;

  const studentInitial = student.userName?.charAt(0)?.toUpperCase() || "S";

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
              <p className="text-sm text-slate-500 dark:text-slate-300">Student Attendance Management</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 p-4 sm:p-5">
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
                <div key={`blank-${index}`} className="h-[62px] rounded-md bg-slate-50 dark:bg-slate-800/40" />
              ))}

              {monthDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const isHoliday = holidays.has(dateKey);
                const isFuture = isAfter(day, new Date());
                const status = attendanceMap.get(dateKey);
                const isUpdating = updatingAttendance.get(`${student.userId}-${dateKey}`);

                const canEdit = !isHoliday && !isFuture;
                const nextStatus = status === "present" ? "absent" : "present";

                return (
                  <button
                    key={dateKey}
                    disabled={!canEdit || isUpdating}
                    onClick={() => onAttendanceStatusChange(student.userId, dateKey, nextStatus)}
                    className={`h-[62px] rounded-md border text-left p-2 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isHoliday
                        ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-700"
                        : status === "present"
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700"
                        : status === "absent"
                        ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700"
                        : "bg-white border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                    title={isHoliday ? holidays.get(dateKey)?.holidayText || "Holiday" : "Toggle attendance"}
                  >
                    <p className="text-xs font-semibold">{format(day, "d")}</p>
                    <p className="text-[10px] mt-1 uppercase tracking-wide">
                      {isHoliday
                        ? "Holiday"
                        : isFuture
                        ? "Future"
                        : status || "Unmarked"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/40 h-fit">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Month Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 p-2">
                <span className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" /> Working Days</span>
                <strong>{monthStats.workingDays}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 p-2">
                <span className="flex items-center gap-2"><User className="h-4 w-4 text-emerald-600" /> Present Days</span>
                <strong>{monthStats.presentDays}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 p-2">
                <span className="flex items-center gap-2"><User className="h-4 w-4 text-amber-600" /> Absent Days</span>
                <strong>{monthStats.absentDays}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 p-2">
                <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-rose-600" /> Holidays</span>
                <strong>{monthStats.holidaysCount}</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceEditModal;
