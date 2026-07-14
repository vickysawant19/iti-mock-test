import React from "react";

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
  // ── Padding helpers ────────────────────────────────────────────────────────
  const cell = compactView ? "py-1 px-1" : "py-2 px-2";
  const stickyCell = compactView ? "py-1 px-2" : "py-3 px-3 sm:px-4";

  // ── Sticky top cascade (pixel-exact to avoid Tailwind purge issues) ───────
  // Row 1 – group labels:  starts at top:0
  // Row 2 – date numbers:  starts below row 1
  // Row 3 – mark buttons:  starts below row 1 + row 2
  // Heights measured from actual rendered output:
  // group-label row: py-1(4px*2)+text-xs(~16px) ≈ 24px compact / py-2(8px*2)+text-xs ≈ 32px normal
  // date row: py-1+date-num ≈ 26px compact / py-2+date-num+day ≈ 44px normal
  const groupRowH = compactView ? 24 : 32; // px – group label row height
  const dateRowH  = compactView ? 26 : 44; // px – date number row height
  const markRowTop = groupRowH + dateRowH;  // px – mark button row top

  // ── Month label for group header ──────────────────────────────────────────
  const monthLabel = formatDate(
    selectedMonth,
    compactView ? "MMM yy" : "MMMM yyyy",
  );

  // Count visible daily columns for colspan
  const dailyCount = columnVisibility.daily ? monthDates.length : 0;
  const prevCount = columnVisibility.previous ? 4 : 0;
  const summaryCount = columnVisibility.summary ? 4 : 0;

  return (
    <thead className="text-white">
      {/* ════════════════════════════════════════════════════════════════════
          ROW 1 – Column Group Labels (topmost sticky row)
      ════════════════════════════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════════════════════════════
          ROW 1 – Column Group Labels (topmost sticky row)
      ════════════════════════════════════════════════════════════════════ */}
      <tr className="sticky top-0 z-40 bg-indigo-700 dark:bg-slate-900">
        {/* Previous month group label */}
        {columnVisibility.previous && (
          <th
            colSpan={prevCount}
            className={`${cell} border border-emerald-500 dark:border-emerald-800 bg-emerald-700 dark:bg-emerald-950/80 text-xs font-bold text-center tracking-wide`}
            scope="colgroup"
          >
            {compactView ? "Prev" : "Previous Month Stats"}
          </th>
        )}

        {/* Always-present sticky info columns (Student Name + Action) */}
        <th
          colSpan={2}
          className={`${stickyCell} sticky left-0 z-50 border border-indigo-500 dark:border-slate-800 bg-indigo-700 dark:bg-slate-900 text-xs font-bold text-left tracking-wide`}
          scope="colgroup"
        >
          {compactView ? "Students" : "Student Info"}
        </th>

        {/* Daily attendance group label */}
        {columnVisibility.daily && (
          <th
            colSpan={dailyCount}
            className={`${cell} border border-sky-500 dark:border-sky-850 bg-sky-700 dark:bg-sky-950/80 text-xs font-bold text-center tracking-wide`}
            scope="colgroup"
          >
            {compactView
              ? `Daily · ${monthLabel}`
              : `Daily Attendance — ${monthLabel}`}
          </th>
        )}

        {/* Monthly summary group label */}
        {columnVisibility.summary && (
          <th
            colSpan={summaryCount}
            className={`${cell} border border-blue-500 dark:border-blue-800 bg-blue-700 dark:bg-blue-950/80 text-xs font-bold text-center tracking-wide`}
            scope="colgroup"
          >
            {compactView ? "This Month" : "Monthly Summary"}
          </th>
        )}
      </tr>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 2 – Date Numbers / Column Headers
      ════════════════════════════════════════════════════════════════════ */}
      <tr className="sticky z-40 bg-indigo-600 dark:bg-slate-800" style={{ top: groupRowH }}>
        {/* GROUP: Previous month stats */}
        {columnVisibility.previous && (
          <>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-700 bg-emerald-600 dark:bg-emerald-900/60 font-semibold text-xs w-16 min-w-16`}
            >
              <div className="text-center">Prev Work</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-700 bg-emerald-600 dark:bg-emerald-900/60 font-semibold text-xs w-16 min-w-16`}
            >
              <div className="text-center">Prev Pres</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-700 bg-emerald-600 dark:bg-emerald-900/60 font-semibold text-xs w-16 min-w-16`}
            >
              <div className="text-center">Prev Abs</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-700 bg-emerald-600 dark:bg-emerald-900/60 font-semibold text-xs w-16 min-w-16`}
            >
              <div className="text-center">Total %</div>
            </th>
          </>
        )}

        {/* GROUP: Student Info — always sticky */}
        <th
          rowSpan={2}
          scope="col"
          className={`${stickyCell} z-50 border border-slate-300 dark:border-slate-700 sticky left-0 bg-indigo-600 dark:bg-slate-900 font-semibold text-left text-sm w-28 sm:w-48 min-w-28 sm:min-w-48`}
        >
          Student Name
        </th>
        <th
          rowSpan={2}
          scope="col"
          className={`${stickyCell} z-50 border border-slate-300 dark:border-slate-700 sticky left-28 sm:left-48 bg-indigo-600 dark:bg-slate-900 font-semibold text-left text-sm w-16 min-w-16`}
        >
          Action
        </th>

        {/* GROUP: Daily columns */}
        {columnVisibility.daily &&
          monthDates.map((date) => {
            const currentDate = new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date,
            );
            const day = formatDate(currentDate, "EEE");
            const fullDate = formatDate(currentDate, "yyyy-MM-dd");
            const isHoliday = holidays.has(fullDate);

            return (
              <th
                key={date}
                scope="col"
                title={`${day}, ${formatDate(currentDate, "dd MMM yyyy")}${isHoliday ? " · Holiday" : ""}`}
                className={`${cell} border ${
                  isHoliday || currentDate.getDay() === 0
                    ? "bg-rose-500 border-rose-400 dark:bg-rose-900/60 dark:border-rose-800"
                    : "bg-sky-500 border-sky-400 dark:bg-sky-900/60 dark:border-sky-800"
                } w-9 min-w-9`}
              >
                <div className="text-center">
                  <div className="font-bold text-sm leading-tight">{date}</div>
                  <div className="text-[10px] sm:text-xs font-normal leading-tight opacity-90">{day}</div>
                </div>
              </th>
            );
          })}

        {/* GROUP: Monthly summary */}
        {columnVisibility.summary && (
          <>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-700 bg-blue-600 dark:bg-blue-900/60 font-semibold text-xs w-14 min-w-14`}
            >
              <div className="text-center">Work Days</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-700 bg-blue-600 dark:bg-blue-900/60 font-semibold text-xs w-14 min-w-14`}
            >
              <div className="text-center">Present</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-700 bg-blue-600 dark:bg-blue-900/60 font-semibold text-xs w-14 min-w-14`}
            >
              <div className="text-center">Absent</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-700 bg-blue-600 dark:bg-blue-900/60 font-semibold text-xs w-14 min-w-14 sticky right-0 z-50`}
            >
              <div className="text-center">%</div>
            </th>
          </>
        )}
      </tr>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 3 – Mark Attendance Buttons (daily columns only)
      ════════════════════════════════════════════════════════════════════ */}
      <tr className="sticky z-30 bg-sky-500 dark:bg-slate-800" style={{ top: markRowTop }}>
        {columnVisibility.daily &&
          monthDates.map((date) => {
            const currentDate = new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date,
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
                className={`${compactView ? "py-1 px-1" : "py-2 px-1 sm:px-2"} border border-slate-300 dark:border-slate-700 text-center ${
                  isHoliday || isSunday
                    ? "bg-rose-500 border-rose-400 dark:bg-rose-900/60 dark:border-rose-800"
                    : "bg-sky-500 border-sky-400 dark:bg-sky-900/60 dark:border-sky-800"
                }`}
              >
                <button
                  disabled={loadingAttendance}
                  onClick={() => onMarkAttendance(fullDate)}
                  title={isFuture ? "Mark Holiday (Attendance blocked)" : "Mark Attendance / Holiday"}
                  className="px-1.5 py-0.5 text-xs font-semibold bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 rounded shadow-sm hover:bg-sky-50 dark:hover:bg-slate-700 transition-all duration-200 border border-sky-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
