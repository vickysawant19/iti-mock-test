import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Lock, Award, Trophy, Zap, Coins, Clock, Star, X } from "lucide-react";
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
  onClose,
  onPlay,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [shiftX, setShiftX] = useState(0);

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

      // 1. Detect if we need to flip below the node (space above < 220px)
      const spaceAbove = screenY;
      const shouldFlip = spaceAbove < 220;
      setIsFlipped(shouldFlip);

      // 2. Clamp horizontally to keep inside viewport
      const popupWidth = 240;
      const padding = 16;

      const leftOver = screenX - popupWidth / 2;
      const rightOver = screenX + popupWidth / 2;

      let shift = 0;
      if (leftOver < padding) {
        shift = padding - leftOver;
      } else if (rightOver > viewportWidth - padding) {
        shift = (viewportWidth - padding) - rightOver;
      }

      // Convert screen pixels to map coordinates by dividing by scale
      setShiftX(shift / currentScale);
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

  // Determine stage difficulty and rewards
  let difficulty = "Medium";
  let xpReward = 50;
  let coinReward = 10;
  let estTime = "3 mins";

  if (node.type === "boss") {
    difficulty = "Hard (Boss)";
    xpReward = 100;
    coinReward = 20;
    estTime = "5 mins";
  } else if (node.type === "bonus") {
    difficulty = "Medium (Bonus)";
    xpReward = 60;
    coinReward = 15;
    estTime = "2 mins";
  } else if (node.type === "start") {
    difficulty = "Easy";
    xpReward = 40;
    coinReward = 5;
    estTime = "1 min";
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transformStyle: "preserve-3d",
      }}
      className="z-50"
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
          "w-[240px] rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl",
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
            "h-2.5 w-2.5 bg-slate-950 border-white/10",
            isFlipped ? "border-l border-t" : "border-r border-b",
          ].join(" ")}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div>
            <h3 className="font-poppins text-xs font-black uppercase tracking-wider text-pink-400">
              Stage {index + 1}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
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
        <div className="my-3 space-y-2">
          {/* Rewards */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 p-1.5">
              <Zap className="h-3.5 w-3.5 text-pink-500 shrink-0" />
              <div>
                <span className="block text-[6px] font-bold uppercase text-slate-500">Reward XP</span>
                <span className="text-[10px] font-black text-white">+{xpReward} XP</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 p-1.5">
              <Coins className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
              <div>
                <span className="block text-[6px] font-bold uppercase text-slate-500">Reward Gold</span>
                <span className="text-[10px] font-black text-white">+{coinReward} Gold</span>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="rounded-lg bg-slate-900/60 p-2 space-y-1.5 text-[9px] font-bold text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-500" />
                Est. Time
              </span>
              <span className="text-white font-extrabold">{estTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                Stars Earned
              </span>
              <span className="text-white font-extrabold">{isCompleted ? "★★★" : "☆☆☆"}</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span>Status</span>
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider",
                  isCompleted
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : isActive
                    ? "bg-pink-500/10 text-pink-400 border border-pink-500/20 animate-pulse"
                    : "bg-slate-800 text-slate-500 border border-slate-700/30",
                ].join(" ")}
              >
                {isCompleted ? "Completed" : isActive ? "Active" : "Locked"}
              </span>
            </div>
          </div>

          {/* Requirements Banner if locked */}
          {isLocked && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-center text-[9px] font-extrabold text-red-400">
              <Lock className="mr-1 inline-block h-3 w-3 shrink-0" />
              Requires Stage {index} Completion
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (!isLocked && onPlay) onPlay();
          }}
          disabled={isLocked}
          className={[
            "w-full h-8 font-poppins text-[10px] font-black uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.98]",
            isLocked
              ? "bg-slate-800 text-slate-500 cursor-not-allowed hover:bg-slate-800 shadow-none border border-slate-700/10"
              : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 hover:-translate-y-0.5",
          ].join(" ")}
        >
          {!isLocked && <Play className="mr-1.5 h-3.5 w-3.5 fill-white text-white" />}
          {isLocked ? "LOCKED" : isCompleted ? "REPLAY STAGE" : "PLAY STAGE"}
        </Button>
      </motion.div>
    </div>
  );
}
