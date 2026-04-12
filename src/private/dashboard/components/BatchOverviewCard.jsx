import React from "react";
import { Users, TrendingUp, Award, AlertTriangle, Calendar, GraduationCap, Building } from "lucide-react";

const StatChip = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-slate-700/50">
    <div className={`p-2 rounded-xl ${color}`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{label}</p>
      <p className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
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
      color: "bg-gradient-to-br from-pink-500 to-rose-600",
    },
    {
      icon: TrendingUp,
      label: "Avg Attendance",
      value: `${batchOverview?.avgAttendance || 0}%`,
      color: "bg-gradient-to-br from-emerald-500 to-green-600",
    },
    {
      icon: Award,
      label: "Avg Score",
      value: `${batchOverview?.avgScore || 0}%`,
      color: "bg-gradient-to-br from-purple-500 to-indigo-600",
    },
    {
      icon: AlertTriangle,
      label: "Low Attendance",
      value: batchOverview?.lowAttendanceCount || 0,
      color: "bg-gradient-to-br from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl">
      {/* Gradient Banner */}
      <div className="h-24 bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
      </div>

      <div className="px-5 sm:px-6 pb-6 -mt-8">
        {/* Batch Title Chip */}
        <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-sm border border-white/40 dark:border-slate-800 mb-5">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {batchContext.batchName}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex-wrap">
              {batchContext.tradeName && (
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3" /> {batchContext.tradeName}
                </span>
              )}
              {batchContext.collegeName && (
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3" /> {batchContext.collegeName}
                </span>
              )}
              {batchContext.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(batchContext.startDate).getFullYear()} – {batchContext.endDate ? new Date(batchContext.endDate).getFullYear() : "Present"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <StatChip key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BatchOverviewCard;
