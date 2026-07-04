/* eslint-disable react/prop-types */
import React from "react";
import { Users, TrendingUp, Award, AlertTriangle, GraduationCap, Building } from "lucide-react";

const MiniStat = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 dark:bg-slate-800/45 backdrop-blur-sm rounded-xl border border-white/25 dark:border-slate-800/60 shadow-sm shrink-0">
    <div className={`p-1.5 rounded-lg ${color} text-white`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div className="leading-none">
      <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</span>
      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 block uppercase mt-0.5 tracking-wider">{label}</span>
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
      color: "bg-pink-500",
    },
    {
      icon: TrendingUp,
      label: "Attendance",
      value: `${batchOverview?.avgAttendance || 0}%`,
      color: "bg-emerald-500",
    },
    {
      icon: Award,
      label: "Avg Score",
      value: `${batchOverview?.avgScore || 0}%`,
      color: "bg-purple-500",
    },
    {
      icon: AlertTriangle,
      label: "Needs Alert",
      value: batchOverview?.lowAttendanceCount || 0,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {/* Batch Details Info */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl text-white shadow-md shadow-pink-500/10">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-black text-slate-850 dark:text-white tracking-tight truncate leading-tight">
            {batchContext.batchName}
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 flex-wrap">
            {batchContext.tradeName && (
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                <Award className="w-3 h-3 text-purple-500" /> {batchContext.tradeName}
              </span>
            )}
            {batchContext.collegeName && (
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                <Building className="w-3 h-3 text-pink-500" /> {batchContext.collegeName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compact horizontal metrics */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {stats.map((stat) => (
          <MiniStat key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default BatchOverviewCard;
