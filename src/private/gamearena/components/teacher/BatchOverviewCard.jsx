/* eslint-disable react/prop-types */
import React from "react";
import { Users, TrendingUp, Award, AlertTriangle, GraduationCap, Building } from "lucide-react";

// Tiny inline stat pill
const StatPill = ({ icon: Icon, value, label, iconColor, bgColor }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${bgColor} select-none`}>
    <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
    <span className="text-xs font-black text-slate-800 dark:text-white">{value}</span>
    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 hidden sm:inline">{label}</span>
  </div>
);

const BatchOverviewCard = ({ batchContext, batchOverview }) => {
  if (!batchContext?.batchId) return null;

  const stats = [
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

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-sm px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
      {/* Left — batch identity */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="p-2 bg-fuchsia-600 dark:bg-fuchsia-700 rounded-xl text-white shadow-sm shadow-fuchsia-500/20 shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-slate-850 dark:text-white tracking-tight truncate leading-tight">
            {batchContext.batchName}
          </h2>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {batchContext.tradeName && (
              <span className="flex items-center gap-1 text-[9px] font-extrabold bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/35 px-1.5 py-0.5 rounded-lg truncate max-w-[120px]">
                <Award className="w-2.5 h-2.5 shrink-0 text-purple-500" />
                <span className="truncate">{batchContext.tradeName}</span>
              </span>
            )}
            {batchContext.collegeName && (
              <span className="flex items-center gap-1 text-[9px] font-extrabold bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-100/50 dark:border-pink-900/35 px-1.5 py-0.5 rounded-lg truncate max-w-[120px]">
                <Building className="w-2.5 h-2.5 shrink-0 text-pink-500" />
                <span className="truncate">{batchContext.collegeName}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right — stat pills */}
      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
        {stats.map((s) => (
          <StatPill key={s.label} {...s} />
        ))}
      </div>
    </div>
  );
};

export default BatchOverviewCard;
