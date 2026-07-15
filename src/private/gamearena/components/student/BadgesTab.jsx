/* eslint-disable react/prop-types */
import React from "react";
import {
  Award,
  Flame,
  Target,
  BookOpen,
  Zap,
  Trophy,
} from "lucide-react";
import { BADGES } from "@/services/reward.service";

const getBadgeIcon = (iconName) => {
  switch (iconName) {
    case "Flame": return <Flame className="w-6 h-6" />;
    case "Target": return <Target className="w-6 h-6" />;
    case "BookOpen": return <BookOpen className="w-6 h-6" />;
    case "Zap": return <Zap className="w-6 h-6" />;
    case "Trophy": return <Trophy className="w-6 h-6" />;
    default: return <Award className="w-6 h-6" />;
  }
};

export default function BadgesTab({
  achievements,
  batchContext = {},
  activeSettings = {},
}) {
  return (
    <div className="space-y-5">
      {/* Full Achievements Badge Grid */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-pink-500" />
            Achievement Badges Milestone Inventory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unlock medals by achieving training milestones.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.values(BADGES).map((badge) => {
            const isUnlocked = achievements.some((a) => a.achievementId === badge.id);

            return (
              <div
                key={badge.id}
                className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  isUnlocked
                    ? "bg-gradient-to-b from-slate-900 to-slate-950 border-pink-500/20 text-white shadow-md"
                    : "bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-850 text-slate-400 dark:text-slate-500 opacity-65"
                }`}
              >
                <div className={`p-2 rounded-xl mb-2 ${
                  isUnlocked ? "bg-gradient-to-br " + badge.color : "bg-slate-200/50 dark:bg-slate-800"
                }`}>
                  {getBadgeIcon(badge.icon)}
                </div>
                <h4 className="text-[10px] font-black tracking-tight leading-tight">{badge.title}</h4>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[120px] leading-normal font-medium">
                  {badge.description}
                </p>
                
                <span className={`text-[8px] font-black tracking-wider uppercase mt-2 px-1.5 py-0.5 rounded-full ${
                  isUnlocked
                    ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                }`}>
                  {isUnlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
