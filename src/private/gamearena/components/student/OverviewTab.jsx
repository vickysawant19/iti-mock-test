/* eslint-disable react/prop-types */
import React from "react";
import {
  Zap,
  Gamepad2,
  Trophy,
  Flame,
  ClipboardList,
  Calendar,
  ChevronRight,
  Star,
  Coins,
} from "lucide-react";

// ─── Compact stat card ────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white/40 dark:bg-[#110d29]/30 backdrop-blur-md border border-slate-200/85 dark:border-[#221a48] hover:border-slate-300 dark:hover:border-[#382b75] rounded-[18px] p-3.5 flex items-center gap-3 transition-all duration-300 shadow-sm hover:shadow hover:translate-y-[-1px]">
    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${color}`}>
      <Icon className="w-4.5 h-4.5 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider truncate leading-tight">{label}</p>
      <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight mt-0.5 leading-none truncate">{value}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OverviewTab({ stats, navigate }) {
  const todayAcc = stats?.dailyQuestionsAttempted > 0
    ? Math.round(((stats.dailyWins || 0) / stats.dailyQuestionsAttempted) * 100)
    : 0;
  const allAcc = stats?.accuracy || 0;

  return (
    <div className="space-y-4">

      {/* ── 4 Game-Native Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Zap}
          label="XP Earned"
          value={`${stats?.xp ?? 0} XP`}
          color="bg-gradient-to-br from-amber-400 to-yellow-500"
        />
        <StatCard
          icon={Coins}
          label="Coins"
          value={stats?.coins ?? 0}
          color="bg-gradient-to-br from-yellow-400 to-amber-500"
        />
        <StatCard
          icon={Star}
          label="Level"
          value={`Lv. ${stats?.level ?? 1}`}
          color="bg-gradient-to-br from-violet-500 to-indigo-600"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${stats?.currentStreak ?? 0} Days`}
          color="bg-gradient-to-br from-orange-500 to-red-500"
        />
      </div>

      {/* ── Game Activity Card ── */}
      {stats && (
        <div className="bg-white/40 dark:bg-[#110d29]/30 backdrop-blur-md border border-slate-200/85 dark:border-[#221a48] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200/80 dark:border-[#221a48] flex items-center gap-2.5">
            <div className="p-1 bg-violet-500/10 rounded-lg">
              <Gamepad2 className="w-4 h-4 text-violet-500" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight">Game Activity</h3>
          </div>

          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-[#221a48]">
            {/* Today */}
            <div className="flex-1 p-4 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Today
              </p>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-slate-100/40 dark:bg-[#110d29]/20 border border-slate-200/50 dark:border-slate-800/40 rounded-xl py-2 px-4">
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none">
                    {stats.dailyQuestionsAttempted || 0}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">Questions</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>Accuracy</span>
                    <span className="text-pink-500 font-extrabold">{todayAcc}%</span>
                  </div>
                  <div className="w-full bg-slate-200/60 dark:bg-slate-950/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-pink-500 transition-all duration-700"
                      style={{ width: `${todayAcc}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium">
                    {stats.dailyWins || 0} correct · {stats.dailyLosses || 0} wrong
                  </div>
                </div>
              </div>
            </div>

            {/* All-Time */}
            <div className="flex-1 p-4 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                All-Time
              </p>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-slate-100/40 dark:bg-[#110d29]/20 border border-slate-200/50 dark:border-slate-800/40 rounded-xl py-2 px-4">
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none">
                    {stats.questionsAttempted || 0}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">Questions</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>Accuracy</span>
                    <span className="text-violet-500 font-extrabold">{allAcc}%</span>
                  </div>
                  <div className="w-full bg-slate-200/60 dark:bg-slate-950/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-700"
                      style={{ width: `${allAcc}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium">
                    Best streak: {stats.highestStreak || 0} days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
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
