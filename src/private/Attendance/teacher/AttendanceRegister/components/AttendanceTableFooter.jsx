import React from "react";

const AttendanceTableFooter = ({
  students,
  monthDates,
  selectedMonth,
  holidays,
  attendanceMap,
  formatDate,
  columnVisibility = { previous: true, daily: true, summary: true },
  compactView = false,
}) => {
  const prevColSpan = columnVisibility.previous ? 7 : 0;
  const summaryColSpan = columnVisibility.summary ? 7 : 0;

  // Standardized Column Widths & Sticky Positions (Pixel exact for dynamic compact shrink)
  const nameWidth = compactView ? 180 : 260;

  const nameColStyle = {
    width: `${nameWidth}px`,
    minWidth: `${nameWidth}px`,
    maxWidth: `${nameWidth}px`,
  };

  const footerRows = [
    {
      label: "Present Students",
      color: "text-emerald-700 dark:text-emerald-400",
      countFn: (studentRecords, fullDate) =>
        studentRecords?.get(fullDate) === "present" ? 1 : 0,
      keyPrefix: "summary-present",
    },
    {
      label: "Absent Students",
      color: "text-rose-700 dark:text-rose-400",
      countFn: (studentRecords, fullDate) =>
        studentRecords?.get(fullDate) === "absent" ? 1 : 0,
      keyPrefix: "summary-absent",
    },
    {
      label: "Total Marked",
      color: "text-indigo-700 dark:text-indigo-400",
      countFn: (studentRecords, fullDate) => {
        const s = studentRecords?.get(fullDate);
        return s === "present" || s === "absent" ? 1 : 0;
      },
      keyPrefix: "summary-total",
    },
  ];

  return (
    <tfoot className="bg-slate-100 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700 select-none">
      {footerRows.map(({ label, color, countFn, keyPrefix }) => (
        <tr key={keyPrefix} className="text-xs">
          {/* Previous Group Blank Span */}
          {columnVisibility.previous && (
            <td
              colSpan={prevColSpan}
              className="py-1.5 px-2 border border-slate-200 dark:border-slate-700"
            />
          )}

          {/* Sticky Student Name Cell */}
          <td style={nameColStyle} className="sticky left-0 py-1.5 px-3 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 z-20 box-border truncate">
            {label}
          </td>


          {/* Daily Columns */}
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
                if (student.isTeacher) return;
                const studentRecords = attendanceMap.get(student.userId);
                count += countFn(studentRecords, fullDate);
              });

              return (
                <td
                  key={`${keyPrefix}-${date}`}
                  className={`py-1.5 px-1 border border-slate-200 dark:border-slate-700 text-center ${color} ${
                    isHoliday ? "bg-rose-50 dark:bg-rose-950/30" : ""
                  }`}
                >
                  {isHoliday ? (count > 0 ? count : "-") : count}
                </td>
              );
            })}

          {/* Summary Group Blank Span */}
          {columnVisibility.summary && (
            <td
              colSpan={summaryColSpan}
              className="py-1.5 px-2 border border-slate-200 dark:border-slate-700"
            />
          )}
        </tr>
      ))}
    </tfoot>
  );
};

export default AttendanceTableFooter;