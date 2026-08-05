// Column group visibility configuration
// Controls which column groups are visible by default in the Attendance Table

export const DEFAULT_VISIBILITY = {
  previous: false, // Previous month stats (hidden by default to reduce clutter)
  daily: true,     // Daily attendance columns (1-31)
  summary: true,   // Monthly summary (Work Days, Present, Absent, %)
};

export const COLUMN_GROUP_LABELS = {
  previous: "Previous",
  daily: "Daily Attendance",
  summary: "Summary",
};
