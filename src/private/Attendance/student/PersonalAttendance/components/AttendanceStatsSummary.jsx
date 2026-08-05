import React from "react";
import { Award, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format, subMonths, parseISO } from "date-fns";

// ─── Reusable skeleton shimmer block ─────────────────────────────────────────
const Shimmer = ({ className = "" }) => (
  <div className={`bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse ${className}`} />
);

// ─── Skeleton for the performance ring card ───────────────────────────────────
const PerfCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-4">
      {/* Donut placeholder */}
      <div className="w-[80px] h-[80px] rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-5 w-28 rounded-full" />
      </div>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <Shimmer className="h-6 w-8" />
          <Shimmer className="h-2.5 w-10" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Skeleton for a 2×2 stat grid card ───────────────────────────────────────
const StatGridSkeleton = ({ accent = "indigo" }) => {
  const bg =
    accent === "blue"
      ? "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-100 dark:border-blue-900/50"
      : "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/50";

  return (
    <div className={`bg-gradient-to-br ${bg} rounded-3xl p-4 border shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-5 w-12 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/20 flex flex-col gap-1.5">
            <Shimmer className="h-2.5 w-12" />
            <Shimmer className="h-6 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Right-panel stats (full sidebar) ─────────────────────────────────────────
export const RightPanelStats = ({
  stats,
  overallStats,
  monthlyStats,
  currentMonth,
  batchData,
  selectedDate,
  isLoadingMonthly = false,
  isLoadingOverall = false,
}) => {
  // Monthly stats (current month, derived from local records)
  const curWorking = (monthlyStats?.presentDays || 0) + (monthlyStats?.absentDays || 0);
  const curPresent = monthlyStats?.presentDays || 0;
  const curAbsent  = monthlyStats?.absentDays  || 0;
  const curRate    = monthlyStats?.attendancePercentage || 0;

  // Detail from stats prop (includes holiday / leave)
  const { holidayDays: curHolidayDays = 0 } = stats || {};

  // Historical stats: batch start → end of previous month
  const ovPresent = overallStats?.presentDays || 0;
  const ovAbsent  = overallStats?.absentDays  || 0;

  // ── Combined performance: batch start → TODAY ──────────────────────────────
  // No extra API call needed — we add historical (prev months) + current month.
  const totalPresent = ovPresent + curPresent;
  const totalAbsent  = ovAbsent  + curAbsent;
  const totalWorking = totalPresent + totalAbsent;
  const totalRate    = totalWorking > 0
    ? Number(((totalPresent / totalWorking) * 100).toFixed(1))
    : 0;

  const isGoodStanding = totalRate >= 75;

  // Historical Breakdown stats (Batch Start → Prev Month End)
  const ovWorking = ovPresent + ovAbsent;
  const ovRate    = overallStats?.attendancePercentage || 0;

  // Labels
  const batchStartLabel = batchData?.start_date
    ? format(parseISO(batchData.start_date), "MMM yyyy")
    : "Batch Start";
  const todayLabel = format(new Date(), "dd MMM yyyy");
  const prevMonthLabel = format(subMonths(selectedDate || new Date(), 1), "MMM yyyy");

  // Ring circumference
  const R = 36;
  const CIRC = 2 * Math.PI * R;
  const dash = (totalRate / 100) * CIRC;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Performance Ring Card ── */}
      {isLoadingOverall ? (
        <PerfCardSkeleton />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Donut */}
            <div className="relative w-[80px] h-[80px] flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={R} fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="9" />
                <circle
                  cx="44" cy="44" r={R} fill="none"
                  className={`transition-all duration-1000 ease-out ${isGoodStanding ? "stroke-indigo-600 dark:stroke-indigo-400" : "stroke-rose-500 dark:stroke-rose-400"}`}
                  strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${dash} 999`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col justify-center items-center">
                <span className={`font-black text-[15px] leading-none ${isGoodStanding ? "text-indigo-600 dark:text-indigo-400" : "text-rose-500"}`}>
                  {totalRate}%
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Overall</span>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-0.5">
                Attendance Performance
              </h4>
              <p className="text-[11px] text-slate-400 mb-2 leading-snug">
                {batchStartLabel} → {todayLabel}
              </p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isGoodStanding ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}>
                <Award size={10} />
                {isGoodStanding ? "Good Standing" : "Risk Warning"}
              </div>
            </div>
          </div>

          {/* Combined quick stats (batch start → today) */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            {[
              { label: "Working", value: totalWorking, valueColor: "text-slate-700 dark:text-slate-200" },
              { label: "Present", value: totalPresent, valueColor: "text-emerald-600" },
              { label: "Absent",  value: totalAbsent,  valueColor: "text-rose-600" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-xl font-black ${s.valueColor}`}>{s.value}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Current Month Summary ── */}
      {isLoadingMonthly ? (
        <StatGridSkeleton accent="indigo" />
      ) : (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-3xl p-4 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">
              {currentMonth || "This Month"}
            </h4>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${curRate >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {curRate >= 75 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {curRate}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Working",  value: curWorking,     labelColor: "text-slate-400",   valueColor: "text-indigo-600" },
              { label: "Holidays", value: curHolidayDays, labelColor: "text-slate-400",   valueColor: "text-slate-600 dark:text-slate-300" },
              { label: "Present",  value: curPresent,     labelColor: "text-emerald-500", valueColor: "text-emerald-600" },
              { label: "Absent",   value: curAbsent,      labelColor: "text-rose-500",    valueColor: "text-rose-600" },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
                <div className={`text-[10px] font-bold uppercase tracking-wider ${item.labelColor}`}>{item.label}</div>
                <div className={`text-xl font-extrabold mt-0.5 leading-none ${item.valueColor}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Overall Breakdown ── */}
      {isLoadingOverall ? (
        <StatGridSkeleton accent="blue" />
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-3xl p-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={12} className="text-blue-500 flex-shrink-0" />
            <h4 className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Overall Breakdown</h4>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">{batchStartLabel} → {prevMonthLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Working", value: ovWorking, labelColor: "text-slate-400",   valueColor: "text-blue-600" },
              { label: "Rate",    value: `${ovRate}%`, labelColor: "text-slate-400", valueColor: "text-indigo-600" },
              { label: "Present", value: ovPresent, labelColor: "text-emerald-500", valueColor: "text-emerald-600" },
              { label: "Absent",  value: ovAbsent,  labelColor: "text-rose-500",    valueColor: "text-rose-600" },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-50 dark:border-blue-900/20">
                <div className={`text-[10px] font-bold uppercase tracking-wider ${item.labelColor}`}>{item.label}</div>
                <div className={`text-xl font-extrabold mt-0.5 leading-none ${item.valueColor}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};


