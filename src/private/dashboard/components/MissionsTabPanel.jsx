/* eslint-disable react/prop-types */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Target, Zap, Coins, CheckCircle2 } from "lucide-react";
import DailyMissionsPanel from "./DailyMissionsPanel";
import { Button } from "@/components/ui/button";

// ─── Challenges Section ────────────────────────────────────────────────────────

function ChallengesSection({ challenges, userId, onClaimChallenge }) {
  if (challenges.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20">
          <Target className="h-7 w-7 text-purple-400" />
        </div>
        <p className="text-xs font-medium text-slate-500">No challenges assigned yet.<br />Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-4 w-4 text-purple-400" />
        <div>
          <p className="text-xs font-black text-white tracking-tight">Teacher Challenges</p>
          <p className="text-[10px] text-slate-400">Complete tasks & claim bonus rewards</p>
        </div>
      </div>

      {challenges.map((challenge) => {
        const completedList = challenge.completedStudents || [];
        const isClaimed = completedList.includes(userId);

        return (
          <motion.div
            key={challenge.$id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-3.5 transition-all ${
              isClaimed
                ? "border-white/5 bg-slate-900/20 opacity-55"
                : "border-purple-500/20 bg-purple-500/5"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: pulse dot + content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {isClaimed ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400 animate-pulse" />
                  )}
                  <p className={`text-xs font-bold leading-tight ${isClaimed ? "text-slate-500 line-through" : "text-slate-100"}`}>
                    {challenge.title}
                  </p>
                </div>
                {challenge.description && (
                  <p className="text-[10px] text-slate-400 mt-0.5 ml-3.5 leading-relaxed">
                    {challenge.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 ml-3.5">
                  {(challenge.rewardXP || 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-pink-400">
                      <Zap className="h-2.5 w-2.5" />+{challenge.rewardXP} XP
                    </span>
                  )}
                  {(challenge.rewardCoins || 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-yellow-400">
                      <Coins className="h-2.5 w-2.5" />+{challenge.rewardCoins}
                    </span>
                  )}
                </div>
              </div>

              {/* Claim button */}
              {isClaimed ? (
                <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-emerald-600 mt-1">Done</span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onClaimChallenge(challenge.$id)}
                  className="h-7 shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 text-[10px] font-black text-white hover:from-purple-400 hover:to-pink-400 active:scale-95 shadow-none border-0"
                >
                  Claim
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Pill Tab Switcher ─────────────────────────────────────────────────────────

const PILLS = [
  { id: "quests",     label: "Daily Quests",     icon: Star   },
  { id: "challenges", label: "Challenges",        icon: Target },
];

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function MissionsTabPanel({
  // Quests props
  missions,
  missionsLoading,
  claimingId,
  completedCount,
  claimedCount,
  missionTotal,
  allClaimed,
  claimMission,
  fetchMissions,
  // Challenges props
  challenges,
  userId,
  onClaimChallenge,
}) {
  const [activeSection, setActiveSection] = useState("quests");

  const unclaimedChallenges = (challenges || []).filter((c) => {
    const completedList = c.completedStudents || [];
    return !completedList.includes(userId);
  }).length;

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5">
      {/* Pill switcher */}
      <div className="flex items-center gap-1.5 mb-5 p-1 rounded-2xl bg-slate-800/50 border border-white/5">
        {PILLS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          const badge =
            id === "quests"
              ? completedCount > claimedCount
                ? completedCount - claimedCount
                : 0
              : unclaimedChallenges;

          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/25 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-3 w-3 ${isActive ? "text-pink-400" : ""}`} />
              {label}
              {badge > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        {activeSection === "quests" ? (
          <motion.div
            key="quests"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
          >
            <DailyMissionsPanel
              missions={missions}
              isLoading={missionsLoading}
              claimingId={claimingId}
              completedCount={completedCount}
              claimedCount={claimedCount}
              totalCount={missionTotal}
              allClaimed={allClaimed}
              onClaim={claimMission}
              onRefresh={fetchMissions}
            />
          </motion.div>
        ) : (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <ChallengesSection
              challenges={challenges}
              userId={userId}
              onClaimChallenge={onClaimChallenge}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
