/* eslint-disable react/prop-types */
import React from "react";
import {
  Users,
  TrendingUp,
  Award,
  AlertTriangle,
  GraduationCap,
  Building,
  Sparkles,
  Target,
  Zap
} from "lucide-react";

// Tiny inline stat pill
const StatPill = ({ icon: Icon, value, label, iconColor, bgColor }) => (
  <div className={`flex items-center justify-center md:justify-start gap-2 px-3 py-2 md:py-1.5 rounded-xl border ${bgColor} select-none w-full md:w-auto transition-transform hover:scale-102`}>
    <Icon className={`w-4 h-4 md:w-3.5 md:h-3.5 shrink-0 ${iconColor}`} />
    <div className="flex flex-col md:flex-row md:items-baseline md:gap-1 text-center md:text-left">
      <span className="text-xs font-black text-slate-800 dark:text-white leading-tight">{value}</span>
      <span className="text-[7.5px] md:text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 md:mt-0">{label}</span>
    </div>
  </div>
);

const BatchOverviewCard = ({
  batchContext,
  batchOverview,
  totalBatchXP,
  avgAccuracy,
  avgLevel
}) => {
  if (!batchContext?.batchId) return null;

  const academicStats = [
    {
      icon: Users,
      label: "Students",
      value: batchOverview?.totalStudents ?? 0,
      bgColor: "bg-pink-50 dark:bg-pink-950/30 border border-pink-100/60 dark:border-pink-900/30",
      iconColor: "text-pink-500 dark:text-pink-400",
    },
    {
      icon: TrendingUp,
      label: "Attendance",
      value: `${batchOverview?.avgAttendance ?? 0}%`,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/60 dark:border-emerald-900/30",
      iconColor: "text-emerald-500 dark:text-emerald-400",
    },
    {
      icon: Award,
      label: "Avg Score",
      value: `${batchOverview?.avgScore ?? 0}%`,
      bgColor: "bg-purple-50 dark:bg-purple-950/30 border border-purple-100/60 dark:border-purple-900/30",
      iconColor: "text-purple-500 dark:text-purple-400",
    },
    {
      icon: AlertTriangle,
      label: "Alerts",
      value: batchOverview?.lowAttendanceCount ?? 0,
      bgColor: "bg-amber-50 dark:bg-amber-950/30 border border-amber-100/60 dark:border-amber-900/30",
      iconColor: "text-amber-500 dark:text-amber-400",
    },
  ];

  const gameStats = [
    {
      icon: Sparkles,
      label: "Total XP",
      value: totalBatchXP !== undefined ? `${totalBatchXP} XP` : "0 XP",
      bgColor: "bg-fuchsia-50 dark:bg-fuchsia-950/30 border border-fuchsia-100/60 dark:border-fuchsia-900/30",
      iconColor: "text-fuchsia-500 dark:text-fuchsia-400",
    },
    {
      icon: Target,
      label: "Game Acc.",
      value: avgAccuracy !== undefined ? `${avgAccuracy}%` : "0%",
      bgColor: "bg-violet-50 dark:bg-violet-950/30 border border-violet-100/60 dark:border-violet-900/30",
      iconColor: "text-violet-500 dark:text-violet-400",
    },
    {
      icon: Zap,
      label: "Avg Level",
      value: avgLevel !== undefined ? `LVL ${avgLevel}` : "LVL 1",
      bgColor: "bg-amber-50 dark:bg-amber-950/30 border border-amber-100/60 dark:border-amber-900/30",
      iconColor: "text-amber-500 dark:text-amber-400",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      {/* Left — batch identity */}
      <div className="flex items-center gap-3 min-w-0 w-full md:w-auto flex-1">
        <div className="p-2.5 bg-fuchsia-600 dark:bg-fuchsia-700 rounded-xl text-white shadow-sm shadow-fuchsia-500/20 shrink-0">
          <GraduationCap className="w-5 h-5 md:w-4 md:h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-slate-855 dark:text-white tracking-tight truncate leading-tight">
            {batchContext.batchName}
          </h2>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {batchContext.tradeName && (
              <span className="flex items-center gap-1 text-[9px] font-extrabold bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/35 px-2 py-0.5 rounded-lg truncate max-w-[150px]">
                <Award className="w-3 h-3 shrink-0 text-purple-500" />
                <span className="truncate">{batchContext.tradeName}</span>
              </span>
            )}
            {batchContext.collegeName && (
              <span className="flex items-center gap-1 text-[9px] font-extrabold bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-100/50 dark:border-pink-900/35 px-2 py-0.5 rounded-lg truncate max-w-[150px]">
                <Building className="w-3 h-3 shrink-0 text-pink-500" />
                <span className="truncate">{batchContext.collegeName}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right — stat pills */}
      <div className="flex flex-col gap-2.5 w-full md:w-auto shrink-0 mt-2 md:mt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:items-center gap-2 md:gap-1.5 justify-items-stretch md:justify-end">
          {academicStats.map((s) => (
            <StatPill key={s.label} {...s} />
          ))}
        </div>
        <div className="grid grid-cols-3 md:flex md:items-center gap-2 md:gap-1.5 justify-items-stretch md:justify-end border-t border-slate-100 dark:border-slate-800/60 pt-2.5 md:pt-1.5">
          {gameStats.map((s) => (
            <StatPill key={s.label} {...s} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BatchOverviewCard;
