/* eslint-disable react/prop-types */
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Lock, Award, Trophy, Compass, ZoomIn, ZoomOut, Info, Flame, GraduationCap, Zap, Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { fixProfileImage } from "@/services/appwriteClient";
import { BADGES } from "@/services/reward.service";
import OnlineBatchMembers from "@/components/components/OnlineBatchMembers";

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

export default function GameWorld({ user, stats, profile, leaderboard = [], batchContext = {}, onAttemptQuestion }) {
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

  // Gamer League Calculations
  const getLeague = (wins) => {
    if (wins < 5) return { name: "Bronze League", color: "text-amber-400 border-amber-500/20 bg-amber-500/5", iconColor: "text-amber-400" };
    if (wins < 15) return { name: "Silver League", color: "text-slate-200 border-slate-350/20 bg-slate-350/5", iconColor: "text-slate-200" };
    if (wins < 30) return { name: "Gold League", color: "text-yellow-350 border-yellow-450/20 bg-yellow-450/5", iconColor: "text-yellow-350" };
    return { name: "Diamond League", color: "text-cyan-300 border-cyan-400/20 bg-cyan-400/5", iconColor: "text-cyan-300" };
  };
  const league = getLeague(stats?.wins || 0);

  // Dynamic Leaderboard Rank Standing & Next Player overtake calculations
  const currentStudentId = user?.$id || stats?.studentId || profile?.userId;
  const currentRank = leaderboard.findIndex((s) => s.studentId === currentStudentId) + 1;
  const rankText = currentRank > 0 ? `#${currentRank}` : "Unranked";
  
  const nextPlayer = currentRank > 1 ? leaderboard[currentRank - 2] : null;
  const xpNeeded = nextPlayer ? Math.max(0, nextPlayer.xp - (stats?.xp || 0)) : 0;

  // Isometric coordinates for a zig-zag road winding upwards
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
  const [activeDetail, setActiveDetail] = useState(null);

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

  // Track window resizing to dynamically update map drag constraints
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      className="relative w-full h-full bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 select-none flex flex-col md:flex-row overflow-hidden"
    >
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
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ── COLUMN 1: THE INTERACTIVE MAP VIEWPORT ── */}
      <div className="flex-1 h-full relative flex flex-col min-w-0 overflow-hidden">
        
        {/* Sky Stars Background (Seamless inside the Map viewport only) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-10 left-12 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-60" />
          <div className="absolute top-24 right-16 w-1 h-1 bg-white rounded-full animate-pulse opacity-40" />
          <div className="absolute top-48 left-20 w-1 h-1 bg-white rounded-full animate-pulse opacity-80" />
          <div className="absolute bottom-40 right-24 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping opacity-70" />
          <div className="absolute top-2/3 left-8 w-1 h-1 bg-white rounded-full animate-pulse opacity-50" />
          <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-pink-500/10 blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-purple-500/15 blur-[100px]" />
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

        {/* Mobile HUD Profile Header (Hidden on Desktop) */}
        <div className="md:hidden w-full shrink-0 z-20 p-3 pb-1 select-none flex flex-col items-center justify-between gap-3 bg-transparent border-none">
          <div 
            onClick={() => setActiveDetail(activeDetail === "level" ? null : "level")}
            className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl relative z-10 w-full shadow-lg active:scale-98 transition-all cursor-pointer"
          >
            <div className="relative shrink-0 animate-breath">
              <Avatar className="h-[48px] w-[48px] border-2 border-white rounded-full shadow-[0_0_10px_rgba(255,46,166,0.35)] relative z-10">
                <AvatarImage src={fixProfileImage(profile?.profileImage)} />
                <AvatarFallback className="text-xl font-black bg-gradient-to-br from-[#FF2EA6] to-[#A020F0] text-white">
                  {profile?.userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 border border-white/20 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white shadow-md z-20">
                LVL {stats?.level || 1}
              </div>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-xs font-black text-white uppercase tracking-wider font-poppins truncate max-w-[90px]">
                  {profile?.userName || "Player"}
                </h2>
                {batchContext.batchName && (
                  <span className="text-[7px] font-extrabold bg-pink-500/20 border border-pink-500/30 text-pink-300 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 max-w-[70px] truncate" title={batchContext.batchName}>
                    {batchContext.batchName}
                  </span>
                )}
                {batchContext.tradeName && (
                  <span className="text-[7px] font-extrabold bg-purple-500/20 border border-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 max-w-[70px] truncate" title={batchContext.tradeName}>
                    {batchContext.tradeName}
                  </span>
                )}
              </div>
              {stats && (
                <div className="mt-1.5 min-w-[140px]">
                  <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-wider text-slate-400">
                    <span>XP Progress</span>
                    <span className="text-pink-400">{stats.xp % 100} / 100 XP</span>
                  </div>
                  <div className="w-full bg-slate-950/80 rounded-full h-1 mt-0.5 relative overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-[#FF2EA6] via-[#A020F0] to-[#4D8CFF] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(stats.xp % 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick HUD values row for mobile */}
          <div className="flex items-center justify-between gap-2 w-full mt-1">
            <div 
              onClick={() => setActiveDetail(activeDetail === "coins" ? null : "coins")}
              className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg h-[28px] active:scale-95 transition-all cursor-pointer flex-1 justify-center"
            >
              <Coins className="w-3.5 h-3.5 text-yellow-400 animate-gamer-bounce" />
              <span className="text-[10px] font-black text-white">{stats?.coins || 0}</span>
            </div>
            
            <div 
              onClick={() => setActiveDetail(activeDetail === "league" ? null : "league")}
              className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg h-[28px] active:scale-95 transition-all cursor-pointer flex-1 justify-center"
            >
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[8px] font-black text-slate-350 uppercase truncate max-w-[80px]">{league.name}</span>
            </div>

            <div 
              onClick={() => setActiveDetail(activeDetail === "rank" ? null : "rank")}
              className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg h-[28px] active:scale-95 transition-all cursor-pointer flex-1 justify-center"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[10px] font-black text-white">{rankText}</span>
            </div>
          </div>

          {/* Smooth animated Detail card */}
          {activeDetail && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full bg-slate-900/85 backdrop-blur-lg border border-pink-500/20 rounded-2xl p-3 shadow-xl relative z-10 flex flex-col gap-1.5 overflow-hidden text-left"
            >
              {/* Close handler clicking inside */}
              <div 
                onClick={() => setActiveDetail(null)}
                className="absolute top-2 right-3 text-slate-400 hover:text-white font-bold text-xs cursor-pointer select-none"
              >
                ✕
              </div>
              {/* Header Icon + Label */}
              <div className="flex items-center gap-2">
                {activeDetail === "level" && <Zap className="w-4 h-4 text-pink-500 animate-pulse" />}
                {activeDetail === "coins" && <Coins className="w-4 h-4 text-yellow-400 animate-gamer-bounce" />}
                {activeDetail === "league" && <Award className="w-4 h-4 text-purple-400" />}
                {activeDetail === "rank" && <Trophy className="w-4 h-4 text-yellow-500" />}
                
                <span className="text-[10px] font-black tracking-wider uppercase text-white font-poppins">
                  {activeDetail === "level" && `Level ${currentLevel} details`}
                  {activeDetail === "coins" && "Gold coins details"}
                  {activeDetail === "league" && "League status"}
                  {activeDetail === "rank" && "Leaderboard rank"}
                </span>
              </div>
              {/* Description Body */}
              <p className="text-[10px] sm:text-xs font-semibold text-slate-300 leading-relaxed pr-6">
                {activeDetail === "level" && (
                  <span className="block space-y-2 w-full">
                    <span className="block text-[10px] sm:text-xs font-semibold text-slate-350 leading-relaxed pr-6">
                      You are at <strong>Level {currentLevel}</strong> with <strong>{stats?.xp || 0} total XP</strong>. 
                      Need <strong className="text-pink-405">{100 - (stats?.xp % 100)} XP</strong> to advance to Level {currentLevel + 1}!
                    </span>
                    {/* Performance analysis stats grid */}
                    <span className="grid grid-cols-2 gap-1.5 mt-1.5 bg-slate-950/40 p-2 rounded-xl border border-white/5 w-full">
                      <span className="flex flex-col p-1.5 bg-slate-950/20 rounded-lg">
                        <span className="text-[7px] uppercase tracking-wider text-slate-500 font-extrabold">Accuracy Rate</span>
                        <span className="text-[10px] font-black text-emerald-400 mt-0.5">
                          {stats?.accuracy ? `${stats.accuracy.toFixed(0)}%` : `${stats?.questionsAttempted ? ((stats.wins / stats.questionsAttempted) * 100).toFixed(0) : 0}%`}
                        </span>
                      </span>
                      <span className="flex flex-col p-1.5 bg-slate-950/20 rounded-lg">
                        <span className="text-[7px] uppercase tracking-wider text-slate-500 font-extrabold">Attempted Nodes</span>
                        <span className="text-[10px] font-black text-white mt-0.5">
                          {stats?.questionsAttempted || 0} ({stats?.wins || 0} Wins)
                        </span>
                      </span>
                      <span className="flex flex-col p-1.5 bg-slate-950/20 rounded-lg">
                        <span className="text-[7px] uppercase tracking-wider text-slate-500 font-extrabold">Highest Streak</span>
                        <span className="text-[10px] font-black text-orange-400 mt-0.5">
                          🔥 {stats?.highestStreak || 0} Days
                        </span>
                      </span>
                      <span className="flex flex-col p-1.5 bg-slate-950/20 rounded-lg">
                        <span className="text-[7px] uppercase tracking-wider text-slate-500 font-extrabold">Total Losses</span>
                        <span className="text-[10px] font-black text-red-400 mt-0.5">
                          💀 {stats?.losses || 0} Answers
                        </span>
                      </span>
                    </span>
                  </span>
                )}
                {activeDetail === "coins" && (
                  <>
                    You possess <strong>{stats?.coins || 0} Gold Coins</strong>. 
                    Gold coins are accumulated for correct challenge answers. Earn more to display high status on the leaderboard!
                  </>
                )}
                {activeDetail === "league" && (
                  <>
                    Current League: <strong className="uppercase">{league.name}</strong>. 
                    You have achieved <strong>{stats?.wins || 0} victories</strong> in daily challenges. 
                    {stats?.wins < 5 && " Need 5 wins to unlock Silver League!"}
                    {stats?.wins >= 5 && stats?.wins < 15 && " Need 15 wins to unlock Gold League!"}
                    {stats?.wins >= 15 && stats?.wins < 30 && " Need 30 wins to unlock Diamond League!"}
                    {stats?.wins >= 30 && " You are in the highest tier Diamond League!"}
                  </>
                )}
                {activeDetail === "rank" && (
                  <>
                    Standing: <strong>Rank {rankText}</strong> inside the batch. 
                    {nextPlayer ? (
                      <>
                        You are chasing <strong className="text-white">{nextPlayer.userName}</strong>. Need <strong className="text-pink-400">{xpNeeded} XP</strong> to bypass them.
                      </>
                    ) : (
                      " 👑 Outstanding! You are sitting at Rank #1 leading the batch leaderboard!"
                    )}
                  </>
                )}
              </p>
            </motion.div>
          )}
        </div>

        {/* Viewport container with 3D perspective */}
        <div 
          ref={containerRef}
          className="relative z-10 flex-1 w-full overflow-hidden border-b border-indigo-500/10 shadow-inner"
          style={{ perspective: 1000, touchAction: "none" }}
        >
          {/* Floating Online Members Capsule */}
          <div className="absolute top-4 left-4 z-30 pointer-events-auto select-none">
            <OnlineBatchMembers batchId={batchContext?.batchId || stats?.batchId} currentUserId={currentStudentId} compact={true} />
          </div>
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
              rotateX: 12,
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
              <path d={curvedRoadPath} fill="none" stroke="url(#roadGlowGrad)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" className="blur-[5px] opacity-75" />
              <path d={curvedRoadPath} fill="none" stroke="#6366f1" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" className="opacity-45" />
              <path d={curvedRoadPath} fill="none" stroke="url(#roadBaseGrad)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <path d={curvedRoadPath} fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="5 7" strokeLinecap="round" strokeLinejoin="round" className="opacity-95" />

              {/* Bridges */}
              {Array.from({ length: totalLevels - 1 }).map((_, L) => {
                const nodeFrom = coordinates[L * 10 + 9];
                const nodeTo = coordinates[(L + 1) * 10];
                if (!nodeFrom || !nodeTo) return null;
                const x = nodeFrom.pixelX;
                const yStart = nodeFrom.pixelY;
                const yEnd = nodeTo.pixelY;
                return (
                  <g key={`bridge-${L}`} className="opacity-95">
                    <line x1={x - 22} y1={yStart - 10} x2={x - 22} y2={yEnd + 10} stroke="#090d16" strokeWidth="6" strokeLinecap="round" className="opacity-60" />
                    <line x1={x + 22} y1={yStart - 10} x2={x + 22} y2={yEnd + 10} stroke="#090d16" strokeWidth="6" strokeLinecap="round" className="opacity-60" />
                    <line x1={x} y1={yStart - 4} x2={x} y2={yEnd + 4} stroke="#1e293b" strokeWidth="24" strokeLinecap="butt" />
                    <line x1={x} y1={yStart - 4} x2={x} y2={yEnd + 4} stroke="#475569" strokeWidth="20" strokeDasharray="2 4" strokeLinecap="butt" />
                    <line x1={x - 11} y1={yStart - 4} x2={x - 11} y2={yEnd + 4} stroke="#ef4444" strokeWidth="2.5" />
                    <line x1={x + 11} y1={yStart - 4} x2={x + 11} y2={yEnd + 4} stroke="#ef4444" strokeWidth="2.5" />
                    <line x1={x - 11} y1={yStart - 4} x2={x - 11} y2={yEnd + 4} stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="1 14" />
                    <line x1={x + 11} y1={yStart - 4} x2={x + 11} y2={yEnd + 4} stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="1 14" />
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

              if (node.type === "boss") {
                icon = <Trophy className={`w-5 h-5 ${isLocked ? "text-slate-600" : "text-yellow-300"}`} />;
                if (isActive) {
                  nodeColor = "bg-gradient-to-br from-yellow-500 to-amber-600 border-white text-white scale-120";
                }
              }

              const otherStudentsOnStage = leaderboard.filter(
                (s) => (s.wins || 0) === index && s.studentId !== currentStudentId
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
                  <div style={{ transform: "rotateX(-12deg)", transformStyle: "preserve-3d" }} className="flex flex-col items-center relative animate-float">
                    {/* Active Player Avatar */}
                    {isActive && (
                      <div className="absolute bottom-11 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="relative p-0.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg border border-white shadow-md">
                          <div className="relative">
                            <InteractiveAvatar src={profile?.profileImage} fallbackText={profile?.userName?.charAt(0) || "U"} userId={profile?.userId} showStatus={true} statusSize="xs" userName={profile?.userName} className="h-7 w-7 rounded-md shrink-0" />
                            {/* Tiny LevelShield badge overlay */}
                            <div className="absolute -bottom-1.5 -right-1.5 w-[15px] h-[15px] pointer-events-none select-none z-30">
                              <LevelShield level={stats?.level || 1} />
                            </div>
                          </div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-purple-600 border-r border-b border-white" />
                        </motion.div>
                      </div>
                    )}

                    {/* Other students on this stage */}
                    {otherStudentsOnStage.length > 0 && (
                      <div className="absolute right-7 top-1/2 -translate-y-1/2 flex -space-x-1 items-center z-20 bg-slate-950/85 backdrop-blur-md px-1 py-0.5 rounded-full border border-indigo-500/30 shadow-lg">
                        {otherStudentsOnStage.slice(0, 2).map((student) => (
                          <div key={student.studentId} className="group relative cursor-help">
                            <InteractiveAvatar src={student.profileImage} fallbackText={student.userName?.charAt(0) || "U"} userId={student.studentId} showStatus={true} statusSize="xs" userName={student.userName} className="h-5 w-5 border border-slate-950 rounded-full hover:scale-110 hover:z-30 transition-all shrink-0" />
                            <span className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all bg-slate-900/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap z-50 shadow-md">
                              {student.userName} (Lvl {student.level})
                            </span>
                          </div>
                        ))}
                        {otherStudentsOnStage.length > 2 && <span className="text-[7px] font-black text-slate-350 px-0.5">+{otherStudentsOnStage.length - 2}</span>}
                      </div>
                    )}

                    {/* Node Button */}
                    <button disabled={isLocked} onClick={isActive ? onAttemptQuestion : undefined} className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${nodeColor} ${glow}`}>
                      {icon}
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-slate-400 bg-slate-950/70 border border-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">Stage {index + 1}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Floating Glassmorphic Zoom Panel (Shifted upwards on mobile to overlay correctly) */}
          <div className="absolute bottom-[112px] md:bottom-[88px] right-4 md:right-6 z-30 flex flex-col gap-2 bg-slate-900/60 backdrop-blur-lg border border-white/10 p-2 rounded-2xl shadow-2xl">
            <button onClick={() => setScale(s => Math.min(1.6, s + 0.15))} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95" title="Zoom In">
              <ZoomIn className="w-4.5 h-4.5" />
            </button>
            <button onClick={() => setScale(s => Math.max(0.8, s - 0.15))} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95" title="Zoom Out">
              <ZoomOut className="w-4.5 h-4.5" />
            </button>
            <button onClick={handleRecenter} className="p-2 bg-white/10 hover:bg-white/20 text-yellow-400 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95" title="Recenter Map">
              <Compass className="w-4.5 h-4.5 animate-pulse" />
            </button>
            <div className="w-full h-px bg-white/10" />
            <button onClick={() => setIsInfoOpen(true)} className="p-2 bg-white/10 hover:bg-white/20 text-blue-400 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95" title="Daily Challenge Rules">
              <Info className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Pinned Play Challenge FAB (Desktop only, stacked above zoom controls) */}
          <div className="hidden md:flex absolute bottom-6 right-6 z-30">
            <Button onClick={onAttemptQuestion} className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-500/20 flex items-center justify-center transition-all hover:-translate-y-0.5 cursor-pointer p-0" title="Play Challenge Node">
              <Play className="w-6 h-6 fill-white ml-0.5 text-white" />
            </Button>
          </div>
        </div>

        {/* Mobile Compact Rank HUD (Hidden on Desktop) */}
        <div className="md:hidden w-full shrink-0 z-20 bg-slate-950/80 backdrop-blur-md border-t border-white/10 px-4 py-2 mb-[56px] flex items-center justify-between gap-3 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            <span className="font-black text-white uppercase tracking-wider">Rank {rankText}</span>
            <span className="text-slate-400 font-medium">• {league.name}</span>
          </div>

          <div className="hidden sm:block text-slate-300 truncate text-center flex-1 max-w-md">
            {nextPlayer ? (
              <span className="flex items-center gap-1 justify-center">
                <Flame className="w-3 h-3 text-orange-500 fill-orange-500 inline animate-pulse" />
                Need <strong className="text-pink-400 font-extrabold">{xpNeeded} XP</strong> to overtake <strong className="text-white font-extrabold">{nextPlayer.userName}</strong>
              </span>
            ) : (
              <span className="text-yellow-405 font-bold">👑 Leading the batch!</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 font-bold text-orange-500">
            <span>Streak:</span>
            <span className="font-black">🔥 {stats?.currentStreak || 0} days</span>
          </div>
        </div>
      </div>

      {/* ── COLUMN 2: DESKTOP HUD INFO PANEL (Visible on Desktop Only) ── */}
      <div className="hidden md:flex flex-col w-[360px] shrink-0 h-full bg-[#150f35]/95 backdrop-blur-md border-l border-white/10 p-5 overflow-x-hidden overflow-y-auto no-scrollbar text-white shadow-2xl z-25 relative">
        {/* Decorative Glows inside Sidebar */}
        <div className="absolute top-[-10%] right-[-10%] w-40 h-40 rounded-full bg-pink-500/5 blur-[50px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-42 h-42 rounded-full bg-purple-500/5 blur-[60px] pointer-events-none" />

        {/* Player Information Card with Avatar (Left), Text (Center), and Level Shield Badge (Right) */}
        <div className="relative bg-slate-900/60 border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-lg mb-6 z-10 overflow-hidden min-h-[92px]">
          {/* Left: Avatar with subtle pulse glow */}
          <div className="relative shrink-0 animate-breath">
            <div className="absolute inset-0 bg-[#FF2EA6]/25 rounded-full blur-xs pointer-events-none" />
            <Avatar className="h-[54px] w-[54px] border-2 border-white rounded-full shadow-[0_0_12px_rgba(255,46,166,0.35)] relative z-10">
              <AvatarImage src={fixProfileImage(profile?.profileImage)} />
              <AvatarFallback className="text-xl font-black bg-gradient-to-br from-[#FF2EA6] to-[#A020F0] text-white">
                {profile?.userName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Center: Name, Batch Name, Trade Name aligned next to it */}
          <div className="min-w-0 flex-1 pr-14 text-left">
            <h2 className="text-sm font-black text-white uppercase tracking-wider leading-tight font-poppins truncate">
              {profile?.userName || "Player"}
            </h2>
            <div className="flex flex-col gap-1 mt-1">
              {batchContext.batchName && (
                <span className="text-[8px] font-extrabold bg-pink-500/20 border border-pink-500/30 text-pink-300 px-2 py-0.5 rounded-md uppercase tracking-wider w-fit truncate max-w-[130px]" title={batchContext.batchName}>
                  {batchContext.batchName}
                </span>
              )}
              {batchContext.tradeName && (
                <span className="text-[8px] font-extrabold bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-md uppercase tracking-wider w-fit truncate max-w-[130px]" title={batchContext.tradeName}>
                  {batchContext.tradeName}
                </span>
              )}
            </div>
          </div>

          {/* Right corner: Small beautiful LevelShield component */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 shrink-0 pointer-events-none select-none">
            <LevelShield level={stats?.level || 1} />
          </div>
        </div>

        {/* XP Progress Card */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 mb-5 shadow-inner relative z-10">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              XP Progress
            </span>
            <span className="text-pink-400 font-extrabold">{stats?.xp ? (stats.xp % 100) : 0} / 100 XP</span>
          </div>
          
          <div className="w-full bg-slate-950/80 rounded-full h-2 mt-2 relative p-[1px] overflow-hidden border border-slate-800/80">
            <div 
              className="bg-gradient-to-r from-[#FF2EA6] via-[#A020F0] to-[#4D8CFF] h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${stats?.xp ? (stats.xp % 100) : 0}%` }}
            />
          </div>
          
          <span className="text-[8px] text-slate-400 font-bold mt-1 text-right block uppercase tracking-wider">
            Level up in {100 - (stats?.xp ? (stats.xp % 100) : 0)} XP
          </span>
        </div>

        {/* Gold Coins Pill Card */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg mb-5 z-10">
          <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-gamer-shine pointer-events-none" />
          <div className="flex items-center gap-3">
            <Coins className="w-5.5 h-5.5 text-yellow-400 animate-gamer-bounce" />
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">Gamer Balance</p>
              <p className="text-lg font-black text-white mt-1 leading-none">{stats?.coins || 0} Coins</p>
            </div>
          </div>
          <Button 
            onClick={onAttemptQuestion}
            className="bg-[#F6C453] hover:bg-[#FFE07D] text-[#23174B] font-black text-xs px-3 py-1 h-[28px] rounded-xl shadow-md cursor-pointer transition-all active:scale-95 z-20"
          >
            + Earn
          </Button>
        </div>

        {/* League and Rank Capsule Card */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 mb-5 space-y-3 shadow-inner relative z-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current League</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${league.color}`}>
              <Award className={`w-3 h-3 ${league.iconColor} shrink-0`} />
              <span>{league.name}</span>
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rank standing</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border border-slate-700 bg-slate-800 text-slate-300 uppercase tracking-wider">
              <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />
              <span>Rank {rankText}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Daily Streak</span>
            <span className="text-xs font-black text-orange-500 flex items-center gap-0.5">
              🔥 {stats?.currentStreak || 0} days
            </span>
          </div>
        </div>

        {/* Overtake Progress Card */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 mb-5 shadow-inner relative z-10">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Standing Overtake Target</p>
          <div className="mt-2.5 text-xs font-medium text-slate-350">
            {nextPlayer ? (
              <div className="flex items-start gap-2.5">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500 shrink-0 animate-pulse mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p>
                    Need <strong className="text-pink-400 font-extrabold">{xpNeeded} XP</strong> to overtake:
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={fixProfileImage(nextPlayer.profileImage)} />
                      <AvatarFallback className="font-extrabold text-[10px] bg-slate-800 text-white">
                        {nextPlayer.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white font-black text-xs truncate max-w-[100px]">{nextPlayer.userName}</span>
                    <span className="text-slate-400 font-bold text-[9px] shrink-0">(Rank #{currentRank - 1})</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400 font-bold">
                <Trophy className="w-4 h-4 text-yellow-500 animate-bounce" />
                <span>Overtook everyone! You lead the batch!</span>
              </div>
            )}
          </div>
        </div>

        {/* Milestone Badges Grid List */}
        <div className="space-y-3 flex-1 min-h-[140px] flex flex-col justify-end relative z-10 pb-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Milestone achievements</p>
          <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[140px] pr-1">
            {Object.values(BADGES).map((badge) => {
              const isUnlocked = stats?.badges?.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                    isUnlocked
                      ? "bg-slate-950 border-pink-500/20 text-white shadow-md scale-100"
                      : "bg-slate-900/30 border-white/5 text-slate-500 opacity-40 scale-95"
                  }`}
                  title={`${badge.title}: ${badge.description}`}
                >
                  <span className="text-base">{badge.icon}</span>
                  <span className="text-[8px] font-black tracking-tight leading-tight mt-1 truncate w-full">{badge.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Challenge Info Dialog Modal */}
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

const LevelShield = ({ level }) => (
  <div className="relative flex items-center justify-center w-full h-full select-none">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
      <defs>
        {/* Gold Wings Gradient */}
        <linearGradient id="goldGradShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE58F" />
          <stop offset="50%" stopColor="#F6C453" />
          <stop offset="100%" stopColor="#D48806" />
        </linearGradient>
        {/* Purple Crystal Gradient */}
        <radialGradient id="purpleShieldGradShield" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E0A7FF" />
          <stop offset="70%" stopColor="#A020F0" />
          <stop offset="100%" stopColor="#5B0E91" />
        </radialGradient>
        {/* Gloss Highlight Gradient */}
        <linearGradient id="glossGradShield" x1="0%" y1="0%" x2="0%" y2="100%">
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
        stroke="url(#goldGradShield)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Gold Wings (Right) */}
      <path
        d="M 72 35 C 90 25, 96 48, 82 58 C 92 52, 94 62, 80 64 C 90 62, 88 72, 74 68"
        fill="none"
        stroke="url(#goldGradShield)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Purple Shield Base */}
      <path
        d="M 32 24 L 68 24 Q 74 24 72 38 L 64 74 Q 50 88 50 88 Q 50 88 36 74 L 28 38 Q 26 24 32 24 Z"
        fill="url(#purpleShieldGradShield)"
        stroke="url(#goldGradShield)"
        strokeWidth="3.5"
      />

      {/* Glossy Highlight Overlay */}
      <path
        d="M 32 24 L 68 24 Q 74 24 72 38 L 50 50 L 28 38 Q 26 24 32 24 Z"
        fill="url(#glossGradShield)"
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
