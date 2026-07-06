/* eslint-disable react/prop-types */
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Lock,
  Award,
  Trophy,
  Compass,
  ZoomIn,
  ZoomOut,
  Info,
  Flame,
  Zap,
  Coins,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { fixProfileImage } from "@/services/appwriteClient";
import { BADGES } from "@/services/reward.service";
import OnlineBatchMembers from "@/components/components/OnlineBatchMembers";

/* ────────────────────────────────────────────────────────────────────────
   Path geometry — generates a smooth SVG road through the level nodes
   ──────────────────────────────────────────────────────────────────── */
const getCurvedPath = (points) => {
  if (points.length === 0) return "";

  const controlPoint = (current, previous, next, reverse) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.16;

    const lengthX = n.pixelX - p.pixelX;
    const lengthY = n.pixelY - p.pixelY;

    const speed = Math.sqrt(lengthX * lengthX + lengthY * lengthY);
    const angle = Math.atan2(lengthY, lengthX) + (reverse ? Math.PI : 0);
    const length = speed * smoothing;

    return [current.pixelX + Math.cos(angle) * length, current.pixelY + Math.sin(angle) * length];
  };

  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.pixelX} ${point.pixelY}`;
    const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
    const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
    return `${acc} C ${cpsX.toFixed(2)} ${cpsY.toFixed(2)}, ${cpeX.toFixed(2)} ${cpeY.toFixed(2)}, ${point.pixelX} ${point.pixelY}`;
  }, "");
};

const BASE_COORDINATES = [
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

const getLeague = (wins = 0) => {
  if (wins < 5) return { name: "Bronze League", ring: "border-amber-500/30 bg-amber-500/10", text: "text-amber-300", icon: "text-amber-400", next: 5 };
  if (wins < 15) return { name: "Silver League", ring: "border-slate-400/30 bg-slate-400/10", text: "text-slate-200", icon: "text-slate-200", next: 15 };
  if (wins < 30) return { name: "Gold League", ring: "border-yellow-400/30 bg-yellow-400/10", text: "text-yellow-300", icon: "text-yellow-300", next: 30 };
  return { name: "Diamond League", ring: "border-cyan-400/30 bg-cyan-400/10", text: "text-cyan-300", icon: "text-cyan-300", next: null };
};

/* ────────────────────────────────────────────────────────────────────────
   Small reusable pieces
   ──────────────────────────────────────────────────────────────────── */

// A compact stat tile used in both the sidebar grid and the mobile strip.
function StatTile({ icon, label, value, onClick, accent = "text-white", compact = false }) {
  return (
    <button
      onClick={onClick}
      className={[
        "group relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04]",
        "px-3 py-2 text-left transition-all hover:bg-white/[0.08] active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/60",
        compact ? "shrink-0" : "w-full",
      ].join(" ")}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`block truncate text-[11px] font-black ${accent}`}>{value}</span>
      </span>
    </button>
  );
}

const LevelShield = ({ level }) => (
  <div className="relative flex h-full w-full select-none items-center justify-center">
    <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
      <defs>
        <linearGradient id="goldGradShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE58F" />
          <stop offset="50%" stopColor="#F6C453" />
          <stop offset="100%" stopColor="#D48806" />
        </linearGradient>
        <radialGradient id="purpleShieldGradShield" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E0A7FF" />
          <stop offset="70%" stopColor="#A020F0" />
          <stop offset="100%" stopColor="#5B0E91" />
        </radialGradient>
        <linearGradient id="glossGradShield" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d="M 50 2 L 53 10 L 61 10 L 55 15 L 57 23 L 50 18 L 43 23 L 45 15 L 39 10 L 47 10 Z" fill="#F6C453" stroke="#D48806" strokeWidth="0.7" />

      <path d="M 28 35 C 10 25, 4 48, 18 58 C 8 52, 6 62, 20 64 C 10 62, 12 72, 26 68" fill="none" stroke="url(#goldGradShield)" strokeWidth="4" strokeLinecap="round" />
      <path d="M 72 35 C 90 25, 96 48, 82 58 C 92 52, 94 62, 80 64 C 90 62, 88 72, 74 68" fill="none" stroke="url(#goldGradShield)" strokeWidth="4" strokeLinecap="round" />

      <path d="M 32 24 L 68 24 Q 74 24 72 38 L 64 74 Q 50 88 50 88 Q 50 88 36 74 L 28 38 Q 26 24 32 24 Z" fill="url(#purpleShieldGradShield)" stroke="url(#goldGradShield)" strokeWidth="3.5" />
      <path d="M 32 24 L 68 24 Q 74 24 72 38 L 50 50 L 28 38 Q 26 24 32 24 Z" fill="url(#glossGradShield)" pointerEvents="none" />

      <circle cx="34" cy="30" r="1.5" fill="#FFFFFF" opacity="0.8" className="animate-pulse" />
      <circle cx="66" cy="30" r="1.5" fill="#FFFFFF" opacity="0.8" className="animate-pulse" />
      <circle cx="50" cy="78" r="1" fill="#FFFFFF" opacity="0.6" />

      <text x="50" y="44" textAnchor="middle" fill="#F6C453" fontSize="9" fontWeight="800" fontFamily="Poppins, sans-serif" letterSpacing="0.8">LEVEL</text>
      <text x="50" y="70" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="Poppins, sans-serif" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.5))">{level}</text>
    </svg>
  </div>
);

/* ────────────────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────────────── */
export default function GameWorld({ user, stats, profile, leaderboard = [], batchContext = {}, onAttemptQuestion }) {
  const currentLevel = stats?.level || 1;
  const xpIntoLevel = stats?.xp ? stats.xp % 100 : 0;

  // Winding path scales with player progress so higher-level students see more road ahead.
  const maxActiveLevel = Math.max(currentLevel, Math.floor((stats?.wins || 0) / 10) + 1);
  const totalLevels = Math.max(3, maxActiveLevel + 1);
  const currentStep = stats?.wins || 0;

  const league = useMemo(() => getLeague(stats?.wins || 0), [stats?.wins]);

  const currentStudentId = user?.$id || stats?.studentId || profile?.userId;
  const currentRank = leaderboard.findIndex((s) => s.studentId === currentStudentId) + 1;
  const rankText = currentRank > 0 ? `#${currentRank}` : "Unranked";

  const nextPlayer = currentRank > 1 ? leaderboard[currentRank - 2] : null;
  const xpNeeded = nextPlayer ? Math.max(0, nextPlayer.xp - (stats?.xp || 0)) : 0;

  // Build the full node list across all unlocked "floors" of the road.
  const coordinates = useMemo(() => {
    const list = [];
    const segmentHeightPercent = 100 / totalLevels;
    const virtualWidth = 500;
    const canvasH = totalLevels * 850;

    for (let L = 0; L < totalLevels; L++) {
      for (let s = 0; s < 10; s++) {
        const base = BASE_COORDINATES[s];
        const yPercent = 100 - L * segmentHeightPercent - ((100 - base.y) / 100) * segmentHeightPercent;
        const nodeType = L > 0 && s === 0 ? "question" : base.type;

        list.push({
          x: base.x,
          y: yPercent,
          pixelX: (base.x / 100) * virtualWidth,
          pixelY: (yPercent / 100) * canvasH,
          type: nodeType,
          globalIndex: L * 10 + s,
        });
      }
    }
    return list;
  }, [totalLevels]);

  const canvasHeight = totalLevels * 850;
  const curvedRoadPath = useMemo(() => getCurvedPath(coordinates), [coordinates]);

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1.05);
  const [mapY, setMapY] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [containerHeight, setContainerHeight] = useState(390);
  const [activeDetail, setActiveDetail] = useState(null);

  const recenterOn = useCallback(
    (nudge = false) => {
      if (!containerRef.current) return;
      const height = containerRef.current.clientHeight || 390;
      setContainerHeight(height);
      const activeNodeY = coordinates[currentStep]?.y || 50;
      const nodePixelY = (activeNodeY / 100) * canvasHeight;
      const initialY = Math.min(0, Math.max(height - canvasHeight, height / 2 - nodePixelY));
      setMapY((prev) => (nudge && prev === initialY ? initialY + 0.001 : initialY));
    },
    [coordinates, currentStep, canvasHeight]
  );

  useEffect(() => {
    recenterOn(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, canvasHeight]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setContainerHeight(containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const detailMeta = {
    level: { icon: <Zap className="h-4 w-4 text-pink-400" />, title: `Level ${currentLevel} details` },
    coins: { icon: <Coins className="h-4 w-4 text-yellow-400" />, title: "Gold coin balance" },
    league: { icon: <Award className="h-4 w-4 text-purple-400" />, title: "League status" },
    rank: { icon: <Trophy className="h-4 w-4 text-yellow-500" />, title: "Leaderboard rank" },
  };

  return (
    <div className="relative flex h-full w-full select-none flex-col overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 md:flex-row">
      <style>{`
        @keyframes breath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes gamerBounce {
          0%, 100% { transform: scale(1) translateY(0); }
          15% { transform: scale(0.9) translateY(0); }
          50% { transform: scale(1.1) translateY(-3px); }
          75% { transform: scale(1) translateY(0); }
        }
        @keyframes gamerShine { 0% { transform: translateX(-150%) rotate(35deg); } 100% { transform: translateX(150%) rotate(35deg); } }
        .animate-breath { animation: breath 4s infinite ease-in-out; }
        .animate-float { animation: float 3s infinite ease-in-out; }
        .animate-gamer-bounce { animation: gamerBounce 4s infinite ease-in-out; }
        .animate-gamer-shine { animation: gamerShine 4s infinite ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          .animate-breath, .animate-float, .animate-gamer-bounce, .animate-gamer-shine { animation: none; }
        }
      `}</style>

      {/* ── MAP COLUMN ───────────────────────────────────────────────── */}
      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Ambient sky */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-10 left-12 h-1.5 w-1.5 animate-ping rounded-full bg-white opacity-60" />
          <div className="absolute top-24 right-16 h-1 w-1 animate-pulse rounded-full bg-white opacity-40" />
          <div className="absolute top-48 left-20 h-1 w-1 animate-pulse rounded-full bg-white opacity-80" />
          <div className="absolute bottom-40 right-24 h-1.5 w-1.5 animate-ping rounded-full bg-yellow-300 opacity-70" />
          <div className="absolute top-1/4 left-1/4 h-40 w-40 rounded-full bg-pink-500/10 blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-purple-500/15 blur-[100px]" />
        </div>

        {/* Mobile HUD — compact header + scrollable stat strip */}
        <div className="z-20 w-full shrink-0 select-none p-3 pb-2 md:hidden">
          <button
            onClick={() => setActiveDetail((d) => (d === "level" ? null : "level"))}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 shadow-lg backdrop-blur-md transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/60"
          >
            <div className="relative shrink-0 animate-breath">
              <Avatar className="h-12 w-12 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,46,166,0.35)]">
                <AvatarImage src={fixProfileImage(profile?.profileImage)} />
                <AvatarFallback className="bg-gradient-to-br from-[#FF2EA6] to-[#A020F0] text-xl font-black text-white">
                  {profile?.userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 rounded-full border border-white/20 bg-gradient-to-r from-pink-500 to-purple-600 px-1.5 py-0.5 text-[8px] font-black text-white shadow-md">
                LVL {currentLevel}
              </div>
            </div>

            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="max-w-[110px] truncate font-poppins text-xs font-black uppercase tracking-wider text-white">
                  {profile?.userName || "Player"}
                </h2>
                {batchContext.batchName && (
                  <span className="max-w-[70px] shrink-0 truncate rounded bg-pink-500/20 border border-pink-500/30 px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wider text-pink-300">
                    {batchContext.batchName}
                  </span>
                )}
              </div>
              <div className="mt-1.5">
                <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-wider text-slate-400">
                  <span>XP Progress</span>
                  <span className="text-pink-400">{xpIntoLevel} / 100</span>
                </div>
                <div className="relative mt-0.5 h-1 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF2EA6] via-[#A020F0] to-[#4D8CFF] transition-all duration-1000 ease-out"
                    style={{ width: `${xpIntoLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </button>

          <div className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto">
            <StatTile
              compact
              icon={<Coins className="h-4 w-4 text-yellow-400" />}
              label="Coins"
              value={stats?.coins || 0}
              onClick={() => setActiveDetail((d) => (d === "coins" ? null : "coins"))}
            />
            <StatTile
              compact
              icon={<Award className={`h-4 w-4 ${league.icon}`} />}
              label="League"
              value={league.name.replace(" League", "")}
              accent={league.text}
              onClick={() => setActiveDetail((d) => (d === "league" ? null : "league"))}
            />
            <StatTile
              compact
              icon={<Trophy className="h-4 w-4 text-yellow-500" />}
              label="Rank"
              value={rankText}
              onClick={() => setActiveDetail((d) => (d === "rank" ? null : "rank"))}
            />
            <StatTile
              compact
              icon={<Flame className="h-4 w-4 fill-orange-500 text-orange-500" />}
              label="Streak"
              value={`${stats?.currentStreak || 0}d`}
              accent="text-orange-400"
            />
          </div>
        </div>

        {/* Draggable map viewport */}
        <div
          ref={containerRef}
          className="relative z-10 w-full flex-1 overflow-hidden border-b border-indigo-500/10 shadow-inner"
          style={{ perspective: 1000, touchAction: "none" }}
        >
          <div className="pointer-events-auto absolute top-4 left-4 z-30 select-none">
            <OnlineBatchMembers batchId={batchContext?.batchId || stats?.batchId} currentUserId={currentStudentId} compact={true} />
          </div>

          <motion.div
            drag="y"
            dragConstraints={{ top: containerHeight - canvasHeight * scale, bottom: 0 }}
            dragElastic={0.15}
            animate={{ y: mapY, scale }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="absolute w-full origin-center cursor-grab active:cursor-grabbing"
            style={{ transformStyle: "preserve-3d", rotateX: 12, height: canvasHeight }}
          >
            <svg viewBox={`0 0 500 ${canvasHeight}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-0 h-full w-full">
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
              <path d={curvedRoadPath} fill="none" stroke="url(#roadGlowGrad)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" className="opacity-75 blur-[5px]" />
              <path d={curvedRoadPath} fill="none" stroke="#6366f1" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" className="opacity-45" />
              <path d={curvedRoadPath} fill="none" stroke="url(#roadBaseGrad)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <path d={curvedRoadPath} fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="5 7" strokeLinecap="round" strokeLinejoin="round" className="opacity-95" />

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
                    <line x1={x - 11} y1={yStart - 4} x2={x - 11} y2={yEnd + 4} stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="1 14" />
                    <line x1={x + 11} y1={yStart - 4} x2={x + 11} y2={yEnd + 4} stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="1 14" />
                  </g>
                );
              })}
            </svg>

            {coordinates.map((node, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              const isLocked = index > currentStep;

              let icon = <Compass className="h-5 w-5" />;
              let nodeColor = "bg-slate-700/80 border-slate-600 text-slate-400";
              let glow = "";
              let scaleClass = "";

              if (isActive) {
                icon = <Play className="ml-0.5 h-6 w-6 animate-pulse fill-white text-white" />;
                nodeColor = "bg-gradient-to-br from-pink-500 to-purple-600 border-white text-white";
                glow = "ring-4 ring-pink-500/50 shadow-2xl shadow-pink-500/50 animate-bounce";
                scaleClass = "scale-110";
              } else if (isCompleted) {
                icon = <Award className="h-5 w-5 text-white" />;
                nodeColor = "bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-400 text-white";
                glow = "shadow-lg shadow-emerald-500/20";
              } else if (isLocked) {
                icon = <Lock className="h-4 w-4 text-slate-600" />;
                nodeColor = "bg-slate-900/90 border-slate-800 text-slate-700 opacity-60";
              }

              if (node.type === "boss") {
                icon = <Trophy className={`h-5 w-5 ${isLocked ? "text-slate-600" : "text-yellow-300"}`} />;
                if (isActive) nodeColor = "bg-gradient-to-br from-yellow-500 to-amber-600 border-white text-white";
              }

              const otherStudentsOnStage = leaderboard.filter((s) => (s.wins || 0) === index && s.studentId !== currentStudentId);

              return (
                <div
                  key={index}
                  style={{ position: "absolute", left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)", transformStyle: "preserve-3d" }}
                  className="z-10"
                >
                  <div style={{ transform: "rotateX(-12deg)", transformStyle: "preserve-3d" }} className="animate-float relative flex flex-col items-center">
                    {isActive && (
                      <div className="absolute bottom-11 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center">
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
                              showStatus={true}
                              statusSize="xs"
                              userName={profile?.userName}
                              className="h-7 w-7 shrink-0 rounded-md"
                            />
                            <div className="pointer-events-none absolute -bottom-1.5 -right-1.5 z-30 h-[15px] w-[15px] select-none">
                              <LevelShield level={currentLevel} />
                            </div>
                          </div>
                          <div className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 border-r border-b border-white bg-purple-600" />
                        </motion.div>
                      </div>
                    )}

                    {otherStudentsOnStage.length > 0 && (
                      <div className="absolute right-7 top-1/2 z-20 flex -translate-y-1/2 -space-x-1 items-center rounded-full border border-indigo-500/30 bg-slate-950/85 px-1 py-0.5 shadow-lg backdrop-blur-md">
                        {otherStudentsOnStage.slice(0, 2).map((student) => (
                          <div key={student.studentId} className="group relative cursor-help">
                            <InteractiveAvatar
                              src={student.profileImage}
                              fallbackText={student.userName?.charAt(0) || "U"}
                              userId={student.studentId}
                              showStatus={true}
                              statusSize="xs"
                              userName={student.userName}
                              className="h-5 w-5 shrink-0 rounded-full border border-slate-950 transition-all hover:z-30 hover:scale-110"
                            />
                            <span className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 scale-0 whitespace-nowrap rounded border border-white/10 bg-slate-900/90 px-1.5 py-0.5 text-[7px] font-bold text-white shadow-md transition-all group-hover:scale-100">
                              {student.userName} (Lvl {student.level})
                            </span>
                          </div>
                        ))}
                        {otherStudentsOnStage.length > 2 && (
                          <span className="px-0.5 text-[7px] font-black text-slate-300">+{otherStudentsOnStage.length - 2}</span>
                        )}
                      </div>
                    )}

                    <button
                      disabled={isLocked}
                      onClick={isActive ? onAttemptQuestion : undefined}
                      aria-label={isLocked ? `Stage ${index + 1} — locked` : `Stage ${index + 1}${isActive ? " — play" : ""}`}
                      className={[
                        "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-11 sm:w-11",
                        isLocked ? "cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/70",
                        nodeColor,
                        glow,
                        scaleClass,
                      ].join(" ")}
                    >
                      {icon}
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-slate-800 bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-400">
                        Stage {index + 1}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Floating map controls */}
          <div className="absolute bottom-[100px] right-4 z-30 flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-2 shadow-2xl backdrop-blur-lg md:bottom-6 md:right-6">
            <button
              onClick={() => setScale((s) => Math.min(1.6, s + 0.15))}
              aria-label="Zoom in"
              className="rounded-xl bg-white/10 p-2 text-white transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              <ZoomIn className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(0.8, s - 0.15))}
              aria-label="Zoom out"
              className="rounded-xl bg-white/10 p-2 text-white transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              <ZoomOut className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => recenterOn(true)}
              aria-label="Recenter map"
              className="rounded-xl bg-white/10 p-2 text-yellow-400 transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              <Compass className="h-[18px] w-[18px] animate-pulse" />
            </button>
            <div className="h-px w-full bg-white/10" />
            <button
              onClick={() => setIsInfoOpen(true)}
              aria-label="Daily challenge rules"
              className="rounded-xl bg-white/10 p-2 text-blue-400 transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              <Info className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* Desktop play FAB */}
          <div className="absolute bottom-6 right-24 z-30 hidden md:flex">
            <Button
              onClick={onAttemptQuestion}
              className="h-14 w-14 cursor-pointer rounded-full bg-gradient-to-r from-pink-600 to-purple-600 p-0 text-white shadow-lg shadow-pink-500/20 transition-all hover:-translate-y-0.5 hover:from-pink-500 hover:to-purple-500"
              title="Play challenge node"
            >
              <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
            </Button>
          </div>
        </div>

        {/* Mobile bottom overtake strip */}
        <div className="z-20 w-full shrink-0 border-t border-white/10 bg-slate-950/80 px-4 py-2 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="flex shrink-0 items-center gap-1.5 font-black uppercase tracking-wider text-white">
              <Trophy className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
              Rank {rankText}
            </span>
            <span className="min-w-0 flex-1 truncate text-center text-slate-300">
              {nextPlayer ? (
                <>
                  <Flame className="mr-1 inline h-3 w-3 fill-orange-500 text-orange-500" />
                  Need <strong className="font-extrabold text-pink-400">{xpNeeded} XP</strong> to pass{" "}
                  <strong className="font-extrabold text-white">{nextPlayer.userName}</strong>
                </>
              ) : (
                <span className="font-bold text-yellow-400">👑 Leading the batch!</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────── */}
      <div className="no-scrollbar relative z-20 hidden h-full w-[340px] shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-[#150f35]/95 p-5 text-white shadow-2xl backdrop-blur-md md:flex">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-500/5 blur-[50px]" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-purple-500/5 blur-[60px]" />

        {/* Player hero card */}
        <div className="relative z-10 mb-5 flex min-h-[92px] items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
          <div className="relative shrink-0 animate-breath">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[#FF2EA6]/25 blur-sm" />
            <Avatar className="relative h-[54px] w-[54px] rounded-full border-2 border-white shadow-[0_0_12px_rgba(255,46,166,0.35)]">
              <AvatarImage src={fixProfileImage(profile?.profileImage)} />
              <AvatarFallback className="bg-gradient-to-br from-[#FF2EA6] to-[#A020F0] text-xl font-black text-white">
                {profile?.userName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-w-0 flex-1 pr-14 text-left">
            <h2 className="truncate font-poppins text-sm font-black uppercase leading-tight tracking-wider text-white">
              {profile?.userName || "Player"}
            </h2>
            <div className="mt-1 flex flex-col gap-1">
              {batchContext.batchName && (
                <span className="w-fit max-w-[130px] truncate rounded-md border border-pink-500/30 bg-pink-500/20 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-pink-300">
                  {batchContext.batchName}
                </span>
              )}
              {batchContext.tradeName && (
                <span className="w-fit max-w-[130px] truncate rounded-md border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-purple-300">
                  {batchContext.tradeName}
                </span>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute right-3 top-1/2 h-14 w-14 -translate-y-1/2 select-none">
            <LevelShield level={currentLevel} />
          </div>
        </div>

        {/* XP progress */}
        <div className="relative z-10 mb-5 rounded-2xl border border-white/10 bg-slate-900/50 p-4 shadow-inner">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 shrink-0 text-pink-500" />
              XP Progress
            </span>
            <span className="font-extrabold text-pink-400">{xpIntoLevel} / 100 XP</span>
          </div>
          <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full border border-slate-800/80 bg-slate-950/80 p-[1px]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#FF2EA6] via-[#A020F0] to-[#4D8CFF] transition-all duration-1000 ease-out" style={{ width: `${xpIntoLevel}%` }} />
          </div>
          <span className="mt-1 block text-right text-[8px] font-bold uppercase tracking-wider text-slate-400">
            Level up in {100 - xpIntoLevel} XP
          </span>
        </div>

        {/* Stat grid: coins / league / rank / streak */}
        <div className="relative z-10 mb-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setActiveDetail((d) => (d === "coins" ? null : "coins"))}
            className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-3 text-left shadow-lg transition-all hover:border-yellow-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
          >
            <div className="pointer-events-none absolute inset-0 w-[200%] -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-gamer-shine" />
            <Coins className="h-4 w-4 animate-gamer-bounce text-yellow-400" />
            <p className="mt-1.5 text-[8px] font-black uppercase tracking-wider leading-none text-slate-400">Coins</p>
            <p className="mt-1 text-base font-black leading-none text-white">{stats?.coins || 0}</p>
          </button>

          <button
            onClick={() => setActiveDetail((d) => (d === "league" ? null : "league"))}
            className={`rounded-2xl border p-3 text-left shadow-inner transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${league.ring}`}
          >
            <Award className={`h-4 w-4 ${league.icon}`} />
            <p className="mt-1.5 text-[8px] font-black uppercase tracking-wider leading-none text-slate-400">League</p>
            <p className={`mt-1 truncate text-base font-black leading-none ${league.text}`}>{league.name.replace(" League", "")}</p>
          </button>

          <button
            onClick={() => setActiveDetail((d) => (d === "rank" ? null : "rank"))}
            className="rounded-2xl border border-white/10 bg-slate-900/50 p-3 text-left shadow-inner transition-all hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
          >
            <Trophy className="h-4 w-4 text-yellow-500" />
            <p className="mt-1.5 text-[8px] font-black uppercase tracking-wider leading-none text-slate-400">Rank</p>
            <p className="mt-1 text-base font-black leading-none text-white">{rankText}</p>
          </button>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3 shadow-inner">
            <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
            <p className="mt-1.5 text-[8px] font-black uppercase tracking-wider leading-none text-slate-400">Streak</p>
            <p className="mt-1 text-base font-black leading-none text-orange-400">{stats?.currentStreak || 0}d</p>
          </div>
        </div>

        {/* Overtake target */}
        <div className="relative z-10 mb-5 rounded-2xl border border-white/10 bg-slate-900/50 p-4 shadow-inner">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Standing overtake target</p>
          <div className="mt-2.5 text-xs font-medium text-slate-300">
            {nextPlayer ? (
              <div className="flex items-start gap-2.5">
                <Flame className="mt-0.5 h-5 w-5 shrink-0 animate-pulse fill-orange-500 text-orange-500" />
                <div className="min-w-0 flex-1">
                  <p>
                    Need <strong className="font-extrabold text-pink-400">{xpNeeded} XP</strong> to overtake:
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={fixProfileImage(nextPlayer.profileImage)} />
                      <AvatarFallback className="bg-slate-800 text-[10px] font-extrabold text-white">{nextPlayer.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[100px] truncate text-xs font-black text-white">{nextPlayer.userName}</span>
                    <span className="shrink-0 text-[9px] font-bold text-slate-400">(Rank #{currentRank - 1})</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-bold text-yellow-400">
                <Trophy className="h-4 w-4 animate-bounce text-yellow-500" />
                <span>Overtook everyone! You lead the batch!</span>
              </div>
            )}
          </div>
        </div>

        {/* Milestone badges */}
        <div className="relative z-10 flex-1 space-y-3 pb-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Milestone achievements</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(BADGES).map((badge) => {
              const isUnlocked = stats?.badges?.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  title={`${badge.title}: ${badge.description}`}
                  className={[
                    "flex flex-col items-center rounded-xl border p-2 text-center transition-all",
                    isUnlocked ? "border-pink-500/20 bg-slate-950 text-white shadow-md" : "border-white/5 bg-slate-900/30 text-slate-500 opacity-40",
                  ].join(" ")}
                >
                  <span className="text-base">{badge.icon}</span>
                  <span className="mt-1 w-full truncate text-[8px] font-black leading-tight tracking-tight">{badge.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Unified stat detail dialog (mobile pills + desktop tiles) ── */}
      <Dialog open={!!activeDetail} onOpenChange={(open) => !open && setActiveDetail(null)}>
        <DialogContent className="w-full max-w-[320px] rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-2xl backdrop-blur-2xl">
          {activeDetail && (
            <>
              <DialogTitle className="flex items-center gap-2 font-poppins text-xs font-black uppercase tracking-wider text-white">
                {detailMeta[activeDetail].icon}
                {detailMeta[activeDetail].title}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-2 text-xs font-semibold leading-relaxed text-slate-300">
                  {activeDetail === "level" && (
                    <div className="space-y-2">
                      <p>
                        You are at <strong>Level {currentLevel}</strong> with <strong>{stats?.xp || 0} total XP</strong>. Need{" "}
                        <strong className="text-pink-400">{100 - xpIntoLevel} XP</strong> to advance to Level {currentLevel + 1}.
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/5 bg-slate-950/40 p-2">
                        <div className="rounded-lg bg-slate-950/20 p-1.5">
                          <p className="text-[7px] font-extrabold uppercase tracking-wider text-slate-500">Accuracy</p>
                          <p className="mt-0.5 text-[10px] font-black text-emerald-400">
                            {stats?.accuracy ? `${stats.accuracy.toFixed(0)}%` : `${stats?.questionsAttempted ? ((stats.wins / stats.questionsAttempted) * 100).toFixed(0) : 0}%`}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-950/20 p-1.5">
                          <p className="text-[7px] font-extrabold uppercase tracking-wider text-slate-500">Attempted</p>
                          <p className="mt-0.5 text-[10px] font-black text-white">{stats?.questionsAttempted || 0} ({stats?.wins || 0} wins)</p>
                        </div>
                        <div className="rounded-lg bg-slate-950/20 p-1.5">
                          <p className="text-[7px] font-extrabold uppercase tracking-wider text-slate-500">Best streak</p>
                          <p className="mt-0.5 text-[10px] font-black text-orange-400">🔥 {stats?.highestStreak || 0}d</p>
                        </div>
                        <div className="rounded-lg bg-slate-950/20 p-1.5">
                          <p className="text-[7px] font-extrabold uppercase tracking-wider text-slate-500">Losses</p>
                          <p className="mt-0.5 text-[10px] font-black text-red-400">💀 {stats?.losses || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetail === "coins" && (
                    <p>
                      You have <strong>{stats?.coins || 0} gold coins</strong>. Coins are earned for correct challenge answers — collect more to climb the leaderboard.
                    </p>
                  )}

                  {activeDetail === "league" && (
                    <p>
                      Current league: <strong className={league.text}>{league.name}</strong>. You've earned <strong>{stats?.wins || 0} wins</strong>.{" "}
                      {league.next ? (
                        <>Need <strong>{league.next} wins</strong> to reach the next league.</>
                      ) : (
                        "You're in the top tier — Diamond League."
                      )}
                    </p>
                  )}

                  {activeDetail === "rank" && (
                    <p>
                      Standing: <strong>Rank {rankText}</strong> in your batch.{" "}
                      {nextPlayer ? (
                        <>
                          Chasing <strong className="text-white">{nextPlayer.userName}</strong> — need{" "}
                          <strong className="text-pink-400">{xpNeeded} XP</strong> to overtake them.
                        </>
                      ) : (
                        "👑 You're leading the batch leaderboard!"
                      )}
                    </p>
                  )}
                </div>
              </DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Daily challenge info dialog ─────────────────────────────── */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="flex w-full max-w-[280px] flex-col items-center gap-4 rounded-[2.5rem] border border-white/10 bg-slate-950/95 p-6 text-center shadow-2xl backdrop-blur-2xl">
          <DialogTitle className="flex w-full items-center justify-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <Flame className="h-5 w-5 animate-pulse fill-orange-500 text-orange-500" />
            Daily Challenge
          </DialogTitle>
          <DialogDescription className="mt-2 w-full text-center text-xs font-bold leading-relaxed text-slate-400">
            Attempt a random question matching your trade, gain XP and level up on correct answers!
          </DialogDescription>
          <Button
            onClick={() => {
              setIsInfoOpen(false);
              onAttemptQuestion();
            }}
            className="mt-2 w-full cursor-pointer rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 py-4 text-xs font-black text-white transition-all hover:-translate-y-0.5 hover:from-pink-500 hover:to-purple-500"
          >
            Play Challenge Node →
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}