/* eslint-disable react/prop-types */
import { motion } from "framer-motion";
import { Play, Lock, Award, Trophy, Compass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fixProfileImage } from "@/services/appwriteClient";

export default function GameMap({ stats, profile, onAttemptQuestion }) {
  const currentLevel = stats?.level || 1;
  const currentXP = stats?.xp || 0;
  const targetXP = currentLevel * 100;
  const prevLevelXP = (currentLevel - 1) * 100;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentXP - prevLevelXP) / 100) * 100)
  );

  // Winding path nodes (10 nodes per level)
  const nodeCount = 10;
  // Current step in the level (0-9)
  const currentStep = (stats?.wins || 0) % nodeCount;

  // Isometric coordinates for a beautiful zig-zag road winding upwards
  // Coordinates are percentage values (x, y) relative to map container
  const coordinates = [
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

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[3/4] bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl border border-indigo-500/20 shadow-2xl overflow-hidden p-6 select-none">
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

      {/* Floating Header UI */}
      <div className="relative z-10 flex items-center justify-between bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 p-3 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-pink-500 rounded-xl shadow-md">
            <AvatarImage src={fixProfileImage(profile?.profileImage)} />
            <AvatarFallback className="font-extrabold bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-xl">
              {profile?.userName?.charAt(0) || "S"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-bold text-white tracking-wide">{profile?.userName || "Player"}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold bg-pink-500 text-white px-1.5 py-0.5 rounded">
                LVL {currentLevel}
              </span>
              <span className="text-[10px] font-bold text-slate-300">
                {currentXP} / {targetXP} XP
              </span>
            </div>
          </div>
        </div>

        {/* Currency Display */}
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-xl shadow-inner">
          <span className="text-sm font-black text-yellow-400 tracking-tight">
            💰 {stats?.coins || 0}
          </span>
          <span className="text-[9px] font-bold text-yellow-300/80 uppercase">Coins</span>
        </div>
      </div>

      {/* XP Level Bar */}
      <div className="relative z-10 mt-3 bg-slate-950/40 backdrop-blur-sm border border-white/5 rounded-full h-3 overflow-hidden p-[1.5px]">
        <div
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full shadow-lg shadow-pink-500/20 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Isometric Grid Container */}
      <div className="relative z-10 flex-1 w-full h-[82%] mt-4">
        {/* SVG connection road lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0">
          <defs>
            <linearGradient id="roadGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path
            d={`M ${coordinates.map((c) => `${(c.x / 100) * 100}%,${(c.y / 100) * 100}%`).join(" L ")}`}
            fill="none"
            stroke="url(#roadGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-lg"
          />
          <path
            d={`M ${coordinates.map((c) => `${(c.x / 100) * 100}%,${(c.y / 100) * 100}%`).join(" L ")}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="8 8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="z-10"
            >
              {/* If active, display Avatar sitting directly on the node */}
              {isActive && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative p-1 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl border border-white shadow-xl"
                  >
                    <Avatar className="h-9 w-9 rounded-lg">
                      <AvatarImage src={fixProfileImage(profile?.profileImage)} />
                      <AvatarFallback className="font-extrabold bg-slate-950 text-white rounded-lg text-xs">
                        {profile?.userName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-purple-600 border-r border-b border-white" />
                  </motion.div>
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
          );
        })}
      </div>
    </div>
  );
}
