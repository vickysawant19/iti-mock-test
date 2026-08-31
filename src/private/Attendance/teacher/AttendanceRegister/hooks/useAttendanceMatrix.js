import { useMemo } from "react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * useAttendanceMatrix Hook
 * ═════════════════════════════════════════════════════════════════════════════
 * High-performance memoized hook that transforms raw students, attendance records,
 * and holidays into a clean, pre-calculated matrix.
 *
 * Features:
 * - Pre-formats daily attendance status, holiday flags, and pre-enrollment ('X') flags
 * - Pre-computes per-student monthly statistics (work days, presents, absents, leaves breakdown, %)
 * - Pre-computes daily column totals for footer summary (presents, absents, total marked)
 * - Identifies teacher vs non-teacher rows
 * - Detects presence of campus holidays in the selected month
 */
export const useAttendanceMatrix = ({
  students = [],
  monthDates = [],
  selectedMonth,
  holidays = new Map(),
  attendanceMap = new Map(),
  rawAttendanceMap = new Map(),
  calculatePreviousMonthsData = new Map(),
  formatDate,
}) => {
  const sy = selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear();
  const sm = selectedMonth ? selectedMonth.getMonth() + 1 : new Date().getMonth() + 1; // 1-12

  /**
   * 1. Check if any date in the active monthDates is a marked campus holiday
   */
  const hasAnyHolidaysInMonth = useMemo(() => {
    if (!holidays || holidays.size === 0 || !monthDates || monthDates.length === 0 || !formatDate) {
      return false;
    }
    return monthDates.some((date) => {
      const fullDate = formatDate(new Date(sy, sm - 1, date), "yyyy-MM-dd");
      return holidays.has(fullDate);
    });
  }, [holidays, monthDates, sy, sm, formatDate]);

  /**
   * 2. Pre-format all student rows and dates in a single pass
   */
  const formattedRows = useMemo(() => {
    if (!students || students.length === 0 || !formatDate) return [];

    return students.map((student, idx) => {
      const studentRecords = attendanceMap?.get(student.userId) || new Map();
      const rawStudentRecords = rawAttendanceMap?.get(student.userId) || new Map();
      const prevMonthData = calculatePreviousMonthsData?.get(student.userId) || {
        workingDays: 0,
        presentDays: 0,
        absentDays: 0,
      };

      // Normalized enrollment date string YYYY-MM-DD
      const enrollDateStr = !student.isTeacher && student.enrollmentDate
        ? String(student.enrollmentDate).substring(0, 10)
        : null;

      let rawPresentDays = 0;
      let currentMonthWorkingDays = 0;
      let currentMonthAbsentDays = 0;
      let currentMonthCasualLeaves = 0;
      let currentMonthSickLeaves = 0;
      let currentMonthSpecialLeaves = 0;
      let currentMonthOnDutyLeaves = 0;

      // Process all active dates in monthDates
      const days = monthDates.map((date) => {
        const dateObj = new Date(sy, sm - 1, date);
        const fullDate = formatDate(dateObj, "yyyy-MM-dd");
        const dateTitleFmt = formatDate(dateObj, "dd MMM yyyy (EEE)");

        // 1. Check if date is before student's enrollment date
        const isNotEnrolled = enrollDateStr ? fullDate < enrollDateStr : false;

        // 2. Check if date is a holiday
        const isHoliday = holidays?.has(fullDate) || false;
        const holidayData = isHoliday ? holidays.get(fullDate) : null;
        const holidayText = holidayData?.holidayText || "Holiday";

        // 3. Attendance record: object if marked, or null
        const statusRaw = studentRecords.get(fullDate) || null;
        const rawRecord = rawStudentRecords.get(fullDate) || null;

        // 4. Calculate working days & attendance stats for valid enrolled working days
        if (!isNotEnrolled && !isHoliday) {
          currentMonthWorkingDays++;
          const s = String(statusRaw || "").toLowerCase();
          if (s === "present" || s === "p") rawPresentDays++;
          else if (s === "absent" || s === "a") currentMonthAbsentDays++;
          else if (["casual", "cl"].includes(s)) currentMonthCasualLeaves++;
          else if (["sick", "sl"].includes(s)) currentMonthSickLeaves++;
          else if (["special", "spl"].includes(s)) currentMonthSpecialLeaves++;
          else if (["on_duty", "od"].includes(s)) currentMonthOnDutyLeaves++;
          else if (s === "leave") currentMonthCasualLeaves++;
        }

        return {
          date,
          fullDate,
          dateObj,
          dateTitleFmt,
          isNotEnrolled,
          enrollDateStr,
          isHoliday,
          holidayData,
          holidayText,
          status: statusRaw,
          rawRecord,
        };
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

      // Previous month statistics normalization
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

      return {
        student,
        idx,
        days,
        stats: {
          rawPresentDays,
          currentMonthWorkingDays,
          currentMonthAbsentDays,
          currentMonthCasualLeaves,
          currentMonthSickLeaves,
          currentMonthSpecialLeaves,
          currentMonthOnDutyLeaves,
          currentMonthPresentDays,
          currentMonthPercentage,
          prevMonthWorkingDays,
          prevMonthCasual,
          prevMonthSick,
          prevMonthSpecial,
          prevMonthOnDuty,
          prevMonthRawPresent,
          prevMonthAbsentDays,
          prevMonthPercentage,
        },
      };
    });
  }, [
    students,
    monthDates,
    sy,
    sm,
    holidays,
    attendanceMap,
    rawAttendanceMap,
    calculatePreviousMonthsData,
    formatDate,
  ]);

  /**
   * 3. Separate teacher vs non-teacher student rows
   */
  const teacherRows = useMemo(
    () => formattedRows.filter((r) => r.student.isTeacher),
    [formattedRows]
  );

  const studentRows = useMemo(
    () => formattedRows.filter((r) => !r.student.isTeacher),
    [formattedRows]
  );

  const nonTeacherCount = studentRows.length;

  /**
   * 4. Pre-compute daily column totals for footer (O(1) lookup per footer cell)
   */
  const dailyColumnTotals = useMemo(() => {
    if (!studentRows || studentRows.length === 0 || !monthDates || monthDates.length === 0) {
      return new Map();
    }

    const totalsMap = new Map();

    monthDates.forEach((date, dateIdx) => {
      let presentCount = 0;
      let absentCount = 0;
      let totalMarkedCount = 0;

      studentRows.forEach((row) => {
        const day = row.days[dateIdx];
        if (!day || day.isHoliday || day.isNotEnrolled) return;

        const s = String(day.status || "").toLowerCase();
        if (s === "present" || s === "p") {
          presentCount++;
          totalMarkedCount++;
        } else if (s === "absent" || s === "a") {
          absentCount++;
          totalMarkedCount++;
        } else if (["casual", "cl", "sick", "sl", "special", "spl", "on_duty", "od", "half_day", "hd", "late", "l", "leave"].includes(s)) {
          totalMarkedCount++;
        }
      });

      totalsMap.set(date, {
        presentCount,
        absentCount,
        totalMarkedCount,
      });
    });

    return totalsMap;
  }, [studentRows, monthDates]);

  return {
    formattedRows,
    teacherRows,
    studentRows,
    nonTeacherCount,
    hasAnyHolidaysInMonth,
    dailyColumnTotals,
  };
};

export default useAttendanceMatrix;
