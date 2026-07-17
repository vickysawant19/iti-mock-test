/* eslint-disable react/prop-types */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronRight, Coins, Target, Flame, Zap } from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { COSMETIC_ITEMS, cosmeticsService } from "@/services/cosmetics.service";

export default function LeaderboardTab({
  gamifiedLeaderboard = [],
  user = {},
}) {
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  return (
    <motion.div
      key="leaderboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      {/* Podium Card display */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm">
        {/* Top 3 podium display */}
        {gamifiedLeaderboard.length > 0 && (
          <div className="flex justify-center items-end gap-3 sm:gap-6 pt-16 pb-0 max-w-md mx-auto relative border-b border-slate-200/60 dark:border-slate-800/80 w-full px-4 bg-slate-50/10 dark:bg-slate-950/10">
            {/* 2nd Place */}
            {gamifiedLeaderboard[1] && (
              <div className="flex flex-col items-center">
                <InteractiveAvatar
                  src={gamifiedLeaderboard[1].profileImage}
                  fallbackText={gamifiedLeaderboard[1].userName.charAt(0)}
                  userId={gamifiedLeaderboard[1].studentId}
                  userName={gamifiedLeaderboard[1].userName}
                  showStatus={true}
                  statusSize="xs"
                  className="h-12 w-12 border-2 border-slate-300 dark:border-slate-800 rounded-xl mb-1 shadow-md"
                />
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 max-w-[70px] truncate text-center">
                  {gamifiedLeaderboard[1].userName}
                </p>
                <div className="w-20 sm:w-24 bg-gradient-to-b from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900 rounded-t-xl h-[clamp(4.5rem,12vw,6rem)] flex flex-col items-center justify-center mt-2 shadow-lg">
                  <span className="text-xl font-black text-slate-700 dark:text-slate-300">2</span>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{gamifiedLeaderboard[1].xp} XP</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {gamifiedLeaderboard[0] && (
              <div className="flex flex-col items-center z-10 -mt-8">
                <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                    👑
                  </div>
                  <InteractiveAvatar
                    src={gamifiedLeaderboard[0].profileImage}
                    fallbackText={gamifiedLeaderboard[0].userName.charAt(0)}
                    userId={gamifiedLeaderboard[0].studentId}
                    userName={gamifiedLeaderboard[0].userName}
                    showStatus={true}
                    statusSize="xs"
                    className="h-16 w-16 border-2 border-yellow-400 rounded-2xl mb-1 shadow-xl"
                  />
                </div>
                <p className="text-xs font-black text-slate-800 dark:text-white max-w-[85px] truncate text-center">
                  {gamifiedLeaderboard[0].userName}
                </p>
                <div className="w-24 sm:w-28 bg-gradient-to-b from-yellow-450 to-amber-500 dark:from-yellow-600 dark:to-amber-900 rounded-t-2xl h-[clamp(6rem,16vw,8rem)] flex flex-col items-center justify-center mt-2 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-pulse" />
                  <span className="text-3xl font-black text-slate-900 dark:text-yellow-100">1</span>
                  <span className="text-[10px] font-black text-slate-800 dark:text-yellow-200">{gamifiedLeaderboard[0].xp} XP</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {gamifiedLeaderboard[2] && (
              <div className="flex flex-col items-center">
                <InteractiveAvatar
                  src={gamifiedLeaderboard[2].profileImage}
                  fallbackText={gamifiedLeaderboard[2].userName.charAt(0)}
                  userId={gamifiedLeaderboard[2].studentId}
                  userName={gamifiedLeaderboard[2].userName}
                  showStatus={true}
                  statusSize="xs"
                  className="h-11 w-11 border-2 border-amber-600/30 dark:border-amber-900 rounded-xl mb-1 shadow-md"
                />
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 max-w-[70px] truncate text-center">
                  {gamifiedLeaderboard[2].userName}
                </p>
                <div className="w-20 sm:w-24 bg-gradient-to-b from-amber-600/20 to-amber-600/40 dark:from-amber-900/30 dark:to-slate-900 rounded-t-xl h-[clamp(3.5rem,10vw,5rem)] flex flex-col items-center justify-center mt-2 shadow-lg">
                  <span className="text-base font-black text-amber-700 dark:text-amber-400">3</span>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500">{gamifiedLeaderboard[2].xp} XP</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="p-4">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Batch Ranking Leaderboard</h3>
        </div>
      </div>

      {/* Desktop-optimized Table View */}
      <div className="hidden md:block overflow-x-auto bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] shadow-sm">
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
            {gamifiedLeaderboard.map((entry) => {
              const isMe = entry.studentId === user?.$id;
              const dailyAccuracy = entry.dailyQuestionsAttempted > 0
                ? Math.round(((entry.dailyWins || 0) / entry.dailyQuestionsAttempted) * 100)
                : 0;

              const entryCosmetics = cosmeticsService.parseCosmetics(entry);
              const entryFrame = entryCosmetics.equipped?.frame;
              const entryTitle = entryCosmetics.equipped?.title;

              // Define specialized rankings theme
              let rowBg = isMe
                ? "bg-pink-500/5 hover:bg-pink-500/10 dark:bg-pink-900/10 dark:hover:bg-pink-900/15"
                : "hover:bg-slate-100/40 dark:hover:bg-slate-805/20";
              let rankBadgeBg = "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
              let rankIcon = null;

              if (entry.rank === 1) {
                if (!isMe) rowBg = "bg-yellow-500/5 hover:bg-yellow-500/10 dark:bg-yellow-500/5 dark:hover:bg-yellow-500/10";
                rankBadgeBg = "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black";
                rankIcon = <span className="text-yellow-500">👑</span>;
              } else if (entry.rank === 2) {
                if (!isMe) rowBg = "bg-slate-100/15 hover:bg-slate-150/20 dark:bg-slate-700/5 dark:hover:bg-slate-700/10";
                rankBadgeBg = "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black";
                rankIcon = <span className="text-slate-450">🥈</span>;
              } else if (entry.rank === 3) {
                if (!isMe) rowBg = "bg-orange-500/5 hover:bg-orange-500/10 dark:bg-orange-500/5 dark:hover:bg-orange-500/10";
                rankBadgeBg = "bg-gradient-to-r from-orange-400 to-amber-600 text-white font-black";
                rankIcon = <span className="text-orange-500">🥉</span>;
              }

              // Name strip background gradient
              let nameStripBg = "bg-gradient-to-r from-slate-100/70 to-transparent dark:from-slate-800/30";
              let nameStripBorder = "border-l-[3px] border-slate-300 dark:border-slate-800";
              if (entry.rank === 1) {
                nameStripBg = "bg-gradient-to-r from-yellow-500/10 to-transparent dark:from-yellow-500/15";
                nameStripBorder = "border-l-[3px] border-yellow-500";
              } else if (entry.rank === 2) {
                nameStripBg = "bg-gradient-to-r from-slate-300/15 to-transparent dark:from-slate-700/15";
                nameStripBorder = "border-l-[3px] border-slate-400";
              } else if (entry.rank === 3) {
                nameStripBg = "bg-gradient-to-r from-orange-500/10 to-transparent dark:from-orange-500/15";
                nameStripBorder = "border-l-[3px] border-orange-500";
              } else if (isMe) {
                nameStripBg = "bg-gradient-to-r from-pink-500/10 to-transparent dark:from-pink-500/15";
                nameStripBorder = "border-l-[3px] border-pink-500";
              }

              return (
                <tr key={entry.studentId} className={`border-b border-slate-150/40 dark:border-slate-800/40 transition-colors ${rowBg}`}>
                  {/* Rank */}
                  <td className="py-4 px-5 text-center">
                    <div className="flex items-center justify-center">
                      <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${rankBadgeBg}`}>
                        {entry.rank}
                      </div>
                    </div>
                  </td>

                  {/* Student Info */}
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <InteractiveAvatar
                          src={entry.profileImage}
                          fallbackText={entry.userName.charAt(0)}
                          userId={entry.studentId}
                          userName={entry.userName}
                          showStatus={true}
                          statusSize="xs"
                          className="h-8.5 w-8.5 rounded-full ring-2 ring-slate-150 dark:ring-slate-800/80 shadow-sm"
                        />
                        {entryFrame && (
                          <div className={`absolute inset-[-3px] rounded-full pointer-events-none z-20 ${
                            COSMETIC_ITEMS.find((i) => i.id === entryFrame)?.value
                          }`} style={{ transform: "scale(1.09)" }} />
                        )}
                        {entry.rank === 1 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 p-0.5 rounded-full ring-2 ring-white dark:ring-slate-900 text-[10px] select-none">
                            👑
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className={`px-2.5 py-0.5 rounded-lg ${nameStripBg} ${nameStripBorder} flex items-center gap-1.5 w-fit max-w-full`}>
                          <p className="text-xs sm:text-sm font-black text-slate-855 dark:text-white truncate flex items-center gap-1.5">
                            {entry.userName}
                            {isMe && (
                              <span className="text-[7px] font-extrabold bg-pink-500 text-white px-1 py-0.2 rounded-full uppercase">
                                You
                              </span>
                            )}
                            {rankIcon}
                          </p>
                        </div>
                        {entryTitle && (
                          <div className="mt-1 px-1">
                            <span className="text-[7.5px] font-black bg-yellow-500/20 text-yellow-600 dark:text-yellow-450 border border-yellow-500/30 px-1.5 py-0.2 rounded uppercase tracking-wider">
                              {COSMETIC_ITEMS.find((i) => i.id === entryTitle)?.value}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Level */}
                  <td className="py-3 px-5 text-center">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-md">
                      LVL {entry.level}
                    </span>
                  </td>

                  {/* XP */}
                  <td className="py-3 px-5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-pink-500" />
                      <span className="text-xs font-black text-slate-850 dark:text-slate-100">{entry.xp}</span>
                    </div>
                  </td>

                  {/* Coins */}
                  <td className="py-3 px-5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-black text-slate-855 dark:text-slate-100">{entry.coins || 0}</span>
                    </div>
                  </td>

                  {/* Streak */}
                  <td className="py-3 px-5 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 text-xs font-black text-orange-600 dark:text-orange-450 leading-none">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{entry.currentStreak || 0}d</span>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                        Best: {entry.maxStreak || entry.currentStreak}d
                      </span>
                    </div>
                  </td>

                  {/* Today's Solved */}
                  <td className="py-3 px-5 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-slate-850 dark:text-white leading-none">
                        {entry.dailyWins || 0} <span className="text-[9px] text-slate-450 font-bold">/ {entry.dailyQuestionsAttempted || 0}</span>
                      </span>
                      <span className="text-[9.5px] font-extrabold text-pink-500 mt-1">
                        {entry.dailyQuestionsAttempted > 0 ? `${dailyAccuracy}% Acc` : "—"}
                      </span>
                    </div>
                  </td>

                  {/* All-Time Solved */}
                  <td className="py-3 px-5 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-slate-855 dark:text-white leading-none">
                        {entry.wins || 0} <span className="text-[9px] text-slate-450 font-bold">/ {entry.questionsAttempted || 0}</span>
                      </span>
                      <span className="text-[9.5px] font-extrabold text-purple-500 mt-1">
                        {entry.accuracy || 0}% Acc
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
        {gamifiedLeaderboard.map((entry) => {
          const isMe = entry.studentId === user?.$id;
          const isExpanded = expandedStudentId === entry.studentId;
          const entryCosmetics = cosmeticsService.parseCosmetics(entry);
          const entryFrame = entryCosmetics.equipped?.frame;
          const entryTitle = entryCosmetics.equipped?.title;

          // Name strip background gradient
          let nameStripBg = "bg-gradient-to-r from-slate-100/70 to-transparent dark:from-slate-800/30";
          let nameStripBorder = "border-l-[3px] border-slate-300 dark:border-slate-800";
          if (entry.rank === 1) {
            nameStripBg = "bg-gradient-to-r from-yellow-500/10 to-transparent dark:from-yellow-500/15";
            nameStripBorder = "border-l-[3px] border-yellow-500";
          } else if (entry.rank === 2) {
            nameStripBg = "bg-gradient-to-r from-slate-300/15 to-transparent dark:from-slate-700/15";
            nameStripBorder = "border-l-[3px] border-slate-400";
          } else if (entry.rank === 3) {
            nameStripBg = "bg-gradient-to-r from-orange-500/10 to-transparent dark:from-orange-500/15";
            nameStripBorder = "border-l-[3px] border-orange-500";
          } else if (isMe) {
            nameStripBg = "bg-gradient-to-r from-pink-500/10 to-transparent dark:from-pink-500/15";
            nameStripBorder = "border-l-[3px] border-pink-500";
          }

          return (
            <div
              key={entry.studentId}
              className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 ${
                isMe
                  ? "ring-2 ring-pink-500/30"
                  : isExpanded
                  ? "ring-2 ring-pink-500/20"
                  : ""
              }`}
            >
              {/* Clickable Header Row */}
              <div
                onClick={() => setExpandedStudentId(isExpanded ? null : entry.studentId)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 sm:py-3.5 gap-3 sm:gap-4 hover:bg-slate-100/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer select-none ${
                  isMe
                    ? "bg-pink-500/5 dark:bg-pink-900/10"
                    : isExpanded
                    ? "bg-slate-50/50 dark:bg-slate-800/20"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <div className="flex items-center gap-3">
                    {/* Rank Visualizer */}
                    {entry.rank === 1 ? (
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-yellow-500/15 dark:bg-yellow-500/20 border border-yellow-500/35 text-yellow-600 dark:text-yellow-450 text-[10px] font-black shrink-0">
                        1
                      </span>
                    ) : entry.rank === 2 ? (
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-300/20 dark:bg-slate-400/25 border border-slate-350 dark:border-slate-600/45 text-slate-600 dark:text-slate-300 text-[10px] font-black shrink-0">
                        2
                      </span>
                    ) : entry.rank === 3 ? (
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-600/15 dark:bg-amber-600/20 border border-amber-600/35 text-amber-700 dark:text-amber-455 text-[10px] font-black shrink-0">
                        3
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-5 text-center shrink-0">
                        #{entry.rank}
                      </span>
                    )}

                    {/* Profile Avatar (Circular) */}
                    <div className="relative shrink-0">
                      <InteractiveAvatar
                        src={entry.profileImage}
                        fallbackText={entry.userName.charAt(0)}
                        userId={entry.studentId}
                        userName={entry.userName}
                        showStatus={true}
                        statusSize="xs"
                        className="h-8.5 w-8.5 rounded-full ring-2 ring-slate-150 dark:ring-slate-800/80 shadow-sm animate-in zoom-in-95 duration-200"
                      />
                      {entryFrame && (
                        <div className={`absolute inset-[-3px] rounded-full pointer-events-none z-20 ${
                          COSMETIC_ITEMS.find((i) => i.id === entryFrame)?.value
                        }`} style={{ transform: "scale(1.09)" }} />
                      )}
                    </div>

                    {/* Name with side color strip accent and Level */}
                    <div className="min-w-0 flex-1">
                      <div className={`px-2.5 py-0.5 rounded-lg ${nameStripBg} ${nameStripBorder} flex items-center gap-1.5 w-fit max-w-full`}>
                        <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
                          {entry.userName}
                          {isMe && (
                            <span className="text-[7px] font-extrabold bg-pink-500 text-white px-1 py-0.2 rounded-full uppercase scale-90">
                              You
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-slate-450 dark:text-slate-400 font-bold mt-1 px-1">
                        <span>LVL {entry.level}</span>
                        {entryTitle && (
                          <span className="text-[7px] font-black bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 px-1 py-0.2 rounded uppercase tracking-wider scale-95">
                            {COSMETIC_ITEMS.find((i) => i.id === entryTitle)?.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chevron Right (visible on mobile next to name row) */}
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 sm:hidden ${isExpanded ? "rotate-90 text-pink-500" : ""}`} />
                </div>

                {/* Right Side Columns - Grid on mobile, flex row on tablet/desktop */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/40 w-full sm:grid-cols-none sm:flex sm:mt-0 sm:pt-0 sm:border-0 sm:w-auto sm:gap-5 sm:items-center sm:justify-end shrink-0">
                  {/* XP Column */}
                  <div className="flex items-center gap-1.5 min-w-[50px]">
                    <div className="p-1 bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-lg shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-black text-slate-850 dark:text-slate-100 leading-none">
                        {entry.xp}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                        XP
                      </p>
                    </div>
                  </div>

                  {/* Coins Column */}
                  <div className="flex items-center gap-1.5 min-w-[50px]">
                    <div className="p-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-455 rounded-lg shrink-0">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-black text-slate-850 dark:text-slate-100 leading-none">
                        {entry.coins || 0}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                        Coins
                      </p>
                    </div>
                  </div>

                  {/* MCQs Column */}
                  <div className="flex items-center gap-1.5 min-w-[70px]">
                    <div className="p-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-455 rounded-lg shrink-0">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-black text-slate-850 dark:text-slate-100 leading-none">
                        {entry.wins} <span className="text-[9px] font-normal text-slate-400">/{entry.questionsAttempted || 0}</span>
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
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
                      <p className="text-[11px] sm:text-xs font-black text-orange-600 dark:text-orange-455 leading-none">
                        {entry.currentStreak || 0}d
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                        Streak
                      </p>
                    </div>
                  </div>

                  {/* Chevron Right (hidden on mobile, visible on tablet/desktop) */}
                  <ChevronRight className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90 text-pink-500" : ""}`} />
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="expanded"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    {(() => {
                      const dailyAccuracy = entry.dailyQuestionsAttempted > 0
                        ? Math.round(((entry.dailyWins || 0) / entry.dailyQuestionsAttempted) * 100)
                        : 0;
                      const levelProgress = entry.xp % 100;
                      return (
                        <div className="px-4 pb-4 pt-3 bg-slate-50/20 dark:bg-slate-900/10 border-t border-slate-205/50 dark:border-slate-800/50 grid grid-cols-2 sm:grid-cols-4 gap-3.5 select-none">

                          {/* Card 1: Today's Solved */}
                          <div className="bg-white/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
                            <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">Today's Solved</p>
                            <p className="text-base font-black text-slate-800 dark:text-white mt-1.5 leading-none">
                              {entry.dailyWins || 0} <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">/ {entry.dailyQuestionsAttempted || 0}</span>
                            </p>
                            <p className="text-[10.5px] font-extrabold text-pink-500 mt-2">
                              {entry.dailyQuestionsAttempted > 0 ? `${dailyAccuracy}% Acc` : "—"}
                            </p>
                          </div>

                          {/* Card 2: All-Time Solved */}
                          <div className="bg-white/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
                            <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">All-Time Solved</p>
                            <p className="text-base font-black text-slate-800 dark:text-white mt-1.5 leading-none">
                              {entry.wins || 0} <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">/ {entry.questionsAttempted || 0}</span>
                            </p>
                            <p className="text-[10.5px] font-extrabold text-purple-500 mt-2">
                              {entry.accuracy || 0}% Acc
                            </p>
                          </div>

                          {/* Card 3: Current Level */}
                          <div className="bg-white/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
                            <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">Current Level</p>
                            <p className="text-base font-black text-slate-800 dark:text-white mt-1.5 leading-none">
                              LVL {entry.level}
                            </p>
                            <div className="w-full bg-slate-200 dark:bg-slate-850 rounded-full h-1 mt-2.5 overflow-hidden">
                              <div
                                  className="h-full rounded-full bg-gradient-to-r from-yellow-450 to-amber-500"
                                  style={{ width: `${levelProgress}%` }}
                              />
                            </div>
                            <p className="text-[8px] text-slate-450 dark:text-slate-500 font-bold mt-1 text-right">{levelProgress}/100 XP</p>
                          </div>

                          {/* Card 4: Streak */}
                          <div className="bg-white/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">Streak</p>
                              <p className="text-base font-black text-orange-500 mt-1.5 flex items-center justify-center gap-1 leading-none">
                                🔥 {entry.currentStreak || 0}d
                              </p>
                            </div>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold mt-2">Best: {entry.maxStreak || entry.currentStreak}d</p>
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
        {gamifiedLeaderboard.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-10">No scores recorded yet in this batch.</p>
        )}
      </div>
    </motion.div>
  );
}
