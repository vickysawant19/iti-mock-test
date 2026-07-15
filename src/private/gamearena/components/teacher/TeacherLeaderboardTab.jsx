import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Crown,
  Award,
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
  const [leaderboardFilter, setLeaderboardFilter] = useState("xp");

  const sortedLeaderboard = useMemo(() => {
    if (!leaderboard) return [];
    const list = [...leaderboard];
    if (leaderboardFilter === "xp") {
      list.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    } else if (leaderboardFilter === "level") {
      list.sort((a, b) => {
        const diff = (b.level || 1) - (a.level || 1);
        return diff !== 0 ? diff : (b.xp || 0) - (a.xp || 0);
      });
    } else if (leaderboardFilter === "daily") {
      list.sort((a, b) => {
        const diffWins = (b.dailyWins || 0) - (a.dailyWins || 0);
        if (diffWins !== 0) return diffWins;
        const diffAtt = (b.dailyQuestionsAttempted || 0) - (a.dailyQuestionsAttempted || 0);
        return diffAtt !== 0 ? diffAtt : (b.xp || 0) - (a.xp || 0);
      });
    } else if (leaderboardFilter === "wins") {
      list.sort((a, b) => {
        const diffWins = (b.wins || 0) - (a.wins || 0);
        if (diffWins !== 0) return diffWins;
        return (b.xp || 0) - (a.xp || 0);
      });
    }
    return list;
  }, [leaderboard, leaderboardFilter]);

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
        <div className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/40 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-slate-800 dark:text-white min-w-0 shadow-sm backdrop-blur-xl">
          <div className="p-2 sm:p-3 bg-pink-500/25 dark:bg-pink-500/20 rounded-xl sm:rounded-2xl text-pink-600 dark:text-pink-400 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[7px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total XP</p>
            <p className="text-xs sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5 sm:mt-1 truncate">{totalBatchXP} XP</p>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/40 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-slate-800 dark:text-white min-w-0 shadow-sm backdrop-blur-xl">
          <div className="p-2 sm:p-3 bg-purple-500/25 dark:bg-purple-500/20 rounded-xl sm:rounded-2xl text-purple-600 dark:text-purple-400 shrink-0">
            <Target className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[7px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Accuracy</p>
            <p className="text-xs sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5 sm:mt-1 truncate">{avgAccuracy}%</p>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/40 p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-slate-800 dark:text-white min-w-0 shadow-sm backdrop-blur-xl">
          <div className="p-2 sm:p-3 bg-amber-500/25 dark:bg-amber-500/20 rounded-xl sm:rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
            <Zap className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[7px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Avg Level</p>
            <p className="text-xs sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5 sm:mt-1 truncate">LVL {avgLevel}</p>
          </div>
        </div>
      </div>

      {/* Batch Game Leaderboard */}
      <div className="space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-pink-500" />
            Batch Gamified Leaderboard
          </h3>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg select-none self-start md:self-auto">
            {leaderboard.length} Students
          </span>
        </div>

        {/* Dynamic Predefined Filter Bar */}
        <div className="flex gap-2 flex-wrap px-1 pb-1">
          {[
            { id: "xp", label: "Highest XP", icon: Sparkles, color: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/15" },
            { id: "level", label: "Highest Level", icon: Trophy, color: "text-purple-500 bg-purple-500/10 hover:bg-purple-500/15" },
            { id: "daily", label: "Active Today", icon: Flame, color: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/15" },
            { id: "wins", label: "MCQs Solved", icon: Target, color: "text-pink-500 bg-pink-500/10 hover:bg-pink-500/15" },
          ].map((tab) => {
            const isActive = leaderboardFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setLeaderboardFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-pink-600 to-purple-650 text-white shadow-sm scale-102"
                    : `${tab.color} border border-transparent`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {sortedLeaderboard.map((student, idx) => {
            const isExpanded = expandedStudentId === student.studentId;
            const rank = idx + 1;

            // Define specialized rankings theme
            let rankBadgeBg = "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
            let rankBorder = "border-slate-100 dark:border-slate-800/40";
            let rankGlow = "";
            let rankIcon = null;

            if (rank === 1) {
              rankBadgeBg = "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black";
              rankBorder = "border-yellow-400/40 dark:border-yellow-500/30";
              rankGlow = "shadow-lg shadow-yellow-500/5 dark:shadow-yellow-500/10";
              rankIcon = <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />;
            } else if (rank === 2) {
              rankBadgeBg = "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black";
              rankBorder = "border-slate-300/40 dark:border-slate-400/20";
              rankGlow = "shadow-md shadow-slate-400/5";
              rankIcon = <Award className="w-3.5 h-3.5 text-slate-400 fill-slate-400" />;
            } else if (rank === 3) {
              rankBadgeBg = "bg-gradient-to-r from-orange-400 to-amber-600 text-white font-black";
              rankBorder = "border-orange-500/30 dark:border-orange-600/20";
              rankGlow = "shadow-md shadow-orange-500/5";
              rankIcon = <Award className="w-3.5 h-3.5 text-orange-550 fill-orange-550" />;
            }

            return (
              <div
                key={student.studentId}
                className={`border rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300 ${rankBorder} ${rankGlow} ${
                  isExpanded ? "ring-2 ring-pink-500/20 dark:ring-pink-500/10 scale-[1.005]" : "hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                {/* Row Header */}
                <div
                  onClick={() => setExpandedStudentId(isExpanded ? null : student.studentId)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 sm:py-4 gap-3 sm:gap-4 hover:bg-white/40 dark:hover:bg-slate-950/20 transition-all cursor-pointer select-none"
                >
                  {/* Left Side: Rank, Avatar, Name, Level */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Rank Badge */}
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${rankBadgeBg}`}>
                      {rank}
                    </div>

                    {/* Avatar with rank crown overlay */}
                    <div className="relative shrink-0">
                      <InteractiveAvatar
                        src={student.profileImage}
                        fallbackText={student.userName?.charAt(0) || "?"}
                        userId={student.studentId}
                        userName={student.userName}
                        showStatus={true}
                        statusSize="xs"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl"
                      />
                      {rank === 1 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-yellow-450 dark:bg-yellow-500 p-0.5 rounded-full ring-2 ring-white dark:ring-slate-900 text-[10px] select-none">
                          👑
                        </span>
                      )}
                    </div>

                    {/* Name and Level */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                          {student.userName}
                        </p>
                        {rankIcon}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md">
                          Level {student.level}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {student.xp} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Metrics Columns (Accuracy, Correct, Expand) */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-6 shrink-0 pt-2.5 sm:pt-0 border-t border-slate-100 dark:border-slate-800/40 sm:border-0">
                    {/* Accuracy Column */}
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-xl shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-black text-pink-650 dark:text-pink-400 leading-none">
                          {student.accuracy}%
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                          Accuracy
                        </p>
                      </div>
                    </div>

                    {/* MCQs Correct Column */}
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-xl shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 leading-none">
                          {student.wins} <span className="text-[10px] font-bold text-slate-400">/ {student.questionsAttempted || 0}</span>
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                          Correct MCQs
                        </p>
                      </div>
                    </div>

                    {/* Expand Chevron Container */}
                    <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-slate-400 shrink-0">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180 text-pink-500" : ""}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded stats panel */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5 bg-slate-50/30 dark:bg-slate-900/10 border-t border-white/5 dark:border-slate-800/20 overflow-hidden text-slate-800 dark:text-slate-200"
                    >
                      {(() => {
                        const sRow = studentRows?.find(r => r.studentId === student.studentId) || {};
                        const dailyAccuracy = student.dailyQuestionsAttempted > 0
                          ? Math.round(((student.dailyWins || 0) / student.dailyQuestionsAttempted) * 100)
                          : 0;
                        const levelProgress = student.xp % 100;
                        
                        return (
                          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            
                            {/* Card 1: Attendance Details */}
                            <div className="bg-white/90 dark:bg-slate-950/65 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl space-y-3.5 shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-1.5 select-none">
                                  <Building className="w-4 h-4 text-purple-500 shrink-0" />
                                  Attendance
                                </span>
                                {sRow.status && (
                                  <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                    sRow.status === 'critical' ? 'bg-red-500/10 text-red-550 border-red-500/20'
                                    : sRow.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-505 border-emerald-505/20'
                                  }`}>
                                    {sRow.status === 'critical' ? 'Low' : sRow.status === 'warning' ? 'Warn' : 'Good'}
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-2.5">
                                {/* Overall */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-extrabold">
                                    <span className="text-slate-550 dark:text-slate-450">Overall Attendance</span>
                                    <span className={`font-black ${sRow.totalAttendancePercent < 75 ? "text-red-550" : "text-emerald-600"}`}>
                                      {sRow.totalAttendancePercent !== undefined ? `${sRow.totalAttendancePercent}%` : "N/A"}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
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
                                  <div className="flex justify-between text-[10px] font-extrabold">
                                    <span className="text-slate-550 dark:text-slate-450">This Month</span>
                                    <span className={`font-black ${sRow.monthlyAttendancePercent < 75 ? "text-red-555" : "text-emerald-600"}`}>
                                      {sRow.monthlyAttendancePercent !== undefined ? `${sRow.monthlyAttendancePercent}%` : "N/A"}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
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
                            <div className="bg-white/90 dark:bg-slate-950/65 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl space-y-3.5 shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-1.5 select-none">
                                  <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                                  Mock Tests
                                </span>
                                <span className="text-[8px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-wider select-none">
                                  Results
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                                  <p className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200">{sRow.testsSubmitted ?? 0}</p>
                                  <p className="text-[8px] font-extrabold text-slate-400 uppercase mt-1 tracking-wider truncate">Submitted</p>
                                </div>
                                <div className={`rounded-xl p-2 border ${
                                  (sRow.avgScore || 0) >= 75 ? 'bg-emerald-500/5 border-emerald-500/20'
                                  : (sRow.avgScore || 0) >= 50 ? 'bg-amber-500/5 border-amber-500/20'
                                  : 'bg-red-500/5 border-red-500/20'
                                }`}>
                                  <p className={`text-sm sm:text-base font-black ${
                                    (sRow.avgScore || 0) >= 75 ? 'text-emerald-500'
                                    : (sRow.avgScore || 0) >= 50 ? 'text-amber-500'
                                    : 'text-red-500'
                                  }`}>{sRow.avgScore !== undefined ? `${sRow.avgScore}%` : "0%"}</p>
                                  <p className="text-[8px] font-extrabold text-slate-400 uppercase mt-1 tracking-wider truncate">Avg Score</p>
                                </div>
                              </div>
                            </div>

                            {/* Card 3: MCQ Solved */}
                            <div className="bg-white/90 dark:bg-slate-950/65 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl space-y-3.5 shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-1.5 select-none">
                                  <Target className="w-4 h-4 text-pink-500 shrink-0" />
                                  MCQ Solved
                                </span>
                                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 bg-slate-150 dark:bg-slate-900 px-1.5 py-0.5 rounded select-none">
                                  Today vs All
                                </span>
                              </div>
                              
                              <div className="space-y-2 pt-0.5">
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold text-slate-650 dark:text-slate-350">Today</span>
                                    <span className="text-[8px] font-bold text-slate-450 dark:text-slate-500 truncate">
                                      {student.dailyWins || 0}/{student.dailyQuestionsAttempted || 0} Correct
                                    </span>
                                  </div>
                                  <span className="font-black text-pink-500 text-xs shrink-0">
                                    {student.dailyQuestionsAttempted > 0 ? `${dailyAccuracy}%` : "—"}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-900/60 pt-2">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold text-slate-655 dark:text-slate-350">All-Time</span>
                                    <span className="text-[8px] font-bold text-slate-455 dark:text-slate-500 truncate">
                                      {student.wins || 0}/{student.questionsAttempted || 0} Correct
                                    </span>
                                  </div>
                                  <span className="font-black text-purple-500 dark:text-purple-400 text-xs shrink-0">
                                    {student.accuracy || 0}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card 4: Level & Streaks */}
                            <div className="bg-white/90 dark:bg-slate-950/65 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl space-y-3.5 shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-1.5 select-none">
                                  <Sparkles className="w-4 h-4 text-yellow-500 shrink-0" />
                                  Level Progress
                                </span>
                                <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 select-none">
                                  <Coins className="w-3.5 h-3.5 shrink-0" />
                                  {student.coins || 0}
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                {/* Level progress bar */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9px] font-extrabold">
                                    <span className="text-slate-550 dark:text-slate-450">LVL {student.level}</span>
                                    <span className="text-slate-400 dark:text-slate-500">{levelProgress}/100 XP</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-yellow-450 to-amber-500"
                                      style={{ width: `${levelProgress}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Streaks */}
                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900/60 pt-2 shrink-0">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20 shrink-0" />
                                    <span className="text-[10px] font-black text-orange-555 truncate">{student.currentStreak || 0}d streak</span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold shrink-0">Best: {student.highestStreak || 0}d</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
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
