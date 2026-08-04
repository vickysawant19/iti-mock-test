import { format, eachDayOfInterval, parseISO, isSunday } from "date-fns";

class AttendanceAnalyticsService {
  /**
   * Resolves calendar days for a given date range using existing holiday collection overlay.
   * DayTypes: "WORKING" | "HOLIDAY" | "EXAM" | "EVENT" | "SUNDAY"
   */
  resolveBatchCalendar({ startDate, endDate, holidayList = [] }) {
    if (!startDate || !endDate) return [];

    const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
    const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

    const holidayMap = new Map();
    (holidayList || []).forEach((h) => {
      if (h?.date) {
        holidayMap.set(h.date, h);
      }
    });

    const days = eachDayOfInterval({ start, end });

    return days.map((dateObj) => {
      const dateStr = format(dateObj, "yyyy-MM-dd");
      const holidayDoc = holidayMap.get(dateStr);

      if (holidayDoc) {
        return {
          date: dateStr,
          dayType: holidayDoc.dayType || holidayDoc.type || "HOLIDAY",
          title: holidayDoc.title || holidayDoc.description || "Holiday",
          holidayId: holidayDoc.$id,
        };
      }

      if (isSunday(dateObj)) {
        return {
          date: dateStr,
          dayType: "SUNDAY",
          title: "Sunday",
          holidayId: null,
        };
      }

      return {
        date: dateStr,
        dayType: "WORKING",
        title: "Working Day",
        holidayId: null,
      };
    });
  }

  /**
   * Calculates attendance percentage accurately.
   */
  calculatePercentage(presentDays, totalWorkingDays) {
    if (!totalWorkingDays || totalWorkingDays <= 0) return 0;
    const pct = (presentDays / totalWorkingDays) * 100;
    return Math.min(100, Math.max(0, parseFloat(pct.toFixed(2))));
  }

  /**
   * Normalizes raw attendance status and dayType from legacy or new records.
   */
  normalizeRecord(record) {
    if (!record) return null;

    const rawDayType = record.dayType;
    const isHolidayFlag = Boolean(record.isHoliday);
    const dayType = rawDayType || (isHolidayFlag ? "HOLIDAY" : "WORKING");

    const rawStatus = String(record.attendanceStatus || record.status || "").trim().toLowerCase();

    let attendanceStatus = "NOT_MARKED";
    let leaveType = record.leaveType || null;

    if (["present", "p"].includes(rawStatus)) {
      attendanceStatus = "PRESENT";
    } else if (["absent", "a"].includes(rawStatus)) {
      attendanceStatus = "ABSENT";
    } else if (["late", "l"].includes(rawStatus)) {
      attendanceStatus = "LATE";
    } else if (["half_day", "halfday", "hd"].includes(rawStatus)) {
      attendanceStatus = "HALF_DAY";
    } else if (["casual", "cl"].includes(rawStatus)) {
      attendanceStatus = "LEAVE";
      leaveType = "CASUAL";
    } else if (["sick", "sl"].includes(rawStatus)) {
      attendanceStatus = "LEAVE";
      leaveType = "SICK";
    } else if (["special", "spl"].includes(rawStatus)) {
      attendanceStatus = "LEAVE";
      leaveType = "SPECIAL";
    } else if (["on_duty", "od"].includes(rawStatus)) {
      attendanceStatus = "LEAVE";
      leaveType = "ON_DUTY";
    } else if (["leave", "l"].includes(rawStatus)) {
      attendanceStatus = "LEAVE";
      leaveType = leaveType ? String(leaveType).toUpperCase() : "CASUAL";
    }

    return {
      ...record,
      dayType,
      attendanceStatus,
      leaveType,
      source: record.source || "MANUAL",
      revision: record.revision || 1,
      syncStatus: record.syncStatus || "SYNCED",
    };
  }

  /**
   * Calculates annual leave quotas and remaining balances for a student/teacher.
   * Quotas:
   *  - Casual Leave (CL): 12 days / year
   *  - Sick Leave (SL): 15 days / year (split in max 2 spells)
   *  - Special Leave (SPL): Unlimited / Not deducted from quota
   *  - On Duty (OD): Unlimited / Not deducted from quota
   */
  calculateLeaveQuota(records = [], targetYear = null) {
    const CL_TOTAL = 12;
    const SL_TOTAL = 15;
    const SL_SPELLS_MAX = 2;

    const normalized = (records || []).map((r) => this.normalizeRecord(r)).filter(Boolean);

    const yearFiltered = targetYear
      ? normalized.filter((r) => {
          if (!r.date) return false;
          const y = new Date(r.date).getFullYear();
          return y === Number(targetYear);
        })
      : normalized;

    let clUsed = 0;
    let splUsed = 0;
    let odUsed = 0;
    const sickDates = [];

    yearFiltered.forEach((rec) => {
      if (rec.attendanceStatus === "LEAVE") {
        const lt = String(rec.leaveType || "").toUpperCase();
        if (lt === "CASUAL" || lt === "CL") {
          clUsed += 1;
        } else if (lt === "SICK" || lt === "SL") {
          if (rec.date) sickDates.push(rec.date);
        } else if (lt === "SPECIAL" || lt === "SPL") {
          splUsed += 1;
        } else if (lt === "ON_DUTY" || lt === "OD") {
          odUsed += 1;
        } else {
          clUsed += 1;
        }
      }
    });

    const slDaysUsed = sickDates.length;
    let slSpellsUsed = 0;

    if (sickDates.length > 0) {
      const sortedDates = [...sickDates].sort((a, b) => new Date(a) - new Date(b));
      slSpellsUsed = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          slSpellsUsed += 1;
        }
      }
    }

    const clRemaining = Math.max(0, CL_TOTAL - clUsed);
    const slDaysRemaining = Math.max(0, SL_TOTAL - slDaysUsed);
    const slSpellsRemaining = Math.max(0, SL_SPELLS_MAX - slSpellsUsed);

    return {
      clTotal: CL_TOTAL,
      clUsed,
      clRemaining,
      slTotalDays: SL_TOTAL,
      slDaysUsed,
      slDaysRemaining,
      slMaxSpells: SL_SPELLS_MAX,
      slSpellsUsed,
      slSpellsRemaining,
      splUsed,
      odUsed,
      isClExceeded: clUsed > CL_TOTAL,
      isSlDaysExceeded: slDaysUsed > SL_TOTAL,
      isSlSpellsExceeded: slSpellsUsed > SL_SPELLS_MAX,
    };
  }

  /**
   * Computes comprehensive statistics for a dataset of attendance records and optional calendar range.
   */
  computeStats({ records = [], holidayList = [], startDate = null, endDate = null }) {
    const normalizedRecords = (records || []).map((r) => this.normalizeRecord(r)).filter(Boolean);

    let workingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let holidayDays = 0;
    let leaveDays = 0;

    const leaveBreakdown = {
      CASUAL: 0,
      SICK: 0,
      ON_DUTY: 0,
      SPECIAL: 0,
    };

    const monthlyAttendance = {};

    normalizedRecords.forEach((record) => {
      const dateStr = record.date;
      if (!dateStr) return;

      const monthKey = format(parseISO(dateStr), "MMMM yyyy");

      if (!monthlyAttendance[monthKey]) {
        monthlyAttendance[monthKey] = {
          workingDays: 0,
          presentDays: 0,
          absentDays: 0,
          holidayDays: 0,
          leaveDays: 0,
        };
      }

      if (record.dayType === "WORKING") {
        workingDays++;
        monthlyAttendance[monthKey].workingDays++;

        if (record.attendanceStatus === "PRESENT") {
          presentDays++;
          monthlyAttendance[monthKey].presentDays++;
        } else if (record.attendanceStatus === "ABSENT") {
          absentDays++;
          monthlyAttendance[monthKey].absentDays++;
        } else if (record.attendanceStatus === "LATE") {
          lateDays++;
          presentDays++; // Count late as present in overall count
          monthlyAttendance[monthKey].presentDays++;
        } else if (record.attendanceStatus === "HALF_DAY") {
          halfDays++;
          presentDays += 0.5;
          monthlyAttendance[monthKey].presentDays += 0.5;
        } else if (record.attendanceStatus === "LEAVE") {
          leaveDays++;
          monthlyAttendance[monthKey].leaveDays++;
          if (record.leaveType && leaveBreakdown[record.leaveType] !== undefined) {
            leaveBreakdown[record.leaveType]++;
          } else {
            leaveBreakdown.CASUAL++;
          }
          // Leaves (CL, SL, SPL, OD) count towards total present days
          presentDays++;
          monthlyAttendance[monthKey].presentDays++;
        }
      } else if (record.dayType === "HOLIDAY") {
        holidayDays++;
        monthlyAttendance[monthKey].holidayDays++;
      }
    });

    // If date range is provided, derive Ground Truth Working Days from Calendar overlay
    let groundTruthWorkingDays = workingDays;
    if (startDate && endDate) {
      const calendarDays = this.resolveBatchCalendar({ startDate, endDate, holidayList });
      groundTruthWorkingDays = calendarDays.filter((d) => d.dayType === "WORKING").length;
    }

    const totalDaysForPercentage = Math.max(groundTruthWorkingDays, workingDays);
    const attendancePercentage = this.calculatePercentage(presentDays, totalDaysForPercentage);

    return {
      totalDays: totalDaysForPercentage,
      workingDays: totalDaysForPercentage,
      recordedWorkingDays: workingDays,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      holidayDays,
      leaveDays,
      leaveBreakdown,
      attendancePercentage,
      monthlyAttendance,
    };
  }

  /**
   * Identifies dates in a date range where calendar is WORKING but attendance is un-marked.
   */
  getMissingAttendanceDays({ records = [], holidayList = [], startDate, endDate }) {
    if (!startDate || !endDate) return [];
    const calendarDays = this.resolveBatchCalendar({ startDate, endDate, holidayList });
    const markedDatesSet = new Set((records || []).map((r) => r.date).filter(Boolean));

    return calendarDays
      .filter((d) => d.dayType === "WORKING" && !markedDatesSet.has(d.date))
      .map((d) => d.date);
  }
}

export const attendanceAnalyticsService = new AttendanceAnalyticsService();
export default attendanceAnalyticsService;
