import React, { useMemo, useState } from "react";
import Calendar from "react-calendar";
import { format, setMonth, setYear, getMonth, getYear } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
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
  lastUpdatedDate,
  openMarkModal,
  canOpenTodayMarkModal = false,
  rawAttendanceByDate,
}) => {
  const [selectedLabel, setSelectedLabel] = useState("");

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
    if (batchData?.start_date) candidates.push(new Date(batchData.start_date));
    if (profile?.enrolledAt) candidates.push(new Date(profile.enrolledAt));
    if (!candidates.length) {
      const fallback = new Date();
      fallback.setFullYear(fallback.getFullYear() - 3);
      return { minYear: fallback.getFullYear(), minMonth: 0 };
    }
    const earliest = new Date(Math.min(...candidates.map((d) => d.getTime())));
    return { minYear: earliest.getFullYear(), minMonth: earliest.getMonth() };
  }, [batchData?.start_date, profile?.enrolledAt]);

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
    if (batchData?.start_date) candidates.push(new Date(batchData.start_date));
    if (profile?.enrolledAt) candidates.push(new Date(profile.enrolledAt));
    if (!candidates.length) return undefined;
    return new Date(Math.min(...candidates.map((d) => d.getTime())));
  }, [batchData?.start_date, profile?.enrolledAt]);

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";
    let classes = "";
    const formattedDate = format(date, "yyyy-MM-dd");
    const todayDate = format(new Date(), "yyyy-MM-dd");
    
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
    // that are excluded from workingDays/attendanceByDate but may have real records.
    const record =
      rawAttendanceByDate?.get(formattedDate) ||
      attendanceByDate?.get(formattedDate) ||
      workingDays?.get(formattedDate);
    // Skip auto-generated absent entries — only colour real records
    const hasRealRecord = record && !record.autoGenerated;
    const status = hasRealRecord ? normalizeStatus(record.status) : "";

    if (status === "present") classes += "attendance-calendar-present";
    else if (status === "absent") classes += "attendance-calendar-absent";
    else if (status === "leave" || status === "onleave") classes += "attendance-calendar-leave";
    else if (holidays?.has(formattedDate)) classes += "attendance-calendar-holiday";

    return classes.trim();
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const dateKey = format(date, "yyyy-MM-dd");
    // Check rawAttendanceByDate first — covers Sundays / 2nd+4th Saturdays
    const record =
      rawAttendanceByDate?.get(dateKey) ||
      attendanceByDate?.get(dateKey) ||
      workingDays?.get(dateKey);
    // Skip auto-generated absent entries — only label real records
    const hasRealRecord = record && !record.autoGenerated;
    const status = hasRealRecord ? normalizeStatus(record.status) : "";
    const isHoliday = holidays?.has(dateKey);

    if (status === "present") {
      return (
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-wide text-emerald-700">
          Present
        </span>
      );
    }
    if (status === "absent") {
      return (
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-wide text-rose-700">
          Absent
        </span>
      );
    }
    if (status === "leave" || status === "onleave") {
      return (
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-wide text-violet-700">
          Leave
        </span>
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
                const newDate = setMonth(new Date(activeDate), Number(e.target.value));
                const clamped = newDate > new Date() ? new Date() : newDate;
                handleMonthChange(clamped);
                setSelectedDate(clamped);
              }}
              className="text-[13px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-0 rounded-xl pl-3 pr-7 py-1.5 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all appearance-none"
            >
              {availableMonths.map(({ label, index }) => (
                <option key={label} value={index}>{label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Year select with caret */}
          <div className="relative">
            <select
              id="calendar-year-select"
              value={activeYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="text-[13px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-0 rounded-xl pl-3 pr-7 py-1.5 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all appearance-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        {/* Next month button */}
        <button
          onClick={() => navigateMonth(1)}
          disabled={activeMonth === maxMonth && activeYear === maxYear}
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
          const status = normalizeStatus(
            attendanceByDate?.get(dateKey)?.status || workingDays?.get(dateKey)?.status
          );
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
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {selectedLabel || `Click a date in ${format(monthRange.start, "MMMM yyyy")} to see details.`}
      </p>
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
          height: 72px;
        }
        .attendance-calendar .attendance-calendar-present {
          background: #dcfce7 !important;
          color: #166534 !important;
        }
        .attendance-calendar .attendance-calendar-absent {
          background: #fee2e2 !important;
          color: #991b1b !important;
        }
        .attendance-calendar .attendance-calendar-leave {
          background: #ede9fe !important;
          color: #5b21b6 !important;
        }
        .attendance-calendar .attendance-calendar-holiday {
          background: #fef3c7 !important;
          color: #92400e !important;
        }
        .attendance-calendar .attendance-calendar-today {
          border: 2px solid #3b82f6 !important;
          background-color: #eff6ff;
        }
        .attendance-calendar .attendance-calendar-selected {
          border: 2px solid #a855f7 !important; /* purple-500 */
          position: relative;
          z-index: 10;
          animation: shapeShift 2s infinite ease-in-out;
        }
        @keyframes shapeShift {
          0% { border-radius: 30px; box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
          50% { border-radius: 0px; box-shadow: 0 0 0 6px rgba(168, 85, 247, 0); }
          100% { border-radius: 30px; box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
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
