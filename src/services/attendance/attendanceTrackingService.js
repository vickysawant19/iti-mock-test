import { format, parseISO, eachDayOfInterval, isSunday } from "date-fns";

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * GLOBAL ATTENDANCE TRACKING & STATUS SERVICE
 * Standardizes attendance tracking attributes (attendanceStatus, status, dayType, leaveType)
 * across the entire application.
 * ══════════════════════════════════════════════════════════════════════════════
 */

export const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
  HALF_DAY: "HALF_DAY",
  LATE: "LATE",
  NOT_MARKED: "NOT_MARKED",
});

export const LEAVE_TYPES = Object.freeze({
  CASUAL: "CASUAL",
  SICK: "SICK",
  SPECIAL: "SPECIAL",
  ON_DUTY: "ON_DUTY",
});

export const DAY_TYPES = Object.freeze({
  WORKING: "WORKING",
  HOLIDAY: "HOLIDAY",
  SUNDAY: "SUNDAY",
  EXAM: "EXAM",
  EVENT: "EVENT",
});

export const LEAVE_QUOTAS = Object.freeze({
  CL_TOTAL: 12,
  SL_TOTAL_DAYS: 15,
  SL_MAX_SPELLS: 2,
});

export const formatAttendanceTime = (recordOrDateStr, formatStr = "hh:mm a") => {
  if (!recordOrDateStr) return "—";

  let raw = recordOrDateStr;
  if (typeof recordOrDateStr === "object" && recordOrDateStr !== null) {
    // 1. Primary: markedAt / marked_at timestamp
    // 2. Secondary fallback: $updatedAt timestamp (for updated or legacy records)
    // 3. Tertiary fallback: $createdAt timestamp (for initial creation records)
    raw =
      recordOrDateStr.markedAt ||
      recordOrDateStr.marked_at ||
      recordOrDateStr.$updatedAt ||
      recordOrDateStr.$createdAt;
  }

  if (!raw) return "—";

  try {
    let dateObj;
    if (raw instanceof Date) {
      dateObj = raw;
    } else if (typeof raw === "number") {
      dateObj = new Date(raw);
    } else if (typeof raw === "string") {
      let str = raw.trim();
      // If ISO format string is missing timezone offset designator (e.g. "2026-08-27T05:30:00" or "2026-08-27 05:30:00")
      // append 'Z' so JS interprets it as UTC timestamp instead of local time
      if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
        str = str.replace(" ", "T") + "Z";
      }
      dateObj = new Date(str);
    }

    if (!dateObj || Number.isNaN(dateObj.getTime())) return "—";

    return format(dateObj, formatStr);
  } catch (e) {
    return "—";
  }
};

class AttendanceTrackingService {
  /**
   * Maps any raw status string (e.g. "casual", "cl", "sick", "sl", "present", "p")
   * to standard { attendanceStatus, leaveType } pair.
   */
  resolveStatusPair(rawStatus = "", explicitLeaveType = null) {
    const s = String(rawStatus || "").trim().toLowerCase();
    let attendanceStatus = ATTENDANCE_STATUS.NOT_MARKED;
    let leaveType = explicitLeaveType ? String(explicitLeaveType).toUpperCase() : null;

    if (["present", "p"].includes(s)) {
      attendanceStatus = ATTENDANCE_STATUS.PRESENT;
    } else if (["absent", "a"].includes(s)) {
      attendanceStatus = ATTENDANCE_STATUS.ABSENT;
    } else if (["late", "l"].includes(s)) {
      attendanceStatus = ATTENDANCE_STATUS.LATE;
    } else if (["half_day", "halfday", "hd"].includes(s)) {
      attendanceStatus = ATTENDANCE_STATUS.HALF_DAY;
    } else if (["casual", "cl"].includes(s)) {
      attendanceStatus = ATTENDANCE_STATUS.LEAVE;
      leaveType = LEAVE_TYPES.CASUAL;
    } else if (["sick", "sl"].includes(s)) {
      attendanceStatus = ATTENDANCE_STATUS.LEAVE;
      leaveType = LEAVE_TYPES.SICK;
    } else if (["special", "spl"].includes(s)) {
      attendanceStatus = ATTENDANCE_STATUS.LEAVE;
      leaveType = LEAVE_TYPES.SPECIAL;
    } else if (["on_duty", "od"].includes(s)) {
      attendanceStatus = ATTENDANCE_STATUS.LEAVE;
      leaveType = LEAVE_TYPES.ON_DUTY;
    } else if (["leave"].includes(s)) {
      attendanceStatus = ATTENDANCE_STATUS.LEAVE;
      leaveType = leaveType || LEAVE_TYPES.CASUAL;
    }

    return { attendanceStatus, leaveType };
  }

  /**
   * Normalizes a raw attendance document into a standard object.
   */
  normalizeRecord(record) {
    if (!record) return null;

    const rawDayType = record.dayType;
    const isHolidayFlag = Boolean(record.isHoliday);
    const dayType = rawDayType || (isHolidayFlag ? DAY_TYPES.HOLIDAY : DAY_TYPES.WORKING);

    const { attendanceStatus, leaveType } = this.resolveStatusPair(
      record.attendanceStatus || record.status,
      record.leaveType
    );

    return {
      $id: record.$id,
      userId: record.userId,
      batchId: record.batchId,
      tradeId: record.tradeId || null,
      date: record.date,
      dayType,
      attendanceStatus,
      leaveType,
      status: record.status || attendanceStatus.toLowerCase(),
      remarks: record.remarks || null,
      markedAt: record.markedAt || record.$updatedAt || record.$createdAt || null,
    };
  }

  /**
   * Creates a standardized Appwrite payload object for creating or updating attendance documents.
   */
  createAttendancePayload({ userId, batchId, date, status, tradeId = null, remarks = null }) {
    const { attendanceStatus, leaveType } = this.resolveStatusPair(status);
    const rawStatus = leaveType ? leaveType.toLowerCase() : status.toLowerCase();

    return {
      userId,
      batchId,
      tradeId,
      date,
      status: rawStatus,
      attendanceStatus,
      leaveType,
      dayType: DAY_TYPES.WORKING,
      remarks,
      markedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns display configuration (label, code badge, Tailwind styles, and flags)
   * for any status string or record.
   */
  getStatusConfig(rawStatus = "", explicitLeaveType = null) {
    const { attendanceStatus, leaveType } = this.resolveStatusPair(rawStatus, explicitLeaveType);

    if (attendanceStatus === ATTENDANCE_STATUS.PRESENT) {
      return {
        label: "Present",
        code: "P",
        badgeClass: "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-300",
        color: "emerald",
        isLeave: false,
        countsAsPresent: true,
      };
    }

    if (attendanceStatus === ATTENDANCE_STATUS.ABSENT) {
      return {
        label: "Absent",
        code: "A",
        badgeClass: "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-300",
        color: "rose",
        isLeave: false,
        countsAsPresent: false,
      };
    }

    if (attendanceStatus === ATTENDANCE_STATUS.LEAVE) {
      if (leaveType === LEAVE_TYPES.CASUAL) {
        return {
          label: "Casual Leave (CL)",
          code: "CL",
          badgeClass: "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-300",
          color: "amber",
          isLeave: true,
          countsAsPresent: true,
        };
      }
      if (leaveType === LEAVE_TYPES.SICK) {
        return {
          label: "Sick Leave (SL)",
          code: "SL",
          badgeClass: "bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-950/80 dark:border-sky-800 dark:text-sky-300",
          color: "sky",
          isLeave: true,
          countsAsPresent: true,
        };
      }
      if (leaveType === LEAVE_TYPES.SPECIAL) {
        return {
          label: "Special Leave (SPL)",
          code: "SPL",
          badgeClass: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950/80 dark:border-purple-800 dark:text-purple-300",
          color: "purple",
          isLeave: true,
          countsAsPresent: true,
        };
      }
      if (leaveType === LEAVE_TYPES.ON_DUTY) {
        return {
          label: "On Duty (OD)",
          code: "OD",
          badgeClass: "bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-950/80 dark:border-teal-800 dark:text-teal-300",
          color: "teal",
          isLeave: true,
          countsAsPresent: true,
        };
      }
    }

    if (attendanceStatus === ATTENDANCE_STATUS.HALF_DAY) {
      return {
        label: "Half Day (HD)",
        code: "HD",
        badgeClass: "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-950/80 dark:border-yellow-800 dark:text-yellow-300",
        color: "yellow",
        isLeave: false,
        countsAsPresent: true,
      };
    }

    if (attendanceStatus === ATTENDANCE_STATUS.LATE) {
      return {
        label: "Late (L)",
        code: "L",
        badgeClass: "bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-950/80 dark:border-indigo-800 dark:text-indigo-300",
        color: "indigo",
        isLeave: false,
        countsAsPresent: true,
      };
    }

    return {
      label: "Unmarked",
      code: "-",
      badgeClass: "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
      color: "slate",
      isLeave: false,
      countsAsPresent: false,
    };
  }

  /**
   * Calculates annual leave quotas and remaining balances for a student/teacher.
   * Quotas:
   *  - Casual Leave (CL): 12 days / year
   *  - Sick Leave (SL): 15 days / year (split in max 2 spells)
   *  - Special Leave (SPL) & On Duty (OD): Unlimited (Excluded from CL/SL quotas)
   */
  calculateLeaveQuotas(records = [], targetYear = null) {
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
      if (rec.attendanceStatus === ATTENDANCE_STATUS.LEAVE) {
        if (rec.leaveType === LEAVE_TYPES.CASUAL) {
          clUsed += 1;
        } else if (rec.leaveType === LEAVE_TYPES.SICK) {
          if (rec.date) sickDates.push(rec.date);
        } else if (rec.leaveType === LEAVE_TYPES.SPECIAL) {
          splUsed += 1;
        } else if (rec.leaveType === LEAVE_TYPES.ON_DUTY) {
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

    const clRemaining = Math.max(0, LEAVE_QUOTAS.CL_TOTAL - clUsed);
    const slDaysRemaining = Math.max(0, LEAVE_QUOTAS.SL_TOTAL_DAYS - slDaysUsed);
    const slSpellsRemaining = Math.max(0, LEAVE_QUOTAS.SL_MAX_SPELLS - slSpellsUsed);

    return {
      clTotal: LEAVE_QUOTAS.CL_TOTAL,
      clUsed,
      clRemaining,
      slTotalDays: LEAVE_QUOTAS.SL_TOTAL_DAYS,
      slDaysUsed,
      slDaysRemaining,
      slMaxSpells: LEAVE_QUOTAS.SL_MAX_SPELLS,
      slSpellsUsed,
      slSpellsRemaining,
      splUsed,
      odUsed,
      isClExceeded: clUsed > LEAVE_QUOTAS.CL_TOTAL,
      isSlDaysExceeded: slDaysUsed > LEAVE_QUOTAS.SL_TOTAL_DAYS,
      isSlSpellsExceeded: slSpellsUsed > LEAVE_QUOTAS.SL_MAX_SPELLS,
    };
  }

  /**
   * Computes comprehensive statistics for a dataset of attendance records.
   * Calculates physical present, authorized leaves, total present (physical + leaves),
   * absent days, and NCVT compliant attendance percentage.
   */
  computeAttendanceStats({ records = [], holidayList = [], startDate = null, endDate = null }) {
    const normalizedRecords = (records || []).map((r) => this.normalizeRecord(r)).filter(Boolean);

    let workingDays = 0;
    let physicalPresentDays = 0;
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

    normalizedRecords.forEach((record) => {
      if (record.dayType === DAY_TYPES.WORKING) {
        workingDays++;

        if (record.attendanceStatus === ATTENDANCE_STATUS.PRESENT) {
          physicalPresentDays++;
        } else if (record.attendanceStatus === ATTENDANCE_STATUS.ABSENT) {
          absentDays++;
        } else if (record.attendanceStatus === ATTENDANCE_STATUS.LATE) {
          lateDays++;
          physicalPresentDays++;
        } else if (record.attendanceStatus === ATTENDANCE_STATUS.HALF_DAY) {
          halfDays++;
          physicalPresentDays += 0.5;
        } else if (record.attendanceStatus === ATTENDANCE_STATUS.LEAVE) {
          leaveDays++;
          if (record.leaveType && leaveBreakdown[record.leaveType] !== undefined) {
            leaveBreakdown[record.leaveType]++;
          } else {
            leaveBreakdown.CASUAL++;
          }
        }
      } else if (record.dayType === DAY_TYPES.HOLIDAY) {
        holidayDays++;
      }
    });

    const totalPresentDays = physicalPresentDays + leaveDays;

    const attendancePercentage =
      workingDays > 0
        ? Math.min(100, Math.max(0, parseFloat(((totalPresentDays / workingDays) * 100).toFixed(1))))
        : 0;

    return {
      workingDays,
      physicalPresentDays,
      totalPresentDays,
      absentDays,
      lateDays,
      halfDays,
      holidayDays,
      leaveDays,
      leaveBreakdown,
      attendancePercentage,
    };
  }
}

export const attendanceTrackingService = new AttendanceTrackingService();
export default attendanceTrackingService;
