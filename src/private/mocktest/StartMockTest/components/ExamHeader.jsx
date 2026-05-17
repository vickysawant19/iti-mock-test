import React from "react";
import { Info, RotateCw } from "lucide-react";
import itimitraLogo from "@/assets/itimitra-logo.png";

/**
 * Government-exam-style fixed top header.
 *
 * Left  : ITI Mitra Logo + ITI Mitra Mock Test branding
 * Center: Countdown timer (full bar + HH:MM:SS)
 * Right : Instructions button
 */
const ExamHeader = ({
  remainingSeconds,
  totalSeconds,
  timeWarning,
  formatTime,
  onShowInstructions,
  isMobilePortrait,
  isLandscapeForced,
  onToggleLandscape,
}) => {
  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
  const barColor =
    remainingSeconds <= 300
      ? "bg-red-500"
      : remainingSeconds <= 600
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <header className="flex-shrink-0 z-50 bg-[#1a3a6b] text-white shadow-md">
      <div className="flex items-center justify-between px-2 md:px-4 py-1.5 gap-2">
        {/* ── Left: Branding ── */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border border-white/30 flex items-center justify-center p-0.5 overflow-hidden shadow-inner">
            <img src={itimitraLogo} alt="ITI Mitra" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] md:text-[10px] font-bold tracking-widest text-amber-300 uppercase leading-none">
              ITI MITRA
            </div>
            <div className="text-xs md:text-sm font-bold tracking-tight leading-tight truncate">
              Mock Test
            </div>
          </div>
        </div>

        {/* ── Center: Timer ── */}
        <div className="flex-1 max-w-xs mx-2 md:mx-6">
          <div className="text-center">
            <div className="text-[9px] text-blue-200 uppercase tracking-widest mb-0.5 hidden md:block">
              Time Remaining
            </div>
            <div
              className={`font-mono text-base md:text-xl font-bold tracking-tight leading-none ${
                remainingSeconds <= 300
                  ? "text-red-300 animate-pulse"
                  : "text-white"
              }`}
            >
              {formatTime(remainingSeconds)}
            </div>
          </div>
          {/* Timer progress bar */}
          <div className="mt-1.5 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* ── Right: Instructions & Rotate Toggle ── */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isMobilePortrait && (
            <button
              type="button"
              onClick={onToggleLandscape}
              className={`flex items-center justify-center border text-white p-1 rounded-lg transition-all ${
                isLandscapeForced ? "bg-amber-500 hover:bg-amber-600 border-amber-400" : "bg-white/10 hover:bg-white/20 border-white/20"
              }`}
              title="Rotate Screen"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLandscapeForced ? "animate-spin-once" : ""}`} />
            </button>
          )}
          <button
            type="button"
            onClick={onShowInstructions}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] md:text-xs font-semibold px-2 py-1 rounded-lg transition-all"
          >
            <Info className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Instructions</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
