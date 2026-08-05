import React from "react";

const Legent = () => {
  return (
    <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
        Attendance Register Key & Legend
      </h4>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs shadow-2xs border border-emerald-300 dark:border-emerald-800">
            P
          </span>
          <span className="text-slate-800 dark:text-slate-200">Present</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs shadow-2xs border border-rose-300 dark:border-rose-800">
            A
          </span>
          <span className="text-slate-800 dark:text-slate-200">Absent</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px] shadow-2xs border border-amber-300 dark:border-amber-800">
            CL
          </span>
          <span className="text-slate-800 dark:text-slate-200">Casual Leave (12/yr)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px] shadow-2xs border border-sky-300 dark:border-sky-800">
            SL
          </span>
          <span className="text-slate-800 dark:text-slate-200">Sick Leave (15d/2 spells)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-extrabold text-[9px] shadow-2xs border border-purple-300 dark:border-purple-800">
            SPL
          </span>
          <span className="text-slate-800 dark:text-slate-200">Special Leave (Excluded)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-extrabold text-[10px] shadow-2xs border border-teal-300 dark:border-teal-800">
            OD
          </span>
          <span className="text-slate-800 dark:text-slate-200">On Duty</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 font-extrabold text-[10px] shadow-2xs border border-yellow-300 dark:border-yellow-800">
            HD
          </span>
          <span className="text-slate-800 dark:text-slate-200">Half Day</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold text-xs shadow-2xs border border-indigo-300 dark:border-indigo-800">
            L
          </span>
          <span className="text-slate-800 dark:text-slate-200">Late</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded bg-rose-200 dark:bg-rose-950/60 border border-rose-400 dark:border-rose-700 flex items-center justify-center font-bold text-rose-900 dark:text-rose-300 text-xs">
            H
          </div>
          <span className="text-slate-800 dark:text-slate-200">Holiday</span>
        </div>

        <div className="flex items-center gap-1.5">
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
