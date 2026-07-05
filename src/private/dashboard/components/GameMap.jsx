/* eslint-disable react/prop-types */
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Lock, Award, Trophy, Compass, ZoomIn, ZoomOut, Info, Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { fixProfileImage } from "@/services/appwriteClient";

// Generates smooth SVG path through coordinates using cubic bezier curves
const getCurvedPath = (points) => {
  if (points.length === 0) return "";
  
  // Helper to calculate control points
  const controlPoint = (current, previous, next, reverse) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.16; // Adjust for smoothness
    
    const lengthX = n.pixelX - p.pixelX;
    const lengthY = n.pixelY - p.pixelY;
    
    const speed = Math.sqrt(lengthX * lengthX + lengthY * lengthY);
    const angle = Math.atan2(lengthY, lengthX) + (reverse ? Math.PI : 0);
    const length = speed * smoothing;
    
    const x = current.pixelX + Math.cos(angle) * length;
    const y = current.pixelY + Math.sin(angle) * length;
    
    return [x, y];
  };

  return points.reduce((acc, point, i, a) => {
    if (i === 0) {
      return `M ${point.pixelX} ${point.pixelY}`;
    }
    const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
    const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
    return `${acc} C ${cpsX.toFixed(2)} ${cpsY.toFixed(2)}, ${cpeX.toFixed(2)} ${cpeY.toFixed(2)}, ${point.pixelX} ${point.pixelY}`;
  }, "");
};

export default function GameMap({ stats, profile, leaderboard = [], onAttemptQuestion }) {
  const currentLevel = stats?.level || 1;
  const currentXP = stats?.xp || 0;
  const targetXP = currentLevel * 100;
  const prevLevelXP = (currentLevel - 1) * 100;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentXP - prevLevelXP) / 100) * 100)
  );

  // Winding path nodes (dynamically scales based on player wins to support higher levels)
  const maxActiveLevel = Math.max(currentLevel, Math.floor((stats?.wins || 0) / 10) + 1);
  const totalLevels = Math.max(3, maxActiveLevel + 1);
  // Current step in the absolute progression track
  const currentStep = stats?.wins || 0;

  // Isometric coordinates for a beautiful zig-zag road winding upwards
  // Coordinates are percentage values (x, y) relative to map container
  const baseCoordinates = [
    { x: 50, y: 88, type: "start" },
    { x: 30, y: 79, type: "question" },
    { x: 22, y: 68, type: "question" },
    { x: 42, y: 60, type: "bonus" },
    { x: 70, y: 56, type: "question" },
    { x: 78, y: 44, type: "question" },
    { x: 55, y: 36, type: "bonus" },
    { x: 30, y: 30, type: "question" },
    { x: 38, y: 18, type: "question" },
    { x: 50, y: 10, type: "boss" },
  ];

  const coordinates = [];
  const segmentHeightPercent = 100 / totalLevels;
  const virtualWidth = 500;
  const canvasHeight = totalLevels * 850;

  for (let L = 0; L < totalLevels; L++) {
    for (let s = 0; s < 10; s++) {
      const base = baseCoordinates[s];
      const yPercent = 100 - (L * segmentHeightPercent) - ((100 - base.y) / 100) * segmentHeightPercent;
      
      let nodeType = base.type;
      if (L > 0 && s === 0) {
        nodeType = "question";
      }

      const pixelX = (base.x / 100) * virtualWidth;
      const pixelY = (yPercent / 100) * canvasHeight;

      coordinates.push({
        x: base.x,
        y: yPercent,
        pixelX,
        pixelY,
        type: nodeType,
        globalIndex: L * 10 + s
      });
    }
  }

  const curvedRoadPath = getCurvedPath(coordinates);

  // Viewport and scroll/zoom refs and state
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1.05);
  const [mapY, setMapY] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [containerHeight, setContainerHeight] = useState(390);

  // Auto center on mount / step changes
  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight || 390;
      setContainerHeight(height);
      const activeNodeY = coordinates[currentStep]?.y || 50;
      const nodePixelY = (activeNodeY / 100) * canvasHeight;
      const initialY = Math.min(
        0,
        Math.max(height - canvasHeight, height / 2 - nodePixelY)
      );
      setMapY(initialY);
    }
  }, [currentStep, canvasHeight]);

  const handleRecenter = () => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight || 390;
      setContainerHeight(height);
      const activeNodeY = coordinates[currentStep]?.y || 50;
      const nodePixelY = (activeNodeY / 100) * canvasHeight;
      const initialY = Math.min(
        0,
        Math.max(height - canvasHeight, height / 2 - nodePixelY)
      );
      setMapY(prev => prev === initialY ? initialY + 0.001 : initialY);
    }
  };

  return (
    <div
      className="relative w-full bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden p-1.5 select-none flex flex-col"
      style={{ height: "calc(100dvh - 64px - 56px - 16px)" }}
    >
      {/* Dynamic Starry Sky and Clouds background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Particle Stars */}
        <div className="absolute top-10 left-12 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-60" />
        <div className="absolute top-24 right-16 w-1 h-1 bg-white rounded-full animate-pulse opacity-40" />
        <div className="absolute top-48 left-20 w-1 h-1 bg-white rounded-full animate-pulse opacity-80" />
        <div className="absolute bottom-40 right-24 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping opacity-70" />
        <div className="absolute top-2/3 left-8 w-1 h-1 bg-white rounded-full animate-pulse opacity-50" />
        
        {/* Nebula/Glow layers */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-pink-500/10 blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-purple-500/15 blur-[100px]" />

        {/* Ambient floating clouds */}
        <motion.div
          animate={{ x: [-20, 20, -20] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 left-6 w-24 h-6 bg-white/10 rounded-full blur-[4px]"
        />
        <motion.div
          animate={{ x: [30, -30, 30] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-10 w-32 h-8 bg-white/5 rounded-full blur-[6px]"
        />
        <motion.div
          animate={{ x: [-15, 15, -15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-28 left-16 w-20 h-6 bg-white/10 rounded-full blur-[4px]"
        />
      </div>

      {/* Metrics and HUD bar removed from GameMap since they are displayed persistently in the main dashboard header */}

      {/* Viewport container with 3D perspective */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-1 w-full mt-4 mb-2 md:mb-20 overflow-hidden rounded-2xl border border-indigo-500/10 shadow-inner"
        style={{ perspective: 1000, touchAction: "none" }}
      >
        {/* Draggable Map Canvas */}
        <motion.div
          drag="y"
          dragConstraints={{ top: containerHeight - canvasHeight * scale, bottom: 0 }}
          dragElastic={0.15}
          animate={{ y: mapY, scale }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="absolute w-full origin-center cursor-grab active:cursor-grabbing"
          style={{ 
            transformStyle: "preserve-3d",
            rotateX: 12, // Tilt the landscape back
            height: canvasHeight,
          }}
        >
          {/* SVG connection road lines */}
          <svg
            viewBox={`0 0 500 ${canvasHeight}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          >
            <defs>
              <linearGradient id="roadGlowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#d946ef" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="roadBaseGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#312e81" />
                <stop offset="50%" stopColor="#4c1d95" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
            </defs>

            {/* 1. Deep Neon Glow Path under the road */}
            <path
              d={curvedRoadPath}
              fill="none"
              stroke="url(#roadGlowGrad)"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="blur-[5px] opacity-75"
            />

            {/* 2. Outer Curb/Border of the road */}
            <path
              d={curvedRoadPath}
              fill="none"
              stroke="#6366f1"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-45"
            />

            {/* 3. The main Asphalt Road Surface */}
            <path
              d={curvedRoadPath}
              fill="none"
              stroke="url(#roadBaseGrad)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 4. Dashed Yellow Lane Divider in the center */}
            <path
              d={curvedRoadPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeDasharray="5 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-95"
            />

            {/* Bridges connecting levels (Elevated architectural overlays) */}
            {Array.from({ length: totalLevels - 1 }).map((_, L) => {
              const nodeFrom = coordinates[L * 10 + 9];
              const nodeTo = coordinates[(L + 1) * 10];
              if (!nodeFrom || !nodeTo) return null;

              const x = nodeFrom.pixelX;
              const yStart = nodeFrom.pixelY;
              const yEnd = nodeTo.pixelY;

              return (
                <g key={`bridge-${L}`} className="opacity-95">
                  {/* Concrete Support Pillars Shadows */}
                  <line
                    x1={x - 22}
                    y1={yStart - 10}
                    x2={x - 22}
                    y2={yEnd + 10}
                    stroke="#090d16"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="opacity-60"
                  />
                  <line
                    x1={x + 22}
                    y1={yStart - 10}
                    x2={x + 22}
                    y2={yEnd + 10}
                    stroke="#090d16"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="opacity-60"
                  />

                  {/* Bridge deck underlay */}
                  <line
                    x1={x}
                    y1={yStart - 4}
                    x2={x}
                    y2={yEnd + 4}
                    stroke="#1e293b"
                    strokeWidth="24"
                    strokeLinecap="butt"
                  />

                  {/* Wood planks texture */}
                  <line
                    x1={x}
                    y1={yStart - 4}
                    x2={x}
                    y2={yEnd + 4}
                    stroke="#475569"
                    strokeWidth="20"
                    strokeDasharray="2 4"
                    strokeLinecap="butt"
                  />

                  {/* Left & Right Red steel railings */}
                  <line
                    x1={x - 11}
                    y1={yStart - 4}
                    x2={x - 11}
                    y2={yEnd + 4}
                    stroke="#ef4444"
                    strokeWidth="2.5"
                  />
                  <line
                    x1={x + 11}
                    y1={yStart - 4}
                    x2={x + 11}
                    y2={yEnd + 4}
                    stroke="#ef4444"
                    strokeWidth="2.5"
                  />

                  {/* Glowing Warning Lights on railings */}
                  <line
                    x1={x - 11}
                    y1={yStart - 4}
                    x2={x - 11}
                    y2={yEnd + 4}
                    stroke="#fbbf24"
                    strokeWidth="3.5"
                    strokeDasharray="1 14"
                  />
                  <line
                    x1={x + 11}
                    y1={yStart - 4}
                    x2={x + 11}
                    y2={yEnd + 4}
                    stroke="#fbbf24"
                    strokeWidth="3.5"
                    strokeDasharray="1 14"
                  />
                </g>
              );
            })}
          </svg>

          {/* Milestones / Nodes */}
          {coordinates.map((node, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isLocked = index > currentStep;

            let icon = <Compass className="w-5 h-5" />;
            let nodeColor = "bg-slate-700/80 border-slate-600 text-slate-400";
            let glow = "";

            if (isActive) {
              icon = <Play className="w-6 h-6 animate-pulse text-white fill-white ml-0.5" />;
              nodeColor = "bg-gradient-to-br from-pink-500 to-purple-600 border-white text-white scale-110";
              glow = "ring-4 ring-pink-500/50 shadow-pink-500/50 shadow-2xl animate-bounce";
            } else if (isCompleted) {
              icon = <Award className="w-5 h-5 text-white" />;
              nodeColor = "bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-400 text-white";
              glow = "shadow-lg shadow-emerald-500/20";
            } else if (isLocked) {
              icon = <Lock className="w-4 h-4 text-slate-600" />;
              nodeColor = "bg-slate-900/90 border-slate-800 text-slate-700 opacity-60";
            }

            // Override boss node
            if (node.type === "boss") {
              icon = <Trophy className={`w-5 h-5 ${isLocked ? "text-slate-600" : "text-yellow-300"}`} />;
              if (isActive) {
                nodeColor = "bg-gradient-to-br from-yellow-500 to-amber-600 border-white text-white scale-120";
              }
            }

            // Find other students situated on this stage
            const otherStudentsOnStage = leaderboard.filter(
              (s) => (s.wins || 0) === index && s.studentId !== stats?.studentId
            );

            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -50%)",
                  transformStyle: "preserve-3d",
                }}
                className="z-10"
              >
                {/* 3D Billboard wrapper - rotates back by -12deg to stand upright */}
                <div 
                  style={{ 
                    transform: "rotateX(-12deg)", 
                    transformStyle: "preserve-3d",
                  }}
                  className="flex flex-col items-center relative"
                >
                  {/* If active, display Avatar sitting directly on the node */}
                  {isActive && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="relative p-1 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl border border-white shadow-xl"
                      >
                        <InteractiveAvatar
                          src={profile?.profileImage}
                          fallbackText={profile?.userName?.charAt(0) || "U"}
                          userId={profile?.userId}
                          showStatus={true}
                          statusSize="xs"
                          userName={profile?.userName}
                          className="h-9 w-9 rounded-lg shrink-0"
                        />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-purple-600 border-r border-b border-white" />
                      </motion.div>
                    </div>
                  )}

                  {/* Other students on this stage */}
                  {otherStudentsOnStage.length > 0 && (
                    <div 
                      className={`absolute flex -space-x-1.5 items-center z-20 ${
                        isActive ? "bottom-24" : "bottom-11"
                      } left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-indigo-500/30 shadow-lg`}
                    >
                      {otherStudentsOnStage.slice(0, 3).map((student) => (
                        <div
                          key={student.studentId}
                          className="group relative cursor-help"
                        >
                          <InteractiveAvatar
                            src={student.profileImage}
                            fallbackText={student.userName?.charAt(0) || "U"}
                            userId={student.studentId}
                            showStatus={true}
                            statusSize="xs"
                            userName={student.userName}
                            className="h-5.5 w-5.5 border border-slate-950 rounded-full hover:scale-110 hover:z-30 transition-all shrink-0"
                          />
                          
                          {/* Tooltip on hover */}
                          <span className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all bg-slate-900/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap z-50 shadow-md">
                            {student.userName} (Lvl {student.level})
                          </span>
                        </div>
                      ))}
                      {otherStudentsOnStage.length > 3 && (
                        <span className="text-[8px] font-black text-slate-350 px-1">
                          +{otherStudentsOnStage.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Node Circle */}
                  <button
                    disabled={isLocked}
                    onClick={isActive ? onAttemptQuestion : undefined}
                    className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${nodeColor} ${glow}`}
                  >
                    {icon}

                    {/* Node Level Milestone Number Tooltip */}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-slate-400 bg-slate-950/70 border border-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                      Stage {index + 1}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Floating Glassmorphic Zoom & Recenter Panel (Positioned above bottom-right FAB) */}
      <div className="absolute bottom-[88px] right-4 md:right-6 z-30 flex flex-col gap-2 bg-slate-900/60 backdrop-blur-lg border border-white/10 p-2 rounded-2xl shadow-2xl">
        <button
          onClick={() => setScale(s => Math.min(1.6, s + 0.15))}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.8, s - 0.15))}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={handleRecenter}
          className="p-2 bg-white/10 hover:bg-white/20 text-yellow-400 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Recenter Map"
        >
          <Compass className="w-4.5 h-4.5 animate-pulse" />
        </button>
        <div className="w-full h-px bg-white/10" />
        <button
          onClick={() => setIsInfoOpen(true)}
          className="p-2 bg-white/10 hover:bg-white/20 text-blue-400 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Daily Challenge Rules"
        >
          <Info className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Pinned Play Challenge Node Button (Desktop FAB bottom-right only) */}
      <div className="hidden md:flex absolute bottom-6 right-6 z-30">
        <Button
          onClick={onAttemptQuestion}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-500/20 flex items-center justify-center transition-all hover:-translate-y-0.5 cursor-pointer p-0"
          title="Play Challenge Node"
        >
          <Play className="w-6 h-6 fill-white ml-0.5 text-white" />
        </Button>
      </div>

      {/* Daily Challenge Info Rules Dialog Modal */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="border border-white/10 bg-slate-950/95 backdrop-blur-2xl shadow-2xl p-6 rounded-[2.5rem] flex flex-col items-center gap-4 max-w-[280px] w-full text-center">
          <DialogTitle className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-2 justify-center w-full">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse animate-bounce" />
            Daily Challenge
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 font-bold leading-relaxed mt-2 text-center w-full">
            Attempt a random question matching your trade, gain XP and level up on correct answers!
          </DialogDescription>
          <Button
            onClick={() => {
              setIsInfoOpen(false);
              onAttemptQuestion();
            }}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-black py-4 text-xs mt-2 cursor-pointer transition-all hover:-translate-y-0.5"
          >
            Play Challenge Node →
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
