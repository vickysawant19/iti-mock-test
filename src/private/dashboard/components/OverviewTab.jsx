/* eslint-disable react/prop-types */
import React from "react";
import {
  TrendingUp,
  Award,
  ClipboardList,
  CheckCircle2,
  Clock,
  Zap,
  Gamepad2,
  Trophy,
  Calendar,
  ChevronRight,
} from "lucide-react";

const StatCard = ({ icon: Icon, label, value, sub, color, progress, progressBarColor }) => (
  <div className="bg-white/40 dark:bg-[#110d29]/30 backdrop-blur-md border border-slate-200/85 dark:border-[#221a48] hover:border-slate-300 dark:hover:border-[#382b75] rounded-[18px] p-3.5 flex flex-col justify-between gap-2.5 transition-all duration-300 shadow-sm hover:shadow hover:translate-y-[-1px] group cursor-pointer">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white transition-transform group-hover:scale-105 ${color}`}>
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider truncate leading-tight">{label}</p>
        <p className="text-sm sm:text-base font-black text-slate-800 dark:text-white tracking-tight mt-0.5 leading-none truncate">{value}</p>
      </div>
    </div>
    
    {progress !== undefined ? (
      <div className="space-y-1">
        <div className="w-full bg-slate-200/60 dark:bg-slate-950/65 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${progressBarColor || "bg-pink-500"}`} 
            style={{ width: `${progress}%` }}
          />
        </div>
        {sub && (
          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 leading-none truncate text-right">
            {sub}
          </p>
        )}
      </div>
    ) : (
      sub && (
        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 leading-none truncate mt-0.5">
          {sub}
        </p>
      )
    )}
  </div>
);

export default function OverviewTab({
  overallStats,
  testStats,
  profileStats,
  stats,
  navigate,
}) {
  const attendancePercentage = overallStats?.percentage || 0;
  const avgScorePercentage = testStats?.avgScore || 0;

  return (
    <div className="space-y-4">
      {/* 6 Metrics Grid — Compact & Highly Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Attendance"
          value={`${attendancePercentage}%`}
          sub={`${overallStats?.presentDays || 0}/${overallStats?.total || 0} days`}
          color="bg-gradient-to-br from-emerald-500 to-green-600"
          progress={attendancePercentage}
          progressBarColor="bg-emerald-500"
        />
        <StatCard
          icon={Award}
          label="Avg Score"
          value={`${avgScorePercentage}%`}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          progress={avgScorePercentage}
          progressBarColor="bg-orange-500"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Questions"
          value={profileStats.totalQuestions}
          color="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Correct Answers"
          value={profileStats.correctAnswers}
          color="bg-gradient-to-br from-blue-500 to-sky-600"
        />
        <StatCard
          icon={Clock}
          label="Avg Time"
          value={profileStats.averageTimeStr}
          color="bg-gradient-to-br from-pink-500 to-rose-600"
        />
        <StatCard
          icon={Zap}
          label="Monthly XP"
          value={`${profileStats.monthlyXp} XP`}
          color="bg-gradient-to-br from-yellow-400 to-amber-500"
        />
      </div>

      {/* Game Stats Card — Bento Grid Style */}
      {stats && (
        <div className="bg-white/40 dark:bg-[#110d29]/30 backdrop-blur-md border border-slate-200/85 dark:border-[#221a48] rounded-2xl overflow-hidden shadow-sm relative z-10">
          <div className="px-4 py-3 border-b border-slate-200/80 dark:border-[#221a48] flex items-center gap-2.5">
            <div className="p-1 bg-violet-500/10 rounded-lg">
              <Gamepad2 className="w-4 h-4 text-violet-500" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight">Game Stats</h3>
          </div>

          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-[#221a48] gap-0">
            {/* Today's Stats */}
            <div className="flex-1 p-4 space-y-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Today's Activity
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 mt-2.5">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center justify-center bg-slate-100/40 dark:bg-[#110d29]/20 border border-slate-200/50 dark:border-slate-800/40 rounded-xl py-2 px-1.5 gap-0.5 min-w-0">
                      <span className="text-base font-black text-slate-800 dark:text-white leading-none">
                        {stats.dailyQuestionsAttempted || 0}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider text-center leading-none mt-1">Questions</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-emerald-500/5 border border-emerald-500/10 rounded-xl py-2 px-1.5 gap-0.5 min-w-0">
                      <span className="text-base font-black text-emerald-500 leading-none">
                        {stats.dailyWins || 0}
                      </span>
                      <span className="text-[8px] font-bold text-emerald-500/70 uppercase tracking-wider text-center leading-none mt-1">Correct</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-red-500/5 border border-red-500/10 rounded-xl py-2 px-1.5 gap-0.5 min-w-0">
                      <span className="text-base font-black text-red-500 leading-none">
                        {stats.dailyLosses || 0}
                      </span>
                      <span className="text-[8px] font-bold text-red-500/70 uppercase tracking-wider text-center leading-none mt-1">Wrong</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-36 shrink-0 space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-405 leading-none">
                      <span>Today's Accuracy</span>
                      <span className="text-pink-500 font-extrabold">
                        {stats.dailyQuestionsAttempted > 0 
                          ? `${(((stats.dailyWins || 0) / stats.dailyQuestionsAttempted) * 100).toFixed(0)}%` 
                          : "0%"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/60 dark:bg-slate-950/60 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-pink-500 transition-all duration-700"
                        style={{ width: `${stats.dailyQuestionsAttempted > 0 ? (((stats.dailyWins || 0) / stats.dailyQuestionsAttempted) * 100).toFixed(0) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* All-Time Stats */}
            <div className="flex-1 p-4 space-y-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                  All-Time Record
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 mt-2.5">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center justify-center bg-slate-100/40 dark:bg-[#110d29]/20 border border-slate-200/50 dark:border-slate-800/40 rounded-xl py-2 px-1.5 gap-0.5 min-w-0">
                      <span className="text-base font-black text-slate-800 dark:text-white leading-none">
                        {stats.questionsAttempted || 0}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider text-center leading-none mt-1">Total</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-emerald-500/5 border border-emerald-500/10 rounded-xl py-2 px-1.5 gap-0.5 min-w-0">
                      <span className="text-base font-black text-emerald-500 leading-none">
                        {stats.wins || 0}
                      </span>
                      <span className="text-[8px] font-bold text-emerald-500/70 uppercase tracking-wider text-center leading-none mt-1">Correct</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-red-500/5 border border-red-500/10 rounded-xl py-2 px-1.5 gap-0.5 min-w-0">
                      <span className="text-base font-black text-red-500 leading-none">
                        {stats.losses || 0}
                      </span>
                      <span className="text-[8px] font-bold text-red-500/70 uppercase tracking-wider text-center leading-none mt-1">Wrong</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-36 shrink-0 space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-405 leading-none">
                      <span>Overall Accuracy</span>
                      <span className="text-violet-500 font-extrabold">{stats.accuracy || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200/60 dark:bg-slate-950/60 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-700"
                        style={{ width: `${stats.accuracy || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions — Compact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/student-attendance")}
          className="w-full h-12 rounded-xl bg-white/40 dark:bg-[#110d29]/30 border border-slate-200/85 dark:border-[#221a48] hover:border-slate-350 dark:hover:border-[#382b75] hover:bg-slate-50/50 dark:hover:bg-[#110d29]/50 transition-all font-bold text-xs flex items-center justify-between px-4 text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm group"
        >
          <span className="flex items-center">
            <Calendar className="w-4.5 h-4.5 mr-2.5 text-pink-500" />
            <span>View Attendance</span>
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all" />
        </button>
        <button
          onClick={() => navigate("/all-mock-tests")}
          className="w-full h-12 rounded-xl bg-white/40 dark:bg-[#110d29]/30 border border-slate-200/85 dark:border-[#221a48] hover:border-slate-350 dark:hover:border-[#382b75] hover:bg-slate-50/50 dark:hover:bg-[#110d29]/50 transition-all font-bold text-xs flex items-center justify-between px-4 text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm group"
        >
          <span className="flex items-center">
            <ClipboardList className="w-4.5 h-4.5 mr-2.5 text-purple-500" />
            <span>Mock Tests</span>
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-550 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>
    </div>
  );
}
