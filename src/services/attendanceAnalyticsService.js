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
    if (["present", "p"].includes(rawStatus)) attendanceStatus = "PRESENT";
    else if (["absent", "a"].includes(rawStatus)) attendanceStatus = "ABSENT";
    else if (["late"].includes(rawStatus)) attendanceStatus = "LATE";
    else if (["half_day", "halfday"].includes(rawStatus)) attendanceStatus = "HALF_DAY";
    else if (["leave", "l"].includes(rawStatus)) attendanceStatus = "LEAVE";

    const leaveType = record.leaveType || (attendanceStatus === "LEAVE" ? "CASUAL" : null);

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
