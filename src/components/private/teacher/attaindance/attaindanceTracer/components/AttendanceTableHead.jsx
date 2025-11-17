import React from "react";

const AttendanceTableHead = ({
  monthDates,
  selectedMonth,
  holidays,
  formatDate,
  onMarkAttendance,
  loadingAttendance,
}) => {
  return (
    <thead className="text-white">
      <tr className="sticky top-0 z-40 ">
        <th
          rowSpan={2}
          className="py-2 px-2 border border-slate-300 dark:border-slate-600 bg-emerald-600 dark:bg-emerald-700 font-semibold text-xs sm:text-sm w-16 sm:w-20 min-w-16"
        >
          <div className="text-center">Prev Work</div>
        </th>
        <th
          rowSpan={2}
          className="py-2 px-2 border border-slate-300 dark:border-slate-600 bg-emerald-600 dark:bg-emerald-700 font-semibold text-xs sm:text-sm w-16 sm:w-20 min-w-16"
        >
          <div className="text-center">Prev Pres</div>
        </th>
        <th
          rowSpan={2}
          className="py-2 px-2 border border-slate-300 dark:border-slate-600 bg-emerald-600 dark:bg-emerald-700 font-semibold text-xs sm:text-sm w-16 sm:w-20 min-w-16"
        >
          <div className="text-center">Prev Abs</div>
        </th>
        <th
          rowSpan={2}
          className="py-2 px-2 border border-slate-300 dark:border-slate-600 bg-emerald-600 dark:bg-emerald-700 font-semibold text-xs sm:text-sm w-16 sm:w-20 min-w-16"
        >
          <div className="text-center">Total %</div>
        </th>
        <th
          rowSpan={2}
          className="py-3 z-50 px-3 sm:px-4 border border-slate-300 dark:border-slate-600 sticky left-0 bg-indigo-600 dark:bg-indigo-700 font-semibold text-left text-sm sm:text-base w-28 sm:w-48 min-w-28 sm:min-w-48 "
        >
          Student Name
        </th>
        <th
          rowSpan={2}
          className="py-3 z-50 px-3 sm:px-4 border border-slate-300 dark:border-slate-600 sticky left-32 sm:left-48 bg-indigo-600 dark:bg-indigo-700 font-semibold text-left text-sm sm:text-base w-16 sm:w-20 min-w-16"
        >
          Action
        </th>
        {monthDates.map((date) => {
          const currentDate = new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth(),
            date
          );
          const day = formatDate(currentDate, "EEE");
          const fullDate = formatDate(currentDate, "yyyy-MM-dd");
          const isHoliday = holidays.has(fullDate);

          return (
            <th
              key={date}
              className={`py-2 sm:py-3 px-2 border ${
                isHoliday
                  ? "bg-rose-500 border-rose-400 dark:bg-rose-600 dark:border-rose-500"
                  : "bg-sky-500 border-sky-400 dark:bg-sky-600 dark:border-sky-500"
              } w-14 sm:w-16 min-w-14 sm:min-w-16`}
            >
              <div className="text-center">
                <div className="font-bold text-sm sm:text-base">{date}</div>
                <div className="text-xs font-normal">{day}</div>
              </div>
            </th>
          );
        })}
        <th
          rowSpan={2}
          className="py-2 px-2 border border-slate-300 dark:border-slate-600 bg-blue-600 dark:bg-blue-700 font-semibold text-xs sm:text-sm w-16 sm:w-20 min-w-16"
        >
          <div className="text-center">Work Days</div>
        </th>
        <th
          rowSpan={2}
          className="py-2 px-2 border border-slate-300 dark:border-slate-600 bg-blue-600 dark:bg-blue-700 font-semibold text-xs sm:text-sm w-14 sm:w-16 min-w-14"
        >
          <div className="text-center">Present</div>
        </th>
        <th
          rowSpan={2}
          className="py-2 px-2 border border-slate-300 dark:border-slate-600 bg-blue-600 dark:bg-blue-700 font-semibold text-xs sm:text-sm w-14 sm:w-16 min-w-14"
        >
          <div className="text-center">Absent</div>
        </th>
        <th
          rowSpan={2}
          className="py-2 px-2 border border-slate-300 dark:border-slate-600 bg-blue-600 dark:bg-blue-700 font-semibold text-xs sm:text-sm w-14 sm:w-16 min-w-14"
        >
          <div className="text-center">%</div>
        </th>
      </tr>
      <tr className="sticky top-14 sm:top-16 z-30">
        {monthDates.map((date) => {
          const fullDate = formatDate(
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date
            ),
            "yyyy-MM-dd"
          );
          const isHoliday = holidays.has(fullDate);
          return (
            <td
              key={`mark-${date}`}
              className={`py-2 px-1 sm:px-2 border border-slate-300 dark:border-slate-600 text-center ${
                isHoliday
                  ? "bg-rose-500 border-rose-400 dark:bg-rose-600 dark:border-rose-500"
                  : "bg-sky-500 border-sky-400 dark:bg-sky-600 dark:border-sky-500"
              }`}
            >
              {!isHoliday && (
                <button
                  disabled={loadingAttendance}
                  onClick={() => onMarkAttendance(fullDate)}
                  className="px-2 py-1 text-xs font-medium bg-white text-sky-700 rounded shadow-sm hover:bg-sky-50 hover:shadow-md transition-all duration-200 border border-sky-200"
                >
                  Mark
                </button>
              )}
            </td>
          );
        })}
      </tr>
    </thead>
  );
};

export default AttendanceTableHead;
