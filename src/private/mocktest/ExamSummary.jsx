import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { differenceInMinutes } from "date-fns";
import { Query } from "appwrite";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// React Icons
import { FaTrophy, FaMedal, FaStar, FaBook } from "react-icons/fa";
import { FiCheckCircle, FiXCircle, FiClock, FiList, FiEye, FiHome, FiArrowRight, FiAward } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { RiTimeLine } from "react-icons/ri";

import mockTestService from "@/services/mocktest.service";
import Loader from "@/components/components/Loader";

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 1200, delay = 300) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start;
    let raf;
    const timeout = setTimeout(() => {
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);
        setValue(Math.round(ease * target));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return value;
}

// ─── Animated progress ring ───────────────────────────────────────────────────
function ScoreRing({ pct, color, size = 160 }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(pct), 400);
    return () => clearTimeout(timeout);
  }, [pct]);

  const offset = circumference - (animated / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
      {/* Track */}
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10"
        stroke="currentColor" className="text-gray-100 dark:text-gray-800" />
      {/* Glow */}
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10"
        stroke={color} strokeOpacity="0.15" />
      {/* Progress */}
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10"
        stroke={color} strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      />
    </svg>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-3
        transition-all duration-500 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`text-xl ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-gray-900 dark:text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Grade config ─────────────────────────────────────────────────────────────
function getGrade(pct) {
  if (pct >= 90) return {
    label: "Outstanding!", sublabel: "You nailed it!",
    Icon: FaTrophy, iconColor: "text-yellow-500",
    ringColor: "#f59e0b",
    badgeClass: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    gradientFrom: "from-yellow-50 dark:from-yellow-950/20",
    gradientTo: "to-amber-50 dark:to-amber-950/10",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    sparkle: true,
  };
  if (pct >= 75) return {
    label: "Excellent!", sublabel: "Great performance!",
    Icon: FiAward, iconColor: "text-blue-500",
    ringColor: "#3b82f6",
    badgeClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    gradientFrom: "from-blue-50 dark:from-blue-950/20",
    gradientTo: "to-indigo-50 dark:to-indigo-950/10",
    borderColor: "border-blue-200 dark:border-blue-800",
    sparkle: false,
  };
  if (pct >= 50) return {
    label: "Good Job!", sublabel: "Keep it up!",
    Icon: FaMedal, iconColor: "text-emerald-500",
    ringColor: "#10b981",
    badgeClass: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    gradientFrom: "from-emerald-50 dark:from-emerald-950/20",
    gradientTo: "to-teal-50 dark:to-teal-950/10",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    sparkle: false,
  };
  return {
    label: "Keep Practicing", sublabel: "You can do better!",
    Icon: FaBook, iconColor: "text-red-500",
    ringColor: "#ef4444",
    badgeClass: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    gradientFrom: "from-red-50 dark:from-red-950/20",
    gradientTo: "to-rose-50 dark:to-rose-950/10",
    borderColor: "border-red-200 dark:border-red-800",
    sparkle: false,
  };
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ["#f59e0b", "#3b82f6", "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4"];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    color: colors[i % colors.length],
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 360}deg`,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ExamSummary = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await mockTestService.listQuestions([
          Query.equal("$id", paperId),
          Query.limit(1),
        ]);
        const paper = res?.[0];
        if (!paper) throw new Error("Result not found.");
        if (!paper.submitted) {
          navigate(`/start-mock-test/${paperId}`, { replace: true });
          return;
        }
        setResult(paper);
        setTimeout(() => setMounted(true), 80);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [paperId, navigate]);

  // ── Derive values safely (hooks must always run, even before result loads) ──
  const score       = result?.score       ?? 0;
  const quesCount   = result?.quesCount   ?? 0;
  const startTime   = result?.startTime   ?? null;
  const endTime     = result?.endTime     ?? null;
  const tradeName   = result?.tradeName   ?? null;
  const title       = result?.title       ?? null;
  const totalMinutes = result?.totalMinutes ?? null;

  const timeTaken = startTime && endTime
    ? differenceInMinutes(new Date(endTime), new Date(startTime))
    : null;

  const answeredCount  = result?.answeredCount ?? score;
  const wrongCount     = Math.max(0, answeredCount - score);
  const unansweredCount = Math.max(0, quesCount - answeredCount);
  const scorePct       = quesCount > 0 ? Math.round((score / quesCount) * 100) : 0;
  const grade          = getGrade(scorePct);

  // ── Animated counters — always called, targets are 0 until result loads ──
  const animScore = useCountUp(score, 1200, 600);
  const animPct   = useCountUp(scorePct, 1200, 600);

  // ── Early returns AFTER all hooks ──
  if (loading) return <Loader isLoading />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="text-center space-y-4">
          <FiXCircle className="text-5xl text-red-400 mx-auto" />
          <p className="text-red-500 font-semibold">{error}</p>
          <Button onClick={() => navigate("/all-mock-tests")}>Go to My Tests</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confetti keyframe injected globally */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti-fall linear forwards; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.6s ease-out both; }

        @keyframes pop-in {
          0%   { opacity: 0; transform: scale(0.7); }
          70%  { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        .pop-in { animation: pop-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both; }

        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .shimmer { animation: shimmer 2s ease-in-out infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .float { animation: float 3s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4 md:p-8">
        <div className={`w-full max-w-2xl transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

          {/* ── Hero Card ── */}
          <div className={`relative overflow-hidden rounded-3xl border ${grade.borderColor} bg-gradient-to-br ${grade.gradientFrom} ${grade.gradientTo} mb-4 fade-up`}
            style={{ animationDelay: "0ms" }}>

            {grade.sparkle && <Confetti />}

            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
              style={{ backgroundColor: grade.ringColor }} />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
              style={{ backgroundColor: grade.ringColor }} />

            <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Score Ring */}
              <div className="relative shrink-0 float">
                <ScoreRing pct={scorePct} color={grade.ringColor} size={160} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black leading-none" style={{ color: grade.ringColor }}>
                    {animPct}%
                  </span>
                  <span className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-widest">Score</span>
                </div>
              </div>

              {/* Grade Info */}
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <grade.Icon className={`text-3xl ${grade.iconColor} pop-in`} style={{ animationDelay: "400ms" }} />
                  {grade.sparkle && (
                    <HiSparkles className="text-2xl text-yellow-400 shimmer" />
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-1">{grade.label}</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-3 text-sm">{grade.sublabel}</p>

                {/* Paper Info */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {tradeName && (
                    <Badge variant="outline" className={`text-xs font-semibold border ${grade.badgeClass}`}>
                      {tradeName}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs font-semibold">
                    <FiList className="mr-1" /> {quesCount} Questions
                  </Badge>
                  {timeTaken !== null && (
                    <Badge variant="outline" className="text-xs font-semibold">
                      <RiTimeLine className="mr-1" /> {timeTaken} min
                    </Badge>
                  )}
                </div>

                {title && (
                  <p className="mt-3 text-xs text-gray-400 truncate max-w-xs">{title}</p>
                )}
              </div>
            </div>

            {/* Score summary bar */}
            <div className="relative z-10 px-6 md:px-8 pb-6">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                <span>Score Progress</span>
                <span>{animScore} / {quesCount} correct</span>
              </div>
              <Progress value={scorePct} className="h-2.5 rounded-full" />
            </div>
          </div>

          {/* ── Stat Grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard
              icon={FiCheckCircle} label="Correct" value={animScore}
              iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600 dark:text-green-400"
              delay={200}
            />
            <StatCard
              icon={FiXCircle} label="Wrong" value={wrongCount < 0 ? 0 : wrongCount}
              iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-600 dark:text-red-400"
              delay={300}
            />
            <StatCard
              icon={FiClock} label="Skipped" value={unansweredCount}
              iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400"
              delay={400}
            />
            <StatCard
              icon={RiTimeLine} label="Time Taken" value={timeTaken !== null ? `${timeTaken}m` : "—"}
              sub={totalMinutes ? `of ${totalMinutes} min` : undefined}
              iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400"
              delay={500}
            />
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col sm:flex-row gap-3 fade-up" style={{ animationDelay: "400ms" }}>
            <Link to={`/show-mock-test/${paperId}`} className="flex-1">
              <Button
                size="lg"
                className="w-full bg-[#1a3a6b] hover:bg-[#15305a] text-white font-bold rounded-2xl h-14 text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#1a3a6b]/20 gap-2"
              >
                <FiEye className="text-xl" />
                Review Full Paper
                <FiArrowRight className="text-lg ml-auto" />
              </Button>
            </Link>
            <Link to="/all-mock-tests" className="flex-1">
              <Button
                size="lg"
                variant="outline"
                className="w-full font-bold rounded-2xl h-14 text-base transition-all hover:scale-[1.02] active:scale-[0.98] gap-2"
              >
                <FiHome className="text-xl" />
                My Mock Tests
              </Button>
            </Link>
          </div>

          {/* ── Footer note ── */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4 fade-up" style={{ animationDelay: "600ms" }}>
            Your answers have been saved. You can review this paper anytime.
          </p>

        </div>
      </div>
    </>
  );
};

export default ExamSummary;
