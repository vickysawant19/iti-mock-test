import React from "react";
import { Edit3 } from "lucide-react";

const AttendanceTableHead = ({
  monthDates,
  selectedMonth,
  holidays,
  formatDate,
  onMarkAttendance,
  loadingAttendance,
  columnVisibility = { previous: true, daily: true, summary: true },
  compactView = false,
}) => {
  // Padding & Sizing helpers
  const cell = compactView ? "py-1 px-1 text-[11px]" : "py-2 px-2 text-xs";
  const stickyCell = compactView ? "py-1.5 px-2 text-xs" : "py-2.5 px-3 sm:px-4 text-xs sm:text-sm";

  // Standardized Column Widths & Sticky Positions
  const nameColWidth = compactView ? "w-36 min-w-36" : "w-48 sm:w-56 min-w-48 sm:min-w-56";
  const actionColWidth = "w-10 min-w-10 sm:w-11 sm:min-w-11";
  const actionStickyPos = compactView ? "left-36" : "left-48 sm:left-56";

  // Sticky top cascade offsets
  const groupRowH = compactView ? 26 : 34; // px
  const dateRowH = compactView ? 28 : 46; // px
  const markRowTop = groupRowH + dateRowH; // px

  const monthLabel = formatDate(
    selectedMonth,
    compactView ? "MMM yy" : "MMMM yyyy"
  );

  const dailyCount = columnVisibility.daily ? monthDates.length : 0;
  const prevCount = columnVisibility.previous ? 7 : 0;
  const summaryCount = columnVisibility.summary ? 7 : 0;

  return (
    <thead className="text-white select-none">
      {/* ════════════════════════════════════════════════════════════════════
          ROW 1 – Column Group Labels (Topmost Sticky Row)
      ════════════════════════════════════════════════════════════════════ */}
      <tr className="sticky top-0 z-40 bg-indigo-800 dark:bg-slate-950 shadow-xs">
        {/* Previous Month Group Label */}
        {columnVisibility.previous && (
          <th
            colSpan={prevCount}
            className={`${cell} border border-emerald-600 dark:border-emerald-900 bg-emerald-700 dark:bg-emerald-950 text-xs font-bold text-center tracking-wide`}
            scope="colgroup"
          >
            {compactView ? "Prev Month" : "Previous Month Stats"}
          </th>
        )}

        {/* Student Info Group Label (Sticky Left) */}
        <th
          colSpan={2}
          className={`${stickyCell} sticky left-0 z-50 border border-indigo-600 dark:border-slate-800 bg-indigo-800 dark:bg-slate-950 text-xs font-bold text-left tracking-wide shadow-[4px_0_10px_-2px_rgba(0,0,0,0.15)]`}
          scope="colgroup"
        >
          {compactView ? "Student Info" : "Student Register Roster"}
        </th>

        {/* Daily Attendance Group Label */}
        {columnVisibility.daily && (
          <th
            colSpan={dailyCount}
            className={`${cell} border border-sky-600 dark:border-sky-900 bg-sky-700 dark:bg-sky-950 text-xs font-bold text-center tracking-wide`}
            scope="colgroup"
          >
            {compactView
              ? `Daily · ${monthLabel}`
              : `Daily Attendance — ${monthLabel}`}
          </th>
        )}

        {/* Monthly Summary Group Label */}
        {columnVisibility.summary && (
          <th
            colSpan={summaryCount}
            className={`${cell} border border-blue-600 dark:border-blue-900 bg-blue-700 dark:bg-blue-950 text-xs font-bold text-center tracking-wide`}
            scope="colgroup"
          >
            {compactView ? "This Month" : "Monthly Summary"}
          </th>
        )}
      </tr>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 2 – Date Numbers & Column Headers
      ════════════════════════════════════════════════════════════════════ */}
      <tr className="sticky z-40 bg-indigo-700 dark:bg-slate-900 shadow-xs" style={{ top: groupRowH }}>
        {/* Previous Month Headers */}
        {columnVisibility.previous && (
          <>
            <th
              rowSpan={2}
              scope="col"
              title="Previous Month Working Days"
              className={`${cell} border border-emerald-600/60 dark:border-emerald-900/60 bg-emerald-600 dark:bg-emerald-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              Work
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="Previous Month Present Days"
              className={`${cell} border border-emerald-600/60 dark:border-emerald-900/60 bg-emerald-600 dark:bg-emerald-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              Pres
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="Previous Month Absent Days"
              className={`${cell} border border-emerald-600/60 dark:border-emerald-900/60 bg-emerald-600 dark:bg-emerald-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              Abs
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="Previous Month Casual Leaves (CL)"
              className={`${cell} border border-emerald-600/60 dark:border-emerald-900/60 bg-amber-600 dark:bg-amber-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              CL
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="Previous Month Sick Leaves (SL)"
              className={`${cell} border border-emerald-600/60 dark:border-emerald-900/60 bg-sky-600 dark:bg-sky-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              SL
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="Previous Month Special Leaves (SPL)"
              className={`${cell} border border-emerald-600/60 dark:border-emerald-900/60 bg-purple-600 dark:bg-purple-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              SPL
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="Previous Month Attendance Percentage"
              className={`${cell} border border-emerald-600/60 dark:border-emerald-900/60 bg-emerald-600 dark:bg-emerald-900/80 font-semibold text-[10px] w-11 min-w-11 text-center px-0.5`}
            >
              Prev %
            </th>
          </>
        )}

        {/* Student Name Header (Sticky Left 0) */}
        <th
          rowSpan={2}
          scope="col"
          className={`${stickyCell} ${nameColWidth} sticky left-0 z-50 border border-indigo-600 dark:border-slate-700 bg-indigo-700 dark:bg-slate-900 font-bold text-left text-xs sm:text-sm`}
        >
          Student Name
        </th>

        {/* Action Header (Sticky Left) */}
        <th
          rowSpan={2}
          scope="col"
          title="Edit Student Monthly Attendance"
          className={`${stickyCell} ${actionColWidth} ${actionStickyPos} sticky z-50 border border-indigo-600 dark:border-slate-700 bg-indigo-700 dark:bg-slate-900 font-bold text-center text-xs shadow-[4px_0_10px_-2px_rgba(0,0,0,0.15)] px-0.5`}
        >
          <Edit3 className="h-3.5 w-3.5 mx-auto text-indigo-200" />
        </th>

        {/* Daily Date Headers */}
        {columnVisibility.daily &&
          monthDates.map((date) => {
            const currentDate = new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date
            );
            const day = formatDate(currentDate, "EEE");
            const fullDate = formatDate(currentDate, "yyyy-MM-dd");
            const isHoliday = holidays.has(fullDate);
            const holidayInfo = holidays.get(fullDate);
            const isSunday = currentDate.getDay() === 0;
            const holidayLabel = holidayInfo?.holidayText || (isSunday ? "Sunday" : "Holiday");

            return (
              <th
                key={date}
                scope="col"
                title={`${day}, ${formatDate(currentDate, "dd MMM yyyy")}${isHoliday || isSunday ? ` · ${holidayLabel}` : ""}`}
                className={`${cell} border ${
                  isHoliday || isSunday
                    ? "bg-rose-600 border-rose-500 dark:bg-rose-950 dark:border-rose-800"
                    : "bg-sky-600 border-sky-500 dark:bg-sky-950 dark:border-sky-800"
                } w-9 min-w-9 text-center`}
              >
                <div className="text-center">
                  <div className="font-bold text-xs sm:text-sm leading-tight">{date}</div>
                  <div className="text-[10px] font-normal opacity-90 leading-none mt-0.5">{day}</div>
                </div>
              </th>
            );
          })}

        {/* Monthly Summary Headers */}
        {columnVisibility.summary && (
          <>
            <th
              rowSpan={2}
              scope="col"
              title="This Month Working Days"
              className={`${cell} border border-blue-600/60 dark:border-blue-900/60 bg-blue-600 dark:bg-blue-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              Work
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="This Month Present Days"
              className={`${cell} border border-blue-600/60 dark:border-blue-900/60 bg-blue-600 dark:bg-blue-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              Pres
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="This Month Absent Days"
              className={`${cell} border border-blue-600/60 dark:border-blue-900/60 bg-blue-600 dark:bg-blue-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              Abs
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="This Month Casual Leaves (CL)"
              className={`${cell} border border-blue-600/60 dark:border-blue-900/60 bg-amber-600 dark:bg-amber-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              CL
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="This Month Sick Leaves (SL)"
              className={`${cell} border border-blue-600/60 dark:border-blue-900/60 bg-sky-600 dark:bg-sky-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              SL
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="This Month Special Leaves (SPL)"
              className={`${cell} border border-blue-600/60 dark:border-blue-900/60 bg-purple-600 dark:bg-purple-900/80 font-semibold text-[10px] w-9 min-w-9 text-center px-0.5`}
            >
              SPL
            </th>
            <th
              rowSpan={2}
              scope="col"
              title="This Month Attendance Percentage"
              className={`${cell} border border-blue-600/60 dark:border-blue-900/60 bg-blue-600 dark:bg-blue-900/80 font-semibold text-[10px] w-11 min-w-11 text-center px-0.5`}
            >
              Pct %
            </th>
          </>
        )}
      </tr>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 3 – Mark Attendance Buttons (Daily Columns Only)
      ════════════════════════════════════════════════════════════════════ */}
      <tr className="sticky z-30 bg-sky-600 dark:bg-slate-900 shadow-xs" style={{ top: markRowTop }}>
        {columnVisibility.daily &&
          monthDates.map((date) => {
            const currentDate = new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date
            );
            const fullDate = formatDate(currentDate, "yyyy-MM-dd");
            const isHoliday = holidays.has(fullDate);
            const isSunday = currentDate.getDay() === 0;
            const todayStr = formatDate(new Date(), "yyyy-MM-dd");
            const isFuture = fullDate > todayStr;

            return (
              <th
                key={`mark-${date}`}
                scope="col"
                className={`${compactView ? "py-1 px-0.5" : "py-1.5 px-1"} border border-sky-500/80 dark:border-slate-700 text-center ${
                  isHoliday || isSunday
                    ? "bg-rose-600 border-rose-500 dark:bg-rose-950 dark:border-rose-800"
                    : "bg-sky-600 border-sky-500 dark:bg-sky-950 dark:border-sky-800"
                }`}
              >
                <button
                  disabled={loadingAttendance}
                  onClick={() => onMarkAttendance(fullDate)}
                  title={isFuture ? "Mark Holiday (Attendance blocked)" : "Mark Attendance / Holiday"}
                  className="w-full px-1 py-0.5 text-[10px] sm:text-xs font-bold bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 rounded hover:bg-sky-100 dark:hover:bg-slate-700 transition-all duration-200 border border-sky-300 dark:border-slate-600 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark
                </button>
              </th>
            );
          })}
      </tr>
    </thead>
  );
};

export default AttendanceTableHead;
