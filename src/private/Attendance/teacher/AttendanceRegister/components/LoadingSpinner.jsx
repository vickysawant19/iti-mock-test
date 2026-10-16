import React from "react";
import AttendanceTableSkeleton from "./AttendanceTableSkeleton";
import { ClipboardList } from "lucide-react";

const LoadingSpinner = () => {
  return (
    <div className="flex h-[calc(100dvh-4.5rem)] min-h-0 min-w-0 flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex h-full min-h-0 min-w-0 w-full max-w-full flex-col">
        {/* Header Skeleton Bar */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-2.5 text-white shadow-xs border-b border-blue-400/30 dark:border-indigo-500/20 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 sm:p-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-white/70" />
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white/90">
                  Attendance Register
                </span>
                <span className="inline-block h-3 w-16 bg-white/20 rounded animate-pulse" />
              </div>

              <div className="flex items-center gap-2">
                {/* Batch dropdown skeleton */}
                <div className="h-7 w-36 bg-white/20 rounded-lg animate-pulse" />
                {/* Month navigator skeleton */}
                <div className="h-7 w-32 bg-white/20 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Bottom Strip Skeleton */}
            <div className="pt-2 border-t border-white/20 dark:border-white/10 flex items-center justify-between gap-1.5 p-1.5 bg-black/15 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="h-5 w-12 bg-white/15 rounded animate-pulse" />
                <div className="h-5 w-16 bg-white/15 rounded animate-pulse" />
                <div className="h-5 w-16 bg-white/15 rounded animate-pulse" />
                <div className="h-5 w-16 bg-white/15 rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-white/15 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="attendance-scroll relative min-h-0 min-w-0 flex-1 overflow-auto border border-slate-300 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="sticky top-0 left-0 right-0 z-50 h-1 w-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 animate-pulse" />
          </div>
          <AttendanceTableSkeleton rowCount={12} daysCount={31} />
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
