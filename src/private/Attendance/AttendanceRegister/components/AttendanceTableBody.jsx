import React from "react";
import { LoaderCircle, Edit3 } from "lucide-react";

const AttendanceTableBody = ({
  students,
  monthDates,
  selectedMonth,
  holidays,
  attendanceMap,
  calculatePreviousMonthsData,
  formatDate,
  updatingAttendance,
  isStudentUpdating,
  loadingAttendance = false,
  loadingStats = false,
  columnVisibility = { previous: true, daily: true, summary: true },
  compactView = false,
  onOpenStudentAttendanceModal,
}) => {
  const cell = compactView ? "py-1 px-1 text-[11px]" : "py-1.5 px-2 text-xs";
  const stickyCell = compactView ? "py-1.5 px-2 text-xs" : "py-2 px-3 text-xs sm:text-sm";

  // Standardized Column Widths & Sticky Positions (Matches AttendanceTableHead)
  const nameColWidth = compactView ? "w-36 min-w-36" : "w-48 sm:w-56 min-w-48 sm:min-w-56";
  const actionColWidth = "w-28 min-w-28";
  const actionStickyPos = compactView ? "left-36" : "left-48 sm:left-56";

  let studentIndex = 1;

  return (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
      {students.map((student, idx) => {
        const studentRecords = attendanceMap.get(student.userId) || new Map();
        const prevMonthData = calculatePreviousMonthsData.get(student.userId) || {
          workingDays: 0,
          presentDays: 0,
          absentDays: 0,
        };

        let currentMonthPresentDays = 0;
        let currentMonthWorkingDays = 0;
        let currentMonthAbsentDays = 0;

        monthDates.forEach((date) => {
          const fullDate = formatDate(
            new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), date),
            "yyyy-MM-dd"
          );
          if (!holidays.has(fullDate)) {
            currentMonthWorkingDays++;
            const status = studentRecords.get(fullDate);
            if (status === "present") currentMonthPresentDays++;
            else if (status === "absent") currentMonthAbsentDays++;
          }
        });

        const currentMonthPercentage =
          currentMonthWorkingDays > 0
            ? ((currentMonthPresentDays / currentMonthWorkingDays) * 100).toFixed(1)
            : 0;

        const prevMonthWorkingDays = prevMonthData.presentDays + prevMonthData.absentDays;
        const prevMonthPresentDays = prevMonthData.presentDays;
        const prevMonthPercentage =
          prevMonthWorkingDays > 0
            ? ((prevMonthPresentDays / prevMonthWorkingDays) * 100).toFixed(1)
            : 0;

        const studentUpdating = isStudentUpdating(student.userId);
        const isRowEven = idx % 2 === 0;

        // Balanced & High Contrast Row and Sticky Cell Backgrounds for Light & Dark Mode
        const rowBgClass = student.isTeacher
          ? "bg-purple-100/70 dark:bg-purple-950/70 hover:bg-purple-200/80 dark:hover:bg-purple-900/80"
          : isRowEven
          ? "bg-white dark:bg-slate-900 hover:bg-indigo-50/70 dark:hover:bg-slate-800/80"
          : "bg-slate-100/60 dark:bg-slate-950 hover:bg-indigo-50/70 dark:hover:bg-slate-800/80";

        const stickyBgClass = student.isTeacher
          ? "bg-purple-100 dark:bg-purple-950"
          : isRowEven
          ? "bg-white dark:bg-slate-900"
          : "bg-slate-100 dark:bg-slate-950";

        return (
          <tr
            key={student.userId || idx}
            className={`transition-colors duration-150 ${rowBgClass} ${
              studentUpdating ? "opacity-60" : ""
            }`}
            onClick={() => onOpenStudentAttendanceModal(student)}
          >
            {/* ── PREVIOUS MONTH STATS ── */}
            {columnVisibility.previous && (
              <>
                <td className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 font-semibold text-slate-800 dark:text-slate-200`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    prevMonthWorkingDays || prevMonthData.workingDays || 0
                  )}
                </td>
                <td className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-extrabold`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    prevMonthPresentDays || 0
                  )}
                </td>
                <td className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-rose-700 dark:text-rose-400 font-extrabold`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    prevMonthData.absentDays || 0
                  )}
                </td>
                <td className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 font-black`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span
                      className={
                        Number(prevMonthPercentage) >= 75
                          ? "text-emerald-700 dark:text-emerald-400"
                          : Number(prevMonthPercentage) >= 50
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-rose-700 dark:text-rose-400"
                      }
                    >
                      {prevMonthPercentage}%
                    </span>
                  )}
                </td>
              </>
            )}

            {/* ── STUDENT NAME (STICKY LEFT 0) ── High Contrast Visible Text */}
            <td className={`${stickyCell} ${nameColWidth} border border-slate-200 dark:border-slate-800 sticky left-0 z-20 ${stickyBgClass} font-semibold text-slate-900 dark:text-white`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-xs truncate leading-snug text-slate-900 dark:text-white">
                    {!student.isTeacher && (
                      <span className="text-slate-500 dark:text-slate-400 font-normal mr-1">
                        {studentIndex++}.
                      </span>
                    )}
                    {student.userName || student.name || "Student"}
                  </span>
                  {!compactView && (
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono truncate">
                      Roll: {student.studentId || student.rollNumber || "NA"}
                    </span>
                  )}
                </div>
                {studentUpdating && !loadingAttendance && (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                )}
              </div>
            </td>

            {/* ── ACTION BUTTON (STICKY LEFT) ── */}
            <td className={`${stickyCell} ${actionColWidth} ${actionStickyPos} border border-slate-200 dark:border-slate-800 sticky z-20 ${stickyBgClass} text-center shadow-[4px_0_10px_-2px_rgba(0,0,0,0.1)]`}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStudentAttendanceModal(student);
                }}
                className="w-full px-2 py-1 text-[11px] font-bold rounded bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white flex items-center justify-center gap-1 shadow-xs transition-all"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </td>

            {/* ── DAILY ATTENDANCE CELLS ── */}
            {columnVisibility.daily &&
              monthDates.map((date) => {
                const fullDate = formatDate(
                  new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), date),
                  "yyyy-MM-dd"
                );
                const status = studentRecords.get(fullDate);
                const isHoliday = holidays.has(fullDate);
                const holidayData = holidays.get(fullDate);
                const cellUpdating = updatingAttendance.get(`${student.userId}-${fullDate}`);

                if (isHoliday) {
                  if (student.isTeacher) {
                    return (
                      <td
                        key={date}
                        className={`${cell} border border-slate-200 dark:border-slate-800 text-center relative bg-purple-50 dark:bg-purple-950/40`}
                      >
                        {cellUpdating && (
                          <div className="absolute inset-0 flex items-center justify-center bg-indigo-100/80 dark:bg-indigo-900/60 z-10">
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                          </div>
                        )}
                        <span
                          className={`inline-flex items-center justify-center font-bold text-xs ${
                            status === "present"
                              ? "text-emerald-700 dark:text-emerald-400"
                              : status === "absent"
                              ? "text-rose-700 dark:text-rose-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {status === "present" ? "P" : status === "absent" ? "A" : "-"}
                        </span>
                      </td>
                    );
                  }

                  const firstStudentIdx = students.findIndex((s) => !s.isTeacher);
                  if (idx === firstStudentIdx) {
                    const studentCount = students.filter((s) => !s.isTeacher).length;
                    return (
                      <td
                        key={date}
                        rowSpan={studentCount}
                        className="py-2 px-1 border border-slate-300 dark:border-slate-700 text-center relative bg-rose-100/90 dark:bg-rose-950/70"
                      >
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-1">
                          <div
                            className="whitespace-nowrap text-xs font-black text-rose-800 dark:text-rose-200 uppercase tracking-wider"
                            style={{
                              writingMode: "vertical-rl",
                              textOrientation: "mixed",
                              transform: "rotate(180deg)",
                            }}
                          >
                            {holidayData?.holidayText || "HOLIDAY"}
                          </div>
                        </div>
                      </td>
                    );
                  }
                  return null;
                }

                return (
                  <td
                    key={date}
                    className={`${cell} border border-slate-200 dark:border-slate-800 text-center relative`}
                  >
                    {cellUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-indigo-100/80 dark:bg-indigo-900/60 z-10">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}

                    {status === "present" ? (
                      <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs shadow-2xs border border-emerald-300 dark:border-emerald-800">
                        P
                      </span>
                    ) : status === "absent" ? (
                      <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs shadow-2xs border border-rose-300 dark:border-rose-800">
                        A
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 font-bold text-xs">
                        -
                      </span>
                    )}
                  </td>
                );
              })}

            {/* ── MONTHLY SUMMARY STATS ── */}
            {columnVisibility.summary && (
              <>
                <td className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 font-semibold text-slate-800 dark:text-slate-200`}>
                  {currentMonthWorkingDays}
                </td>
                <td className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 text-emerald-700 dark:text-emerald-400 font-extrabold`}>
                  {currentMonthPresentDays}
                </td>
                <td className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 text-rose-700 dark:text-rose-400 font-extrabold`}>
                  {currentMonthAbsentDays}
                </td>
                <td className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 font-black`}>
                  <span
                    className={
                      Number(currentMonthPercentage) >= 75
                        ? "text-emerald-700 dark:text-emerald-400"
                        : Number(currentMonthPercentage) >= 50
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-rose-700 dark:text-rose-400"
                    }
                  >
                    {currentMonthPercentage}%
                  </span>
                </td>
              </>
            )}
          </tr>
        );
      })}
    </tbody>
  );
};

export default AttendanceTableBody;
