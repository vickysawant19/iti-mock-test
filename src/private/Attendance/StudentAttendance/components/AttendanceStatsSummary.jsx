import React from "react";
import { Award } from "lucide-react";
import { format, subMonths, parseISO } from "date-fns";

const StatGrid = ({ label, items }) => (
  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-3xl p-4 sm:p-5 border border-indigo-100 dark:border-indigo-900/50">
    <h4 className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest mb-3">{label}</h4>
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={item.gradient
            ? "bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 sm:p-3 rounded-xl"
            : "bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/20"}
        >
          <div className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${item.gradient ? "text-white/70" : item.labelColor || "text-slate-400"}`}>
            {item.label}
          </div>
          <div className={`text-lg sm:text-xl font-extrabold mt-0.5 leading-none ${item.gradient ? "text-white" : item.valueColor || "text-indigo-600"}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const TopStatsRow = ({ overallStats, monthlyStats, currentMonth, batchData, selectedDate }) => {
  // Current month stats (month start → today)
  const curWorking = (monthlyStats?.presentDays || 0) + (monthlyStats?.absentDays || 0);
  const curPresent = monthlyStats?.presentDays || 0;
  const curAbsent = monthlyStats?.absentDays || 0;
  const curRate = monthlyStats?.attendancePercentage || 0;

  // Overall stats (batch start → last month end)
  const ovWorking = (overallStats?.presentDays || 0) + (overallStats?.absentDays || 0);
  const ovPresent = overallStats?.presentDays || 0;
  const ovAbsent = overallStats?.absentDays || 0;
  const ovRate = overallStats?.attendancePercentage || 0;

  // Dynamic range label
  const batchStartLabel = batchData?.start_date
    ? format(parseISO(batchData.start_date), "MMM yyyy")
    : "Batch Start";
  const prevMonthLabel = format(subMonths(selectedDate || new Date(), 1), "MMM yyyy");
  const overallLabel = `Overall (${batchStartLabel} → ${prevMonthLabel})`;

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Current Month Summary */}
      <StatGrid
        label={`${currentMonth || "Current Month"} Summary`}
        items={[
          { label: "Working", value: curWorking },
          { label: "Present", value: curPresent, labelColor: "text-emerald-500", valueColor: "text-emerald-600" },
          { label: "Absent", value: curAbsent, labelColor: "text-rose-500", valueColor: "text-rose-600" },
          { label: "Rate", value: `${curRate}%`, gradient: true },
        ]}
      />

      {/* Overall Summary: batch start → last month end */}
      <StatGrid
        label={overallLabel}
        items={[
          { label: "Working", value: ovWorking },
          { label: "Present", value: ovPresent, labelColor: "text-emerald-500", valueColor: "text-emerald-600" },
          { label: "Absent", value: ovAbsent, labelColor: "text-rose-500", valueColor: "text-rose-600" },
          { label: "Rate", value: `${ovRate}%`, gradient: true },
        ]}
      />
    </div>
  );
};

export const RightPanelStats = ({ stats, overallStats, currentMonth }) => {
  const {
    totalDays: curTotalDays = 0,
    presentDays: curPresentDays = 0,
    absentDays: curAbsentDays = 0,
    leaveDays: curLeaveDays = 0,
    holidayDays: curHolidayDays = 0,
  } = stats || {};

  const overallPercentage = overallStats?.attendancePercentage || 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Perf Ring Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-5">
        <div className="relative w-[78px] h-[78px] flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" className="stroke-indigo-50 dark:stroke-slate-800" strokeWidth="8" />
            <circle
              cx="44" cy="44" r="36" fill="none"
              className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-1000 ease-out"
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(overallPercentage / 100) * (2 * Math.PI * 36)} 999`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base leading-none">{overallPercentage}%</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Overall</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Attendance Performance</h4>
          <p className="text-xs text-slate-500 mb-2 leading-snug">Overall rate up to previous month end</p>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${overallPercentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <Award size={11} /> {overallPercentage >= 75 ? 'Good Standing' : 'Risk Warning'}
          </div>
        </div>
      </div>

      {/* Current Month Detail Grid */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-3xl p-5 border border-indigo-100 dark:border-indigo-900/50">
        <h4 className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest mb-3">{currentMonth} — Detail</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Working", value: curTotalDays, color: "text-indigo-600" },
            { label: "Holidays", value: curHolidayDays, color: "text-indigo-600" },
            { label: "Present", value: curPresentDays, color: "text-emerald-600", labelColor: "text-emerald-500" },
            { label: "Absent", value: curAbsentDays, color: "text-rose-600", labelColor: "text-rose-500" },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${item.labelColor || "text-slate-400"}`}>{item.label}</div>
              <div className={`text-xl font-extrabold mt-0.5 ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
