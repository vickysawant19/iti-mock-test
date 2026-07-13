/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Play,
  User,
  Users,
  Compass,
  Zap,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Coins,
  Star,
  Wrench,
  LayoutGrid,
  BarChart2,
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
import LuckyWheelModal from "./components/LuckyWheelModal";
import MissionsTabPanel from "./components/MissionsTabPanel";
import useStudentGame from "@/hooks/useStudentGame";
import useDailyMissions from "@/hooks/useDailyMissions";
import { BADGES } from "@/services/reward.service";
import { fixProfileImage } from "@/services/appwriteClient";
import CosmeticStoreTab from "./components/CosmeticStoreTab";
import { COSMETIC_ITEMS, cosmeticsService } from "@/services/cosmetics.service";
import StudentProfileCard from "./components/StudentProfileCard";
import OverviewTab from "./components/OverviewTab";
import AnalysisTab from "./components/AnalysisTab";
import BadgesTab from "./components/BadgesTab";
import AvatarStoreTab from "./components/AvatarStoreTab";
import LeaderboardTab from "./components/LeaderboardTab";
import BottomNavDock from "./components/BottomNavDock";
import CelebrationOverlays from "./components/CelebrationOverlays";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "game";
  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };
  const { isComplete, missingFields } = checkProfileCompletion(profile);
  
  // Modals
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [profileSubTab, setProfileSubTab] = useState("stats"); // "stats" | "store"


  const studentTabsLeft = [
    { id: "game", label: "Game World", shortLabel: "Game", icon: Gamepad2 },
    { id: "leaderboard", label: "Leaderboard", shortLabel: "Ranks", icon: Trophy },
  ];

  const studentTabsRight = [
    { id: "missions", label: "Missions", shortLabel: "Missions", icon: Star },
    { id: "profile", label: "My Profile", shortLabel: "Profile", icon: User },
  ];
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Original attendance and mock test stats
  const [overallStats, setOverallStats] = useState(null);
  const [testStats, setTestStats] = useState({ count: 0, avgScore: 0 });
  const [recentTests, setRecentTests] = useState([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [profileStats, setProfileStats] = useState({
    totalQuestions: 0,
    correctAnswers: 0,
    averageTimeStr: "—",
    monthlyXp: 0,
    strongestSubject: "N/A",
    weakestSubject: "N/A",
    accuracySeries: [],
  });

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
    spinLuckyWheel,
    canSpin,
    purchaseCosmetic,
    equipCosmetic,
  } = useStudentGame(user?.$id, activeBatchId, activeBatchData?.tradeId);

  // Daily Missions
  const {
    missions,
    isLoading: missionsLoading,
    claimingId,
    completedCount,
    claimedCount,
    totalCount: missionTotal,
    allClaimed,
    fetchMissions,
    claimMission,
    incrementProgress,
    resetProgress,
  } = useDailyMissions(user?.$id, activeBatchId);

  // Parse equipped cosmetics
  const cosmeticsState = cosmeticsService.parseCosmetics(stats);
  const equippedAvatar = cosmeticsState.equipped?.avatar;
  const equippedFrame = cosmeticsState.equipped?.frame;
  const equippedTitle = cosmeticsState.equipped?.title;
  const equippedBorder = cosmeticsState.equipped?.border;

  const customAvatarUrl = equippedAvatar
    ? COSMETIC_ITEMS.find((i) => i.id === equippedAvatar)?.value
    : null;

  // Custom modified profile and leaderboard objects to override avatar image
  const gamifiedProfile = profile ? {
    ...profile,
    profileImage: customAvatarUrl || profile.profileImage
  } : profile;

  const gamifiedLeaderboard = leaderboard.map((entry) => {
    const entryCosmetics = cosmeticsService.parseCosmetics(entry);
    const entryAvatarId = entryCosmetics.equipped?.avatar;
    const entryAvatarUrl = entryAvatarId
      ? COSMETIC_ITEMS.find((i) => i.id === entryAvatarId)?.value
      : null;
    return {
      ...entry,
      profileImage: entryAvatarUrl || entry.profileImage
    };
  });

  const borderItem = COSMETIC_ITEMS.find((item) => item.id === equippedBorder);
  const profileCardClass = borderItem 
    ? `relative overflow-hidden rounded-[24px] shadow-[0_15px_30px_rgba(0,0,0,0.3)] p-5 md:p-6 flex flex-col gap-6 w-full ${borderItem.value}`
    : "relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1b0d3a] via-[#110926] to-[#0c051e] border border-[#2d1b54] shadow-[0_15px_30px_rgba(0,0,0,0.3)] p-5 md:p-6 flex flex-col gap-6 w-full";

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
            Query.select(["score", "quesCount", "paperId", "tradeName", "$createdAt", "startTime", "endTime"]),
            Query.orderDesc("$createdAt"),
          ]),
        ]);

        setOverallStats(attStats);
        setRecentTests(tests ? tests.slice(0, 10) : []);

        if (tests?.length > 0) {
          const avg = parseFloat(
            (tests.reduce((s, t) => s + (t.quesCount > 0 ? (t.score / t.quesCount) * 100 : 0), 0) / tests.length).toFixed(1)
          );
          setTestStats({ count: tests.length, avgScore: avg });

          // Compute advanced profile statistics
          let totalQues = 0;
          let correctAns = 0;
          let totalDurationMs = 0;
          let durationCount = 0;
          let currentMonthXp = 0;
          const subjectStats = {};

          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          tests.forEach((test) => {
            totalQues += test.quesCount || 0;
            correctAns += test.score || 0;

            // Average completion time
            if (test.startTime && test.endTime) {
              const duration = new Date(test.endTime).getTime() - new Date(test.startTime).getTime();
              // Validate realistic completion time: between 1 second and 4 hours
              if (duration > 1000 && duration < 4 * 60 * 60 * 1000) {
                totalDurationMs += duration;
                durationCount++;
              }
            }

            // Monthly XP (estimate based on 10 XP per correct question this month)
            if (test.$createdAt && new Date(test.$createdAt) >= startOfMonth) {
              currentMonthXp += (test.score || 0) * 10;
            }

            // Subject performance mapping
            const subject = test.tradeName || "General";
            if (!subjectStats[subject]) {
              subjectStats[subject] = { correct: 0, total: 0 };
            }
            subjectStats[subject].correct += test.score || 0;
            subjectStats[subject].total += test.quesCount || 0;
          });

          // Strongest / Weakest Subject logic
          let strongestSub = "N/A";
          let strongestRate = -1;
          let weakestSub = "N/A";
          let weakestRate = 2; // > 100%

          Object.keys(subjectStats).forEach((sub) => {
            const subData = subjectStats[sub];
            if (subData.total > 0) {
              const rate = subData.correct / subData.total;
              if (rate > strongestRate) {
                strongestRate = rate;
                strongestSub = sub;
              }
              if (rate < weakestRate) {
                weakestRate = rate;
                weakestSub = sub;
              }
            }
          });

          const avgTimeSeconds = durationCount > 0 ? Math.round((totalDurationMs / durationCount) / 1000) : 0;
          const formatTime = (secs) => {
            if (secs <= 0) return "—";
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            return m > 0 ? `${m}m ${s}s` : `${s}s`;
          };

          // Accuracy chart series of the last 10 tests (sorted oldest to newest)
          const last10Tests = [...tests].slice(0, 10).reverse();
          const accuracySeries = last10Tests.map((t) =>
            t.quesCount > 0 ? Math.round((t.score / t.quesCount) * 100) : 0
          );

          setProfileStats({
            totalQuestions: totalQues,
            correctAnswers: correctAns,
            averageTimeStr: formatTime(avgTimeSeconds),
            monthlyXp: currentMonthXp,
            strongestSubject: strongestSub,
            weakestSubject: weakestSub,
            accuracySeries,
          });
        }
      } catch (err) {
        console.error("[StudentDashboard] Error:", err);
      } finally {
        setIsStatsLoading(false);
      }
    };
    fetchStats();
  }, [activeBatchId, user?.$id]);

  // Fire login mission once per session when user is ready
  useEffect(() => {
    if (user?.$id && activeBatchId) {
      incrementProgress("login", 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.$id, activeBatchId]);

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

    // Update daily mission progress (fire-and-forget, non-blocking)
    try {
      // Every answered question counts
      incrementProgress("questions", 1);
      // XP earned counts toward xp missions
      const xpGained = result?.xpGained || 0;
      if (xpGained > 0) incrementProgress("xp", xpGained);
      // Correct answers
      if (isCorrect) {
        incrementProgress("correct_answers", 1);
        // Streak missions
        incrementProgress("correct_streak", 1);
      } else {
        // Reset streak missions if answered incorrectly
        resetProgress("correct_streak");
      }
    } catch (missionErr) {
      console.warn("[Mission] progress update failed:", missionErr);
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

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden pb-20 md:pb-24">
      <GradientBackground />

      {/* Level Up & Badge Celebration Overlays */}
      <CelebrationOverlays
        showLevelUp={showLevelUp}
        setShowLevelUp={setShowLevelUp}
        stats={stats}
        unlockedBadges={unlockedBadges}
      />

      <div className={`relative z-10 ${
        activeTab === "game"
          ? "w-full h-[calc(100dvh-64px)] overflow-hidden"
          : "max-w-7xl mx-auto px-3 sm:px-6 pb-0 pt-3"
      }`}>
        {activeTab === "game" ? (
          <GameWorld
            user={user}
            stats={stats}
            profile={gamifiedProfile}
            leaderboard={gamifiedLeaderboard}
            batchContext={batchContext}
            activeSettings={activeSettings}
            onAttemptQuestion={() => setIsQuestionOpen(true)}
            canSpin={canSpin}
            setIsWheelOpen={setIsWheelOpen}
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
              <StudentProfileCard
                profile={gamifiedProfile}
                batchContext={batchContext}
                stats={stats}
                equippedFrame={equippedFrame}
                equippedTitle={equippedTitle}
                equippedBorder={equippedBorder}
                rankText={rankText}
                onEarnCoins={() => setIsQuestionOpen(true)}
                onLuckySpin={() => setIsWheelOpen(true)}
              />
            )}
            {/* Tab content */}
            <div className="space-y-4 ">
              <AnimatePresence mode="wait">
                {activeTab === "leaderboard" && (
                  <LeaderboardTab
                    gamifiedLeaderboard={gamifiedLeaderboard}
                    user={user}
                  />
                )}

                {activeTab === "missions" && (
                  <motion.div
                    key="missions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Internal sub-tab pill switcher */}
                    <MissionsTabPanel
                      missions={missions}
                      missionsLoading={missionsLoading}
                      claimingId={claimingId}
                      completedCount={completedCount}
                      claimedCount={claimedCount}
                      missionTotal={missionTotal}
                      allClaimed={allClaimed}
                      claimMission={claimMission}
                      fetchMissions={fetchMissions}
                      challenges={challenges}
                      userId={user?.$id}
                      onClaimChallenge={handleClaimChallenge}
                    />
                  </motion.div>
                )}

                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Profile Sub-tabs Switcher */}
                    <div className="flex items-center gap-4 sm:gap-6 md:gap-8 border-b border-slate-200 dark:border-[#221a48] pb-0 relative z-10 select-none w-full">
                      {[
                        { id: "stats", label: "Overview", icon: LayoutGrid },
                        { id: "analysis", label: "Analysis", icon: BarChart2 },
                        { id: "badges", label: "Badges", icon: Trophy },
                        { id: "store", label: "Avatar Store", icon: Gamepad2 }
                      ].map((tab) => {
                        const isActive = profileSubTab === tab.id;
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setProfileSubTab(tab.id)}
                            className={`relative flex items-center gap-2 py-3 px-1 cursor-pointer transition-all duration-200 text-xs sm:text-sm font-bold whitespace-nowrap ${
                              isActive
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? "text-pink-500" : "text-slate-400"}`} />
                            <span>{tab.label}</span>
                            {isActive && (
                              <motion.div
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Subtab Contents */}
                    {isStatsLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                      </div>
                    ) : profileSubTab === "stats" ? (
                      <OverviewTab
                        overallStats={overallStats}
                        testStats={testStats}
                        profileStats={profileStats}
                        stats={stats}
                        navigate={navigate}
                      />
                    ) : profileSubTab === "analysis" ? (
                      <AnalysisTab
                        profileStats={profileStats}
                        achievements={achievements}
                        recentTests={recentTests}
                      />
                    ) : profileSubTab === "badges" ? (
                      <BadgesTab
                        achievements={achievements}
                        batchContext={batchContext}
                        activeSettings={activeSettings}
                      />
                    ) : (
                      <AvatarStoreTab
                        stats={stats}
                        purchaseCosmetic={purchaseCosmetic}
                        equipCosmetic={equipCosmetic}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>{/* end layout container */}

      {/* Bottom Navigation Dock */}
      <BottomNavDock
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentTabsLeft={studentTabsLeft}
        studentTabsRight={studentTabsRight}
        completedCount={completedCount}
        claimedCount={claimedCount}
        setIsQuestionOpen={setIsQuestionOpen}
      />

      {/* Gamified MCQ Question Dialog Modal */}
      <QuestionModal
        isOpen={isQuestionOpen}
        onClose={() => setIsQuestionOpen(false)}
        tradeId={activeBatchData?.tradeId || batchContext?.tradeId || stats?.tradeId}
        batchId={activeBatchId || batchContext?.batchId || stats?.batchId}
        activeSettings={activeSettings}
        onAnswerSubmit={handleAnswerSubmit}
        stats={stats}
      />

      {/* Daily Lucky Spin Modal */}
      <LuckyWheelModal
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
        canSpin={canSpin}
        spinLuckyWheel={spinLuckyWheel}
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
