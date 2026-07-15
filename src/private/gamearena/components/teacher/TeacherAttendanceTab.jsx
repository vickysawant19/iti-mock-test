import React from "react";
import { AlertCircle } from "lucide-react";
import StudentTable from "./StudentTable";
import AttendanceTrendChart from "./AttendanceTrendChart";

export default function TeacherAttendanceTab({
  studentRows,
  selectedMonth,
  attendanceTrend,
}) {
  return (
    <>
      {/* Student Table */}
      <StudentTable studentRows={studentRows} selectedMonth={selectedMonth} />

      {/* Visual Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceTrendChart data={attendanceTrend} />

        {/* Needs Attention List */}
        <div className="bg-transparent border-0 shadow-none sm:bg-white/60 sm:dark:bg-slate-900/60 sm:backdrop-blur-xl sm:border sm:border-slate-200/80 sm:dark:border-slate-800/60 sm:rounded-3xl sm:shadow-sm sm:overflow-hidden">
          <div className="px-2 py-3 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800/40 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
              Needs Attention
            </h3>
          </div>
          <div className="py-2 px-0 sm:p-4 space-y-2 max-h-56 overflow-y-auto">
            {studentRows
              .filter((s) => s.totalAttendancePercent < 75)
              .sort((a, b) => a.totalAttendancePercent - b.totalAttendancePercent)
              .slice(0, 8)
              .map((s) => (
                <div
                  key={s.studentId}
                  className="flex items-center justify-between gap-2 py-2 px-1 sm:p-2.5 sm:rounded-xl sm:bg-red-50/40 sm:dark:bg-red-900/10 border-b border-slate-100 dark:border-slate-800/30 sm:border sm:border-red-100/30 sm:dark:border-red-900/20 last:border-b-0"
                >
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">
                    {s.userName}
                  </span>
                  <span className="text-xs font-extrabold text-red-650 dark:text-red-400 tabular-nums shrink-0">
                    {s.totalAttendancePercent}%
                  </span>
                </div>
              ))}
            {studentRows.filter((s) => s.totalAttendancePercent < 75).length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                All students have ≥75% attendance 🎉
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
