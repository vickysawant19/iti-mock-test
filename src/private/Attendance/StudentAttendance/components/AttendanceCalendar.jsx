import React, { useMemo, useState } from "react";
import Calendar from "react-calendar";
import { format } from "date-fns";
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
}) => {
  const [selectedLabel, setSelectedLabel] = useState("");

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
    const formattedDate = format(date, "yyyy-MM-dd");
    const isRecentlyUpdated = lastUpdatedDate === formattedDate;
    const status = normalizeStatus(
      attendanceByDate?.get(formattedDate)?.status || workingDays?.get(formattedDate)?.status
    );
    if (status === "present") return `attendance-calendar-present ${isRecentlyUpdated ? "attendance-calendar-updated" : ""}`;
    if (status === "absent") return `attendance-calendar-absent ${isRecentlyUpdated ? "attendance-calendar-updated" : ""}`;
    if (status === "leave" || status === "onleave") return `attendance-calendar-leave ${isRecentlyUpdated ? "attendance-calendar-updated" : ""}`;
    if (holidays?.has(formattedDate)) return `attendance-calendar-holiday ${isRecentlyUpdated ? "attendance-calendar-updated" : ""}`;
    return "";
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const dateKey = format(date, "yyyy-MM-dd");
    const record = attendanceByDate?.get(dateKey) || workingDays?.get(dateKey);
    const status = normalizeStatus(record?.status);
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
    <div className="bg-white dark:bg-slate-900 p-4 md:p-6">
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
        .attendance-calendar .react-calendar__navigation button {
          min-width: 42px;
          border-radius: 0;
          border: none !important;
          font-weight: 700;
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
