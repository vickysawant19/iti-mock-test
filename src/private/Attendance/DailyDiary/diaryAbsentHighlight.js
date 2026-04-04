/**
 * Shared absence checks for diary views (student + teacher).
 * Backend stores status on attendance records (e.g. "absent", "present").
 */
export const highlightAbsentRow = (status) => status === "absent";

/** Tailwind classes for teacher absent row highlight (visual only; does not restrict editing). */
export const TEACHER_ABSENT_ROW_CLASS =
  "bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400";
