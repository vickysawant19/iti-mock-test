/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  GraduationCap,
  Calendar,
  Award,
  TrendingUp,
  ClipboardList,
  Clock,
  AlertCircle,
  BookOpen,
  Building,
  Gamepad2,
  Trophy,
  Target,
  Flame,
  Users,
  Compass,
  Zap,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Query } from "appwrite";
import { checkProfileCompletion } from "@/utils/profileCompletion";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import mockTestService from "@/services/mocktest.service";
import OnlineBatchMembers from "@/components/components/OnlineBatchMembers";
import GameMap from "./components/GameMap";
import QuestionModal from "./components/QuestionModal";
import useStudentGame from "@/hooks/useStudentGame";
import { BADGES } from "@/services/reward.service";
import { fixProfileImage } from "@/services/appwriteClient";

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/30 dark:border-slate-700/50">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);

const StudentDashboard = ({
  user,
  profile,
  batchContext,
  activeBatchId,
  activeBatchData,
  userBatches,
  isBatchLoading,
}) => {
  const navigate = useNavigate();
  const { isComplete, missingFields } = checkProfileCompletion(profile);
  
  // Tabs: game, leaderboard, challenges, rewards, stats, friends
  const [activeTab, setActiveTab] = useState("game");
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Original attendance and mock test stats
  const [overallStats, setOverallStats] = useState(null);
  const [testStats, setTestStats] = useState({ count: 0, avgScore: 0 });
  const [recentTests, setRecentTests] = useState([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Gamification hook
  const {
    stats,
    leaderboard,
    challenges,
    achievements,
    submitAnswer,
    claimChallengeReward,
    unlockedBadges,
    clearUnlockedBadges,
  } = useStudentGame(user?.$id, activeBatchId, activeBatchData?.tradeId);

  // Fetch original student-specific attendance and tests stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!activeBatchId || !user?.$id) {
        setIsStatsLoading(false);
        return;
      }
      setIsStatsLoading(true);
      try {
        const [attStats, tests] = await Promise.all([
          newAttendanceService.getStudentAttendanceStats(user.$id, activeBatchId),
          mockTestService.listQuestions([
            Query.equal("userId", user.$id),
            Query.equal("submitted", true),
            Query.select(["score", "quesCount", "paperId", "tradeName", "$createdAt"]),
            Query.orderDesc("$createdAt"),
            Query.limit(10),
          ]),
        ]);

        setOverallStats(attStats);
        setRecentTests(tests || []);

        if (tests?.length > 0) {
          const avg = parseFloat(
            (tests.reduce((s, t) => s + (t.quesCount > 0 ? (t.score / t.quesCount) * 100 : 0), 0) / tests.length).toFixed(1)
          );
          setTestStats({ count: tests.length, avgScore: avg });
        }
      } catch (err) {
        console.error("[StudentDashboard] Error:", err);
      } finally {
        setIsStatsLoading(false);
      }
    };
    fetchStats();
  }, [activeBatchId, user?.$id]);

  // Show badge unlock celebrations if any exist
  useEffect(() => {
    if (unlockedBadges.length > 0) {
      // Show first badge celebration
      const timer = setTimeout(() => {
        clearUnlockedBadges();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [unlockedBadges, clearUnlockedBadges]);

  if (!activeBatchId && !isBatchLoading) {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <GradientBackground />
        <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 pb-20 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-8 text-center max-w-md">
            <div className="p-4 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl inline-block mb-4">
              <GraduationCap className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Join a Batch</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Send a request to join a batch and start tracking your progress.
            </p>
            <Button
              onClick={() => navigate("/browse-batches")}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-md shadow-pink-500/20 transition-all hover:-translate-y-0.5"
            >
              Browse Batches →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle answering question in modal
  const handleAnswerSubmit = async (isCorrect, isFiftyFiftyUsed) => {
    const result = await submitAnswer(isCorrect, isFiftyFiftyUsed);
    if (result?.levelUp) {
      setShowLevelUp(true);
    }
    return result;
  };

  // Claiming challenge reward
  const handleClaimChallenge = async (challengeId) => {
    try {
      await claimChallengeReward(challengeId);
    } catch (err) {
      alert(err.message || "Failed to claim reward");
    }
  };

  const getBadgeIcon = (iconName) => {
    switch (iconName) {
      case "Flame": return <Flame className="w-6 h-6" />;
      case "Target": return <Target className="w-6 h-6" />;
      case "BookOpen": return <BookOpen className="w-6 h-6" />;
      case "Zap": return <Zap className="w-6 h-6" />;
      case "Trophy": return <Trophy className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden pb-12">
      <GradientBackground />

      {/* Level Up Overlay Celebration */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLevelUp(false)} />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-slate-900 border border-yellow-500/30 p-8 rounded-3xl text-center max-w-sm text-white shadow-2xl z-10"
            >
              <div className="w-20 h-20 bg-yellow-500/20 border border-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Sparkles className="w-10 h-10 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-black text-yellow-400 tracking-tight mb-2">LEVEL UP!</h2>
              <p className="text-sm text-slate-300 mb-6">
                Congratulations! Your hard work has paid off. You have ascended to:
              </p>
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full text-slate-950 font-black text-lg tracking-wide mb-6">
                Level {stats?.level || 1}
              </div>
              <Button onClick={() => setShowLevelUp(false)} className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl">
                Awesome!
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Badge Unlock Celebration Banner */}
      <AnimatePresence>
        {unlockedBadges.length > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm bg-slate-900 border-2 border-pink-500 rounded-2xl p-4 shadow-2xl flex items-center gap-4 text-white"
          >
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              {getBadgeIcon(unlockedBadges[0].icon)}
            </div>
            <div>
              <p className="text-[10px] font-black text-pink-500 tracking-widest uppercase">New Badge Unlocked!</p>
              <h4 className="text-sm font-black text-white">{unlockedBadges[0].title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{unlockedBadges[0].description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pb-20 pt-3">

        {/* ── TWO-COLUMN DESKTOP LAYOUT ──
             Left  col (lg+): GameMap — sticky, always visible
             Right col (lg+): profile header + tabs + content
             Mobile: single column, tabs navigate between views        ── */}
        <div className="lg:grid lg:grid-cols-[420px_1fr] lg:gap-5 lg:items-start">

          {/* ───── LEFT COLUMN ─────
               Desktop only. Plain div (NOT inside AnimatePresence)
               so position:sticky is never broken by FM transforms. ───── */}
          <div
            className="hidden lg:block sticky z-20"
            style={{ top: "calc(64px + 8px)" }}
          >
            <GameMap
              stats={stats}
              profile={profile}
              leaderboard={leaderboard}
              onAttemptQuestion={() => setIsQuestionOpen(true)}
            />
          </div>

          {/* ───── RIGHT COLUMN (all content) ───── */}
          <div className="min-w-0 space-y-4">
            {/* Profile Incomplete Banner */}
            {!isComplete && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Complete your profile</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">Missing: {missingFields.join(", ")}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/profile/edit")}
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl shrink-0"
                >
                  Update
                </Button>
              </div>
            )}

            {/* Compact Header */}
            <div className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-md p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                  <AvatarImage src={fixProfileImage(profile?.profileImage)} />
                  <AvatarFallback className="text-base font-extrabold bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 rounded-xl">
                    {profile?.userName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="text-base font-black text-slate-850 dark:text-white tracking-tight truncate leading-tight">
                    {profile?.userName || "Student"}
                  </h1>
                  <div className="flex items-center gap-2.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 flex-wrap">
                    {batchContext.batchName && (
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        <GraduationCap className="w-3 h-3 text-pink-500" /> {batchContext.batchName}
                      </span>
                    )}
                    {batchContext.tradeName && (
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        <Award className="w-3 h-3 text-purple-500" /> {batchContext.tradeName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {stats && (
                <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 px-3.5 py-1.5 rounded-xl self-end sm:self-auto shrink-0 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                  <span className="text-[11px] font-black text-pink-600 dark:text-pink-400">LEVEL {stats.level}</span>
                </div>
              )}
            </div>

            {/* Navigation Tabs — sticky below navbar */}
            <div className="sticky top-16 z-30 flex items-center overflow-x-auto gap-1 bg-slate-900/85 dark:bg-slate-950/75 p-2 rounded-2xl border border-slate-800 backdrop-blur-md scrollbar-none select-none shadow-xl shadow-pink-950/5">
              {[
                { id: "game", label: "Game World", icon: Gamepad2 },
                { id: "leaderboard", label: "Leaderboard", icon: Trophy },
                { id: "challenges", label: "Challenges", icon: Target },
                { id: "rewards", label: "Badges", icon: Award },
                { id: "stats", label: "My Progress", icon: ClipboardList },
                { id: "friends", label: "Online Presence", icon: Users },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive ? "text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 rounded-xl -z-10 shadow-lg shadow-pink-500/30 border-t border-white/20"
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 transition-transform ${isActive ? "text-white scale-110" : "text-slate-500"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">

                {/* Game tab — unified responsive view. GameMap is in the sticky left column on desktop, and inline here on mobile. */}
                {activeTab === "game" && (
                  <motion.div
                    key="game"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full space-y-4"
                  >
                    {/* Play button card */}
                    <div className="flex flex-col p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl gap-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                          Daily Theory Challenge
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                          Attempt a random question matching your trade, gain XP and level up on correct answers!
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsQuestionOpen(true)}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-md shadow-pink-500/20 py-4 cursor-pointer"
                      >
                        Play Challenge Node →
                      </Button>
                    </div>

                    {/* Stats display — Desktop only (since GameMap is already visible on the left side) */}
                    {stats && (
                      <div className="hidden lg:block p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl space-y-3.5 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Your Game Stats</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">XP Level</p>
                            <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">LVL {stats.level}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Accuracy</p>
                            <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{stats.accuracy}%</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Streak</p>
                            <p className="text-lg font-black text-orange-500 mt-0.5">🔥 {stats.currentStreak}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Wins</p>
                            <p className="text-lg font-black text-emerald-500 mt-0.5">🏆 {stats.wins}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GameMap — Mobile viewports only */}
                    <div className="lg:hidden">
                      <GameMap
                        stats={stats}
                        profile={profile}
                        leaderboard={leaderboard}
                        onAttemptQuestion={() => setIsQuestionOpen(true)}
                      />
                    </div>
                  </motion.div>
                )}

            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* Top 3 podium display */}
                {leaderboard.length > 0 && (
                  <div className="flex justify-center items-end gap-3 sm:gap-6 pt-10 pb-4 max-w-md mx-auto relative">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                      <div className="flex flex-col items-center">
                        <Avatar className="h-12 w-12 border-2 border-slate-300 ring-2 ring-slate-400/20 rounded-xl mb-1 shadow-md">
                          <AvatarImage src={fixProfileImage(leaderboard[1].profileImage)} />
                          <AvatarFallback className="font-extrabold bg-slate-200 text-slate-700 text-sm rounded-xl">
                            {leaderboard[1].userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 max-w-[70px] truncate text-center">
                          {leaderboard[1].userName}
                        </p>
                        <div className="w-20 sm:w-24 bg-gradient-to-b from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900 border border-slate-300 dark:border-slate-800 rounded-t-xl h-20 flex flex-col items-center justify-center mt-2 shadow-lg">
                          <span className="text-xl font-black text-slate-700 dark:text-slate-300">2</span>
                          <span className="text-[9px] font-bold text-slate-500">{leaderboard[1].xp} XP</span>
                        </div>
                      </div>
                    )}

                    {/* 1st Place */}
                    {leaderboard[0] && (
                      <div className="flex flex-col items-center z-10 -mt-8">
                        <div className="relative">
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                            👑
                          </div>
                          <Avatar className="h-16 w-16 border-2 border-yellow-400 ring-4 ring-yellow-400/20 rounded-2xl mb-1 shadow-xl">
                            <AvatarImage src={fixProfileImage(leaderboard[0].profileImage)} />
                            <AvatarFallback className="font-extrabold bg-yellow-100 text-yellow-700 text-base rounded-2xl">
                              {leaderboard[0].userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <p className="text-xs font-black text-slate-800 dark:text-white max-w-[85px] truncate text-center">
                          {leaderboard[0].userName}
                        </p>
                        <div className="w-24 sm:w-28 bg-gradient-to-b from-yellow-400 to-amber-500 dark:from-yellow-600 dark:to-amber-950 border border-yellow-300 dark:border-amber-900 rounded-t-2xl h-28 flex flex-col items-center justify-center mt-2 shadow-2xl relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-pulse" />
                          <span className="text-3xl font-black text-slate-900 dark:text-yellow-100">1</span>
                          <span className="text-[10px] font-black text-slate-800 dark:text-yellow-200">{leaderboard[0].xp} XP</span>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                      <div className="flex flex-col items-center">
                        <Avatar className="h-11 w-11 border-2 border-amber-600/40 ring-2 ring-amber-600/15 rounded-xl mb-1 shadow-md">
                          <AvatarImage src={fixProfileImage(leaderboard[2].profileImage)} />
                          <AvatarFallback className="font-extrabold bg-amber-50 text-amber-800 text-sm rounded-xl">
                            {leaderboard[2].userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 max-w-[70px] truncate text-center">
                          {leaderboard[2].userName}
                        </p>
                        <div className="w-20 sm:w-24 bg-gradient-to-b from-amber-600/20 to-amber-600/40 dark:from-amber-900/30 dark:to-slate-900 border border-amber-600/30 dark:border-slate-800 rounded-t-xl h-16 flex flex-col items-center justify-center mt-2 shadow-lg">
                          <span className="text-base font-black text-amber-700 dark:text-amber-400">3</span>
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500">{leaderboard[2].xp} XP</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Leaderboard list */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-white/20 dark:border-slate-800">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Batch Ranking Leaderboard</h3>
                  </div>
                  <div className="divide-y divide-white/20 dark:divide-slate-800/40">
                    {leaderboard.map((entry, index) => {
                      const isMe = entry.studentId === user?.$id;
                      return (
                        <div
                          key={entry.studentId}
                          className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
                            isMe ? "bg-pink-500/5 dark:bg-pink-900/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 w-5">
                              #{entry.rank}
                            </span>
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarImage src={fixProfileImage(entry.profileImage)} />
                              <AvatarFallback className="font-extrabold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 rounded-lg">
                                {entry.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                {entry.userName}
                                {isMe && (
                                  <span className="text-[8px] font-extrabold bg-pink-500 text-white px-1.5 py-0.5 rounded-full uppercase">
                                    You
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold mt-0.5">
                                <span>LVL {entry.level}</span>
                                <span>•</span>
                                <span>Accuracy: {entry.accuracy}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-pink-600 dark:text-pink-400">{entry.xp} XP</p>
                            <p className="text-[9px] text-slate-400 font-bold">Streak: 🔥 {entry.currentStreak}</p>
                          </div>
                        </div>
                      );
                    })}
                    {leaderboard.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-10">No scores recorded yet in this batch.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "challenges" && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-2">Teacher Challenges</h3>
                  <p className="text-xs text-slate-500">
                    Complete challenges set by your instructor and claim bonus XP and Coins!
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {challenges.map((challenge) => {
                    const completedList = challenge.completedStudents || [];
                    const isClaimed = completedList.includes(user?.$id);

                    return (
                      <div
                        key={challenge.$id}
                        className={`p-4 rounded-3xl border transition-all ${
                          isClaimed
                            ? "bg-slate-100/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-900 opacity-70"
                            : "bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-sm"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                              {isClaimed ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                              )}
                              {challenge.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {challenge.description}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="text-[10px] font-extrabold bg-pink-500/10 text-pink-600 dark:text-pink-400 px-2.5 py-1 rounded-xl">
                                🌟 +{challenge.rewardXP} XP
                              </span>
                              <span className="text-[10px] font-extrabold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded-xl">
                                💰 +{challenge.rewardCoins} Coins
                              </span>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handleClaimChallenge(challenge.$id)}
                            disabled={isClaimed}
                            className={`w-full sm:w-auto px-5 py-4 font-bold text-xs rounded-xl shadow-sm ${
                              isClaimed
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
                                : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white cursor-pointer"
                            }`}
                          >
                            {isClaimed ? "Claimed" : "Claim Reward"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {challenges.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-10">No challenges assigned at this moment.</p>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "rewards" && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-2">Achievement Badges</h3>
                  <p className="text-xs text-slate-500">
                    Unlock medals and display them on your profile by reaching stats milestones.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.values(BADGES).map((badge) => {
                    const isUnlocked = achievements.some((a) => a.achievementId === badge.id);

                    return (
                      <div
                        key={badge.id}
                        className={`p-5 rounded-3xl border flex flex-col items-center text-center transition-all ${
                          isUnlocked
                            ? "bg-gradient-to-b from-slate-900 to-slate-950 border-pink-500/20 text-white shadow-lg"
                            : "bg-white/40 dark:bg-slate-900/40 border-white/20 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60"
                        }`}
                      >
                        <div className={`p-4 rounded-2xl mb-3 ${
                          isUnlocked ? "bg-gradient-to-br " + badge.color : "bg-slate-200 dark:bg-slate-800"
                        }`}>
                          {getBadgeIcon(badge.icon)}
                        </div>
                        <h4 className="text-xs font-black tracking-tight">{badge.title}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[130px] leading-normal font-medium">
                          {badge.description}
                        </p>
                        
                        <span className={`text-[9px] font-black tracking-wider uppercase mt-4 px-2 py-0.5 rounded-full ${
                          isUnlocked
                            ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}>
                          {isUnlocked ? "Unlocked" : "Locked"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Stats cards */}
                {isStatsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <StatCard
                        icon={TrendingUp}
                        label="Attendance"
                        value={`${overallStats?.percentage || 0}%`}
                        sub={`${overallStats?.presentDays || 0} / ${overallStats?.total || 0} days`}
                        color="bg-gradient-to-br from-emerald-500 to-green-600"
                      />
                      <StatCard
                        icon={Calendar}
                        label="Present"
                        value={overallStats?.presentDays || 0}
                        color="bg-gradient-to-br from-pink-500 to-rose-600"
                      />
                      <StatCard
                        icon={ClipboardList}
                        label="Tests"
                        value={testStats.count}
                        color="bg-gradient-to-br from-purple-500 to-indigo-600"
                      />
                      <StatCard
                        icon={Award}
                        label="Avg Score"
                        value={`${testStats.avgScore}%`}
                        color="bg-gradient-to-br from-amber-500 to-orange-600"
                      />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => navigate("/student-attendance")}
                        variant="outline"
                        className="h-14 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/40 dark:border-slate-800 hover:bg-pink-50/60 dark:hover:bg-pink-900/10 transition-all font-bold text-xs cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                        View Attendance
                      </Button>
                      <Button
                        onClick={() => navigate("/all-mock-tests")}
                        variant="outline"
                        className="h-14 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/40 dark:border-slate-800 hover:bg-purple-50/60 dark:hover:bg-purple-900/10 transition-all font-bold text-xs cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 mr-2 text-purple-500" />
                        Mock Tests
                      </Button>
                    </div>

                    {/* Recent Tests Table */}
                    {recentTests.length > 0 && (
                      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
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
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                    {test.$createdAt ? format(new Date(test.$createdAt), "dd MMM yyyy") : "—"}
                                  </p>
                                </div>
                                <span className={`text-xs font-extrabold tabular-nums ${
                                  pct >= 75 ? "text-emerald-600 dark:text-emerald-400"
                                  : pct >= 50 ? "text-amber-600 dark:text-amber-400"
                                  : "text-red-600 dark:text-red-400"
                                }`}>
                                  {pct}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === "friends" && (
              <motion.div
                key="friends"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Live Batch Members List */}
                <OnlineBatchMembers batchId={activeBatchId} currentUserId={user?.$id} />
              </motion.div>
            )}
              </AnimatePresence>
            </div>
          </div>{/* end right column */}
        </div>{/* end grid */}
      </div>

      {/* Gamified MCQ Question Dialog Modal */}
      <QuestionModal
        isOpen={isQuestionOpen}
        onClose={() => setIsQuestionOpen(false)}
        tradeId={activeBatchData?.tradeId}
        onAnswerSubmit={handleAnswerSubmit}
        stats={stats}
      />
    </div>
  );
};

const GradientBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse" />
    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse" />
  </div>
);

export default StudentDashboard;
