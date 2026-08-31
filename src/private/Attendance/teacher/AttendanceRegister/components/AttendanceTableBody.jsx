import React from "react";
import { LoaderCircle, Clock } from "lucide-react";
import AttendanceStatusBadge from "@/components/components/AttendanceStatusBadge";
import { formatAttendanceTime } from "@/services/attendanceTrackingService";
import { useAttendanceMatrix } from "../hooks/useAttendanceMatrix";

const AttendanceTableBody = ({
  students,
  monthDates,
  selectedMonth,
  holidays,
  attendanceMap,
  rawAttendanceMap,
  currentMonthlyStatsMap,
  calculatePreviousMonthsData,
  formatDate,
  onAttendanceStatusChange,
  updatingAttendance,
  isStudentUpdating,
  loadingAttendance = false,
  loadingStats = false,
  columnVisibility = { previous: true, daily: true, summary: true },
  compactView = false,
  nameWidthProp,
  onOpenStudentAttendanceModal,
  onOpenStudentProfile,
  matrixData, // Optional pre-calculated matrix from parent
}) => {
  const cell = compactView ? "py-1 px-1 text-[11px]" : "py-1.5 px-2 text-xs";
  const stickyCell = compactView ? "py-1.5 px-1.5 text-xs" : "py-1.5 px-2 text-xs sm:text-sm";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const defaultNameWidth = compactView ? (isMobile ? 120 : 140) : (isMobile ? 140 : 180);
  const nameWidth = nameWidthProp !== undefined ? nameWidthProp : defaultNameWidth;

  const nameColStyle = {
    width: `${nameWidth}px`,
    minWidth: `${nameWidth}px`,
    maxWidth: `${nameWidth}px`,
  };

  // Compute or reuse formatted attendance matrix
  const internalMatrix = useAttendanceMatrix({
    students,
    monthDates,
    selectedMonth,
    holidays,
    attendanceMap,
    rawAttendanceMap,
    calculatePreviousMonthsData,
    formatDate,
  });

  const {
    teacherRows,
    studentRows,
    nonTeacherCount,
    hasAnyHolidaysInMonth,
  } = matrixData || internalMatrix;

  return (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
      {/* ── 1. TEACHER ROW(S) ── */}
      {teacherRows.map(({ student, idx, days, stats }) => {
        const studentUpdating = isStudentUpdating(student.userId);

        return (
          <tr
            key={student.userId || idx}
            className={`transition-colors duration-150 bg-purple-100/70 dark:bg-purple-950/70 hover:bg-purple-200/80 dark:hover:bg-purple-900/80 ${
              studentUpdating ? "opacity-60" : ""
            }`}
            onClick={() => onOpenStudentAttendanceModal(student)}
          >
            {columnVisibility.previous && (
              <>
                <td title="Work Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 font-semibold text-slate-800 dark:text-slate-200 text-[10px] px-0.5`}>
                  {loadingStats ? <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" /> : stats.prevMonthWorkingDays}
                </td>
                <td title="Physical Present Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" /> : stats.prevMonthRawPresent}
                </td>
                <td title="Absent Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" /> : stats.prevMonthAbsentDays}
                </td>
                <td title="Casual Leaves (CL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-amber-50/40 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-amber-600 dark:text-amber-400" /> : stats.prevMonthCasual}
                </td>
                <td title="Sick Leaves (SL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-sky-50/40 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-sky-600 dark:text-sky-400" /> : stats.prevMonthSick}
                </td>
                <td title="Special Leaves (SPL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-purple-50/40 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-purple-600 dark:text-purple-400" /> : stats.prevMonthSpecial}
                </td>
                <td title="Previous Percentage" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 font-black text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span className={Number(stats.prevMonthPercentage) >= 75 ? "text-emerald-700 dark:text-emerald-400" : Number(stats.prevMonthPercentage) >= 50 ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400"}>
                      {stats.prevMonthPercentage}%
                    </span>
                  )}
                </td>
              </>
            )}

            <td style={nameColStyle} className={`${stickyCell} border border-slate-200 dark:border-slate-800 sticky left-0 z-20 bg-purple-100 dark:bg-purple-950 font-semibold text-slate-900 dark:text-white box-border`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-xs truncate leading-snug text-slate-900 dark:text-white">
                  {student.userName || student.name || "Instructor"}
                </span>
                {studentUpdating && !loadingAttendance && (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                )}
              </div>
            </td>

            {columnVisibility.daily &&
              days.map((day) => {
                const cellUpdating = updatingAttendance.get(`${student.userId}-${day.fullDate}`);

                if (day.isHoliday) {
                  return (
                    <td
                      key={day.date}
                      title={`Date: ${day.dateTitleFmt}\nHoliday: ${day.holidayText}${day.status ? `\nStatus: ${day.status}` : ""}\nCampus Holiday • Instructor Exempted`}
                      className={`${cell} border border-rose-200 dark:border-rose-900/60 text-center relative bg-rose-50/85 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 select-none p-0.5`}
                    >
                      {cellUpdating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-100/80 dark:bg-indigo-900/60 z-10">
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                        </div>
                      )}
                      <AttendanceStatusBadge status={day.status || "H"} variant="plain" />
                    </td>
                  );
                }

                return (
                  <td
                    key={day.date}
                    className={`${cell} border border-slate-200 dark:border-slate-800 text-center relative hover:bg-purple-200/50 dark:hover:bg-purple-900/50`}
                  >
                    {cellUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-indigo-100/80 dark:bg-indigo-900/60 z-10">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                    <AttendanceStatusBadge status={day.status} variant="plain" />
                  </td>
                );
              })}

            {columnVisibility.summary && (() => {
              const preStat = currentMonthlyStatsMap?.get(student.userId);
              const displayWorkingDays = preStat?.workingDays !== undefined ? preStat.workingDays : stats.currentMonthWorkingDays;
              const displayRawPresent = preStat?.presentDays !== undefined ? preStat.presentDays : stats.rawPresentDays;
              const displayAbsentDays = preStat?.absentDays !== undefined ? preStat.absentDays : stats.currentMonthAbsentDays;
              const displayCasualLeaves = preStat?.casualLeaves !== undefined ? preStat.casualLeaves : stats.currentMonthCasualLeaves;
              const displaySickLeaves = preStat?.sickLeaves !== undefined ? preStat.sickLeaves : stats.currentMonthSickLeaves;
              const displaySpecialLeaves = preStat?.specialLeaves !== undefined ? preStat.specialLeaves : stats.currentMonthSpecialLeaves;
              const displayPercentage = preStat?.attendancePercentage !== undefined ? preStat.attendancePercentage : stats.currentMonthPercentage;

              return (
                <>
                  <td title="Work Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 font-semibold text-slate-800 dark:text-slate-200 text-[10px] px-0.5`}>
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
                    <span className={Number(displayPercentage) >= 75 ? "text-emerald-700 dark:text-emerald-400" : Number(displayPercentage) >= 50 ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400"}>
                      {displayPercentage}%
                    </span>
                  </td>
                </>
              );
            })()}
          </tr>
        );
      })}

      {/* ── 2. DEDICATED HOLIDAY ANCHOR ROW (Holds vertical 180° holiday text spanned across all students) ── */}
      {hasAnyHolidaysInMonth && nonTeacherCount > 0 && (
        <tr
          className="h-0 p-0 m-0 border-0 leading-none"
          style={{ height: 0, padding: 0, margin: 0, border: 0 }}
        >
          {columnVisibility.previous && (
            <>
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
            </>
          )}

          {/* Invisible Name Cell for table alignment */}
          <td
            style={{ ...nameColStyle, height: 0, padding: 0 }}
            className="p-0 h-0 border-0 border-transparent leading-none text-[0px] sticky left-0 z-20"
          />

          {/* Daily Date Columns */}
          {columnVisibility.daily &&
            monthDates.map((date) => {
              const sy = selectedMonth.getFullYear();
              const sm = selectedMonth.getMonth();
              const dateObj = new Date(sy, sm, date);
              const fullDate = formatDate(dateObj, "yyyy-MM-dd");
              const dateTitleFmt = formatDate(dateObj, "dd MMM yyyy (EEE)");
              const isHoliday = holidays?.has(fullDate);
              const holidayData = isHoliday ? holidays.get(fullDate) : null;
              const holidayText = holidayData?.holidayText || "Holiday";

              if (isHoliday) {
                return (
                  <td
                    key={`holiday-anchor-${date}`}
                    rowSpan={nonTeacherCount + 1}
                    title={`Date: ${dateTitleFmt}\nHoliday: ${holidayText}\nCampus Holiday • All Students Exempted`}
                    className={`${cell} border border-rose-200 dark:border-rose-900/60 text-center relative bg-rose-50/90 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 select-none hover:bg-rose-100/90 dark:hover:bg-rose-900/60 transition-colors p-0 align-middle`}
                  >
                    <div className="flex items-center justify-center h-full min-h-[60px] w-full py-2 px-0.5">
                      <span
                        className="[writing-mode:vertical-rl] rotate-180 select-none whitespace-nowrap tracking-widest font-black text-[11px] sm:text-xs text-rose-700 dark:text-rose-300 uppercase inline-block drop-shadow-2xs"
                        title={holidayText}
                      >
                        {holidayText || "HOLIDAY"}
                      </span>
                    </div>
                  </td>
                );
              }

              return (
                <td
                  key={`empty-anchor-${date}`}
                  className="p-0 h-0 border-0 border-transparent leading-none text-[0px]"
                  style={{ height: 0, padding: 0 }}
                />
              );
            })}

          {columnVisibility.summary && (
            <>
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
              <td className="p-0 h-0 border-0 border-transparent leading-none text-[0px]" style={{ height: 0, padding: 0 }} />
            </>
          )}
        </tr>
      )}

      {/* ── 3. STUDENT ROWS (Uniform logic for every single student) ── */}
      {studentRows.map(({ student, days, stats }, studentIdx) => {
        const studentUpdating = isStudentUpdating(student.userId);
        const isRowEven = studentIdx % 2 === 0;

        const rowBgClass = isRowEven
          ? "bg-white dark:bg-slate-900 hover:bg-indigo-50/70 dark:hover:bg-slate-800/80"
          : "bg-slate-100/60 dark:bg-slate-950 hover:bg-indigo-50/70 dark:hover:bg-slate-800/80";

        const stickyBgClass = isRowEven
          ? "bg-white dark:bg-slate-900"
          : "bg-slate-100 dark:bg-slate-950";

        return (
          <tr
            key={student.userId || studentIdx}
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
                    stats.prevMonthWorkingDays
                  )}
                </td>
                <td title="Physical Present Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    stats.prevMonthRawPresent
                  )}
                </td>
                <td title="Absent Days" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    stats.prevMonthAbsentDays
                  )}
                </td>
                <td title="Casual Leaves (CL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-amber-50/40 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-amber-600 dark:text-amber-400" />
                  ) : (
                    stats.prevMonthCasual
                  )}
                </td>
                <td title="Sick Leaves (SL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-sky-50/40 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-sky-600 dark:text-sky-400" />
                  ) : (
                    stats.prevMonthSick
                  )}
                </td>
                <td title="Special Leaves (SPL)" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-purple-50/40 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-purple-600 dark:text-purple-400" />
                  ) : (
                    stats.prevMonthSpecial
                  )}
                </td>
                <td title="Previous Percentage" className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/30 font-black text-[10px] px-0.5`}>
                  {loadingStats ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span
                      className={
                        Number(stats.prevMonthPercentage) >= 75
                          ? "text-emerald-700 dark:text-emerald-400"
                          : Number(stats.prevMonthPercentage) >= 50
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-rose-700 dark:text-rose-400"
                      }
                    >
                      {stats.prevMonthPercentage}%
                    </span>
                  )}
                </td>
              </>
            )}

            {/* ── STUDENT NAME CELL (Sticky) ── */}
            <td style={nameColStyle} className={`${stickyCell} border border-slate-200 dark:border-slate-800 sticky left-0 z-20 ${stickyBgClass} font-semibold text-slate-900 dark:text-white box-border`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex flex-col flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenStudentProfile) {
                        onOpenStudentProfile(student);
                      }
                    }}
                    className="font-bold text-xs truncate leading-snug text-left transition-colors text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 cursor-pointer group/name"
                    title="Click to view student profile details"
                  >
                    <span className="text-slate-500 dark:text-slate-400 font-mono font-bold mr-1.5 shrink-0">
                      {student.rollNo || student.studentId || student.rollNumber || (studentIdx + 1)}.
                    </span>
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
              days.map((day) => {
                const cellUpdating = updatingAttendance.get(`${student.userId}-${day.fullDate}`);

                // 1. Holiday Date: Handled by dedicated anchor row spanning across all students
                if (day.isHoliday) {
                  return null;
                }

                // 2. Not Enrolled Date (Render bold 'X')
                if (day.isNotEnrolled) {
                  return (
                    <td
                      key={day.date}
                      className={`${cell} border border-slate-200 dark:border-slate-800 text-center relative bg-slate-100/80 dark:bg-slate-900/80 text-slate-400 dark:text-slate-500 font-black text-xs select-none`}
                      title={`Student: ${student.userName || 'Student'}\nDate: ${day.dateTitleFmt}\nStatus: Not Enrolled Yet (Enrollment Date: ${day.enrollDateStr})`}
                    >
                      X
                    </td>
                  );
                }

                // 3. Normal Working Day cell
                const rawRecord = day.rawRecord;
                const markedAtStr = rawRecord ? formatAttendanceTime(rawRecord, "hh:mm a") : null;

                const getStatusInfo = (st) => {
                  const s = String(st || "").toLowerCase();
                  if (["present", "p"].includes(s)) return { label: "Present", colorCls: "text-emerald-400 bg-emerald-950/80 border-emerald-800" };
                  if (["absent", "a"].includes(s)) return { label: "Absent", colorCls: "text-rose-400 bg-rose-950/80 border-rose-800" };
                  if (["casual", "cl"].includes(s)) return { label: "Casual Leave", colorCls: "text-amber-400 bg-amber-950/80 border-amber-800" };
                  if (["sick", "sl"].includes(s)) return { label: "Sick Leave", colorCls: "text-sky-400 bg-sky-950/80 border-sky-800" };
                  if (["special", "spl"].includes(s)) return { label: "Special Leave", colorCls: "text-purple-400 bg-purple-950/80 border-purple-800" };
                  if (["on_duty", "od"].includes(s)) return { label: "On Duty", colorCls: "text-teal-400 bg-teal-950/80 border-teal-800" };
                  if (["half_day", "hd"].includes(s)) return { label: "Half Day", colorCls: "text-yellow-400 bg-yellow-950/80 border-yellow-800" };
                  if (["late", "l"].includes(s)) return { label: "Late", colorCls: "text-indigo-400 bg-indigo-950/80 border-indigo-800" };
                  return { label: "Not Marked", colorCls: "text-slate-400 bg-slate-800/80 border-slate-700" };
                };

                const stInfo = getStatusInfo(day.status);
                const nativeTooltip = rawRecord
                  ? `Student: ${student.userName || student.name || 'Student'}\nDate: ${day.dateTitleFmt}\nStatus: ${stInfo.label}\nMarked At: ${markedAtStr || 'N/A'}${rawRecord.remarks ? `\nRemarks: ${rawRecord.remarks}` : ''}${rawRecord.source ? `\nSource: ${rawRecord.source}` : ''}`
                  : `Student: ${student.userName || student.name || 'Student'}\nDate: ${day.dateTitleFmt}\nStatus: ${stInfo.label}`;

                const isTopRow = studentIdx < 2;
                const tooltipPos = isTopRow ? "top-full mt-1.5" : "bottom-full mb-1.5";
                const arrowPos = isTopRow ? "bottom-full border-b-slate-900 dark:border-b-slate-950" : "top-full border-t-slate-900 dark:border-t-slate-950";

                return (
                  <td
                    key={day.date}
                    title={nativeTooltip}
                    className={`${cell} border border-slate-200 dark:border-slate-800 text-center relative group cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-slate-800/60`}
                  >
                    {cellUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-indigo-100/80 dark:bg-indigo-900/60 z-10">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}

                    <AttendanceStatusBadge status={day.status} variant="plain" />

                    {/* Hover Tooltip Card */}
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 ${tooltipPos} hidden group-hover:flex flex-col gap-1 z-40 w-48 p-2.5 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[11px] font-medium rounded-xl shadow-2xl border border-slate-700/60 backdrop-blur-md pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95`}
                    >
                      <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800">
                        <span className="font-bold text-slate-300 text-[10px]">{day.dateTitleFmt}</span>
                        <span className={`font-black px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wider ${stInfo.colorCls}`}>
                          {stInfo.label}
                        </span>
                      </div>

                      {rawRecord ? (
                        <>
                          <div className="flex items-center justify-between text-slate-300 pt-0.5">
                            <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                              Marked At:
                            </span>
                            <span className="font-bold text-emerald-400 text-[11px]">
                              {markedAtStr || "—"}
                            </span>
                          </div>

                          {rawRecord.remarks && (
                            <div className="text-slate-200 text-[10px] bg-slate-800/80 p-1.5 rounded border border-slate-700/50 mt-0.5 text-left">
                              <span className="text-slate-400 font-semibold block text-[9px]">Remarks:</span>
                              <p className="line-clamp-2">{rawRecord.remarks}</p>
                            </div>
                          )}

                          {rawRecord.source && (
                            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                              <span>Source:</span>
                              <span className="font-mono text-slate-300 uppercase font-semibold">{rawRecord.source}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-slate-400 italic text-[10px] py-0.5">
                          Not marked
                        </div>
                      )}

                      <div className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${arrowPos}`} />
                    </div>
                  </td>
                );
              })}

            {/* ── MONTHLY SUMMARY STATS (Pre-aggregated monthlyAttendanceStats Collection Row) ── */}
            {columnVisibility.summary && (() => {
              const preStat = currentMonthlyStatsMap?.get(student.userId);
              const displayWorkingDays = preStat?.workingDays !== undefined ? preStat.workingDays : stats.currentMonthWorkingDays;
              const displayRawPresent = preStat?.presentDays !== undefined ? preStat.presentDays : stats.rawPresentDays;
              const displayAbsentDays = preStat?.absentDays !== undefined ? preStat.absentDays : stats.currentMonthAbsentDays;
              const displayCasualLeaves = preStat?.casualLeaves !== undefined ? preStat.casualLeaves : stats.currentMonthCasualLeaves;
              const displaySickLeaves = preStat?.sickLeaves !== undefined ? preStat.sickLeaves : stats.currentMonthSickLeaves;
              const displaySpecialLeaves = preStat?.specialLeaves !== undefined ? preStat.specialLeaves : stats.currentMonthSpecialLeaves;
              const displayPercentage = preStat?.attendancePercentage !== undefined ? preStat.attendancePercentage : stats.currentMonthPercentage;

              return (
                <>
                  <td title={`Work Days marked so far: ${displayWorkingDays} (Total Calendar Work Days: ${stats.currentMonthWorkingDays})`} className={`${cell} border border-slate-200 dark:border-slate-800 text-center bg-blue-50/40 dark:bg-blue-950/20 font-semibold text-slate-800 dark:text-slate-200 text-[10px] px-0.5`}>
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
