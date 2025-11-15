import React from "react";

const AttendanceTableFooter = ({
  students,
  monthDates,
  selectedMonth,
  holidays,
  attendanceMap,
  formatDate,
}) => {
  return (
    <tfoot className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
      <tr className="font-bold">
        <td
          colSpan="4"
          className="py-2 sm:py-3 px-2 sm:px-3 border border-slate-300 dark:border-slate-600"
        ></td>
        <td className="sticky left-0 py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-700 z-10 text-xs sm:text-sm">
          Present Students
        </td>
        <td className="sticky left-32 sm:left-48 py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-700 z-10"></td>
        {monthDates.map((date) => {
          const fullDate = formatDate(
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date
            ),
            "yyyy-MM-dd"
          );
          let dailyPresent = 0;
          students.forEach((student) => {
            const studentRecords = attendanceMap.get(student.userId);
            if (studentRecords?.get(fullDate) === "present") {
              dailyPresent++;
            }
          });
          const isHoliday = holidays.has(fullDate);
          return (
            <td
              key={`summary-present-${date}`}
              className={`py-2 sm:py-3 px-1 sm:px-2 border border-slate-300 dark:border-slate-600 text-center text-green-700 dark:text-green-400 text-xs sm:text-sm ${
                isHoliday ? "bg-rose-50 dark:bg-rose-900/30" : ""
              }`}
            >
              {isHoliday ? "-" : dailyPresent}
            </td>
          );
        })}
        <td
          colSpan="4"
          className="py-2 sm:py-3 px-2 sm:px-3 border border-slate-300 dark:border-slate-600"
        ></td>
      </tr>
      <tr className="font-bold">
        <td
          colSpan="4"
          className="py-2 sm:py-3 px-2 sm:px-3 border border-slate-300 dark:border-slate-600"
        ></td>
        <td className="sticky left-0 py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-700 z-10 text-xs sm:text-sm">
          Absent Students
        </td>
        <td className="sticky left-32 sm:left-48 py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-700 z-10"></td>
        {monthDates.map((date) => {
          const fullDate = formatDate(
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date
            ),
            "yyyy-MM-dd"
          );
          let dailyAbsent = 0;
          students.forEach((student) => {
            const studentRecords = attendanceMap.get(student.userId);
            if (studentRecords?.get(fullDate) === "absent") {
              dailyAbsent++;
            }
          });
          const isHoliday = holidays.has(fullDate);
          return (
            <td
              key={`summary-absent-${date}`}
              className={`py-2 sm:py-3 px-1 sm:px-2 border border-slate-300 dark:border-slate-600 text-center text-red-700 dark:text-red-400 text-xs sm:text-sm ${
                isHoliday ? "bg-rose-50 dark:bg-rose-900/30" : ""
              }`}
            >
              {isHoliday ? "-" : dailyAbsent}
            </td>
          );
        })}
        <td
          colSpan="4"
          className="py-2 sm:py-3 px-2 sm:px-3 border border-slate-300 dark:border-slate-600"
        ></td>
      </tr>
      <tr className="font-bold">
        <td
          colSpan="4"
          className="py-2 sm:py-3 px-2 sm:px-3 border border-slate-300 dark:border-slate-600"
        ></td>
        <td className="sticky left-0 py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-700 z-10 text-xs sm:text-sm">
          Total Students
        </td>
        <td className="sticky left-32 sm:left-48 py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-700 z-10"></td>
        {monthDates.map((date) => {
          const fullDate = formatDate(
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date
            ),
            "yyyy-MM-dd"
          );
          let dailyTotal = 0;
          students.forEach((student) => {
            const studentRecords = attendanceMap.get(student.userId);
            const status = studentRecords?.get(fullDate);
            if (status === "present" || status === "absent") {
              dailyTotal++;
            }
          });
          const isHoliday = holidays.has(fullDate);
          return (
            <td
              key={`summary-total-${date}`}
              className={`py-2 sm:py-3 px-1 sm:px-2 border border-slate-300 dark:border-slate-600 text-center text-indigo-700 dark:text-indigo-400 text-xs sm:text-sm ${
                isHoliday ? "bg-rose-50 dark:bg-rose-900/30" : ""
              }`}
            >
              {isHoliday ? "-" : dailyTotal}
            </td>
          );
        })}
        <td
          colSpan="4"
          className="py-2 sm:py-3 px-2 sm:px-3 border border-slate-300 dark:border-slate-600"
        ></td>
      </tr>
    </tfoot>
  );
};

export default AttendanceTableFooter;