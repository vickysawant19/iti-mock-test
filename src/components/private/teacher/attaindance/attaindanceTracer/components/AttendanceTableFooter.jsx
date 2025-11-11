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
    <tfoot className="bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
      <tr className="font-bold">
        <td className="sticky left-0 py-3 px-4 border border-gray-300 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-700 z-10 w-48 min-w-48 max-w-48">
          Present Students
        </td>
        <td className="sticky left-48 py-3 px-4 border  border-gray-300 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-700 z-10 "></td>
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
            if (studentRecords?.get(fullDate) === "Present") {
              dailyPresent++;
            }
          });
          const isHoliday = holidays.has(fullDate);
          return (
            <td
              key={`summary-present-${date}`}
              className={`py-3 px-2 border border-gray-300 dark:border-gray-700 text-center text-green-600 dark:text-green-400 w-16 min-w-16 max-w-16 ${
                isHoliday ? "bg-red-50 dark:bg-red-900" : ""
              }`}
            >
              {isHoliday ? "-" : dailyPresent}
            </td>
          );
        })}
        <td
          colSpan="8"
          className="py-3 px-3 border border-gray-300 dark:border-gray-700 w-24 min-w-24 max-w-24"
        ></td>
      </tr>
      <tr className="font-bold">
        <td className="sticky left-0 py-3 px-4 border border-gray-300 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-700 z-10 w-48 min-w-48 max-w-48">
          Absent Students
        </td>
        <td className="sticky left-48 py-3 px-4 border border-gray-300 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-700 z-10 "></td>
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
            if (studentRecords?.get(fullDate) === "Absent") {
              dailyAbsent++;
            }
          });
          const isHoliday = holidays.has(fullDate);
          return (
            <td
              key={`summary-absent-${date}`}
              className={`py-3 px-2 border border-gray-300 dark:border-gray-700 text-center text-red-600 dark:text-red-400 w-16 min-w-16 max-w-16 ${
                isHoliday ? "bg-red-50 dark:bg-red-900" : ""
              }`}
            >
              {isHoliday ? "-" : dailyAbsent}
            </td>
          );
        })}
        <td
          colSpan="8"
          className="py-3 px-3 border border-gray-300 dark:border-gray-700 w-24 min-w-24 max-w-24"
        ></td>
      </tr>
      <tr className="font-bold">
        <td className="sticky left-0 py-3 px-4 border border-gray-300 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-700 z-10 w-48 min-w-48 max-w-48">
          Total Students
        </td>
        <td className="sticky left-48 py-3 px-4 border border-gray-300 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 bg-gray-100 dark:bg-gray-700 z-10 "></td>
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
            if (status === "Present" || status === "Absent") {
              dailyTotal++;
            }
          });
          const isHoliday = holidays.has(fullDate);
          return (
            <td
              key={`summary-total-${date}`}
              className={`py-3 px-2 border border-gray-300 dark:border-gray-700 text-center text-indigo-600 dark:text-indigo-400 w-16 min-w-16 max-w-16 ${
                isHoliday ? "bg-red-50 dark:bg-red-900" : ""
              }`}
            >
              {isHoliday ? "-" : dailyTotal}
            </td>
          );
        })}
        <td
          colSpan="8"
          className="py-3 px-3 border border-gray-300 dark:border-gray-700 w-24 min-w-24 max-w-24"
        ></td>
      </tr>
    </tfoot>
  );
};

export default AttendanceTableFooter;
