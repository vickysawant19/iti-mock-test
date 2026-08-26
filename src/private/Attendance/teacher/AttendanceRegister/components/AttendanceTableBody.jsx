import React from "react";
import { LoaderCircle, Edit3, UserCircle2 } from "lucide-react";
import AttendanceStatusBadge from "@/components/components/AttendanceStatusBadge";

const AttendanceTableBody = ({
  students,
  monthDates,
  selectedMonth,
  holidays,
  attendanceMap,
  currentMonthlyStatsMap,
  calculatePreviousMonthsData,
  formatDate,
  updatingAttendance,
  isStudentUpdating,
  loadingAttendance = false,
  loadingStats = false,
  columnVisibility = { previous: true, daily: true, summary: true },
  compactView = false,
  nameWidthProp,
  onOpenStudentAttendanceModal,
  onOpenStudentProfile,
}) => {
  const cell = compactView ? "py-1 px-1 text-[11px]" : "py-1.5 px-2 text-xs";
  const stickyCell = compactView ? "py-1.5 px-1.5 text-xs" : "py-1.5 px-2 text-xs sm:text-sm";

  // Standardized Column Widths & Sticky Positions (Optimized for mobile readability)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const defaultNameWidth = compactView ? (isMobile ? 120 : 140) : (isMobile ? 140 : 180);
  const nameWidth = nameWidthProp !== undefined ? nameWidthProp : defaultNameWidth;

  const nameColStyle = {
    width: `${nameWidth}px`,
    minWidth: `${nameWidth}px`,
    maxWidth: `${nameWidth}px`,
  };

  const nonTeacherStudents = students.filter((s) => !s.isTeacher);
  const firstNonTeacherIdx = students.findIndex((s) => !s.isTeacher);
  const nonTeacherCount = nonTeacherStudents.length;

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

        // For the enrollment month, count working days only from the student's enrollment date.
        // This ensures a student enrolled mid-month doesn't have days before enrollment counted.
        const enrollDay = (() => {
          if (!student.enrollmentDate) return 1;
          try {
            const ed = new Date(student.enrollmentDate);
            const sy = selectedMonth.getFullYear();
            const sm = selectedMonth.getMonth();
            if (ed.getFullYear() === sy && ed.getMonth() === sm) {
              return ed.getDate();
            }
          } catch { /* ignore */ }
          return 1;
        })();

        monthDates.forEach((date) => {
          // Skip days before this student's enrollment date (in their enrollment month)
          if (date < enrollDay) return;

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

        const prevMonthWorkingDays = prevMonthData.workingDays || 0;
        const prevMonthCasual = prevMonthData.casualLeaves ?? prevMonthData.leaveBreakdown?.CASUAL ?? prevMonthData.casualDays ?? 0;
        const prevMonthSick = prevMonthData.sickLeaves ?? prevMonthData.leaveBreakdown?.SICK ?? prevMonthData.sickDays ?? 0;
        const prevMonthSpecial = prevMonthData.specialLeaves ?? prevMonthData.leaveBreakdown?.SPECIAL ?? prevMonthData.specialDays ?? 0;
        const prevMonthOnDuty = prevMonthData.onDutyLeaves ?? prevMonthData.leaveBreakdown?.ON_DUTY ?? prevMonthData.onDutyDays ?? 0;
        const prevMonthLeaveTotal = prevMonthCasual + prevMonthSick + prevMonthSpecial + prevMonthOnDuty;
        const prevMonthTotalPresent = prevMonthData.totalPresent !== undefined ? prevMonthData.totalPresent : (prevMonthData.presentDays || 0);
        const prevMonthRawPresent = prevMonthData.presentDays !== undefined && prevMonthData.totalPresent !== undefined ? prevMonthData.presentDays : Math.max(0, prevMonthTotalPresent - prevMonthLeaveTotal);
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
            <td style={nameColStyle} className={`${stickyCell} border border-slate-200 dark:border-slate-800 sticky left-0 z-20 ${stickyBgClass} font-semibold text-slate-900 dark:text-white box-border`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex flex-col flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenStudentProfile && !student.isTeacher) {
                        onOpenStudentProfile(student);
                      }
                    }}
                    className={`font-bold text-xs truncate leading-snug text-left transition-colors ${
                      !student.isTeacher && onOpenStudentProfile
                        ? "text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 cursor-pointer group/name"
                        : "text-slate-900 dark:text-white cursor-default"
                    }`}
                    title={!student.isTeacher ? "Click to view student profile details" : ""}
                  >
                    {!student.isTeacher && (
                      <span className="text-slate-500 dark:text-slate-400 font-mono font-bold mr-1.5 shrink-0">
                        {student.rollNo || student.studentId || student.rollNumber || studentIndex++}.
                      </span>
                    )}
                    <span className="group-hover/name:underline underline-offset-2">
                      {student.userName || student.name || "Student"}
                    </span>
                  </button>
                </div>


                {studentUpdating && !loadingAttendance && (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                )}
              </div>
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

                // Check if date is before student's enrollment date
                const enrollDateStr = !student.isTeacher && student.enrollmentDate
                  ? String(student.enrollmentDate).substring(0, 10)
                  : null;
                const isBeforeEnrollment = enrollDateStr ? fullDate < enrollDateStr : false;

                if (isBeforeEnrollment) {
                  return (
                    <td
                      key={date}
                      className={`${cell} border border-slate-200 dark:border-slate-800 text-center relative bg-slate-100/70 dark:bg-slate-900/70 text-slate-400 dark:text-slate-500 font-extrabold select-none`}
                      title={`Before enrollment date (${enrollDateStr})`}
                    >
                      X
                    </td>
                  );
                }

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

                  if (firstNonTeacherIdx !== -1 && idx !== firstNonTeacherIdx) {
                    return null;
                  }

                  const holidayName = holidayData?.holidayText || "HOLIDAY";
                  const spanRows = nonTeacherCount > 0 ? nonTeacherCount : 1;

                  return (
                    <td
                      key={date}
                      rowSpan={spanRows}
                      className="border border-rose-300 dark:border-rose-900/80 text-center align-middle bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 font-bold select-none p-1 relative hover:bg-rose-200/90 dark:hover:bg-rose-900/90 transition-colors shadow-inner"
                      title={`Holiday: ${holidayName}`}
                    >
                      <div className="flex items-center justify-center h-full w-full py-4 min-h-[140px]">
                        <span
                          className="inline-block transform rotate-180 whitespace-nowrap tracking-widest font-black text-xs sm:text-sm uppercase text-rose-800 dark:text-rose-200 select-none drop-shadow-xs"
                          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                        >
                          {holidayName}
                        </span>
                      </div>
                    </td>
                  );
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

                    <AttendanceStatusBadge status={status} variant="plain" />
                  </td>
                );
              })}


            {/* ── MONTHLY SUMMARY STATS (Pre-aggregated monthlyAttendanceStats Collection Row) ── */}
            {columnVisibility.summary && (() => {
              const preStat = currentMonthlyStatsMap?.get(student.userId);
              const markedWorkingDays = rawPresentDays + currentMonthAbsentDays + currentMonthCasualLeaves + currentMonthSickLeaves + currentMonthSpecialLeaves + currentMonthOnDutyLeaves;

              const displayWorkingDays = preStat?.workingDays !== undefined ? preStat.workingDays : currentMonthWorkingDays;
              const displayRawPresent = preStat?.presentDays !== undefined ? preStat.presentDays : rawPresentDays;
              const displayAbsentDays = preStat?.absentDays !== undefined ? preStat.absentDays : currentMonthAbsentDays;
              const displayCasualLeaves = preStat?.casualLeaves !== undefined ? preStat.casualLeaves : currentMonthCasualLeaves;
              const displaySickLeaves = preStat?.sickLeaves !== undefined ? preStat.sickLeaves : currentMonthSickLeaves;
              const displaySpecialLeaves = preStat?.specialLeaves !== undefined ? preStat.specialLeaves : currentMonthSpecialLeaves;
              const displayPercentage = preStat?.attendancePercentage !== undefined ? preStat.attendancePercentage : currentMonthPercentage;

              return (
                <>
                  <td title={`Work Days marked so far: ${displayWorkingDays} (Total Calendar Work Days: ${currentMonthWorkingDays})`} className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 font-semibold text-slate-800 dark:text-slate-200 text-[10px] px-0.5`}>
                    {displayWorkingDays}
                  </td>
                  <td title="Physical Present Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] px-0.5`}>
                    {displayRawPresent}
                  </td>
                  <td title="Absent Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-0.5`}>
                    {displayAbsentDays}
                  </td>
                  <td title="Casual Leaves (CL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-0.5`}>
                    {displayCasualLeaves}
                  </td>
                  <td title="Sick Leaves (SL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-sky-50/40 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 font-extrabold text-[10px] px-0.5`}>
                    {displaySickLeaves}
                  </td>
                  <td title="Special Leaves (SPL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] px-0.5`}>
                    {displaySpecialLeaves}
                  </td>
                  <td title="This Month Percentage" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 font-black text-[10px] px-0.5`}>
                    <span
                      className={
                        Number(displayPercentage) >= 75
                          ? "text-emerald-700 dark:text-emerald-400"
                          : Number(displayPercentage) >= 50
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-rose-700 dark:text-rose-400"
                      }
                    >
                      {displayPercentage}%
                    </span>
                  </td>
                </>
              );
            })()}
          </tr>
        );
      })}
    </tbody>
  );
};

export default AttendanceTableBody;
