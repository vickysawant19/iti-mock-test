import { format, parseISO, differenceInMonths, addMonths, endOfMonth } from "date-fns";

/**
 * Generates 1 or 2 academic sessions based on start_date and end_date.
 * If course duration >= 15 months, splits into First Year and Second Year.
 */
export function generateSessionsFromDates(startDateStr, endDateStr, teacherId = "", teacherName = "") {
  const start = startDateStr?.split("T")[0] || "";
  const end = endDateStr?.split("T")[0] || "";

  if (!start || !end) {
    return [
      {
        id: "year1",
        name: "First Year",
        year: "FIRST",
        startDate: start,
        endDate: end,
        vacationStart: null,
        vacationEnd: null,
        teacherId,
        teacherName,
        status: "ACTIVE",
      },
    ];
  }

  const startDateObj = parseISO(start);
  const endDateObj = parseISO(end);
  const totalMonths = Math.abs(differenceInMonths(endDateObj, startDateObj));

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const getStatus = (sDate, eDate) => {
    if (!sDate || !eDate) return "ACTIVE";
    if (todayStr < sDate) return "UPCOMING";
    if (todayStr > eDate) return "COMPLETED";
    return "ACTIVE";
  };

  // Multi-year course (>= 15 months)
  if (totalMonths >= 15) {
    // Year 1 ends 11 months after start
    const y1EndMonthObj = addMonths(startDateObj, 10);
    const y1EndObj = endOfMonth(y1EndMonthObj);
    const y1EndStr = format(y1EndObj, "yyyy-MM-dd");

    // Vacation is the 12th month
    const vacStartObj = addMonths(startDateObj, 11);
    const vacEndObj = endOfMonth(vacStartObj);
    const vacStartStr = format(vacStartObj, "yyyy-MM-01");
    const vacEndStr = format(vacEndObj, "yyyy-MM-dd");

    // Year 2 starts right after vacation
    const y2StartObj = addMonths(startDateObj, 12);
    const y2StartStr = format(y2StartObj, "yyyy-MM-01");

    return [
      {
        id: "year1",
        name: "First Year",
        year: "FIRST",
        startDate: start,
        endDate: y1EndStr,
        vacationStart: vacStartStr,
        vacationEnd: vacEndStr,
        teacherId,
        teacherName,
        status: getStatus(start, y1EndStr),
      },
      {
        id: "year2",
        name: "Second Year",
        year: "SECOND",
        startDate: y2StartStr,
        endDate: end,
        vacationStart: null,
        vacationEnd: null,
        teacherId,
        teacherName,
        status: getStatus(y2StartStr, end),
      },
    ];
  }

  // Single-year course
  return [
    {
      id: "year1",
      name: "First Year",
      year: "FIRST",
      startDate: start,
      endDate: end,
      vacationStart: null,
      vacationEnd: null,
      teacherId,
      teacherName,
      status: getStatus(start, end),
    },
  ];
}

/**
 * Normalizes batch sessions array.
 * If sessions is a string (JSON), it parses it.
 * If empty or missing, auto-splits into First & Second Year if >= 15 months.
 */
export function normalizeBatchSessions(batch) {
  if (!batch) return [];

  let rawSessions = batch.sessions;
  if (typeof rawSessions === "string") {
    try {
      rawSessions = JSON.parse(rawSessions);
    } catch (e) {
      console.warn("Failed to parse batch.sessions JSON string:", e);
      rawSessions = [];
    }
  }

  if (Array.isArray(rawSessions) && rawSessions.length > 0) {
    return rawSessions;
  }

  // Fallback: Generate split sessions automatically from start_date & end_date
  return generateSessionsFromDates(
    batch.start_date,
    batch.end_date,
    batch.teacherId,
    batch.teacherName
  );
}

/**
 * Finds the specific session that covers a given target date (YYYY-MM-DD or Date object).
 */
export function getSessionForDate(batch, targetDate) {
  const sessions = normalizeBatchSessions(batch);
  if (!sessions || sessions.length === 0 || !targetDate) return null;

  const dateStr = typeof targetDate === "string" 
    ? targetDate.split("T")[0] 
    : format(targetDate, "yyyy-MM-dd");

  return sessions.find((session) => {
    const start = session.startDate;
    const end = session.endDate;
    if (!start || !end) return false;
    return dateStr >= start && dateStr <= end;
  }) || sessions[0];
}

/**
 * Finds the currently active session for a batch based on current date or status.
 */
export function getCurrentSession(batch) {
  const sessions = normalizeBatchSessions(batch);
  if (!sessions || sessions.length === 0) return null;

  const activeByStatus = sessions.find((s) => s.status === "ACTIVE");
  if (activeByStatus) return activeByStatus;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  return getSessionForDate(batch, todayStr) || sessions[0];
}

/**
 * Returns a formatted string label for a session (e.g., "First Year (2026–2027)").
 */
export function formatSessionLabel(session) {
  if (!session) return "";
  const startYear = session.startDate ? session.startDate.substring(0, 4) : "";
  const endYear = session.endDate ? session.endDate.substring(0, 4) : "";
  const range = startYear && endYear ? ` (${startYear}–${endYear})` : "";

  // Strip any existing parenthesised year range already in the name
  // e.g. "First Year (2026 - 2027)" → "First Year"
  const rawName = (session.name || session.year || "").replace(/\s*\(\d{4}\s*[-–]\s*\d{4}\)\s*$/, "").trim();

  return `${rawName}${range}`;
}
