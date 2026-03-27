import React from "react";

const AttendanceTableFooter = ({
  students,
  monthDates,
  selectedMonth,
  holidays,
  attendanceMap,
  formatDate,
  columnVisibility = { previous: true, daily: true, summary: true },
}) => {
  const prevColSpan = columnVisibility.previous ? 4 : 0;
  const summaryColSpan = columnVisibility.summary ? 4 : 0;

  const footerRows = [
    {
      label: "Present Students",
      color: "text-green-700 dark:text-green-400",
      countFn: (studentRecords, fullDate) =>
        studentRecords?.get(fullDate) === "present" ? 1 : 0,
      keyPrefix: "summary-present",
    },
    {
      label: "Absent Students",
      color: "text-red-700 dark:text-red-400",
      countFn: (studentRecords, fullDate) =>
        studentRecords?.get(fullDate) === "absent" ? 1 : 0,
      keyPrefix: "summary-absent",
    },
    {
      label: "Total Students",
      color: "text-indigo-700 dark:text-indigo-400",
      countFn: (studentRecords, fullDate) => {
        const s = studentRecords?.get(fullDate);
        return s === "present" || s === "absent" ? 1 : 0;
      },
      keyPrefix: "summary-total",
    },
  ];

  return (
    <tfoot className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
      {footerRows.map(({ label, color, countFn, keyPrefix }) => (
        <tr key={keyPrefix} className="font-bold">
          {/* Previous group blank span */}
          {columnVisibility.previous && (
            <td
              colSpan={prevColSpan}
              className="py-2 sm:py-3 px-2 sm:px-3 border border-slate-300 dark:border-slate-600"
            />
          )}

          {/* Sticky label cell */}
          <td className="sticky left-0 py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-700 z-10 text-xs sm:text-sm">
            {label}
          </td>

          {/* Sticky action cell */}
          <td className="sticky left-28 sm:left-48 py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-700 z-10" />

          {/* Daily columns */}
          {columnVisibility.daily &&
            monthDates.map((date) => {
              const fullDate = formatDate(
                new Date(
                  selectedMonth.getFullYear(),
                  selectedMonth.getMonth(),
                  date
                ),
                "yyyy-MM-dd"
              );
              const isHoliday = holidays.has(fullDate);
              let count = 0;
              students.forEach((student) => {
                const studentRecords = attendanceMap.get(student.userId);
                count += countFn(studentRecords, fullDate);
              });

              return (
                <td
                  key={`${keyPrefix}-${date}`}
                  className={`py-2 sm:py-3 px-1 sm:px-2 border border-slate-300 dark:border-slate-600 text-center ${color} text-xs sm:text-sm ${
                    isHoliday ? "bg-rose-50 dark:bg-rose-900/30" : ""
                  }`}
                >
                  {isHoliday ? (count > 0 ? count : "-") : count}
                </td>
              );
            })}

          {/* Summary group blank span */}
          {columnVisibility.summary && (
            <td
              colSpan={summaryColSpan}
              className="py-2 sm:py-3 px-2 sm:px-3 border border-slate-300 dark:border-slate-600"
            />
          )}
        </tr>
      ))}
    </tfoot>
  );
};

export default AttendanceTableFooter;