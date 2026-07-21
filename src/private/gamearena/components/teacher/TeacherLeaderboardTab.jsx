import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Target,
  Zap,
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
  recentlyUpdatedStudents = {},
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


      {/* Batch Game Leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-pink-500" />
            Batch Leaderboard
          </h3>
          <span className="text-[10px] font-bold text-slate-455 dark:text-slate-500">
            {leaderboard.length} Students
          </span>
        </div>

        {/* Dynamic Predefined Filter Bar */}
        <div className="flex gap-2 flex-wrap px-1 pb-1">
          {[
            { id: "xp", label: "Highest XP", icon: Sparkles, color: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/10" },
            { id: "level", label: "Highest Level", icon: Trophy, color: "text-purple-500 bg-purple-500/10 hover:bg-purple-500/15 border-purple-500/10" },
            { id: "daily", label: "Active Today", icon: Flame, color: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/15 border-orange-500/10" },
            { id: "wins", label: "MCQs Solved", icon: Target, color: "text-pink-500 bg-pink-500/10 hover:bg-pink-500/15 border-pink-500/10" },
          ].map((tab) => {
            const isActive = leaderboardFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setLeaderboardFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? "bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-sm shadow-pink-500/20 border-transparent scale-102"
                    : `${tab.color} bg-white/20 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/80`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Desktop-optimized Table View */}
        <div className="hidden md:block overflow-x-auto bg-white/40 dark:bg-[#110d29]/30 backdrop-blur-md border border-slate-200/85 dark:border-[#221a48] rounded-[24px] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150/40 dark:border-slate-800/40 text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                <th className="py-4 px-5 w-16 text-center">Rank</th>
                <th className="py-4 px-5">Student</th>
                <th className="py-4 px-5 text-center">Level</th>
                <th className="py-4 px-5 text-center">XP</th>
                <th className="py-4 px-5 text-center">Coins</th>
                <th className="py-4 px-5 text-center">Streak</th>
                <th className="py-4 px-5 text-center">Today's Solved</th>
                <th className="py-4 px-5 text-center">All-Time Solved</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeaderboard.map((student, idx) => {
                const rank = idx + 1;
                const dailyAccuracy = student.dailyQuestionsAttempted > 0
                  ? Math.round(((student.dailyWins || 0) / student.dailyQuestionsAttempted) * 100)
                  : 0;

                const isHighlighted = recentlyUpdatedStudents[student.studentId];

                // Define specialized rankings theme
                let rowBg = isHighlighted
                  ? "bg-indigo-500/15 dark:bg-indigo-500/20 animate-pulse border-y border-y-indigo-500/30"
                  : "hover:bg-slate-100/40 dark:hover:bg-slate-855/20";
                let rankBadgeBg = isHighlighted
                  ? "bg-indigo-500 text-white font-black ring-2 ring-indigo-400/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
                let rankIcon = null;

                if (!isHighlighted) {
                  if (rank === 1) {
                    rowBg = "bg-yellow-500/5 hover:bg-yellow-500/10 dark:bg-yellow-500/5 dark:hover:bg-yellow-500/10";
                    rankBadgeBg = "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black";
                    rankIcon = <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />;
                  } else if (rank === 2) {
                    rowBg = "bg-slate-100/15 hover:bg-slate-150/20 dark:bg-slate-700/5 dark:hover:bg-slate-700/10";
                    rankBadgeBg = "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black";
                    rankIcon = <Award className="w-3.5 h-3.5 text-slate-450 fill-slate-400" />;
                  } else if (rank === 3) {
                    rowBg = "bg-orange-500/5 hover:bg-orange-500/10 dark:bg-orange-500/5 dark:hover:bg-orange-500/10";
                    rankBadgeBg = "bg-gradient-to-r from-orange-400 to-amber-600 text-white font-black";
                    rankIcon = <Award className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />;
                  }
                }

                // Name strip background gradient
                let nameStripBg = "bg-gradient-to-r from-slate-100/70 to-transparent dark:from-slate-800/30";
                let nameStripBorder = "border-l-[3px] border-slate-300 dark:border-slate-800";
                if (isHighlighted) {
                  nameStripBg = "bg-gradient-to-r from-indigo-500/15 to-transparent dark:from-indigo-500/20";
                  nameStripBorder = "border-l-[3px] border-indigo-500";
                } else if (rank === 1) {
                  nameStripBg = "bg-gradient-to-r from-yellow-500/10 to-transparent dark:from-yellow-500/15";
                  nameStripBorder = "border-l-[3px] border-yellow-500";
                } else if (rank === 2) {
                  nameStripBg = "bg-gradient-to-r from-slate-300/15 to-transparent dark:from-slate-700/15";
                  nameStripBorder = "border-l-[3px] border-slate-400";
                } else if (rank === 3) {
                  nameStripBg = "bg-gradient-to-r from-orange-500/10 to-transparent dark:from-orange-500/15";
                  nameStripBorder = "border-l-[3px] border-orange-500";
                }

                return (
                  <tr key={student.studentId} className={`border-b border-slate-150/40 dark:border-slate-800/40 transition-colors ${rowBg}`}>
                    {/* Rank */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center">
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${rankBadgeBg}`}>
                          {rank}
                        </div>
                      </div>
                    </td>

                    {/* Student Info */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <InteractiveAvatar
                            src={student.profileImage}
                            fallbackText={student.userName?.charAt(0) || "?"}
                            userId={student.studentId}
                            userName={student.userName}
                            lastseen={student.lastseen}
                            showStatus={true}
                            statusSize="xs"
                            className="h-9 w-9 rounded-2xl"
                          />
                          {rank === 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 p-0.5 rounded-full ring-2 ring-white dark:ring-slate-900 text-[10px] select-none">
                              👑
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`px-2.5 py-0.5 rounded-lg ${nameStripBg} ${nameStripBorder} flex items-center gap-1.5 w-fit max-w-full`}>
                            <p className="text-xs sm:text-sm font-black text-slate-850 dark:text-white truncate">
                              {student.userName}
                            </p>
                            {rankIcon}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="py-3 px-5 text-center">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md">
                        LVL {student.level}
                      </span>
                    </td>

                    {/* XP */}
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-pink-500" />
                        <span className="text-xs font-black text-slate-850 dark:text-slate-100">{student.xp}</span>
                      </div>
                    </td>

                    {/* Coins */}
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-black text-slate-850 dark:text-slate-100">{student.coins || 0}</span>
                      </div>
                    </td>

                    {/* Streak */}
                    <td className="py-3 px-5 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1 text-xs font-black text-orange-600 dark:text-orange-450 leading-none">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{student.currentStreak || 0}d</span>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                          Best: {student.highestStreak || 0}d
                        </span>
                      </div>
                    </td>

                    {/* Today's Solved */}
                    <td className="py-3 px-5 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-slate-850 dark:text-white leading-none">
                          {student.dailyWins || 0} <span className="text-[9px] text-slate-450 font-bold">/ {student.dailyQuestionsAttempted || 0}</span>
                        </span>
                        <span className="text-[9.5px] font-extrabold text-pink-500 mt-1">
                          {student.dailyQuestionsAttempted > 0 ? `${dailyAccuracy}% Acc` : "—"}
                        </span>
                      </div>
                    </td>

                    {/* All-Time Solved */}
                    <td className="py-3 px-5 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-slate-850 dark:text-white leading-none">
                          {student.wins || 0} <span className="text-[9px] text-slate-450 font-bold">/ {student.questionsAttempted || 0}</span>
                        </span>
                        <span className="text-[9.5px] font-extrabold text-purple-500 mt-1">
                          {student.accuracy || 0}% Acc
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile List View (click-to-expand) */}
        <div className="md:hidden space-y-2.5">
          {sortedLeaderboard.map((student, idx) => {
            const isExpanded = expandedStudentId === student.studentId;
            const rank = idx + 1;
            const isHighlighted = recentlyUpdatedStudents[student.studentId];

            // Define specialized rankings theme
            let rankBadgeBg = isHighlighted
              ? "bg-indigo-500 text-white font-black ring-2 ring-indigo-400/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
            let rankIcon = null;

            if (!isHighlighted) {
              if (rank === 1) {
                rankBadgeBg = "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black";
                rankIcon = <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />;
              } else if (rank === 2) {
                rankBadgeBg = "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black";
                rankIcon = <Award className="w-3.5 h-3.5 text-slate-450 fill-slate-400" />;
              } else if (rank === 3) {
                rankBadgeBg = "bg-gradient-to-r from-orange-400 to-amber-600 text-white font-black";
                rankIcon = <Award className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />;
              }
            }

            // Name strip background gradient
            let nameStripBg = "bg-gradient-to-r from-slate-100/70 to-transparent dark:from-slate-800/30";
            let nameStripBorder = "border-l-[3px] border-slate-300 dark:border-slate-800";
            if (isHighlighted) {
              nameStripBg = "bg-gradient-to-r from-indigo-500/15 to-transparent dark:from-indigo-500/20";
              nameStripBorder = "border-l-[3px] border-indigo-500";
            } else if (rank === 1) {
              nameStripBg = "bg-gradient-to-r from-yellow-500/10 to-transparent dark:from-yellow-500/15";
              nameStripBorder = "border-l-[3px] border-yellow-500";
            } else if (rank === 2) {
              nameStripBg = "bg-gradient-to-r from-slate-300/15 to-transparent dark:from-slate-700/15";
              nameStripBorder = "border-l-[3px] border-slate-400";
            } else if (rank === 3) {
              nameStripBg = "bg-gradient-to-r from-orange-500/10 to-transparent dark:from-orange-500/15";
              nameStripBorder = "border-l-[3px] border-orange-500";
            }

            const glowCardClass = isHighlighted
              ? "border-indigo-500 dark:border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.35)] ring-2 ring-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 animate-pulse"
              : "";

            return (
              <div
                key={student.studentId}
                className={`bg-white/40 dark:bg-[#110d29]/30 backdrop-blur-md border border-slate-200/85 dark:border-[#221a48] rounded-2xl overflow-hidden shadow-sm transition-all duration-200 ${
                  isExpanded ? "ring-2 ring-pink-500/20" : ""
                } ${glowCardClass}`}
              >
                {/* Row Header */}
                <div
                  onClick={() => setExpandedStudentId(isExpanded ? null : student.studentId)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 sm:py-4 gap-3 sm:gap-4 hover:bg-slate-100/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer select-none ${
                    isExpanded ? "bg-slate-50/60 dark:bg-slate-800/20" : ""
                  }`}
                >
                  {/* Left Side: Rank, Avatar, Name, Level */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
                        lastseen={student.lastseen}
                        showStatus={true}
                        statusSize="xs"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl"
                      />
                      {rank === 1 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 p-0.5 rounded-full ring-2 ring-white dark:ring-slate-900 text-[10px] select-none">
                          👑
                        </span>
                      )}
                    </div>

                    {/* Name with side color strip accent and Level */}
                    <div className="min-w-0 flex-1">
                      <div className={`px-2.5 py-0.5 rounded-lg ${nameStripBg} ${nameStripBorder} flex items-center gap-1.5 w-fit max-w-full`}>
                        <p className="text-xs sm:text-sm font-black text-slate-850 dark:text-white">
                          {student.userName}
                        </p>
                        {rankIcon}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md">
                          Level {student.level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Metrics Columns (XP, Coins, MCQs, Streak, Expand) */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 shrink-0 pt-2.5 sm:pt-0 border-t border-slate-100 dark:border-slate-800/40 sm:border-0 flex-wrap sm:flex-nowrap">
                    {/* XP Column */}
                    <div className="flex items-center gap-1.5 min-w-[50px]">
                      <div className="p-1 bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-lg shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-black text-slate-850 dark:text-slate-100 leading-none">
                          {student.xp}
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                          XP
                        </p>
                      </div>
                    </div>

                    {/* Coins Column */}
                    <div className="flex items-center gap-1.5 min-w-[50px]">
                      <div className="p-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-450 rounded-lg shrink-0">
                        <Coins className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-black text-slate-855 dark:text-slate-100 leading-none">
                          {student.coins || 0}
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                          Coins
                        </p>
                      </div>
                    </div>

                    {/* MCQs Column */}
                    <div className="flex items-center gap-1.5 min-w-[70px]">
                      <div className="p-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-lg shrink-0">
                        <Target className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-black text-slate-850 dark:text-slate-100 leading-none">
                          {student.wins} <span className="text-[9px] font-normal text-slate-450">/{student.questionsAttempted || 0}</span>
                        </p>
                        <p className="text-[8px] font-bold text-slate-405 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                          MCQs
                        </p>
                      </div>
                    </div>

                    {/* Streak Column */}
                    <div className="flex items-center gap-1.5 min-w-[55px]">
                      <div className="p-1 bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg shrink-0">
                        <Flame className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-black text-orange-600 dark:text-orange-450 leading-none">
                          {student.currentStreak || 0}d
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                          Streak
                        </p>
                      </div>
                    </div>

                    {/* Expand Chevron Container */}
                    <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-slate-450 shrink-0">
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
                      className="px-5 pb-5 bg-slate-50/20 dark:bg-slate-900/10 border-t border-slate-200/50 dark:border-slate-800/20 overflow-hidden text-slate-800 dark:text-slate-200"
                    >
                      {(() => {
                        const dailyAccuracy = student.dailyQuestionsAttempted > 0
                          ? Math.round(((student.dailyWins || 0) / student.dailyQuestionsAttempted) * 100)
                          : 0;
                        const levelProgress = student.xp % 100;

                        return (
                          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                            
                            {/* Card 1: Today's Solved */}
                            <div className="bg-white/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
                              <p className="text-[10px] font-black text-slate-450 dark:text-slate-505 uppercase tracking-wider">Today's Solved</p>
                              <p className="text-base font-black text-slate-800 dark:text-white mt-1.5 leading-none">
                                {student.dailyWins || 0} <span className="text-xs text-slate-450 dark:text-slate-500 font-bold">/ {student.dailyQuestionsAttempted || 0}</span>
                              </p>
                              <p className="text-[10.5px] font-extrabold text-pink-500 mt-2">
                                {student.dailyQuestionsAttempted > 0 ? `${dailyAccuracy}% Acc` : "—"}
                              </p>
                            </div>

                            {/* Card 2: All-Time Solved */}
                            <div className="bg-white/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
                              <p className="text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-wider">All-Time Solved</p>
                              <p className="text-base font-black text-slate-800 dark:text-white mt-1.5 leading-none">
                                {student.wins || 0} <span className="text-xs text-slate-450 dark:text-slate-500 font-bold">/ {student.questionsAttempted || 0}</span>
                              </p>
                              <p className="text-[10.5px] font-extrabold text-purple-500 mt-2">
                                {student.accuracy || 0}% Acc
                              </p>
                            </div>

                            {/* Card 3: Current Level */}
                            <div className="bg-white/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
                              <p className="text-[10px] font-black text-slate-450 dark:text-slate-505 uppercase tracking-wider">Current Level</p>
                              <p className="text-base font-black text-slate-800 dark:text-white mt-1.5 leading-none">
                                LVL {student.level}
                              </p>
                              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-2.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-yellow-450 to-amber-500"
                                  style={{ width: `${levelProgress}%` }}
                                />
                              </div>
                              <p className="text-[8px] text-slate-450 dark:text-slate-505 font-bold mt-1 text-right">{levelProgress}/100 XP</p>
                            </div>

                            {/* Card 4: Streak */}
                            <div className="bg-white/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center flex flex-col justify-between">
                              <div>
                                <p className="text-[10px] font-black text-slate-450 dark:text-slate-505 uppercase tracking-wider">Streak</p>
                                <p className="text-base font-black text-orange-500 mt-1.5 flex items-center justify-center gap-1 leading-none">
                                  🔥 {student.currentStreak || 0}d
                                </p>
                              </div>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold mt-2">Best: {student.highestStreak || 0}d</p>
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
