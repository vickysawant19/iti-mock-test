import React, { useMemo, useState } from "react";
import Calendar from "react-calendar";
import { format, setMonth, setYear, getMonth, getYear } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, Clock, Calendar as CalendarIcon } from "lucide-react";
import { formatAttendanceTime } from "@/services/attendance/attendanceTrackingService";
import "react-calendar/dist/Calendar.css";

const AttendanceCalendar = ({
  selectedDate,
  setSelectedDate,
  handleMonthChange,
  workingDays,
  attendanceByDate,
  holidays,
  profile,
  batchData,
  enrollmentDate,
  lastUpdatedDate,
  openMarkModal,
  canOpenTodayMarkModal = false,
  rawAttendanceByDate,
}) => {
  const [selectedLabel, setSelectedLabel] = useState("");

  const enrollDateStr = useMemo(() => {
    if (!enrollmentDate) return null;
    if (typeof enrollmentDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(enrollmentDate)) {
      return enrollmentDate;
    }
    try {
      return format(new Date(enrollmentDate), "yyyy-MM-dd");
    } catch {
      return null;
    }
  }, [enrollmentDate]);

  // Derive the active view date (what month is shown in the picker)
  const activeDate = selectedDate instanceof Date && !isNaN(selectedDate) ? selectedDate : new Date();
  const activeMonth = getMonth(activeDate); // 0-indexed
  const activeYear = getYear(activeDate);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Derive min year AND min month from batch/enrollment start date
  const { minYear, minMonth: batchMinMonth } = useMemo(() => {
    const candidates = [];
    if (enrollDateStr) candidates.push(new Date(enrollDateStr));
    else {
      if (batchData?.start_date) candidates.push(new Date(batchData.start_date));
      if (profile?.enrolledAt) candidates.push(new Date(profile.enrolledAt));
    }
    if (!candidates.length) {
      const fallback = new Date();
      fallback.setFullYear(fallback.getFullYear() - 3);
      return { minYear: fallback.getFullYear(), minMonth: 0 };
    }
    const earliest = new Date(Math.min(...candidates.map((d) => d.getTime())));
    return { minYear: earliest.getFullYear(), minMonth: earliest.getMonth() };
  }, [enrollDateStr, batchData?.start_date, profile?.enrolledAt]);


  const maxYear = new Date().getFullYear();
  const maxMonth = getMonth(new Date()); // current month (0-indexed)

  // Filtered month list based on selected year
  const availableMonths = useMemo(() => {
    return MONTHS.map((label, index) => ({ label, index })).filter(({ index }) => {
      if (activeYear === minYear && index < batchMinMonth) return false;
      if (activeYear === maxYear && index > maxMonth) return false;
      return true;
    });
  }, [activeYear, minYear, batchMinMonth, maxYear, maxMonth]);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);
    return years;
  }, [minYear, maxYear]);

  const navigateMonth = (offset) => {
    let newDate = new Date(activeDate);
    newDate.setMonth(newDate.getMonth() + offset);
    // Clamp to today
    if (newDate > new Date()) newDate = new Date();
    // Clamp to batch start
    const batchMin = new Date(minYear, batchMinMonth, 1);
    if (newDate < batchMin) newDate = batchMin;
    handleMonthChange(newDate);
    setSelectedDate(newDate);
  };

  // When year changes, clamp month to valid range for that year
  const handleYearChange = (newYear) => {
    let month = activeMonth;
    if (newYear === minYear && month < batchMinMonth) month = batchMinMonth;
    if (newYear === maxYear && month > maxMonth) month = maxMonth;
    const newDate = setYear(setMonth(new Date(activeDate), month), newYear);
    const clamped = newDate > new Date() ? new Date() : newDate;
    handleMonthChange(clamped);
    setSelectedDate(clamped);
  };

  // Also disable the prev arrow when already at the minimum allowed month
  const isAtMin = activeYear === minYear && activeMonth <= batchMinMonth;

  const normalizeStatus = (rawStatus) => {
    const value = String(rawStatus || "").trim().toLowerCase();
    if (["present", "p"].includes(value)) return "present";
    if (["absent", "a"].includes(value)) return "absent";
    if (["leave", "onleave", "on_leave", "l"].includes(value)) return "leave";
    if (["holiday", "h"].includes(value)) return "holiday";
    if (["late"].includes(value)) return "late";
    return value;
  };

  const monthRange = useMemo(() => {
    const date = selectedDate || new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }, [selectedDate]);

  const minAllowedDate = useMemo(() => {
    const candidates = [];
    if (enrollDateStr) candidates.push(new Date(enrollDateStr));
    else {
      if (batchData?.start_date) candidates.push(new Date(batchData.start_date));
      if (profile?.enrolledAt) candidates.push(new Date(profile.enrolledAt));
    }
    if (!candidates.length) return undefined;
    return new Date(Math.min(...candidates.map((d) => d.getTime())));
  }, [enrollDateStr, batchData?.start_date, profile?.enrolledAt]);

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";
    let classes = "";
    const formattedDate = format(date, "yyyy-MM-dd");
    const todayDate = format(new Date(), "yyyy-MM-dd");
    
    if (enrollDateStr && formattedDate < enrollDateStr) {
      classes += "attendance-calendar-disabled opacity-40 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed ";
    }

    if (formattedDate === todayDate) {
      classes += "attendance-calendar-today ";
    }

    if (selectedDate && formattedDate === format(selectedDate, "yyyy-MM-dd")) {
      classes += "attendance-calendar-selected ";
    }

    const isRecentlyUpdated = lastUpdatedDate === formattedDate;
    if (isRecentlyUpdated) {
      classes += "attendance-calendar-updated ";
    }

    // Check rawAttendanceByDate first — covers Sundays / 2nd+4th Saturdays
    // Check rawAttendanceByDate first — covers Sundays / 2nd+4th Saturdays
    // that are excluded from workingDays/attendanceByDate but may have real records.
    const record =
      rawAttendanceByDate?.get(formattedDate) ||
      attendanceByDate?.get(formattedDate) ||
      workingDays?.get(formattedDate);
    // Skip auto-generated absent entries — only colour real records
    const hasRealRecord = record && !record.autoGenerated;
    const status = hasRealRecord ? normalizeStatus(record.attendanceStatus || record.status) : "";

    if (record?.verificationStatus === "PENDING") {
      classes += "attendance-calendar-pending bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 animate-pulse ";
    } else if (record?.verificationStatus === "REJECTED") {
      classes += "attendance-calendar-rejected bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 ";
    } else if (status === "present") classes += "attendance-calendar-present";
    else if (status === "absent") classes += "attendance-calendar-absent";
    else if (status === "leave" || status === "onleave") classes += "attendance-calendar-leave";
    else if (holidays?.has(formattedDate)) classes += "attendance-calendar-holiday";

    return classes.trim();
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const dateKey = format(date, "yyyy-MM-dd");

    if (enrollDateStr && dateKey < enrollDateStr) {
      return (
        <span className="mt-1 block text-[9px] font-extrabold tracking-wide text-slate-400 dark:text-slate-500">
          X Pre-Enroll
        </span>
      );
    }

    // Check rawAttendanceByDate first — covers Sundays / 2nd+4th Saturdays
    const record =
      rawAttendanceByDate?.get(dateKey) ||
      attendanceByDate?.get(dateKey) ||
      workingDays?.get(dateKey);
    // Skip auto-generated absent entries — only label real records
    const hasRealRecord = record && !record.autoGenerated;
    const status = hasRealRecord ? normalizeStatus(record.attendanceStatus || record.status) : "";
    const isHoliday = holidays?.has(dateKey);
    const markedAtTime = record && hasRealRecord ? formatAttendanceTime(record, "hh:mm a") : null;
    const hasValidTime = markedAtTime && markedAtTime !== "—";

    if (record?.verificationStatus === "PENDING") {
      const lt = String(record?.leaveType || "").toUpperCase();
      const s = String(record?.status || "").toLowerCase();
      let code = "P";
      if (lt === "CASUAL" || ["cl", "casual"].includes(s)) code = "CL";
      else if (lt === "SICK" || ["sl", "sick"].includes(s)) code = "SL";
      else if (lt === "SPECIAL" || ["spl", "special"].includes(s)) code = "SPL";

      return (
        <div className="mt-0.5 leading-tight animate-pulse text-center">
          <span className="block text-[9px] font-bold tracking-wide text-amber-700 dark:text-amber-300">
            ⏳ {code} Pending
          </span>
          {hasValidTime && (
            <span className="block text-[8px] font-mono font-semibold text-amber-800/90 dark:text-amber-300/90">
              {markedAtTime}
            </span>
          )}
        </div>
      );
    }
    if (record?.verificationStatus === "REJECTED") {
      return (
        <div className="mt-0.5 leading-tight text-center">
          <span className="block text-[9px] font-bold tracking-wide text-rose-700 dark:text-rose-300">
            ✕ Rejected
          </span>
          {hasValidTime && (
            <span className="block text-[8px] font-mono font-medium text-rose-800/80 dark:text-rose-300/80">
              {markedAtTime}
            </span>
          )}
        </div>
      );
    }

    if (status === "present") {
      return (
        <div className="mt-0.5 leading-tight text-center">
          <span className="block text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Present
          </span>
          {hasValidTime && (
            <span className="block text-[8px] font-mono font-semibold text-emerald-800/90 dark:text-emerald-300/90">
              {markedAtTime}
            </span>
          )}
        </div>
      );
    }
    if (status === "absent") {
      return (
        <div className="mt-0.5 leading-tight text-center">
          <span className="block text-[9px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-400">
            Absent
          </span>
          {hasValidTime && (
            <span className="block text-[8px] font-mono font-semibold text-rose-800/90 dark:text-rose-300/90">
              {markedAtTime}
            </span>
          )}
        </div>
      );
    }
    if (status === "leave" || status === "onleave") {
      const lt = String(record?.leaveType || "").toUpperCase();
      const s = String(record?.status || "").toLowerCase();
      let label = "Leave";
      if (lt === "CASUAL" || ["cl", "casual"].includes(s)) label = "CL";
      else if (lt === "SICK" || ["sl", "sick"].includes(s)) label = "SL";
      else if (lt === "SPECIAL" || ["spl", "special"].includes(s)) label = "SPL";

      return (
        <div className="mt-0.5 leading-tight text-center">
          <span className="block text-[9px] font-black uppercase tracking-wide text-violet-700 dark:text-violet-400">
            {label}
          </span>
          {hasValidTime && (
            <span className="block text-[8px] font-mono font-semibold text-violet-800/90 dark:text-violet-300/90">
              {markedAtTime}
            </span>
          )}
        </div>
      );
    }
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const isPastDate = dateKey < todayKey;
    const canOpenForDate =
      dateKey === todayKey
        ? canOpenTodayMarkModal
        : Boolean(
            batchData?.canMarkAttendance &&
              batchData?.canMarkPrevious &&
              !isHoliday &&
              isPastDate
          );
    if (canOpenForDate) {
      return (
        <span className="mt-1 block text-[9px] font-bold tracking-wide text-blue-700">
          Double-click to mark
        </span>
      );
    }
    if (isHoliday) {
      const holidayText = holidays?.get(dateKey) || "Holiday";
      return (
        <span
          className="mt-1 block truncate text-[9px] font-bold tracking-wide text-amber-700"
          title={holidayText}
        >
          {holidayText}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-1">
      {/* Month / Year Picker */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        {/* Prev month button */}
        <button
          onClick={() => navigateMonth(-1)}
          disabled={isAtMin}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-all active:scale-90 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous month"
          type="button"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Month + Year selects */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          {/* Month select with caret */}
          <div className="relative">
            <select
              id="calendar-month-select"
              value={activeMonth}
              onChange={(e) => {
                const month = Number(e.target.value);
                const newDate = setMonth(new Date(activeDate), month);
                handleMonthChange(newDate);
                setSelectedDate(newDate);
              }}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs px-3 py-1.5 pr-6 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {availableMonths.map(({ label, index }) => (
                <option key={index} value={index}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Year select with caret */}
          <div className="relative">
            <select
              id="calendar-year-select"
              value={activeYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs px-3 py-1.5 pr-6 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Next month button */}
        <button
          onClick={() => navigateMonth(1)}
          disabled={activeYear === maxYear && activeMonth >= maxMonth}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-all active:scale-90 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next month"
          type="button"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <Calendar
        value={selectedDate}
        onChange={(date) => {
          setSelectedDate(date);
          const dateKey = format(date, "yyyy-MM-dd");
          const record =
            rawAttendanceByDate?.get(dateKey) ||
            attendanceByDate?.get(dateKey) ||
            workingDays?.get(dateKey);
          const hasRealRecord = record && !record.autoGenerated;
          const status = hasRealRecord ? normalizeStatus(record.attendanceStatus || record.status) : "";
          if (status) {
            setSelectedLabel(`Attendance: ${status}`);
            return;
          }
          if (holidays?.has(dateKey)) {
            setSelectedLabel(`Holiday: ${holidays.get(dateKey) || "Holiday"}`);
            return;
          }
          setSelectedLabel("No record for this date");
        }}
        onClickDay={(date, event) => {
          const dateKey = format(date, "yyyy-MM-dd");
          if (enrollDateStr && dateKey < enrollDateStr) {
            return;
          }
          const todayKey = format(new Date(), "yyyy-MM-dd");
          const isHoliday = holidays?.has(dateKey);
          const isPastDate = dateKey < todayKey;
          const isDoubleClick = event?.detail >= 2;
          const canOpenForDate =
            dateKey === todayKey
              ? canOpenTodayMarkModal
              : Boolean(
                  batchData?.canMarkAttendance &&
                    batchData?.canMarkPrevious &&
                    !isHoliday &&
                    isPastDate
                );

          if (
            isDoubleClick &&
            canOpenForDate &&
            typeof openMarkModal === "function"
          ) {
            openMarkModal(dateKey);
          }
        }}
        tileClassName={tileClassName}
        tileContent={tileContent}
        minDate={minAllowedDate}
        maxDate={new Date()}
        onActiveStartDateChange={({ activeStartDate }) => {
          if (activeStartDate) handleMonthChange(activeStartDate);
        }}
        className="w-full attendance-calendar"
        view="month"
        minDetail="month"
        maxDetail="month"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Present</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Absent</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" />Leave</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Holiday</span>
      </div>
      {/* Selected Date Details Card */}
      {(() => {
        const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
        const selectedRecord = selectedDateKey
          ? rawAttendanceByDate?.get(selectedDateKey) ||
            attendanceByDate?.get(selectedDateKey) ||
            workingDays?.get(selectedDateKey)
          : null;
        const hasSelectedRealRecord = selectedRecord && !selectedRecord.autoGenerated;
        const selectedMarkedTime = hasSelectedRealRecord
          ? formatAttendanceTime(selectedRecord, "hh:mm a")
          : null;
        const selectedStatus = hasSelectedRealRecord
          ? normalizeStatus(selectedRecord.attendanceStatus || selectedRecord.status)
          : null;
        const isSelectedHoliday = selectedDateKey && holidays?.has(selectedDateKey);
        const isSelectedPreEnroll = enrollDateStr && selectedDateKey && selectedDateKey < enrollDateStr;

        return (
          <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No Date Selected"}
              </span>

              {isSelectedPreEnroll ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  Not Enrolled Yet
                </span>
              ) : isSelectedHoliday ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                  Holiday: {holidays.get(selectedDateKey) || "Campus Holiday"}
                </span>
              ) : selectedRecord?.verificationStatus === "PENDING" ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse">
                  ⏳ Verification Pending ({selectedRecord.leaveType || selectedRecord.status || "P"})
                </span>
              ) : selectedRecord?.verificationStatus === "REJECTED" ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                  ✕ Request Rejected: {selectedRecord.rejectionReason || "Instructor Rejected"}
                </span>
              ) : selectedStatus === "present" ? (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  ✓ Marked Present
                </span>
              ) : selectedStatus === "absent" ? (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                  ✕ Absent
                </span>
              ) : selectedStatus === "leave" || selectedStatus === "onleave" ? (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-300">
                  Leave ({selectedRecord?.leaveType || "LEAVE"})
                </span>
              ) : (
                <span className="text-slate-400 text-xs italic">
                  No attendance marked
                </span>
              )}
            </div>

            {/* Right: Marked Time & Remarks */}
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] flex-wrap">
              {selectedMarkedTime && selectedMarkedTime !== "—" && (
                <span className="flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  Time Marked: {selectedMarkedTime}
                </span>
              )}
              {selectedRecord?.remarks && (
                <span className="italic truncate max-w-[200px]" title={selectedRecord.remarks}>
                  "{selectedRecord.remarks}"
                </span>
              )}
            </div>
          </div>
        );
      })()}

      <style>{`
        .attendance-calendar {
          width: 100%;
          border: none;
          background: transparent;
        }
        .attendance-calendar .react-calendar__navigation {
          display: none !important;
        }
        .attendance-calendar .react-calendar__month-view__days__day--neighboringMonth {
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .attendance-calendar .react-calendar__tile {
          border-radius: 0;
          border: 1px solid #ffffff !important;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
          height: 74px;
          padding: 4px 2px !important;
          background: #ffffff;
          transition: all 0.2s ease;
        }
        .dark .attendance-calendar .react-calendar__tile {
          background: #0f172a;
          border: 1px solid #1e293b !important;
          box-shadow: none;
        }
        .attendance-calendar .attendance-calendar-present {
          background: #dcfce7 !important;
          color: #166534 !important;
        }
        .dark .attendance-calendar .attendance-calendar-present {
          background: rgba(16, 185, 129, 0.15) !important;
          color: #34d399 !important;
        }
        .attendance-calendar .attendance-calendar-absent {
          background: #fee2e2 !important;
          color: #991b1b !important;
        }
        .dark .attendance-calendar .attendance-calendar-absent {
          background: rgba(244, 63, 94, 0.15) !important;
          color: #fb7185 !important;
        }
        .attendance-calendar .attendance-calendar-leave {
          background: #ede9fe !important;
          color: #5b21b6 !important;
        }
        .dark .attendance-calendar .attendance-calendar-leave {
          background: rgba(139, 92, 246, 0.15) !important;
          color: #a78bfa !important;
        }
        .attendance-calendar .attendance-calendar-holiday {
          background: #fef3c7 !important;
          color: #92400e !important;
        }
        .dark .attendance-calendar .attendance-calendar-holiday {
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .attendance-calendar .attendance-calendar-today {
          border: 2px solid #3b82f6 !important;
          background-color: #eff6ff !important;
        }
        .dark .attendance-calendar .attendance-calendar-today {
          border: 2px solid #60a5fa !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .attendance-calendar .attendance-calendar-selected {
          border: 2px solid #a855f7 !important;
          position: relative;
          z-index: 10;
          animation: shapeShift 2s infinite ease-in-out;
        }
        .dark .attendance-calendar .attendance-calendar-selected {
          border: 2px solid #c084fc !important;
        }
        @keyframes shapeShift {
          0% { border-radius: 20px; box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
          50% { border-radius: 4px; box-shadow: 0 0 0 6px rgba(168, 85, 247, 0); }
          100% { border-radius: 20px; box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
        }
        .attendance-calendar .attendance-calendar-updated {
          animation: attendanceTilePulse 1.6s ease-out;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.7) inset, 0 0 0 6px rgba(59, 130, 246, 0.18);
        }
        @keyframes attendanceTilePulse {
          0% { transform: scale(0.96); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AttendanceCalendar;
