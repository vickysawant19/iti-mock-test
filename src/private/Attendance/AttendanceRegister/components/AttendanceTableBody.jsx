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

        let rawPresentDays = 0;
        let currentMonthWorkingDays = 0;
        let currentMonthAbsentDays = 0;
        let currentMonthCasualLeaves = 0;
        let currentMonthSickLeaves = 0;
        let currentMonthSpecialLeaves = 0;
        let currentMonthOnDutyLeaves = 0;

        monthDates.forEach((date) => {
          const fullDate = formatDate(
            new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), date),
            "yyyy-MM-dd"
          );
          if (!holidays.has(fullDate)) {
            currentMonthWorkingDays++;
            const status = String(studentRecords.get(fullDate) || "").toLowerCase();
            if (status === "present" || status === "p") rawPresentDays++;
            else if (status === "absent" || status === "a") currentMonthAbsentDays++;
            else if (["casual", "cl"].includes(status)) currentMonthCasualLeaves++;
            else if (["sick", "sl"].includes(status)) currentMonthSickLeaves++;
            else if (["special", "spl"].includes(status)) currentMonthSpecialLeaves++;
            else if (["on_duty", "od"].includes(status)) currentMonthOnDutyLeaves++;
            else if (status === "leave") currentMonthCasualLeaves++;
          }
        });

        // Total present days is sum of Present + CL + SL + SPL + OD
        const currentMonthPresentDays =
          rawPresentDays +
          currentMonthCasualLeaves +
          currentMonthSickLeaves +
          currentMonthSpecialLeaves +
          currentMonthOnDutyLeaves;

        const currentMonthPercentage =
          currentMonthWorkingDays > 0
            ? ((currentMonthPresentDays / currentMonthWorkingDays) * 100).toFixed(1)
            : 0;

        const prevMonthWorkingDays = prevMonthData.workingDays || (prevMonthData.presentDays + prevMonthData.absentDays);
        const prevMonthCasual = prevMonthData.leaveBreakdown?.CASUAL || prevMonthData.casualDays || 0;
        const prevMonthSick = prevMonthData.leaveBreakdown?.SICK || prevMonthData.sickDays || 0;
        const prevMonthSpecial = prevMonthData.leaveBreakdown?.SPECIAL || prevMonthData.specialDays || 0;
        const prevMonthOnDuty = prevMonthData.leaveBreakdown?.ON_DUTY || prevMonthData.onDutyDays || 0;
        const prevMonthLeaveTotal = prevMonthCasual + prevMonthSick + prevMonthSpecial + prevMonthOnDuty;
        const prevMonthTotalPresent = prevMonthData.presentDays || 0;
        const prevMonthRawPresent = Math.max(0, prevMonthTotalPresent - prevMonthLeaveTotal);
        const prevMonthAbsentDays = prevMonthData.absentDays || 0;
        const prevMonthPercentage = prevMonthData.percentage !== undefined ? prevMonthData.percentage : (
          prevMonthWorkingDays > 0
            ? ((prevMonthTotalPresent / prevMonthWorkingDays) * 100).toFixed(1)
            : 0
        );

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
                <td title="Work Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 font-semibold text-slate-800 dark:text-slate-200 text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    prevMonthWorkingDays
                  )}
                </td>
                <td title="Physical Present Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    prevMonthRawPresent
                  )}
                </td>
                <td title="Absent Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    prevMonthAbsentDays
                  )}
                </td>
                <td title="Casual Leaves (CL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-amber-50/40 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-amber-600 dark:text-amber-400" />
                  ) : (
                    prevMonthCasual
                  )}
                </td>
                <td title="Sick Leaves (SL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-sky-50/40 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-sky-600 dark:text-sky-400" />
                  ) : (
                    prevMonthSick
                  )}
                </td>
                <td title="Special Leaves (SPL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-purple-50/40 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-purple-600 dark:text-purple-400" />
                  ) : (
                    prevMonthSpecial
                  )}
                </td>
                <td title="Previous Percentage" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 font-black text-[10px] px-0.5`}>
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

                    {(() => {
                      const s = String(status || "").toLowerCase();
                      if (["present", "p"].includes(s)) {
                        return (
                          <span title="Present" className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs shadow-2xs border border-emerald-300 dark:border-emerald-800">
                            P
                          </span>
                        );
                      }
                      if (["absent", "a"].includes(s)) {
                        return (
                          <span title="Absent" className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs shadow-2xs border border-rose-300 dark:border-rose-800">
                            A
                          </span>
                        );
                      }
                      if (["casual", "cl"].includes(s)) {
                        return (
                          <span title="Casual Leave (CL)" className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px] shadow-2xs border border-amber-300 dark:border-amber-800">
                            CL
                          </span>
                        );
                      }
                      if (["sick", "sl"].includes(s)) {
                        return (
                          <span title="Sick Leave (SL)" className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px] shadow-2xs border border-sky-300 dark:border-sky-800">
                            SL
                          </span>
                        );
                      }
                      if (["special", "spl"].includes(s)) {
                        return (
                          <span title="Special Leave (SPL)" className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-extrabold text-[9px] shadow-2xs border border-purple-300 dark:border-purple-800">
                            SPL
                          </span>
                        );
                      }
                      if (["on_duty", "od"].includes(s)) {
                        return (
                          <span title="On Duty (OD)" className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-extrabold text-[10px] shadow-2xs border border-teal-300 dark:border-teal-800">
                            OD
                          </span>
                        );
                      }
                      if (["half_day", "halfday", "hd"].includes(s)) {
                        return (
                          <span title="Half Day (HD)" className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 font-extrabold text-[10px] shadow-2xs border border-yellow-300 dark:border-yellow-800">
                            HD
                          </span>
                        );
                      }
                      if (["late", "l"].includes(s)) {
                        return (
                          <span title="Late (L)" className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold text-xs shadow-2xs border border-indigo-300 dark:border-indigo-800">
                            L
                          </span>
                        );
                      }
                      if (["leave"].includes(s)) {
                        return (
                          <span title="Leave (CL)" className="inline-flex items-center justify-center h-5.5 w-5.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px] shadow-2xs border border-amber-300 dark:border-amber-800">
                            CL
                          </span>
                        );
                      }
                      return (
                        <span className="text-slate-400 dark:text-slate-600 font-bold text-xs">
                          -
                        </span>
                      );
                    })()}
                  </td>
                );
              })}

            {/* ── MONTHLY SUMMARY STATS ── */}
            {columnVisibility.summary && (
              <>
                <td title="Work Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 font-semibold text-slate-800 dark:text-slate-200 text-[10px] px-0.5`}>
                  {currentMonthWorkingDays}
                </td>
                <td title="Physical Present Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] px-0.5`}>
                  {rawPresentDays}
                </td>
                <td title="Absent Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-0.5`}>
                  {currentMonthAbsentDays}
                </td>
                <td title="Casual Leaves (CL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-0.5`}>
                  {currentMonthCasualLeaves}
                </td>
                <td title="Sick Leaves (SL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-sky-50/40 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 font-extrabold text-[10px] px-0.5`}>
                  {currentMonthSickLeaves}
                </td>
                <td title="Special Leaves (SPL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] px-0.5`}>
                  {currentMonthSpecialLeaves}
                </td>
                <td title="This Month Percentage" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 font-black text-[10px] px-0.5`}>
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
