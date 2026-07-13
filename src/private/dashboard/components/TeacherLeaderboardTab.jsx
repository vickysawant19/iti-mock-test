import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Zap,
  Building,
  Trophy,
  Coins,
  Flame,
  ChevronDown,
  Loader2,
} from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

export default function TeacherLeaderboardTab({
  loadingGame,
  totalBatchXP,
  avgAccuracy,
  avgLevel,
  leaderboard,
  expandedStudentId,
  setExpandedStudentId,
  studentRows,
}) {
  if (loadingGame) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <>
      {/* Game Stats overview */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-white min-w-0">
          <div className="p-2 sm:p-3 bg-pink-500/20 rounded-xl sm:rounded-2xl text-pink-500 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Total XP</p>
            <p className="text-xs sm:text-2xl font-black text-white mt-0.5 sm:mt-1 truncate">{totalBatchXP} XP</p>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-white min-w-0">
          <div className="p-2 sm:p-3 bg-purple-500/20 rounded-xl sm:rounded-2xl text-purple-500 shrink-0">
            <Target className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Accuracy</p>
            <p className="text-xs sm:text-2xl font-black text-white mt-0.5 sm:mt-1 truncate">{avgAccuracy}%</p>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-white min-w-0">
          <div className="p-2 sm:p-3 bg-amber-500/20 rounded-xl sm:rounded-2xl text-amber-500 shrink-0">
            <Zap className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Avg Level</p>
            <p className="text-xs sm:text-2xl font-black text-white mt-0.5 sm:mt-1 truncate">LVL {avgLevel}</p>
          </div>
        </div>
      </div>

      {/* Batch Game Leaderboard */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Batch Gamified Leaderboard</h3>
        </div>
        <div className="divide-y divide-white/20 dark:divide-slate-800/40">
          {leaderboard.map((student, idx) => {
            const isExpanded = expandedStudentId === student.studentId;
            return (
              <div key={student.studentId} className="border-b border-white/10 dark:border-slate-800/40 last:border-b-0">
                {/* Row Header clickable to toggle expand */}
                <div
                  onClick={() => setExpandedStudentId(isExpanded ? null : student.studentId)}
                  className="flex justify-between items-center px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 w-5">#{idx + 1}</span>
                    <InteractiveAvatar
                      src={student.profileImage}
                      fallbackText={student.userName?.charAt(0) || "?"}
                      userId={student.studentId}
                      userName={student.userName}
                      showStatus={true}
                      statusSize="xs"
                      className="h-8 w-8 rounded-lg"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-750 dark:text-slate-350">{student.userName}</p>
                      <p className="text-[9px] text-slate-400 font-bold">Level {student.level} • {student.xp} XP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-xs font-black text-pink-500">{student.accuracy}% Accuracy</span>
                      <p className="text-[9px] text-slate-400 font-bold">{student.wins} / {student.questionsAttempted || 0} Correct</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-pink-500" : ""}`} />
                  </div>
                </div>

                {/* Expanded stats panel */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-5 bg-slate-50/50 dark:bg-slate-900/10 border-t border-white/5 dark:border-slate-800/20 overflow-hidden text-slate-800 dark:text-slate-200"
                  >
                    {(() => {
                      const sRow = studentRows?.find(r => r.studentId === student.studentId) || {};
                      const dailyAccuracy = student.dailyQuestionsAttempted > 0
                        ? Math.round(((student.dailyWins || 0) / student.dailyQuestionsAttempted) * 100)
                        : 0;
                      const levelProgress = student.xp % 100;
                      
                      return (
                        <div className="pt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          
                          {/* Card 1: Attendance Details */}
                          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/50 p-3 sm:p-4 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Building className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                Attendance
                              </span>
                              {sRow.status && (
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                                  sRow.status === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                  : sRow.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                }`}>
                                  {sRow.status === 'critical' ? 'Low' : sRow.status === 'warning' ? 'Warn' : 'Good'}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {/* Overall */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-slate-500 dark:text-slate-400 truncate">Overall</span>
                                  <span className={sRow.totalAttendancePercent < 75 ? "text-red-550 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                                    {sRow.totalAttendancePercent !== undefined ? `${sRow.totalAttendancePercent}%` : "N/A"}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${
                                      (sRow.totalAttendancePercent || 0) < 50 ? 'from-red-400 to-red-500'
                                      : (sRow.totalAttendancePercent || 0) < 75 ? 'from-amber-400 to-amber-500'
                                      : 'from-emerald-400 to-emerald-500'
                                    }`}
                                    style={{ width: `${sRow.totalAttendancePercent || 0}%` }}
                                  />
                                </div>
                              </div>

                              {/* Monthly */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-slate-500 dark:text-slate-400 truncate">Monthly</span>
                                  <span className={sRow.monthlyAttendancePercent < 75 ? "text-red-550 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                                    {sRow.monthlyAttendancePercent !== undefined ? `${sRow.monthlyAttendancePercent}%` : "N/A"}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${
                                      (sRow.monthlyAttendancePercent || 0) < 50 ? 'from-red-400 to-red-500'
                                      : (sRow.monthlyAttendancePercent || 0) < 75 ? 'from-amber-400 to-amber-500'
                                      : 'from-emerald-400 to-emerald-500'
                                    }`}
                                    style={{ width: `${sRow.monthlyAttendancePercent || 0}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card 2: Mock Tests */}
                          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/50 p-3 sm:p-4 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                Mock Tests
                              </span>
                              <span className="text-[8px] font-extrabold text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded-full border border-indigo-500/10">
                                Result
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-center pt-1.5">
                              <div className="bg-slate-100/50 dark:bg-slate-800/40 rounded-xl p-1.5 border border-slate-200/20">
                                <p className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300">{sRow.testsSubmitted ?? 0}</p>
                                <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase mt-0.5 tracking-wider truncate">Done</p>
                              </div>
                              <div className={`rounded-xl p-1.5 border ${
                                (sRow.avgScore || 0) >= 75 ? 'bg-emerald-500/5 border-emerald-500/15'
                                : (sRow.avgScore || 0) >= 50 ? 'bg-amber-500/5 border-amber-500/15'
                                : 'bg-red-500/5 border-red-500/15'
                              }`}>
                                <p className={`text-xs sm:text-sm font-black ${
                                  (sRow.avgScore || 0) >= 75 ? 'text-emerald-500'
                                  : (sRow.avgScore || 0) >= 50 ? 'text-amber-500'
                                  : 'text-red-500'
                                }`}>{sRow.avgScore !== undefined ? `${sRow.avgScore}%` : "0%"}</p>
                                <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase mt-0.5 tracking-wider truncate">Avg</p>
                              </div>
                            </div>
                          </div>

                          {/* Card 3: Gamified Activity */}
                          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/50 p-3 sm:p-4 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                                MCQ Solved
                              </span>
                              <span className="text-[8px] font-black text-slate-400">
                                Today vs All
                              </span>
                            </div>
                            
                            <div className="space-y-1.5 pt-0.5">
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-705 dark:text-slate-300">Today</span>
                                  <span className="text-[7px] sm:text-[8px] text-slate-400 truncate">
                                    {student.dailyWins || 0}/{student.dailyQuestionsAttempted || 0} Correct
                                  </span>
                                </div>
                                <span className="font-extrabold text-pink-500 text-[10px] sm:text-xs">
                                  {student.dailyQuestionsAttempted > 0 ? `${dailyAccuracy}%` : "—"}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800/60 pt-1.5">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-705 dark:text-slate-300">All-Time</span>
                                  <span className="text-[7px] sm:text-[8px] text-slate-400 truncate">
                                    {student.wins || 0}/{student.questionsAttempted || 0} Correct
                                  </span>
                                </div>
                                <span className="font-extrabold text-purple-550 dark:text-purple-400 text-[10px] sm:text-xs">
                                  {student.accuracy || 0}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card 4: Level & Streaks */}
                          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/50 p-3 sm:p-4 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                Progress
                              </span>
                              <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black text-amber-500">
                                <Coins className="w-3 h-3 shrink-0" />
                                {student.coins || 0}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {/* Level progress bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] sm:text-[9px] font-bold">
                                  <span className="text-slate-500 dark:text-slate-400">LVL {student.level}</span>
                                  <span className="text-slate-400">{levelProgress}/100 XP</span>
                                </div>
                                <div className="w-full h-1 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                                    style={{ width: `${levelProgress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Streaks */}
                              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-1.5">
                                <div className="flex items-center gap-0.5 min-w-0">
                                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20 shrink-0" />
                                  <span className="text-[9px] sm:text-[10px] font-extrabold text-orange-500 truncate">{student.currentStreak || 0}d streak</span>
                                </div>
                                <span className="text-[7px] sm:text-[8px] text-slate-400 font-bold shrink-0">Best: {student.highestStreak || 0}d</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </div>
            );
          })}
          {leaderboard.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-10">No game scores recorded.</p>
          )}
        </div>
      </div>
    </>
  );
}
