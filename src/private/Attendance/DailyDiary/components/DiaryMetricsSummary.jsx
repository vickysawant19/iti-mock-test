import React from "react";
import { CalendarDays, UserCheck, UserX, Clock, BookOpen } from "lucide-react";

export const DiaryMetricsSummary = React.memo(({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {/* Total Days */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            Total Days
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-100">
            {stats.totalDays} Days
          </span>
        </div>
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
          <CalendarDays className="w-4 h-4" />
        </div>
      </div>

      {/* Present Days */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            Present Days
          </span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
            {stats.presentDays} Days
          </span>
        </div>
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
          <UserCheck className="w-4 h-4" />
        </div>
      </div>

      {/* Absent Days */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            Absent Days
          </span>
          <span className="text-base font-black text-rose-600 dark:text-rose-400">
            {stats.absentDays} Days
          </span>
        </div>
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
          <UserX className="w-4 h-4" />
        </div>
      </div>

      {/* Total Hours */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            Total Hours
          </span>
          <span className="text-base font-black text-purple-600 dark:text-purple-400">
            {stats.totalHours} hrs
          </span>
        </div>
        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* Theory & Practical Classes */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
        <div>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            Classes Logged
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
              {stats.theoryCount} Th
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400">
              {stats.practicalCount} Pr
            </span>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
          <BookOpen className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
});

export default DiaryMetricsSummary;
