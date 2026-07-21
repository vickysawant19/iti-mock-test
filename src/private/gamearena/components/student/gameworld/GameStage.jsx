import React, { memo } from "react";
import { motion, useTransform } from "framer-motion";
import { Play, Lock, Award, Trophy, Compass } from "lucide-react";
import LevelShield from "./LevelShield";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { COSMETIC_ITEMS, cosmeticsService } from "@/services/cosmetics.service";

function GameStage({
  node,
  index,
  currentStep,
  leaderboard = [],
  currentStudentId,
  profile,
  stats,
  currentLevel,
  focusedStage,
  mapX,
  mapY,
  scale,
  viewportWidth,
  viewportHeight,
  onNodeClick,
}) {
  const isCompleted = index < currentStep;
  const isActive = index === currentStep;
  const isLocked = index > currentStep;

  const cosmeticsState = cosmeticsService.parseCosmetics(stats);
  const equippedFrame = cosmeticsState.equipped?.frame;

  // 1. Calculate the real-time screen coordinates of this node
  const screenX = useTransform([mapX, scale], ([x, s]) => x + node.pixelX * s);
  const screenY = useTransform([mapY, scale], ([y, s]) => y + node.pixelY * s);

  // 2. Calculate the 2D Euclidean distance from the viewport center
  const distance = useTransform([screenX, screenY], ([sx, sy]) => {
    const dx = sx - viewportWidth / 2;
    const dy = sy - viewportHeight / 2;
    return Math.sqrt(dx * dx + dy * dy);
  });

  // 3. Interpolate styles based on screen distance — NO blur, just subtle scale + opacity
  const stageScale = useTransform(distance, [0, 200, 400, 700], [1.15, 1.0, 0.9, 0.8]);
  const stageOpacity = useTransform(distance, [0, 200, 400, 700], [1.0, 1.0, 0.85, 0.6]);
  const stageZIndex = useTransform(distance, [0, 300, 600], [30, 20, 10]);

  // Render simplified stage nodes when far away to keep DOM light and responsive
  const indexDistance = Math.abs(index - focusedStage);
  const isNearby = indexDistance <= 4;

  let icon = <Compass className="h-5 w-5" />;
  let nodeColor = "bg-slate-700/80 border-slate-600 text-slate-400";
  let glow = "";
  let scaleClass = "";

  if (isActive) {
    icon = <Play className="ml-0.5 h-6 w-6 fill-white text-white" />;
    nodeColor = "bg-gradient-to-br from-pink-500 to-purple-600 border-white text-white";
    glow = "ring-4 ring-pink-500/50 shadow-[0_0_24px_rgba(236,72,153,0.55)]";
    scaleClass = "scale-110";
  } else if (isCompleted) {
    icon = <Award className="h-5 w-5 text-white" />;
    nodeColor = "bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-400 text-white";
    glow = "shadow-lg shadow-emerald-500/25";
  } else if (isLocked) {
    icon = <Lock className="h-4 w-4 text-slate-600" />;
    nodeColor = "bg-slate-900/90 border-slate-800 text-slate-700 opacity-60";
  }

  if (node.type === "boss") {
    icon = <Trophy className={`h-5 w-5 ${isLocked ? "text-slate-600" : "text-yellow-300"}`} />;
    if (isActive) {
      nodeColor = "bg-gradient-to-br from-yellow-500 to-amber-600 border-white text-white";
      glow = "ring-4 ring-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.5)]";
    }
  }

  const otherStudentsOnStage = leaderboard.filter(
    (s) => (s.wins || 0) === index && s.studentId !== currentStudentId
  );

  const handleClick = (e) => {
    e.stopPropagation();
    onNodeClick(index, node);
  };

  // 4. Simplified Render (Reduced DOM complexity for far-away stages)
  if (!isNearby) {
    return (
      <motion.div
        style={{
          position: "absolute",
          left: `${node.x}%`,
          top: `${node.y}%`,
          x: "-50%",
          y: "-50%",
          transformStyle: "preserve-3d",
          scale: stageScale,
          opacity: stageOpacity,
          zIndex: useTransform(stageZIndex, (z) => Math.round(z)),
        }}
        className="pointer-events-none"
      >
        <div style={{ transform: "rotateX(-12deg)" }} className="flex flex-col items-center">
          <div
            className={[
              "relative flex h-11 w-11 items-center justify-center rounded-full border-2 opacity-50",
              nodeColor,
            ].join(" ")}
          >
            {icon}
          </div>
        </div>
      </motion.div>
    );
  }

  // 5. Full Featured Render
  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${node.x}%`,
        top: `${node.y}%`,
        x: "-50%",
        y: "-50%",
        transformStyle: "preserve-3d",
        scale: stageScale,
        opacity: stageOpacity,
        zIndex: useTransform(stageZIndex, (z) => Math.round(z)),
      }}
      className="z-10"
    >
      <div
        style={{ transform: "rotateX(-12deg)", transformStyle: "preserve-3d" }}
        className="relative flex flex-col items-center animate-float"
      >
        {/* Floating Player Avatar */}
        {isActive && (
          <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-lg border border-white bg-gradient-to-br from-pink-500 to-purple-600 p-0.5 shadow-md"
            >
              <div className="relative">
                <InteractiveAvatar
                  src={profile?.profileImage}
                  fallbackText={profile?.userName?.charAt(0) || "U"}
                  userId={profile?.userId}
                  lastseen={profile?.lastseen}
                  showStatus={true}
                  statusSize="xs"
                  userName={profile?.userName}
                  className="h-7 w-7 shrink-0 rounded-md"
                />
                {equippedFrame && (
                  <div className={`absolute inset-[-1.5px] rounded-lg pointer-events-none z-20 ${
                    COSMETIC_ITEMS.find((i) => i.id === equippedFrame)?.value
                  }`} style={{ transform: "scale(1.08)" }} />
                )}
                <div className="pointer-events-none absolute -bottom-1.5 -right-1.5 z-30 h-[15px] w-[15px] select-none">
                  <LevelShield level={currentLevel} />
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 border-r border-b border-white bg-purple-600" />
            </motion.div>
          </div>
        )}

        {/* Other batch members on this stage */}
        {otherStudentsOnStage.length > 0 && (
          <div className="absolute right-7 top-1/2 z-20 flex -translate-y-1/2 -space-x-1 items-center rounded-full border border-indigo-500/30 bg-slate-950/85 px-1 py-0.5 shadow-lg backdrop-blur-md">
            {otherStudentsOnStage.slice(0, 2).map((student) => {
              const studentCosmetics = cosmeticsService.parseCosmetics(student);
              const studentFrame = studentCosmetics.equipped?.frame;
              return (
                <div key={student.studentId} className="group relative cursor-help">
                  <div className="relative">
                    <InteractiveAvatar
                      src={student.profileImage}
                      fallbackText={student.userName?.charAt(0) || "U"}
                      userId={student.studentId}
                      lastseen={student.lastseen}
                      showStatus={true}
                      statusSize="xs"
                      userName={student.userName}
                      className="h-5 w-5 shrink-0 rounded-full border border-slate-950 transition-all hover:z-30 hover:scale-110"
                    />
                    {studentFrame && (
                      <div className={`absolute inset-[-1px] rounded-full pointer-events-none z-20 ${
                        COSMETIC_ITEMS.find((i) => i.id === studentFrame)?.value
                      }`} style={{ transform: "scale(1.15)" }} />
                    )}
                  </div>
                  <span className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 scale-0 whitespace-nowrap rounded border border-white/10 bg-slate-900/90 px-1.5 py-0.5 text-[7px] font-bold text-white shadow-md transition-all group-hover:scale-100">
                    {student.userName} (Lvl {student.level})
                  </span>
                </div>
              );
            })}
            {otherStudentsOnStage.length > 2 && (
              <span className="px-0.5 text-[7px] font-black text-slate-300">
                +{otherStudentsOnStage.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Pulsing highlights & floating particles for focused stage */}
        {index === focusedStage && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
            <div className="absolute w-16 h-16 rounded-full border border-pink-500/40 bg-pink-500/5 animate-ping opacity-60" />
            <div className="absolute w-20 h-20 rounded-full border border-purple-500/20 animate-pulse opacity-40" />
            
            {/* Particle stars/circles floating upwards */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-full h-12 flex justify-around overflow-visible">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400/80 animate-[floatUp_2s_infinite_linear]" style={{ animationDelay: "0s" }} />
              <div className="w-1 h-1 rounded-full bg-yellow-300 animate-[floatUp_2.5s_infinite_linear]" style={{ animationDelay: "0.5s" }} />
              <div className="w-1.8 h-1.8 rounded-full bg-purple-400/80 animate-[floatUp_1.8s_infinite_linear]" style={{ animationDelay: "1.2s" }} />
            </div>
          </div>
        )}

        {/* Node Button */}
        <button
          onClick={handleClick}
          aria-label={
            isLocked
              ? `Stage ${index + 1} — locked`
              : `Stage ${index + 1}${isActive ? " — play" : ""}`
          }
          className={[
            "relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
            "cursor-pointer hover:scale-110 active:scale-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/70",
            nodeColor,
            glow,
            scaleClass,
          ].join(" ")}
        >
          {icon}
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-slate-800 bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-400">
            Stage {index + 1}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

export default memo(GameStage);
