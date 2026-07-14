/* eslint-disable react/prop-types */
import React from "react";
import { Users, TrendingUp, Award, AlertTriangle, GraduationCap, Building } from "lucide-react";

const MiniStat = ({ icon: Icon, label, value, bgCircleColor, iconColor }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm w-full select-none">
    <div className={`p-2.5 rounded-2xl ${bgCircleColor} ${iconColor} shrink-0 flex items-center justify-center`}>
      <Icon className="w-5 h-5 stroke-[2.5]" />
    </div>
    <div className="flex flex-col min-w-0 flex-1 leading-tight">
      <span className="text-xl sm:text-2xl font-black tracking-tight block truncate text-slate-850 dark:text-white">
        {value}
      </span>
      <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase mt-0.5 tracking-wider truncate">
        {label}
      </span>
    </div>
  </div>
);

const BatchOverviewCard = ({ batchContext, batchOverview }) => {
  if (!batchContext?.batchId) return null;

  const stats = [
    {
      icon: Users,
      label: "Students",
      value: batchOverview?.totalStudents || 0,
      bgCircleColor: "bg-pink-500/10 dark:bg-pink-500/20",
      iconColor: "text-pink-550 dark:text-pink-400",
    },
    {
      icon: TrendingUp,
      label: "Attendance",
      value: `${batchOverview?.avgAttendance || 0}%`,
      bgCircleColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconColor: "text-emerald-550 dark:text-emerald-400",
    },
    {
      icon: Award,
      label: "Avg Score",
      value: `${batchOverview?.avgScore || 0}%`,
      bgCircleColor: "bg-purple-500/10 dark:bg-purple-500/20",
      iconColor: "text-purple-550 dark:text-purple-400",
    },
    {
      icon: AlertTriangle,
      label: "Needs Alert",
      value: batchOverview?.lowAttendanceCount || 0,
      bgCircleColor: "bg-amber-500/10 dark:bg-amber-500/20",
      iconColor: "text-amber-550 dark:text-amber-400",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-md p-5 flex flex-col gap-5 w-full">
      {/* Batch Details Info */}
      <div className="flex items-center gap-3.5 w-full">
        <div className="p-3 bg-fuchsia-600 dark:bg-fuchsia-700 rounded-2xl text-white shadow-md shadow-fuchsia-500/10 shrink-0 flex items-center justify-center">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-850 dark:text-white tracking-tight truncate leading-tight">
            {batchContext.batchName}
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-extrabold mt-2 flex-wrap">
            {batchContext.tradeName && (
              <span className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-650 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/35 px-2.5 py-1 rounded-xl truncate max-w-[150px] sm:max-w-none">
                <Award className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="truncate">{batchContext.tradeName}</span>
              </span>
            )}
            {batchContext.collegeName && (
              <span className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-950/30 text-pink-650 dark:text-pink-400 border border-pink-100/50 dark:border-pink-900/35 px-2.5 py-1 rounded-xl truncate max-w-[150px] sm:max-w-none">
                <Building className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span className="truncate">{batchContext.collegeName}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid of 4 stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
        {stats.map((stat) => (
          <MiniStat key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default BatchOverviewCard;
