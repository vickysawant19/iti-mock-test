/* eslint-disable react/prop-types */
import React from "react";
import {
  Calendar,
  Zap,
  Coins,
  Trophy,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { COSMETIC_ITEMS } from "@/services/cosmetics.service";
import { fixProfileImage } from "@/services/appwriteClient";

const LevelShield = ({ level }) => (
  <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 select-none">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
      <defs>
        {/* Gold Wings Gradient */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE58F" />
          <stop offset="50%" stopColor="#F6C453" />
          <stop offset="100%" stopColor="#D48806" />
        </linearGradient>
        {/* Purple Crystal Gradient */}
        <radialGradient id="purpleShieldGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E0A7FF" />
          <stop offset="70%" stopColor="#A020F0" />
          <stop offset="100%" stopColor="#5B0E91" />
        </radialGradient>
        {/* Gloss Highlight Gradient */}
        <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Star on top */}
      <path
        d="M 50 2 L 53 10 L 61 10 L 55 15 L 57 23 L 50 18 L 43 23 L 45 15 L 39 10 L 47 10 Z"
        fill="#F6C453"
        stroke="#D48806"
        strokeWidth="0.7"
      />

      {/* Gold Wings (Left) */}
      <path
        d="M 28 35 C 10 25, 4 48, 18 58 C 8 52, 6 62, 20 64 C 10 62, 12 72, 26 68"
        fill="none"
        stroke="url(#goldGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Gold Wings (Right) */}
      <path
        d="M 72 35 C 90 25, 96 48, 82 58 C 92 52, 94 62, 80 64 C 90 62, 88 72, 74 68"
        fill="none"
        stroke="url(#goldGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Purple Shield Base */}
      <path
        d="M 32 24 L 68 24 Q 74 24 72 38 L 64 74 Q 50 88 50 88 Q 50 88 36 74 L 28 38 Q 26 24 32 24 Z"
        fill="url(#purpleShieldGrad)"
        stroke="url(#goldGrad)"
        strokeWidth="3.5"
      />

      {/* Glossy Highlight Overlay */}
      <path
        d="M 32 24 L 68 24 Q 74 24 72 38 L 50 50 L 28 38 Q 26 24 32 24 Z"
        fill="url(#glossGrad)"
        pointerEvents="none"
      />
      
      {/* Tiny sparkling star particles */}
      <circle cx="34" cy="30" r="1.5" fill="#FFFFFF" opacity="0.8" className="animate-pulse" />
      <circle cx="66" cy="30" r="1.5" fill="#FFFFFF" opacity="0.8" className="animate-pulse" />
      <circle cx="50" cy="78" r="1" fill="#FFFFFF" opacity="0.6" />

      {/* Level Text */}
      <text x="50" y="44" textAnchor="middle" fill="#F6C453" fontSize="9" fontWeight="800" fontFamily="Poppins, sans-serif" letterSpacing="0.8">LEVEL</text>
      <text x="50" y="70" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="Poppins, sans-serif" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.5))">{level}</text>
    </svg>
  </div>
);

export default function StudentProfileCard({
  profile,
  batchContext = {},
  stats,
  equippedFrame,
  equippedTitle,
  equippedBorder,
  rankText,
  onEarnCoins,
  onLuckySpin,
}) {
  const borderItem = COSMETIC_ITEMS.find((item) => item.id === equippedBorder);
  const profileCardClass = borderItem 
    ? `relative overflow-hidden rounded-[24px] shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.3)] p-4 sm:p-5 md:p-6 flex flex-col gap-4 sm:gap-6 w-full ${borderItem.value}`
    : "relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] dark:from-[#1b0d3a] dark:via-[#110926] dark:to-[#0c051e] border border-slate-200/90 dark:border-[#2d1b54] shadow-[0_10px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.3)] p-4 sm:p-5 md:p-6 flex flex-col gap-4 sm:gap-6 w-full";

  return (
    <div className={profileCardClass}>
      {/* Custom Gamer Keyframe Animations */}
      <style>{`
        @keyframes breath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes gamerBounce {
          0%, 100% { transform: scale(1) translateY(0); }
          15% { transform: scale(0.9) translateY(0); }
          50% { transform: scale(1.1) translateY(-3px); }
          75% { transform: scale(1) translateY(0); }
        }
        @keyframes gamerShine {
          0% { transform: translateX(-150%) rotate(35deg); }
          100% { transform: translateX(150%) rotate(35deg); }
        }
        .animate-breath {
          animation: breath 4s infinite ease-in-out;
        }
        .animate-float {
          animation: float 3s infinite ease-in-out;
        }
        .animate-gamer-bounce {
          animation: gamerBounce 4s infinite ease-in-out;
        }
        .animate-gamer-shine {
          animation: gamerShine 4s infinite ease-in-out;
        }
      `}</style>

      {/* Decorative Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full bg-[#FF2EA6]/10 blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[5%] w-32 h-32 rounded-full bg-[#A020F0]/10 blur-[50px] pointer-events-none" />

      {/* Top Section: Avatar, Name, Badges, Level Badge (Strictly Horizontal) */}
      <div className="flex flex-row items-center justify-between w-full gap-2 sm:gap-4 relative z-10">
        <div className="flex items-center gap-2 sm:gap-4.5 min-w-0">
          {/* Left: Player Avatar (Circular) */}
          <div className="relative shrink-0 animate-breath">
            <div className="absolute inset-0 bg-[#4D8CFF]/25 rounded-full blur-sm pointer-events-none" />
            <Avatar className="h-12 w-12 sm:h-18 sm:w-18 lg:h-20 lg:w-20 border-2 border-white rounded-full shadow-[0_0_12px_rgba(255,46,166,0.35)] relative z-10">
              <AvatarImage src={fixProfileImage(profile?.profileImage)} className="object-cover" />
              <AvatarFallback className="text-xl sm:text-2xl font-black bg-gradient-to-br from-[#FF2EA6] to-[#A020F0] text-white rounded-full">
                {profile?.userName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {/* Equipped Frame Overlay */}
            {equippedFrame && (
              <div className={`absolute inset-[-4px] rounded-full pointer-events-none z-20 ${
                COSMETIC_ITEMS.find((i) => i.id === equippedFrame)?.value
              }`} />
            )}
          </div>

          {/* Middle: Info Text Stack */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm sm:text-lg lg:text-2xl font-black text-slate-800 dark:text-white tracking-wide uppercase leading-tight font-poppins truncate">
                {profile?.userName || "RAKESH RAMA TARI"}
              </h2>
              {equippedTitle && (
                <span className="text-[7px] sm:text-[9px] font-black bg-yellow-500/35 text-yellow-355 border border-yellow-500/30 px-1 sm:px-2 py-0.5 rounded uppercase tracking-wider">
                  {COSMETIC_ITEMS.find((i) => i.id === equippedTitle)?.value}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2 items-center mt-1 sm:mt-1.5">
              {batchContext.batchName && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-0.5 sm:py-1.5 bg-slate-200/50 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 rounded-full text-[8px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-inner">
                  <Calendar className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-pink-500 shrink-0" />
                  <span className="truncate max-w-[90px] sm:max-w-[150px]">{batchContext.batchName}</span>
                </div>
              )}
              {batchContext.tradeName && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-0.5 sm:py-1.5 bg-slate-200/50 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 rounded-full text-[8px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-inner">
                  <Wrench className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate max-w-[90px] sm:max-w-[150px]">{batchContext.tradeName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Level Shield */}
        {stats && (
          <div className="shrink-0 animate-float">
            <LevelShield level={stats.level} />
          </div>
        )}
      </div>

      {/* Bottom Section: strictly horizontal 4-column metric panels */}
      {stats && (
        <div className="w-full bg-slate-100/50 dark:bg-[#18113c]/50 border border-slate-200 dark:border-white/10 rounded-[16px] sm:rounded-[20px] p-2.5 sm:p-5 flex flex-row divide-x divide-slate-250/70 dark:divide-white/10 gap-0 relative z-10 mt-3 sm:mt-4">
          {/* Column 1: XP Progress */}
          <div className="flex-1 flex flex-col justify-between pr-2 sm:pr-6 min-w-0">
            <div className="flex justify-between items-center text-[7px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 gap-1">
              <span className="flex items-center gap-0.5 sm:gap-1.5 truncate">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500 fill-pink-500/20 shrink-0" />
                <span className="truncate">XP Progress</span>
              </span>
              <span className="text-pink-600 dark:text-pink-400 font-extrabold text-[8px] sm:text-xs shrink-0">
                <span className="text-xs sm:text-lg font-black text-pink-600 dark:text-pink-500">{stats.xp % 100}</span>
                <span className="text-pink-600/80 dark:text-pink-500/80 text-[8px] sm:text-[10px]"> / 100</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold ml-0.5">XP</span>
              </span>
            </div>
            
            {/* Glowing XP Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-950/60 rounded-full h-1 sm:h-1.5 mt-1 sm:mt-2 relative p-[1px] overflow-hidden border border-slate-300 dark:border-slate-800/80">
              <div 
                className="bg-pink-500 h-full rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_8px_rgba(255,46,166,0.5)]" 
                style={{ width: `${(stats.xp % 100)}%` }}
              >
                {/* Shimmer light effect */}
                <div className="absolute right-0 top-0 bottom-0 w-1 sm:w-2 bg-white/60 blur-[1px] rounded-full animate-pulse" />
              </div>
            </div>
            
            <span className="text-[7px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 sm:mt-1.5 block">
              Level up in {100 - (stats.xp % 100)} XP
            </span>
          </div>

          {/* Column 2: Coins */}
          <div className="flex-1 flex flex-col justify-between px-2 sm:px-6 min-w-0">
            <div className="flex items-center gap-0.5 sm:gap-1.5 text-[7px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
              Coins
            </div>
            <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5">
              <span className="text-xs sm:text-xl lg:text-2xl font-black text-slate-800 dark:text-white leading-none">
                {stats?.coins || 0}
              </span>
              <button 
                onClick={onEarnCoins}
                className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-[#FFE58F] hover:bg-[#F6C453] text-[#23174B] flex items-center justify-center font-black text-[9px] sm:text-xs shadow-[0_2px_6px_rgba(246,196,83,0.3)] transition-all active:scale-90 cursor-pointer shrink-0"
                title="Earn Coins"
              >
                +
              </button>
            </div>
          </div>

          {/* Column 3: Rank */}
          <div className="flex-1 flex flex-col justify-between px-2 sm:px-6 min-w-0">
            <div className="flex items-center gap-0.5 sm:gap-1.5 text-[7px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
              Rank
            </div>
            <span className="text-xs sm:text-xl lg:text-2xl font-black text-slate-800 dark:text-white mt-1 sm:mt-1.5 leading-none">
              {rankText}
            </span>
          </div>

          {/* Column 4: Lucky Spin */}
          <div className="flex-1 flex flex-col justify-between pl-2 sm:pl-6 min-w-0">
            <div className="flex items-center gap-0.5 sm:gap-1.5 text-[7px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/20 bg-[conic-gradient(from_0deg,#ff3b30,#ffcc00,#4cd964,#5ac8fa,#5856d6,#ff3b30)] animate-spin shrink-0" style={{ animationDuration: '10s' }} />
              Lucky Spin
            </div>
            <button
              onClick={onLuckySpin}
              className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-base font-extrabold text-slate-800 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer group text-left w-fit"
            >
              <span>Spin</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-450 group-hover:text-pink-450 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
