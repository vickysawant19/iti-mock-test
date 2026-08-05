import React from "react";

/**
 * Reusable Student Leave Quota Badges component
 * Displays annual CL, SL, SPL, OD remaining/used quotas and warning indicators when quotas are exceeded.
 */
export const StudentLeaveQuotaBadges = React.memo(({
  quota = {
    clRemaining: 12,
    clUsed: 0,
    slDaysRemaining: 15,
    slDaysUsed: 0,
    slSpellsRemaining: 2,
    slSpellsUsed: 0,
    splUsed: 0,
    odUsed: 0,
    isClExceeded: false,
    isSlDaysExceeded: false,
    isSlSpellsExceeded: false,
  },
  layout = "inline", // "inline" | "grid"
  className = "",
}) => {
  if (layout === "grid") {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${className}`}>
        {/* Casual Leave Quota */}
        <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-amber-200 dark:border-amber-900">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Casual Leave (CL)</p>
          <p className="text-sm sm:text-base font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
            {quota.clRemaining} <span className="text-[10px] font-normal text-slate-500">/ 12 left</span>
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">Used: {quota.clUsed || 0} days</p>
        </div>

        {/* Sick Leave Quota */}
        <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-sky-200 dark:border-sky-900">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Sick Leave (SL)</p>
          <p className="text-sm sm:text-base font-extrabold text-sky-700 dark:text-sky-300 mt-0.5">
            {quota.slDaysRemaining}d <span className="text-[10px] font-normal text-slate-500">({quota.slSpellsRemaining}/2 spells left)</span>
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">Used: {quota.slDaysUsed || 0}d ({quota.slSpellsUsed || 0} spells)</p>
        </div>

        {/* Special Leave (SPL) */}
        <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-purple-200 dark:border-purple-900">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Special Leave (SPL)</p>
          <p className="text-sm sm:text-base font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
            {quota.splUsed || 0} <span className="text-[10px] font-normal text-slate-500">taken</span>
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">Not deducted from quota</p>
        </div>

        {/* On Duty (OD) */}
        <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-teal-200 dark:border-teal-900">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">On Duty (OD)</p>
          <p className="text-sm sm:text-base font-extrabold text-teal-700 dark:text-teal-300 mt-0.5">
            {quota.odUsed || 0} <span className="text-[10px] font-normal text-slate-500">taken</span>
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">Official duty leave</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 text-[10px] ${className}`}>
      <span
        title="Casual Leave Quota (12 / year)"
        className={`px-2 py-0.5 rounded-md font-semibold border transition-colors ${
          quota.isClExceeded
            ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300"
            : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
        }`}
      >
        CL: {quota.clRemaining}/12 left
      </span>

      <span
        title="Sick Leave Quota (15 days / max 2 spells per year)"
        className={`px-2 py-0.5 rounded-md font-semibold border transition-colors ${
          quota.isSlDaysExceeded || quota.isSlSpellsExceeded
            ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300"
            : "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300"
        }`}
      >
        SL: {quota.slDaysRemaining}d ({quota.slSpellsRemaining}/2 spells left)
      </span>

      <span
        title="Special Leave (Not deducted from quota)"
        className="px-2 py-0.5 rounded-md font-semibold border bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
      >
        SPL: Excluded
      </span>
    </div>
  );
});

export default StudentLeaveQuotaBadges;
