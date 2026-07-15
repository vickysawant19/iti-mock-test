/* eslint-disable react/prop-types */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronRight } from "lucide-react";
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
      {/* Leaderboard list container */}
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
                  className="h-12 w-12 border-2 border-slate-350 dark:border-slate-850 rounded-xl mb-1 shadow-md"
                />
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 max-w-[70px] truncate text-center">
                  {gamifiedLeaderboard[1].userName}
                </p>
                <div className="w-20 sm:w-24 bg-gradient-to-b from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-905 rounded-t-xl h-20 flex flex-col items-center justify-center mt-2 shadow-lg">
                  <span className="text-xl font-black text-slate-700 dark:text-slate-300">2</span>
                  <span className="text-[9px] font-bold text-slate-500">{gamifiedLeaderboard[1].xp} XP</span>
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
                <div className="w-24 sm:w-28 bg-gradient-to-b from-yellow-400 to-amber-500 dark:from-yellow-600 dark:to-amber-955 rounded-t-2xl h-28 flex flex-col items-center justify-center mt-2 shadow-2xl relative overflow-hidden">
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
                <div className="w-20 sm:w-24 bg-gradient-to-b from-amber-600/20 to-amber-600/40 dark:from-amber-900/30 dark:to-slate-905 rounded-t-xl h-16 flex flex-col items-center justify-center mt-2 shadow-lg">
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
        <div className="divide-y divide-slate-200/50 dark:divide-slate-800/40">
          {gamifiedLeaderboard.map((entry) => {
            const isMe = entry.studentId === user?.$id;
            const isExpanded = expandedStudentId === entry.studentId;
            const entryCosmetics = cosmeticsService.parseCosmetics(entry);
            const entryFrame = entryCosmetics.equipped?.frame;
            const entryTitle = entryCosmetics.equipped?.title;

            return (
              <div key={entry.studentId} className="flex flex-col">
                {/* Clickable Header Row */}
                <div
                  onClick={() => setExpandedStudentId(isExpanded ? null : entry.studentId)}
                  className={`flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer select-none ${
                    isMe 
                      ? "bg-pink-500/5 dark:bg-pink-900/10" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  } ${isExpanded ? "bg-slate-50/50 dark:bg-slate-800/20" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Visualizer */}
                    {entry.rank === 1 ? (
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-yellow-500/15 dark:bg-yellow-500/20 border border-yellow-500/35 text-yellow-600 dark:text-yellow-450 text-[10px] font-black shrink-0">
                        1
                      </span>
                    ) : entry.rank === 2 ? (
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-300/20 dark:bg-slate-400/25 border border-slate-350 dark:border-slate-600/40 text-slate-655 dark:text-slate-300 text-[10px] font-black shrink-0">
                        2
                      </span>
                    ) : entry.rank === 3 ? (
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-600/15 dark:bg-amber-600/20 border border-amber-600/35 text-amber-700 dark:text-amber-400 text-[10px] font-black shrink-0">
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

                    <div>
                      <p className="text-xs font-bold text-slate-850 dark:text-white flex items-center gap-1.5 flex-wrap">
                        {entry.userName}
                        {entryTitle && (
                          <span className="text-[7px] font-black bg-yellow-500/20 text-yellow-600 dark:text-yellow-455 border border-yellow-500/30 px-1 py-0.2 rounded uppercase tracking-wider scale-95">
                            {COSMETIC_ITEMS.find((i) => i.id === entryTitle)?.value}
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[8px] font-extrabold bg-pink-500 text-white px-1.5 py-0.5 rounded-full uppercase">
                            You
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-[9px] text-slate-450 dark:text-slate-400 font-bold mt-0.5">
                        <span>LVL {entry.level}</span>
                        <span>•</span>
                        <span>Accuracy: {entry.accuracy}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-black text-pink-600 dark:text-pink-400">{entry.xp} XP</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Streak: 🔥 {entry.currentStreak}</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90 text-pink-500" : ""}`} />
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
                      <div className="px-4 pb-4 pt-2.5 bg-slate-55/70 dark:bg-slate-900/40 border-t border-slate-200/50 dark:border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs select-none">
                        {/* Level XP Bar */}
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Level Progress</span>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-650 dark:text-slate-300">
                            <span>LVL {entry.level}</span>
                            <span className="text-pink-600 dark:text-pink-400">{entry.xp % 100} / 100 XP</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-950/80 rounded-full h-1.5 overflow-hidden border border-slate-250 dark:border-slate-800">
                            <div 
                              className="bg-pink-500 h-full rounded-full" 
                              style={{ width: `${entry.xp % 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Accuracy details */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Overall Accuracy</span>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-650 dark:text-slate-300">
                            <span>Accuracy</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{entry.accuracy}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-950/80 rounded-full h-1.5 overflow-hidden border border-slate-250 dark:border-slate-800">
                            <div 
                              className="bg-emerald-500 h-full rounded-full" 
                              style={{ width: `${entry.accuracy}%` }}
                            />
                          </div>
                        </div>

                        {/* Streak details */}
                        <div className="flex flex-col justify-between h-fit py-0.5">
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Activity Streak</span>
                          <span className="text-[12px] font-black text-slate-700 dark:text-slate-250 flex items-center gap-1.5 mt-0.5">
                            🔥 {entry.currentStreak} Days Streak
                          </span>
                          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold mt-1">Max Streak: {entry.maxStreak || entry.currentStreak}</span>
                        </div>

                        {/* Equipped cosmetics and coins details */}
                        <div className="flex flex-col justify-between h-fit py-0.5">
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Equipped Title</span>
                          <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 truncate mt-0.5">
                            {entryTitle ? (
                              <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-450 px-2 py-0.5 rounded border border-yellow-500/20 uppercase tracking-wider text-[9px] font-black">
                                {COSMETIC_ITEMS.find((i) => i.id === entryTitle)?.value}
                              </span>
                            ) : (
                              "None equipped"
                            )}
                          </span>
                          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold mt-1">Coins Balance: 🪙 {entry.coins || 0}</span>
                        </div>
                      </div>
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
      </div>
    </motion.div>
  );
}
