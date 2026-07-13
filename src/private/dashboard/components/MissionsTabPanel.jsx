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
          <Target className="h-7 w-7 text-purple-400 animate-pulse" />
        </div>
        <p className="text-xs font-medium text-slate-500">No challenges assigned yet.<br />Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-4 w-4 text-purple-500 dark:text-purple-400" />
        <div>
          <p className="text-xs font-black text-slate-800 dark:text-white tracking-tight">Teacher Challenges</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Complete tasks & claim bonus rewards</p>
        </div>
      </div>

      {challenges.map((challenge) => {
        const isClaimed = challenge.claimed || false;
        const isManual = !challenge.type || challenge.type === "manual" || !challenge.target;
        const isCompleted = isManual ? true : (challenge.progress || 0) >= (challenge.target || 0);

        return (
          <motion.div
            key={challenge.$id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-3.5 transition-all ${
              isClaimed
                ? "border-slate-200/60 dark:border-white/5 bg-slate-100/40 dark:bg-slate-900/20 opacity-55"
                : isCompleted
                ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5 animate-pulse animate-duration-1000"
                : "border-purple-500/15 dark:border-purple-500/20 bg-purple-500/5"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: pulse dot + content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {isClaimed ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                  ) : isCompleted ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-bounce" />
                  ) : (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400 animate-pulse" />
                  )}
                  <p className={`text-xs font-bold leading-tight ${isClaimed ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-800 dark:text-slate-100"}`}>
                    {challenge.title}
                  </p>
                </div>
                {challenge.description && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 ml-3.5 leading-relaxed">
                    {challenge.description}
                  </p>
                )}

                {/* Progress bar visual for tracking challenges */}
                {!isManual && !isClaimed && (
                  <div className="mt-2.5 ml-3.5 space-y-1 select-none">
                    <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-500 dark:text-slate-400">
                      <span>Progress</span>
                      <span className={isCompleted ? "text-emerald-500 dark:text-emerald-400 font-black" : "text-purple-600 dark:text-purple-300"}>
                        {challenge.progress || 0} / {challenge.target}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-950/60 rounded-full h-1.5 overflow-hidden border border-slate-300 dark:border-slate-800/80">
                      <div
                        className={`h-full rounded-full transition-all duration-750 ${
                          isCompleted
                            ? "bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}
                        style={{ width: `${Math.min(((challenge.progress || 0) / (challenge.target || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2 ml-3.5">
                  {(challenge.rewardXP || 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-pink-500 dark:text-pink-400">
                      <Zap className="h-2.5 w-2.5" />+{challenge.rewardXP} XP
                    </span>
                  )}
                  {(challenge.rewardCoins || 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-yellow-600 dark:text-yellow-400">
                      <Coins className="h-2.5 w-2.5" />+{challenge.rewardCoins}
                    </span>
                  )}
                </div>
              </div>

              {/* Claim button */}
              {isClaimed ? (
                <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-1">Done</span>
              ) : (
                <Button
                  size="sm"
                  disabled={!isCompleted}
                  onClick={() => onClaimChallenge(challenge.$id)}
                  className={`h-7 shrink-0 cursor-pointer rounded-xl px-2.5 text-[10px] font-black active:scale-95 shadow-none border-0 transition-all ${
                    isCompleted
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white hover:shadow-[0_2px_8px_rgba(236,72,153,0.35)]"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/30 cursor-not-allowed"
                  }`}
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
    <div className="space-y-5">
      {/* Pill switcher */}
      <div className="flex items-center p-1 rounded-full bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 select-none relative mb-5">
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
              className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full py-2 text-xs font-bold transition-all duration-300 select-none ${
                isActive
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {/* Sliding glassmorphic capsule background */}
              {isActive && (
                <motion.div
                  layoutId="activeMissionTab"
                  className="absolute inset-0 bg-white border border-slate-200/80 dark:bg-gradient-to-r dark:from-[#311c66]/65 dark:to-[#170a3c]/65 dark:border dark:border-[#533f93]/40 shadow-sm rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              <Icon className={`h-3.5 w-3.5 transition-colors ${isActive ? "text-pink-500 dark:text-pink-400" : "text-slate-400 dark:text-slate-500"}`} />
              <span>{label}</span>
              {badge > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white ml-0.5">
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
