import React from "react";

const Legent = () => {
  return (
    <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
        Attendance Register Key & Legend
      </h4>
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs shadow-2xs">
            P
          </span>
          <span className="text-slate-800 dark:text-slate-200">Present</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs shadow-2xs">
            A
          </span>
          <span className="text-slate-800 dark:text-slate-200">Absent</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 text-xs">
            H
          </div>
          <span className="text-slate-800 dark:text-slate-200">Batch Holiday</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500 font-bold text-sm px-1.5">
            -
          </span>
          <span className="text-slate-800 dark:text-slate-200">Not Marked</span>
        </div>
      </div>
    </div>
  );
};

export default Legent;
