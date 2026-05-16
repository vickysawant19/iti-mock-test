import React from "react";
import { Info } from "lucide-react";
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
}) => {
  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
  const barColor =
    remainingSeconds <= 300
      ? "bg-red-500"
      : remainingSeconds <= 600
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <header className="flex-shrink-0 z-50 bg-[#1a3a6b] text-white shadow-lg">
      {/* Top accent strip */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-green-600" />

      <div className="flex items-center justify-between px-3 md:px-6 py-2 gap-2">
        {/* ── Left: Branding ── */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-white/30 flex items-center justify-center p-1 overflow-hidden shadow-inner">
            <img src={itimitraLogo} alt="ITI Mitra" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] md:text-[11px] font-bold tracking-widest text-amber-300 uppercase leading-none">
              ITI MITRA
            </div>
            <div className="text-sm md:text-base font-bold tracking-tight leading-tight truncate">
              Mock Test
            </div>
          </div>
        </div>

        {/* ── Center: Timer ── */}
        <div className="flex-1 max-w-xs mx-2 md:mx-6">
          <div className="text-center">
            <div className="text-[10px] text-blue-200 uppercase tracking-widest mb-1 hidden md:block">
              Time Remaining
            </div>
            <div
              className={`font-mono text-lg md:text-2xl font-bold tracking-tight leading-none ${
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

        {/* ── Right: Instructions ── */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={onShowInstructions}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instructions</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
