import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Lock, Award, Trophy, Zap, Coins, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StagePopup({
  node,
  index,
  currentStep,
  mapX,
  mapY,
  scale,
  viewportWidth,
  viewportHeight,
  stats,
  activeSettings,
  onClose,
  onPlay,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [shiftX, setShiftX] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const isCompleted = index < currentStep;
  const isActive = index === currentStep;
  const isLocked = index > currentStep;

  // Compute layout offsets based on viewport boundaries and zoom scale
  useEffect(() => {
    const updateLayout = () => {
      const currentScale = scale.get();
      const currentMapX = mapX.get();
      const currentMapY = mapY.get();

      // Screen positions
      const screenX = currentMapX + node.pixelX * currentScale;
      const screenY = currentMapY + node.pixelY * currentScale;

      setCoords({ x: screenX, y: screenY });

      // 1. Detect if we need to flip below the node (space above < 220px)
      const spaceAbove = screenY;
      const shouldFlip = spaceAbove < 220;
      setIsFlipped(shouldFlip);

      // 2. Clamp horizontally to keep inside viewport
      const popupWidth = typeof window !== "undefined" && window.innerWidth < 640 ? 220 : 240;
      const padding = 12;

      const leftOver = screenX - popupWidth / 2;
      const rightOver = screenX + popupWidth / 2;

      let shift = 0;
      if (leftOver < padding) {
        shift = padding - leftOver;
      } else if (rightOver > viewportWidth - padding) {
        shift = (viewportWidth - padding) - rightOver;
      }

      setShiftX(shift);
    };

    updateLayout();

    // Listen to real-time changes
    const unsubscribeX = mapX.on("change", updateLayout);
    const unsubscribeY = mapY.on("change", updateLayout);
    const unsubscribeScale = scale.on("change", updateLayout);

    return () => {
      unsubscribeX();
      unsubscribeY();
      unsubscribeScale();
    };
  }, [mapX, mapY, scale, node.pixelX, node.pixelY, viewportWidth, viewportHeight]);

  // Base values from settings
  const baseXP = activeSettings?.correctAnswerXp !== undefined ? Number(activeSettings.correctAnswerXp) : 10;
  const baseCoins = activeSettings?.correctAnswerCoins !== undefined ? Number(activeSettings.correctAnswerCoins) : 5;
  const streakBonusPerDay = activeSettings?.streakXpBonus !== undefined ? Number(activeSettings.streakXpBonus) : 2;

  // Streak calculations
  const currentStreak = stats?.currentStreak || 0;
  const streakBonus = currentStreak * streakBonusPerDay;

  // Determine stage difficulty and rewards
  let difficulty = "Medium";
  let xpReward = baseXP;
  let coinReward = baseCoins;
  let estTime = "3 mins";

  if (node.type === "boss") {
    difficulty = "Hard (Boss)";
    xpReward = baseXP * 2;
    coinReward = baseCoins * 2;
    estTime = "5 mins";
  } else if (node.type === "bonus") {
    difficulty = "Medium (Bonus)";
    xpReward = Math.round(baseXP * 1.5);
    coinReward = Math.round(baseCoins * 1.5);
    estTime = "2 mins";
  } else if (node.type === "start") {
    difficulty = "Easy";
    xpReward = Math.round(baseXP * 0.8);
    coinReward = Math.round(baseCoins * 0.8);
    estTime = "1 min";
  }

  // Add the streak bonus to XP
  xpReward += streakBonus;

  const rewardDetailText = streakBonus > 0 ? `Includes +${streakBonus} XP streak bonus` : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: coords.x,
        top: coords.y,
        zIndex: 50,
      }}
      className="pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: isFlipped ? 15 : -15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: isFlipped ? 15 : -15 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          position: "absolute",
          left: 0,
          x: `calc(-50% + ${shiftX}px)`,
          // Position relative to stage node center
          bottom: isFlipped ? "auto" : "28px",
          top: isFlipped ? "28px" : "auto",
        }}
        className={[
          "w-[220px] sm:w-[240px] rounded-2xl border border-white/10 bg-slate-950/95 p-3.5 text-white shadow-2xl backdrop-blur-xl",
          isFlipped ? "origin-top" : "origin-bottom",
        ].join(" ")}
      >
        {/* Floating Arrow */}
        <div
          style={{
            position: "absolute",
            left: `calc(50% - ${shiftX}px)`,
            transform: "translateX(-50%) rotate(45deg)",
            [isFlipped ? "top" : "bottom"]: "-5px",
          }}
          className={[
            "h-2 w-2 bg-slate-950 border-white/10",
            isFlipped ? "border-l border-t" : "border-r border-b",
          ].join(" ")}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div>
            <h3 className="font-poppins text-xs font-black uppercase tracking-wider text-pink-400">
              Stage {index + 1}
            </h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
              {difficulty}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        <div className="my-2 space-y-1.5">
          {/* Rewards */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 p-1.5" title={rewardDetailText}>
              <Zap className="h-3.5 w-3.5 text-pink-500 shrink-0" />
              <div>
                <span className="block text-[8px] font-bold uppercase text-slate-500">XP</span>
                <span className="text-[11px] font-black text-white">
                  +{xpReward} {streakBonus > 0 && <span className="text-[8px] text-pink-400 font-bold" title={`Streak Bonus: +${streakBonus} XP`}>🔥</span>}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 p-1.5">
              <Coins className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
              <div>
                <span className="block text-[8px] font-bold uppercase text-slate-500">Gold</span>
                <span className="text-[11px] font-black text-white">+{coinReward}</span>
              </div>
            </div>
          </div>

          {/* Requirements Banner if locked */}
          {isLocked && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-center text-[9px] font-extrabold text-red-400">
              <Lock className="mr-1 inline-block h-3 w-3 shrink-0" />
              Requires Stage {index}
            </div>
          )}
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (!isLocked && onPlay) onPlay();
          }}
          disabled={isLocked}
          size="sm"
          className={[
            "w-full font-poppins text-[10px] font-black uppercase tracking-wider text-white transition-all active:scale-[0.98] cursor-pointer",
            isLocked
              ? "bg-slate-800 text-slate-500 cursor-not-allowed hover:bg-slate-800 shadow-none border border-slate-700/10"
              : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 hover:-translate-y-0.5 shadow-md",
          ].join(" ")}
        >
          {!isLocked && <Play className="h-3.5 w-3.5 fill-white text-white animate-pulse" />}
          {isLocked ? "LOCKED" : isCompleted ? "REPLAY STAGE" : "PLAY STAGE"}
        </Button>
      </motion.div>
    </div>
  );
}
