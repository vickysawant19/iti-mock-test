/* eslint-disable react/prop-types */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, Circle, Zap, Coins, Star,
  MessageSquare, Trophy, Flame, ChevronRight, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Icon map per mission type ─────────────────────────────────────────────────

const TYPE_ICON = {
  questions:       { icon: MessageSquare, color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  xp:              { icon: Zap,           color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/20" },
  login:           { icon: Star,          color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  correct_streak:  { icon: Flame,         color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  correct_answers: { icon: CheckCircle2,  color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
};

// ─── Single Mission Row ────────────────────────────────────────────────────────

function MissionRow({ mission, onClaim, isClaiming }) {
  const isComplete = (mission.progress || 0) >= mission.target;
  const isClaimed  = mission.claimed;
  const pct        = Math.min(Math.round(((mission.progress || 0) / mission.target) * 100), 100);

  const typeInfo = TYPE_ICON[mission.type] || TYPE_ICON.questions;
  const TypeIcon = typeInfo.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border p-3.5 transition-all ${
        isClaimed
          ? "border-slate-200/60 dark:border-white/5 bg-slate-100/50 dark:bg-slate-900/20 opacity-50"
          : isComplete
          ? "border-emerald-500/20 dark:border-emerald-500/25 bg-emerald-50/20 dark:bg-emerald-500/5"
          : "border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-slate-900/40"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${typeInfo.bg}`}>
          <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-bold leading-tight ${isClaimed ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-800 dark:text-slate-100"}`}>
              {mission.label}
            </p>
            <span className={`shrink-0 text-[10px] font-black ${
              isClaimed ? "text-slate-450 dark:text-slate-600" : isComplete ? "text-emerald-500 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
            }`}>
              {mission.progress || 0}/{mission.target}
            </span>
          </div>

          {/* Progress bar */}
          {!isClaimed && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800/60">
              <motion.div
                className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-pink-500 to-purple-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          )}

          {/* Reward chips */}
          <div className="mt-2 flex items-center gap-2">
            {(mission.rewardXp || 0) > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-pink-400">
                <Zap className="h-2.5 w-2.5" />+{mission.rewardXp} XP
              </span>
            )}
            {(mission.rewardCoins || 0) > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-yellow-400">
                <Coins className="h-2.5 w-2.5" />+{mission.rewardCoins}
              </span>
            )}
          </div>
        </div>

        {/* Claim / Status button */}
        <div className="ml-1 shrink-0 self-center">
          {isClaimed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : isComplete ? (
            <Button
              size="sm"
              onClick={() => onClaim(mission.$id)}
              disabled={isClaiming}
              className="h-7 cursor-pointer rounded-xl bg-emerald-500 px-2.5 text-[10px] font-black text-slate-950 hover:bg-emerald-400 active:scale-95"
            >
              {isClaiming ? <Loader2 className="h-3 w-3 animate-spin" /> : "Claim"}
            </Button>
          ) : (
            <Circle className="h-5 w-5 text-slate-300 dark:text-slate-700" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Reward Toast ──────────────────────────────────────────────────────────────

function RewardToast({ reward, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      onAnimationComplete={() => setTimeout(onDone, 1800)}
      className="absolute left-1/2 top-0 z-50 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 shadow-xl backdrop-blur-xl"
    >
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      <span className="text-xs font-black text-emerald-300">
        Mission Complete!&nbsp;
        {reward.xpReward > 0 && <span className="text-pink-400">+{reward.xpReward} XP</span>}
        {reward.xpReward > 0 && reward.coinsReward > 0 && " · "}
        {reward.coinsReward > 0 && <span className="text-yellow-400">+{reward.coinsReward} Coins</span>}
      </span>
    </motion.div>
  );
}

// ─── All Missions Complete Banner ─────────────────────────────────────────────

function AllDoneCard() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
        <Trophy className="h-8 w-8 text-amber-400" />
      </div>
      <div>
        <p className="text-sm font-black text-amber-600 dark:text-amber-300">All Missions Done!</p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Come back tomorrow for new missions.</p>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function DailyMissionsPanel({
  missions = [],
  isLoading = false,
  claimingId = null,
  completedCount = 0,
  claimedCount = 0,
  totalCount = 0,
  allClaimed = false,
  onClaim,
  onRefresh,
}) {
  const [lastReward, setLastReward] = useState(null);

  const handleClaim = async (missionDocId) => {
    const reward = await onClaim(missionDocId);
    if (reward) setLastReward(reward);
  };

  const overallPct = totalCount > 0 ? Math.round((claimedCount / totalCount) * 100) : 0;

  return (
    <div className="relative">
      {/* Reward toast */}
      <AnimatePresence>
        {lastReward && (
          <RewardToast reward={lastReward} onDone={() => setLastReward(null)} />
        )}
      </AnimatePresence>

      {/* Header summary */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            Daily Quests
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            {claimedCount}/{totalCount} missions claimed
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-xl p-1.5 text-slate-500 hover:text-slate-750 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          title="Refresh missions"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Daily Progress</span>
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">{overallPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800/60 border border-slate-300 dark:border-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Mission list */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10">
          <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
          <span className="text-xs text-slate-400 font-medium">Loading today's missions…</span>
        </div>
      ) : totalCount === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-500 font-medium">No missions found. Try refreshing.</p>
        </div>
      ) : allClaimed ? (
        <AllDoneCard />
      ) : (
        <div className="space-y-2.5">
          {missions.map((mission) => (
            <MissionRow
              key={mission.$id || mission.missionId}
              mission={mission}
              onClaim={handleClaim}
              isClaiming={claimingId === mission.$id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
