import { useDiaryData } from "./useDiaryData";

/**
 * Weekly diary + attendance for the current profile (student flow default).
 * @param {{ role?: 'student'|'teacher', enabled?: boolean }} [options]
 */
export function useWeeklyDiaryData(options) {
  const role = options?.role ?? "student";
  const enabled = options?.enabled ?? true;
  return useDiaryData({ viewType: "weekly", role, enabled });
}
