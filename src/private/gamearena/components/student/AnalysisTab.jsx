/* eslint-disable react/prop-types */
import React from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  Trophy,
  AlertCircle,
  BookOpen,
  Clock,
  Flame,
  Target,
  Zap,
  Award,
} from "lucide-react";
import { BADGES } from "@/services/reward.service";

const AccuracyGraph = ({ series = [] }) => {
  if (!series || series.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/30 dark:border-slate-800 p-5 text-slate-400 text-xs font-bold text-center">
        <TrendingUp className="w-8 h-8 text-slate-350 dark:text-slate-700 mb-2 animate-bounce" />
        No test data available for accuracy mapping
      </div>
    );
  }

  const width = 500;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const points = series.map((val, idx) => {
    const x = paddingX + (series.length > 1 ? (idx / (series.length - 1)) * graphWidth : 0);
    const y = paddingY + graphHeight - (val / 100) * graphHeight;
    return { x, y, value: val };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          Accuracy Trend (Last {series.length} Tests)
        </h4>
        <span className="text-[10px] font-black text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full">{series[series.length - 1]}% Latest</span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF2EA6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#A020F0" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <dropShadow dx="0" dy="3" stdDeviation="3" floodColor="#FF2EA6" floodOpacity="0.3" />
            </filter>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF2EA6" />
              <stop offset="100%" stopColor="#A020F0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((yVal) => {
            const y = paddingY + graphHeight - (yVal / 100) * graphHeight;
            return (
              <g key={yVal} className="opacity-10 dark:opacity-20">
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-400 dark:text-slate-500"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  fill="currentColor"
                  className="text-slate-400 dark:text-slate-500 font-bold"
                  fontSize="8"
                  textAnchor="end"
                >
                  {yVal}%
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          )}

          {points.map((p, idx) => (
            <g key={idx} className="group/point cursor-help">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                className="fill-white dark:fill-slate-900 stroke-pink-500 hover:scale-125 transition-transform"
                strokeWidth="2"
              />
              <rect
                x={p.x - 14}
                y={p.y - 20}
                width="28"
                height="14"
                rx="4"
                className="fill-slate-900/90 dark:fill-white/95 opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none"
              />
              <text
                x={p.x}
                y={p.y - 10}
                className="fill-white dark:fill-slate-900 opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none font-black"
                fontSize="8"
                textAnchor="middle"
              >
                {p.value}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

const RecentBadgesRibbon = ({ achievements = [], badges = {} }) => {
  const getBadgeIconHelper = (iconName) => {
    switch (iconName) {
      case "Flame": return <Flame className="w-5 h-5 text-orange-500" />;
      case "Target": return <Target className="w-5 h-5 text-red-500" />;
      case "BookOpen": return <BookOpen className="w-5 h-5 text-purple-500" />;
      case "Zap": return <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case "Trophy": return <Trophy className="w-5 h-5 text-yellow-400" />;
      default: return <Award className="w-5 h-5 text-pink-500" />;
    }
  };

  const unlockedAchievementIds = achievements.map(a => a.achievementId);
  const recentBadgesList = Object.values(badges)
    .filter(badge => unlockedAchievementIds.includes(badge.id))
    .map(badge => {
      const achDoc = achievements.find(a => a.achievementId === badge.id);
      return {
        ...badge,
        unlockedAt: achDoc?.$createdAt || achDoc?.$updatedAt
      };
    })
    .sort((a, b) => new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime())
    .slice(0, 4);

  if (recentBadgesList.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5 text-center text-slate-400 text-xs font-bold shadow-sm">
        🎖️ Unlock badges by answering questions and completing missions!
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
        <Award className="w-4 h-4 text-pink-500" />
        Recent Badges Unlocked
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {recentBadgesList.map((badge) => (
          <div
            key={badge.id}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800"
            title={`${badge.title}: ${badge.description}`}
          >
            <div className={`p-2 rounded-xl bg-slate-200/50 dark:bg-slate-800`}>
              {getBadgeIconHelper(badge.icon)}
            </div>
            <span className="text-[7px] font-black uppercase text-slate-400 dark:text-slate-500 mt-1.5 text-center truncate w-full max-w-[56px]">
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AnalysisTab({
  profileStats,
  achievements,
  recentTests,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column (8 cols): Accuracy Graph & Subject Analysis */}
      <div className="lg:col-span-8 space-y-5">
        <AccuracyGraph series={profileStats.accuracySeries} />

        {/* Subject Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Strongest Subject */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="p-3 bg-emerald-500/10 rounded-2xl shrink-0">
              <Trophy className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Strongest Subject</p>
              <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1 truncate">{profileStats.strongestSubject}</h4>
            </div>
          </div>

          {/* Weakest Subject */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="p-3 bg-red-500/10 rounded-2xl shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Needs Focus (Weakest)</p>
              <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1 truncate">{profileStats.weakestSubject}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (4 cols): Recent Badges Ribbon & Recent Tests */}
      <div className="lg:col-span-4 space-y-5">
        <RecentBadgesRibbon achievements={achievements} badges={BADGES} />

        {/* Recent Tests Table */}
        {recentTests.length > 0 && (
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Recent Tests</h3>
            </div>
            <div className="divide-y divide-white/20 dark:divide-slate-800/50">
              {recentTests.slice(0, 5).map((test, idx) => {
                const pct = test.quesCount > 0 ? ((test.score / test.quesCount) * 100).toFixed(1) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-pink-50/20 dark:hover:bg-pink-900/5 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{test.tradeName || test.paperId}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-550 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {test.$createdAt ? format(new Date(test.$createdAt), "dd MMM yyyy") : "—"}
                      </p>
                    </div>
                    <span className={`text-xs font-extrabold tabular-nums ${
                      pct >= 75 ? "text-emerald-600 dark:text-emerald-400"
                      : pct >= 50 ? "text-amber-600 dark:text-amber-400"
                      : "text-red-650 dark:text-red-400"
                    }`}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
