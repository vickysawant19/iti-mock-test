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
  User,
  Users,
  Compass,
  Zap,
  ChevronRight,
  Sparkles,
  Coins,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Query } from "appwrite";
import { checkProfileCompletion } from "@/utils/profileCompletion";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import mockTestService from "@/services/mocktest.service";
import OnlineBatchMembers from "@/components/components/OnlineBatchMembers";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import GameWorld from "./components/gameworld/GameWorld";
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
  
  // Tabs: game, leaderboard, challenges, profile
  const [activeTab, setActiveTab] = useState("game");
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);

  const studentTabsLeft = [
    { id: "game", label: "Game World", shortLabel: "Game", icon: Gamepad2 },
    { id: "leaderboard", label: "Leaderboard", shortLabel: "Ranks", icon: Trophy },
  ];

  const studentTabsRight = [
    { id: "challenges", label: "Challenges", shortLabel: "Challenges", icon: Target },
    { id: "profile", label: "My Profile", shortLabel: "Profile", icon: User },
  ];
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
    activeSettings,
    submitAnswer,
    claimChallengeReward,
    unlockedBadges,
    clearUnlockedBadges,
  } = useStudentGame(user?.$id, activeBatchId, activeBatchData?.tradeId);

  // Gamer League Calculations (Emoji-Free SVGs)
  const getLeague = (wins) => {
    if (wins < 5) return { name: "Bronze League", color: "text-amber-400 border-amber-500/20 bg-amber-500/5", iconColor: "text-amber-400" };
    if (wins < 15) return { name: "Silver League", color: "text-slate-200 border-slate-350/20 bg-slate-350/5", iconColor: "text-slate-200" };
    if (wins < 30) return { name: "Gold League", color: "text-yellow-350 border-yellow-450/20 bg-yellow-450/5", iconColor: "text-yellow-350" };
    return { name: "Diamond League", color: "text-cyan-300 border-cyan-400/20 bg-cyan-400/5", iconColor: "text-cyan-300" };
  };
  const league = getLeague(stats?.wins || 0);

  // Dynamic Leaderboard Rank Standing
  const currentRank = leaderboard.findIndex((s) => s.studentId === user?.$id) + 1;
  const rankText = currentRank > 0 ? `#${currentRank}` : "Unranked";

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

  // Reset scroll position to top on tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

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

  // Handle lock-scroll for the game tab to make it a self-contained screen
  useEffect(() => {
    if (activeTab === "game") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeTab]);

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
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden pb-20 md:pb-24">
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

      <div className={`relative z-10 ${
        activeTab === "game"
          ? "w-full h-[calc(100dvh-64px)] overflow-hidden"
          : "max-w-7xl mx-auto px-3 sm:px-6 pb-0 pt-3"
      }`}>
        {activeTab === "game" ? (
          <GameWorld
            user={user}
            stats={stats}
            profile={profile}
            leaderboard={leaderboard}
            batchContext={batchContext}
            onAttemptQuestion={() => setIsQuestionOpen(true)}
          />
        ) : (
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

            {/* Premium Gamer Profile Card (Compact Landscape Mode) */}
            {activeTab === "profile" && (
              <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#23174B] via-[#2D2165] to-[#3B2F86] border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.3)] p-4 flex flex-col lg:flex-row items-center justify-between gap-4 w-full">
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
              `}</style>

              {/* Decorative Glows */}
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full bg-[#FF2EA6]/10 blur-[60px] pointer-events-none" />
              <div className="absolute bottom-[-20%] left-[5%] w-32 h-32 rounded-full bg-[#A020F0]/10 blur-[50px] pointer-events-none" />

              {/* Panel 1: Avatar & Core Info */}
              <div className="flex items-center gap-3.5 w-full lg:w-auto relative z-10">
                {/* Left: Player Avatar */}
                <div className="relative shrink-0 animate-breath">
                  <div className="absolute inset-0 bg-[#4D8CFF]/25 rounded-[16px] blur-sm pointer-events-none" />
                  <Avatar className="h-[56px] w-[56px] border-2 border-white rounded-[16px] shadow-[0_0_10px_rgba(255,46,166,0.35)] relative z-10">
                    <AvatarImage src={fixProfileImage(profile?.profileImage)} />
                    <AvatarFallback className="text-xl font-black bg-gradient-to-br from-[#FF2EA6] to-[#A020F0] text-white rounded-[16px]">
                      {profile?.userName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Info Text Stack */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase leading-tight font-poppins truncate">
                    {profile?.userName || "RAKESH RAMA TARI"}
                  </h2>
                  <div className="flex flex-wrap gap-1.5 items-center mt-1">
                    {batchContext.batchName && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-white/10 dark:bg-white/5 border border-white/10 rounded-full text-[10px] font-medium text-white shadow-sm">
                        <GraduationCap className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{batchContext.batchName}</span>
                      </div>
                    )}
                    {batchContext.tradeName && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-white/10 dark:bg-white/5 border border-white/10 rounded-full text-[10px] font-medium text-white shadow-sm">
                        <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate max-w-[125px]">{batchContext.tradeName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel 2: Level Shield & XP Bar */}
              {stats && (
                <div className="flex items-center gap-3 bg-slate-900/40 border border-white/5 px-3 py-2 rounded-[20px] relative z-10 w-full lg:max-w-xs xl:max-w-md flex-1">
                  <div className="animate-float relative shrink-0">
                    <div className="absolute inset-0 bg-[#FF2EA6]/15 rounded-full blur-sm pointer-events-none" />
                    <div className="w-12 h-12">
                      <LevelShield level={stats.level} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-300">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-pink-500 shrink-0" />
                        XP Progress
                      </span>
                      <span className="text-pink-400 font-extrabold">{stats.xp % 100} / 100 XP</span>
                    </div>
                    
                    {/* Glowing XP Progress Bar */}
                    <div className="w-full bg-slate-950/60 rounded-full h-2 mt-1 relative p-[1px] overflow-hidden border border-slate-800/80">
                      <div 
                        className="bg-gradient-to-r from-[#FF2EA6] via-[#A020F0] to-[#4D8CFF] h-full rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_8px_rgba(255,46,166,0.5)]" 
                        style={{ width: `${(stats.xp % 100)}%` }}
                      >
                        {/* Shimmer light effect */}
                        <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/60 blur-[1px] rounded-full animate-pulse" />
                      </div>
                    </div>
                    
                    <span className="text-[8px] text-slate-400 font-bold mt-0.5 text-right block">
                      Level up in {100 - (stats.xp % 100)} XP
                    </span>
                  </div>
                </div>
              )}

              {/* Panel 3: Economy (Coins) & Achievements */}
              <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto relative z-10 shrink-0">
                {/* Gold Coins card with sliding shine */}
                <div className="relative group overflow-hidden bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-2xl flex items-center gap-2.5 shadow-lg min-w-[120px] h-[48px] shrink-0">
                  <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-gamer-shine pointer-events-none" />
                  
                  <Coins className="w-4.5 h-4.5 text-yellow-400 animate-gamer-bounce shrink-0" />
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">Coins</span>
                    <span className="text-xs font-black text-white mt-0.5 leading-none">
                      {stats?.coins || 0}
                    </span>
                  </div>
                  
                  {/* Circular "+" button */}
                  <button 
                    onClick={() => setIsQuestionOpen(true)}
                    className="w-5 h-5 rounded-full bg-[#F6C453] hover:bg-[#FFE07D] text-[#23174B] flex items-center justify-center font-black text-xs shadow-[0_2px_6px_rgba(246,196,83,0.3)] transition-all active:scale-90 cursor-pointer shrink-0 ml-auto"
                    title="Earn Coins"
                  >
                    +
                  </button>
                </div>

                {/* League, Rank & Achievements badges */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${league.color}`}>
                    <Award className={`w-3 h-3 ${league.iconColor} shrink-0`} />
                    <span className="hidden sm:inline">{league.name}</span>
                  </span>
                  
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border border-slate-700/50 bg-slate-800/40 text-slate-300 uppercase tracking-wider">
                    <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />
                    <span>Rank {rankText}</span>
                  </span>

                  {/* Mini achievements */}
                  <div className="flex gap-1 items-center shrink-0">
                    {stats?.badges && stats.badges.length > 0 ? (
                      stats.badges.slice(0, 2).map((badgeId, idx) => {
                        const badgeDetails = BADGES[badgeId] || { name: "Badge", icon: "🏅" };
                        return (
                          <div
                            key={idx}
                            className="w-5.5 h-5.5 flex items-center justify-center rounded-lg bg-white/10 border border-white/10 text-xs shadow-inner hover:scale-110 active:scale-95 transition-all cursor-help"
                            title={badgeDetails.name}
                          >
                            {badgeDetails.icon}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">No Badges</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Tab content */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
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
                            <InteractiveAvatar
                              src={leaderboard[1].profileImage}
                              fallbackText={leaderboard[1].userName.charAt(0)}
                              userId={leaderboard[1].studentId}
                              userName={leaderboard[1].userName}
                              showStatus={true}
                              statusSize="xs"
                              className="h-12 w-12 border-2 border-slate-300 ring-2 ring-slate-400/20 rounded-xl mb-1 shadow-md"
                            />
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
                              <InteractiveAvatar
                                src={leaderboard[0].profileImage}
                                fallbackText={leaderboard[0].userName.charAt(0)}
                                userId={leaderboard[0].studentId}
                                userName={leaderboard[0].userName}
                                showStatus={true}
                                statusSize="xs"
                                className="h-16 w-16 border-2 border-yellow-400 ring-4 ring-yellow-400/20 rounded-2xl mb-1 shadow-xl"
                              />
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
                            <InteractiveAvatar
                              src={leaderboard[2].profileImage}
                              fallbackText={leaderboard[2].userName.charAt(0)}
                              userId={leaderboard[2].studentId}
                              userName={leaderboard[2].userName}
                              showStatus={true}
                              statusSize="xs"
                              className="h-11 w-11 border-2 border-amber-600/40 ring-2 ring-amber-600/15 rounded-xl mb-1 shadow-md"
                            />
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
                                <InteractiveAvatar
                                  src={entry.profileImage}
                                  fallbackText={entry.userName.charAt(0)}
                                  userId={entry.studentId}
                                  userName={entry.userName}
                                  showStatus={true}
                                  statusSize="xs"
                                  className="h-8 w-8 rounded-lg"
                                />
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

                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
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

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

                          {/* Achievement Badges Section */}
                          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5 h-fit">
                            <div className="mb-4">
                              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-pink-500" />
                                Achievement Badges
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Milestone medals unlocked during training.
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {Object.values(BADGES).map((badge) => {
                                const isUnlocked = achievements.some((a) => a.achievementId === badge.id);

                                return (
                                  <div
                                    key={badge.id}
                                    className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all ${
                                      isUnlocked
                                        ? "bg-gradient-to-b from-slate-900 to-slate-950 border-pink-500/20 text-white shadow-md"
                                        : "bg-white/40 dark:bg-slate-900/40 border-white/20 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60"
                                    }`}
                                  >
                                    <div className={`p-2 rounded-xl mb-2 ${
                                      isUnlocked ? "bg-gradient-to-br " + badge.color : "bg-slate-200 dark:bg-slate-800"
                                    }`}>
                                      {getBadgeIcon(badge.icon)}
                                    </div>
                                    <h4 className="text-[10px] font-black tracking-tight leading-tight">{badge.title}</h4>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[120px] leading-normal font-medium">
                                      {badge.description}
                                    </p>
                                    
                                    <span className={`text-[8px] font-black tracking-wider uppercase mt-2 px-1.5 py-0.5 rounded-full ${
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
                          </div>
                          
                          {/* Active Game Settings Rules Card */}
                          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-5 h-fit lg:col-span-2">
                            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                              <div className="p-2 bg-pink-500/10 rounded-xl">
                                <Gamepad2 className="w-5 h-5 text-pink-500" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-slate-850 dark:text-white tracking-tight">Active Batch Game Settings</h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Configured by Batch Instructor for {batchContext?.batchName || "your batch"}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
                              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Question Filter Scope</span>
                                <span className="text-xs font-bold text-slate-880 dark:text-white mt-1 uppercase">
                                  {activeSettings?.questionFilter === "first_year" ? "First Year Only"
                                   : activeSettings?.questionFilter === "second_year" ? "Second Year Only"
                                   : activeSettings?.questionFilter === "module" ? `Module: ${activeSettings?.selectedModuleName || activeSettings?.selectedModuleId || "Specific Module"}`
                                   : "All Subject Questions"}
                                </span>
                              </div>
                              
                              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Correct Answer Clear Payout</span>
                                <span className="text-xs font-bold text-slate-850 dark:text-white mt-1">
                                  ⭐ +{activeSettings?.correctAnswerXp !== undefined ? activeSettings.correctAnswerXp : 10} XP
                                  {" | "}
                                  🪙 +{activeSettings?.correctAnswerCoins !== undefined ? activeSettings.correctAnswerCoins : 5} Coins
                                </span>
                              </div>
                              
                              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Streak Bonus</span>
                                <span className="text-xs font-bold text-slate-850 dark:text-white mt-1">
                                  🔥 +{activeSettings?.streakXpBonus !== undefined ? activeSettings.streakXpBonus : 2} XP per consecutive day
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>{/* end layout container */}

      {/* Bottom Navigation Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 dark:bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-lg shadow-[0_-8px_30px_rgba(0,0,0,0.3)] px-3 py-1.5 pb-safe md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl md:rounded-2xl md:border md:border-slate-800/80">
        <div className="flex items-center justify-between max-w-md mx-auto relative h-11">
          {/* Left Tabs */}
          <div className="flex flex-1 justify-around items-center">
            {studentTabsLeft.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center relative py-0.5 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive ? "text-pink-500 scale-105 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-pink-500 animate-pulse" : "text-slate-500"}`} />
                  <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight hidden md:block">{tab.label}</span>
                  <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight block md:hidden max-w-[50px] truncate">{tab.shortLabel}</span>
                  {isActive && (
                    <motion.div
                      layoutId="studentBottomTabDot"
                      className="w-1 h-1 bg-pink-500 rounded-full mt-0.5 absolute -bottom-1"
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Center Play Game Button */}
          <div className="relative flex justify-center items-center px-4">
            <div className="absolute -top-6">
              <button
                onClick={() => {
                  setIsQuestionOpen(true);
                  if (activeTab !== "game") {
                    setActiveTab("game");
                  }
                }}
                className="w-12 h-12 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-pink-500/40 border-4 border-slate-900 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Play Mocktest Game"
              >
                <Flame className="w-6 h-6 text-white fill-white/10 group-hover:scale-110 transition-transform duration-200 animate-pulse" />
              </button>
            </div>
            {/* Invisible placeholder to keep space for the floating center button */}
            <div className="w-12 h-12" />
          </div>

          {/* Right Tabs */}
          <div className="flex flex-1 justify-around items-center">
            {studentTabsRight.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center relative py-0.5 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive ? "text-pink-500 scale-105 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-pink-500 animate-pulse" : "text-slate-500"}`} />
                  <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight hidden md:block">{tab.label}</span>
                  <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight block md:hidden max-w-[50px] truncate">{tab.shortLabel}</span>
                  {isActive && (
                    <motion.div
                      layoutId="studentBottomTabDot"
                      className="w-1 h-1 bg-pink-500 rounded-full mt-0.5 absolute -bottom-1"
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gamified MCQ Question Dialog Modal */}
      <QuestionModal
        isOpen={isQuestionOpen}
        onClose={() => setIsQuestionOpen(false)}
        tradeId={activeBatchData?.tradeId}
        batchId={activeBatchId || batchContext?.batchId || stats?.batchId}
        activeSettings={activeSettings}
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

const LevelShield = ({ level }) => (
  <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 select-none">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
      <defs>
        {/* Gold Wings Gradient */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE58F" />
          <stop offset="50%" stopColor="#F6C453" />
          <stop offset="100%" stopColor="#D48806" />
        </linearGradient>
        {/* Purple Crystal Gradient */}
        <radialGradient id="purpleShieldGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E0A7FF" />
          <stop offset="70%" stopColor="#A020F0" />
          <stop offset="100%" stopColor="#5B0E91" />
        </radialGradient>
        {/* Gloss Highlight Gradient */}
        <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
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
        stroke="url(#goldGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Gold Wings (Right) */}
      <path
        d="M 72 35 C 90 25, 96 48, 82 58 C 92 52, 94 62, 80 64 C 90 62, 88 72, 74 68"
        fill="none"
        stroke="url(#goldGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Purple Shield Base */}
      <path
        d="M 32 24 L 68 24 Q 74 24 72 38 L 64 74 Q 50 88 50 88 Q 50 88 36 74 L 28 38 Q 26 24 32 24 Z"
        fill="url(#purpleShieldGrad)"
        stroke="url(#goldGrad)"
        strokeWidth="3.5"
      />

      {/* Glossy Highlight Overlay */}
      <path
        d="M 32 24 L 68 24 Q 74 24 72 38 L 50 50 L 28 38 Q 26 24 32 24 Z"
        fill="url(#glossGrad)"
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

export default StudentDashboard;
