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
      <tr className="sticky top-0 z-40 bg-indigo-700 dark:bg-indigo-800">
        {/* Previous month group label */}
        {columnVisibility.previous && (
          <th
            colSpan={prevCount}
            className={`${cell} border border-emerald-500 bg-emerald-700 dark:bg-emerald-800 text-xs font-bold text-center tracking-wide`}
            scope="colgroup"
          >
            {compactView ? "Prev" : "Previous Month Stats"}
          </th>
        )}

        {/* Always-present sticky info columns (Student Name + Action) */}
        <th
          colSpan={2}
          className={`${stickyCell} sticky left-0 z-50 border border-indigo-500 bg-indigo-700 dark:bg-indigo-800 text-xs font-bold text-left tracking-wide`}
          scope="colgroup"
        >
          {compactView ? "Students" : "Student Info"}
        </th>

        {/* Daily attendance group label */}
        {columnVisibility.daily && (
          <th
            colSpan={dailyCount}
            className={`${cell} border border-sky-500 bg-sky-700 dark:bg-sky-800 text-xs font-bold text-center tracking-wide`}
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
            className={`${cell} border border-blue-500 bg-blue-700 dark:bg-blue-800 text-xs font-bold text-center tracking-wide`}
            scope="colgroup"
          >
            {compactView ? "This Month" : "Monthly Summary"}
          </th>
        )}
      </tr>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 2 – Date Numbers / Column Headers
      ════════════════════════════════════════════════════════════════════ */}
      <tr className="sticky z-40 bg-indigo-600 dark:bg-indigo-700" style={{ top: groupRowH }}>
        {/* GROUP: Previous month stats */}
        {columnVisibility.previous && (
          <>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-600 bg-emerald-600 dark:bg-emerald-700 font-semibold text-xs w-16 min-w-16`}
            >
              <div className="text-center">Prev Work</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-600 bg-emerald-600 dark:bg-emerald-700 font-semibold text-xs w-16 min-w-16`}
            >
              <div className="text-center">Prev Pres</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-600 bg-emerald-600 dark:bg-emerald-700 font-semibold text-xs w-16 min-w-16`}
            >
              <div className="text-center">Prev Abs</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-600 bg-emerald-600 dark:bg-emerald-700 font-semibold text-xs w-16 min-w-16`}
            >
              <div className="text-center">Total %</div>
            </th>
          </>
        )}

        {/* GROUP: Student Info — always sticky */}
        <th
          rowSpan={2}
          scope="col"
          className={`${stickyCell} z-50 border border-slate-300 dark:border-slate-600 sticky left-0 bg-indigo-600 dark:bg-indigo-700 font-semibold text-left text-sm w-28 sm:w-48 min-w-28 sm:min-w-48`}
        >
          Student Name
        </th>
        <th
          rowSpan={2}
          scope="col"
          className={`${stickyCell} z-50 border border-slate-300 dark:border-slate-600 sticky left-28 sm:left-48 bg-indigo-600 dark:bg-indigo-700 font-semibold text-left text-sm w-16 min-w-16`}
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
                  isHoliday
                    ? "bg-rose-500 border-rose-400 dark:bg-rose-600 dark:border-rose-500"
                    : "bg-sky-500 border-sky-400 dark:bg-sky-600 dark:border-sky-500"
                } w-12 min-w-12`}
              >
                <div className="text-center">
                  <div className="font-bold text-sm">{date}</div>
                  {!compactView && (
                    <div className="text-xs font-normal">{day}</div>
                  )}
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
              className={`${cell} border border-slate-300 dark:border-slate-600 bg-blue-600 dark:bg-blue-700 font-semibold text-xs w-14 min-w-14`}
            >
              <div className="text-center">Work Days</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-600 bg-blue-600 dark:bg-blue-700 font-semibold text-xs w-14 min-w-14`}
            >
              <div className="text-center">Present</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-600 bg-blue-600 dark:bg-blue-700 font-semibold text-xs w-14 min-w-14`}
            >
              <div className="text-center">Absent</div>
            </th>
            <th
              rowSpan={2}
              scope="col"
              className={`${cell} border border-slate-300 dark:border-slate-600 bg-blue-600 dark:bg-blue-700 font-semibold text-xs w-14 min-w-14 sticky right-0 z-50`}
            >
              <div className="text-center">%</div>
            </th>
          </>
        )}
      </tr>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 3 – Mark Attendance Buttons (daily columns only)
      ════════════════════════════════════════════════════════════════════ */}
      <tr className="sticky z-30 bg-sky-500 dark:bg-sky-600" style={{ top: markRowTop }}>
        {columnVisibility.daily &&
          monthDates.map((date) => {
            const fullDate = formatDate(
              new Date(
                selectedMonth.getFullYear(),
                selectedMonth.getMonth(),
                date,
              ),
              "yyyy-MM-dd",
            );
            const isHoliday = holidays.has(fullDate);
            return (
              <th
                key={`mark-${date}`}
                scope="col"
                className={`${compactView ? "py-1 px-1" : "py-2 px-1 sm:px-2"} border border-slate-300 dark:border-slate-600 text-center ${
                  isHoliday
                    ? "bg-rose-500 border-rose-400 dark:bg-rose-600 dark:border-rose-500"
                    : "bg-sky-500 border-sky-400 dark:bg-sky-600 dark:border-sky-500"
                }`}
              >
                <button
                  disabled={loadingAttendance}
                  onClick={() => onMarkAttendance(fullDate)}
                  className="px-1.5 py-0.5 text-xs font-medium bg-white text-sky-700 rounded shadow-sm hover:bg-sky-50 hover:shadow-md transition-all duration-200 border border-sky-200"
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
