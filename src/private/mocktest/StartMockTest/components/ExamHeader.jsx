import React from "react";
import { motion } from "framer-motion";
import { Info, RotateCw, Clock } from "lucide-react";
import itimitraLogo from "@/assets/itimitra-logo.webp";

/**
 * Government-exam-style fixed top header.
 *
 * Left  : ITI Mitra Logo + ITI Mitra Mock Test branding
 * Center: Countdown timer (full bar + HH:MM:SS) + Urgency pulse
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
  const isUrgent = timeWarning || remainingSeconds <= 300;
  const barColor =
    isUrgent
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

        {/* ── Center: Timer with Urgency Pulse ── */}
        <div className="flex-1 max-w-xs mx-2 md:mx-6 flex flex-col items-center">
          <div className="text-center w-full">
            <div className="text-[9px] text-blue-200 uppercase tracking-widest mb-0.5 hidden md:block">
              Time Remaining
            </div>
            
            {/* Urgency Heartbeat + Shaking Clock Icon */}
            <motion.div
              animate={
                isUrgent
                  ? { scale: [1, 1.07, 1] }
                  : { scale: 1 }
              }
              transition={
                isUrgent
                  ? { duration: 0.95, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
              className={`inline-flex items-center justify-center gap-1.5 font-mono text-base md:text-xl font-bold tracking-tight leading-none ${
                isUrgent ? "text-red-300" : "text-white"
              }`}
            >
              <motion.span
                animate={
                  isUrgent
                    ? { rotate: [0, -14, 14, -10, 10, 0] }
                    : { rotate: 0 }
                }
                transition={
                  isUrgent ? { duration: 0.7, repeat: Infinity, repeatDelay: 1.2 } : {}
                }
                className="flex items-center"
              >
                <Clock className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isUrgent ? "text-red-400" : "text-blue-200"}`} />
              </motion.span>
              <span>{formatTime(remainingSeconds)}</span>
            </motion.div>
          </div>

          {/* Timer progress bar */}
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: "100%" }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "tween", ease: "linear", duration: 0.5 }}
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
