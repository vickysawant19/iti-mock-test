/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useCallback } from "react";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  RefreshCw,
  Building,
  AlertCircle,
  Trophy,
  Target,
  Award,
  Sparkles,
  Zap,
  PlusCircle,
  Users,
  CheckCircle,
  Settings,
  ChevronDown,
  Coins,
  Flame,
  Calendar,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fixProfileImage } from "@/services/appwriteClient";
import { checkProfileCompletion } from "@/utils/profileCompletion";
import BatchOverviewCard from "./components/teacher/BatchOverviewCard";
import TeacherAttendanceTab from "./components/teacher/TeacherAttendanceTab";
import TeacherLeaderboardTab from "./components/teacher/TeacherLeaderboardTab";
import TeacherChallengesTab from "./components/teacher/TeacherChallengesTab";
import TeacherPrizesTab from "./components/teacher/TeacherPrizesTab";
import TeacherSettingsTab from "./components/teacher/TeacherSettingsTab";
import OnlineBatchMembers from "@/components/components/OnlineBatchMembers";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { challengeService, CHALLENGE_TEMPLATES } from "@/services/challenge.service";
import { gameService } from "@/services/game.service";
import { leaderboardService } from "@/services/leaderboard.service";
import { BADGES } from "@/services/reward.service";
import { ID } from "appwrite";

const TeacherGameArena = ({
  profile,
  batchContext,
  batchOverview,
  studentRows,
  attendanceTrend,
  selectedMonth,
  setSelectedMonth,
  userBatches,
  isLoading,
  error,
  refetch,
}) => {
  const navigate = useNavigate();
  const { isComplete, missingFields } = checkProfileCompletion(profile);

  // Tab: attendance, gamification or settings
  const [activeTab, setActiveTab] = useState("attendance");

  // Game Settings Tab States
  const [questionFilter, setQuestionFilter] = useState("all");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [correctAnswerXp, setCorrectAnswerXp] = useState(10);
  const [correctAnswerCoins, setCorrectAnswerCoins] = useState(5);
  const [streakXpBonus, setStreakXpBonus] = useState(2);
  const [modulesList, setModulesList] = useState([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Gamification state
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingGame, setLoadingGame] = useState(false);

  // Form states
  const [selectedTemplateId, setSelectedTemplateId] = useState("answer_10_questions");
  const [challengeType, setChallengeType] = useState("questions");
  const [challengeTarget, setChallengeTarget] = useState(10);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeXP, setChallengeXP] = useState(100);
  const [challengeCoins, setChallengeCoins] = useState(50);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // Automatically populate fields when template changes
  useEffect(() => {
    if (!selectedTemplateId) return;
    const tpl = CHALLENGE_TEMPLATES.find((t) => t.templateId === selectedTemplateId);
    if (tpl) {
      setChallengeTitle(tpl.title);
      setChallengeDesc(tpl.description);
      setChallengeXP(tpl.defaultXP);
      setChallengeCoins(tpl.defaultCoins);
      setChallengeType(tpl.type);
      setChallengeTarget(tpl.target);
    }
  }, [selectedTemplateId]);

  // Prize dispatcher state
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [bonusXP, setBonusXP] = useState(50);
  const [bonusCoins, setBonusCoins] = useState(20);
  const [prizeType, setPrizeType] = useState("bonus"); // 'badge' or 'bonus'
  const [isDispatchingPrize, setIsDispatchingPrize] = useState(false);

  // Fetch teacher-specific gamification stats
  const fetchGamificationData = useCallback(async () => {
    if (!batchContext?.batchId) return;
    setLoadingGame(true);
    try {
      const [challengesList, leaderboardList] = await Promise.all([
        challengeService.listChallenges(batchContext.batchId),
        leaderboardService.getBatchLeaderboard(batchContext.batchId),
      ]);
      setChallenges(challengesList);
      setLeaderboard(leaderboardList);
    } catch (err) {
      console.error("[TeacherDashboard] Error fetching gamification:", err);
    } finally {
      setLoadingGame(false);
    }
  }, [batchContext?.batchId]);

  useEffect(() => {
    if (
      batchContext?.batchId &&
      (activeTab === "leaderboard" ||
        activeTab === "challenges" ||
        activeTab === "prizes")
    ) {
      fetchGamificationData();
    }
  }, [batchContext?.batchId, activeTab, fetchGamificationData]);

  // Reset scroll position to top on tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Fetch batch game settings and modules
  const fetchSettingsData = useCallback(async () => {
    if (!batchContext?.batchId) return;
    setIsLoadingSettings(true);
    try {
      const [settings, mods] = await Promise.all([
        gameService.getBatchGameSettings(batchContext.batchId),
        gameService.getModulesForTrade(batchContext.tradeId || "").catch(() => []),
      ]);
      if (settings) {
        setQuestionFilter(settings.questionFilter || "all");
        setSelectedModuleId(settings.selectedModuleId || "");
        setCorrectAnswerXp(settings.correctAnswerXp !== undefined ? settings.correctAnswerXp : 10);
        setCorrectAnswerCoins(settings.correctAnswerCoins !== undefined ? settings.correctAnswerCoins : 5);
        setStreakXpBonus(settings.streakXpBonus !== undefined ? settings.streakXpBonus : 2);
      }
      setModulesList(mods || []);
    } catch (err) {
      console.error("[TeacherDashboard] Error loading settings:", err);
    } finally {
      setIsLoadingSettings(false);
    }
  }, [batchContext?.batchId, batchContext?.tradeId]);

  useEffect(() => {
    if (batchContext?.batchId && activeTab === "settings") {
      fetchSettingsData();
    }
  }, [batchContext?.batchId, activeTab, fetchSettingsData]);

  // Save batch game settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!batchContext?.batchId) return;
    setIsSavingSettings(true);
    try {
      let selectedNames = "";
      if (questionFilter === "module" && selectedModuleId) {
        const modsPart = selectedModuleId.includes("|") ? selectedModuleId.split("|")[0] : selectedModuleId;
        const modsListIds = modsPart.split(",").map(id => id.trim()).filter(Boolean);
        const matchedMods = modulesList.filter(m => modsListIds.includes(m.moduleId));
        selectedNames = matchedMods.map(m => m.moduleName).join(", ");
      }

      const payload = {
        batchId: batchContext.batchId,
        questionFilter,
        selectedModuleId: selectedModuleId || "",
        selectedModuleName: selectedNames,
        correctAnswerXp: Number(correctAnswerXp),
        correctAnswerCoins: Number(correctAnswerCoins),
        streakXpBonus: Number(streakXpBonus),
      };
      await gameService.saveBatchGameSettings(batchContext.batchId, payload);
      alert("Game Settings saved successfully!");
    } catch (err) {
      console.error("[TeacherDashboard] Error saving settings:", err);
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Create new challenge
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!challengeTitle || !challengeDesc || !batchContext?.batchId) return;
    
    setIsCreatingChallenge(true);
    try {
      await challengeService.createChallenge({
        teacherId: profile?.userId || "teacher",
        batchId: batchContext.batchId,
        title: challengeTitle,
        description: challengeDesc,
        rewardXP: Number(challengeXP),
        rewardCoins: Number(challengeCoins),
        type: challengeType,
        target: Number(challengeTarget),
      });

      setSelectedTemplateId("answer_10_questions");
      setChallengeTitle("");
      setChallengeDesc("");
      setChallengeXP(100);
      setChallengeCoins(50);
      
      // Refresh list
      await fetchGamificationData();
      alert("Challenge launched successfully! Students can now see it on their dashboard.");
    } catch (err) {
      console.error(err);
      alert("Failed to create challenge: " + err.message);
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  // Dispatch bonus/badge prize
  const handleDispatchPrize = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !batchContext?.batchId) {
      alert("Please select a student");
      return;
    }

    setIsDispatchingPrize(true);
    try {
      const studentName = studentRows.find(s => s.studentId === selectedStudent)?.userName || "Student";
      
      if (prizeType === "badge") {
        if (!selectedBadge) {
          alert("Please select a badge");
          setIsDispatchingPrize(false);
          return;
        }
        
        // Add achievement directly
        const { rewardService } = await import("@/services/reward.service");
        await rewardService.createRow({
          studentId: selectedStudent,
          achievementId: selectedBadge,
          unlockedAt: new Date().toISOString(),
          batchId: batchContext.batchId,
        }, undefined, ID.unique());
        
        alert(`Successfully awarded ${BADGES[selectedBadge]?.title} Badge to ${studentName}!`);
      } else {
        // Award XP and Coins
        await gameService.awardBonus(
          selectedStudent,
          batchContext.batchId,
          "theory", // Fallback trade label
          Number(bonusXP),
          Number(bonusCoins)
        );
        alert(`Successfully awarded +${bonusXP} XP and +${bonusCoins} Coins to ${studentName}!`);
      }

      setSelectedStudent("");
      setSelectedBadge("");
      setBonusXP(50);
      setBonusCoins(20);
      
      // Refresh leaderboard list
      await fetchGamificationData();
    } catch (err) {
      console.error(err);
      alert("Failed to dispatch prize: " + err.message);
    } finally {
      setIsDispatchingPrize(false);
    }
  };

  // No batch state
  if (!batchContext?.batchId && !isLoading) {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <GradientBackground />
        <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 pb-20 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-8 text-center max-w-md">
            <div className="p-4 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl inline-block mb-4">
              <Building className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Create Your First Batch</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Set up a batch to start managing students and track their progress.
            </p>
            <Button
              onClick={() => navigate("/manage-batch/create")}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-md shadow-pink-500/20 transition-all hover:-translate-y-0.5"
            >
              Create Batch →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate quick metrics for gamified dashboard
  const totalBatchXP = leaderboard.reduce((acc, curr) => acc + (curr.xp || 0), 0);
  const avgAccuracy = leaderboard.length > 0
    ? parseFloat((leaderboard.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / leaderboard.length).toFixed(1))
    : 0;
  const avgLevel = leaderboard.length > 0
    ? parseFloat((leaderboard.reduce((acc, curr) => acc + (curr.level || 1), 0) / leaderboard.length).toFixed(1))
    : 1;

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden pb-20 md:pb-24">
      <GradientBackground />
      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 space-y-5 pb-0">
        
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

        {/* Batch Overview Hero */}
        <BatchOverviewCard batchContext={batchContext} batchOverview={batchOverview} />

        {/* Live Class Lobby - Expandable Inline Panel */}
        <ClassLobbyCard batchContext={batchContext} profile={profile} />

        {/* Bottom Navigation Dock replaces old tabs on mobile and desktop */}

        <AnimatePresence mode="wait">
          {activeTab === "attendance" && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Controls Bar */}
              <div className="flex flex-row items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-widest">Month</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 backdrop-blur-sm pointer-events-none select-none text-slate-800 dark:text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {(() => {
                          if (!selectedMonth) return "";
                          const [year, month] = selectedMonth.split("-");
                          const date = new Date(year, parseInt(month) - 1, 1);
                          return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                        })()}
                      </span>
                      <ChevronDown className="w-3 h-3 text-slate-400 ml-1 shrink-0" />
                    </div>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refetch}
                  disabled={isLoading}
                  className="text-xs font-bold text-slate-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              ) : error ? (
                <div className="bg-red-50/60 dark:bg-red-900/20 backdrop-blur-xl border border-red-200/50 dark:border-red-800 rounded-3xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              ) : (
                <TeacherAttendanceTab
                  studentRows={studentRows}
                  selectedMonth={selectedMonth}
                  attendanceTrend={attendanceTrend}
                />
              )}
            </motion.div>
          )}

          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <TeacherLeaderboardTab
                loadingGame={loadingGame}
                totalBatchXP={totalBatchXP}
                avgAccuracy={avgAccuracy}
                avgLevel={avgLevel}
                leaderboard={leaderboard}
                expandedStudentId={expandedStudentId}
                setExpandedStudentId={setExpandedStudentId}
                studentRows={studentRows}
              />
            </motion.div>
          )}
          {activeTab === "challenges" && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <TeacherChallengesTab
                loadingGame={loadingGame}
                selectedTemplateId={selectedTemplateId}
                setSelectedTemplateId={setSelectedTemplateId}
                challengeTitle={challengeTitle}
                setChallengeTitle={setChallengeTitle}
                challengeDesc={challengeDesc}
                setChallengeDesc={setChallengeDesc}
                challengeType={challengeType}
                setChallengeType={setChallengeType}
                challengeTarget={challengeTarget}
                setChallengeTarget={setChallengeTarget}
                challengeXP={challengeXP}
                setChallengeXP={setChallengeXP}
                challengeCoins={challengeCoins}
                setChallengeCoins={setChallengeCoins}
                isCreatingChallenge={isCreatingChallenge}
                handleCreateChallenge={handleCreateChallenge}
                challenges={challenges}
                studentRows={studentRows}
              />
            </motion.div>
          )}

          {activeTab === "prizes" && (
            <motion.div
              key="prizes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <TeacherPrizesTab
                loadingGame={loadingGame}
                selectedStudent={selectedStudent}
                setSelectedStudent={setSelectedStudent}
                prizeType={prizeType}
                setPrizeType={setPrizeType}
                selectedBadge={selectedBadge}
                setSelectedBadge={setSelectedBadge}
                bonusXP={bonusXP}
                setBonusXP={setBonusXP}
                bonusCoins={bonusCoins}
                setBonusCoins={setBonusCoins}
                isDispatchingPrize={isDispatchingPrize}
                handleDispatchPrize={handleDispatchPrize}
                studentRows={studentRows}
              />
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <TeacherSettingsTab
                isLoadingSettings={isLoadingSettings}
                questionFilter={questionFilter}
                setQuestionFilter={setQuestionFilter}
                selectedModuleId={selectedModuleId}
                setSelectedModuleId={setSelectedModuleId}
                modulesList={modulesList}
                correctAnswerXp={correctAnswerXp}
                setCorrectAnswerXp={setCorrectAnswerXp}
                correctAnswerCoins={correctAnswerCoins}
                setCorrectAnswerCoins={setCorrectAnswerCoins}
                streakXpBonus={streakXpBonus}
                setStreakXpBonus={setStreakXpBonus}
                isSavingSettings={isSavingSettings}
                handleSaveSettings={handleSaveSettings}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-lg shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)] px-3 py-1.5 pb-safe md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl md:rounded-2xl md:border md:border-slate-200/80 dark:md:border-slate-800/80">
        <div className="flex items-center justify-around max-w-xl mx-auto relative h-11">
          {[
            { id: "attendance", label: "Attendance & Stats", shortLabel: "Attendance", icon: Users },
            { id: "leaderboard", label: "Leaderboard & Stats", shortLabel: "Leaderboard", icon: Trophy },
            { id: "challenges", label: "Launch Challenges", shortLabel: "Challenges", icon: Target },
            { id: "prizes", label: "Dispatch Prizes", shortLabel: "Prizes", icon: Award },
            { id: "settings", label: "Game Settings", shortLabel: "Settings", icon: Settings },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center relative py-0.5 px-3 rounded-xl transition-all duration-200 cursor-pointer flex-1 ${
                  isActive ? "text-pink-600 dark:text-pink-500 scale-105 font-bold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-pink-600 dark:text-pink-500 animate-pulse" : "text-slate-450 dark:text-slate-500"}`} />
                <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight hidden md:block">{tab.label}</span>
                <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight block md:hidden max-w-[80px] truncate">{tab.shortLabel}</span>
                {isActive && (
                  <motion.div
                    layoutId="teacherBottomTabDot"
                    className="w-1 h-1 bg-pink-600 dark:bg-pink-500 rounded-full mt-0.5 absolute -bottom-1"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Class Lobby Card ───────────────────────────────────────────────────────
const ClassLobbyCard = ({ batchContext, profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { onlineUsers } = useOnlineUsers();

  const batchId = batchContext?.batchId;
  const currentUserId = profile?.userId;

  const members = Array.from(onlineUsers.values()).filter(
    (u) => u.metadata?.activeBatchId === batchId
  );
  const teachers = members.filter((m) => m.metadata?.role === "Teacher");
  const students = members.filter((m) => m.metadata?.role !== "Teacher");
  const totalCount = members.length;

  const getActivity = (path) => {
    if (!path) return "Online";
    if (path === "/arena" || path === "/") return "In Game Arena";
    if (path === "/profile") return "Viewing Profile";
    if (path.includes("mock-test")) return "Taking Mock Test";
    if (path.includes("leaderboard")) return "Leaderboard";
    if (path.includes("attendance")) return "Attendance";
    return "Browsing App";
  };

  return (
    <div className="relative z-30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Row — always visible, tap to expand */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center justify-between p-3 select-none cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
            Class Lobby
          </span>
          {totalCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {totalCount} Online
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mini avatar stack preview */}
          {totalCount > 0 && !isOpen && (
            <div className="flex -space-x-1.5">
              {members.slice(0, 4).map((m) => (
                <InteractiveAvatar
                  key={m.userId}
                  src={m.metadata?.profileImage}
                  fallbackText={m.metadata?.userName?.charAt(0) || "?"}
                  userId={m.userId}
                  showStatus={false}
                  className="w-5 h-5 rounded-full border border-white dark:border-slate-900 shrink-0"
                />
              ))}
              {members.length > 4 && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 text-[8px] font-black text-slate-500 dark:text-slate-400 z-10">
                  +{members.length - 4}
                </div>
              )}
            </div>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Expandable panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="lobby-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              {totalCount === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4 font-semibold">
                  No batch members are online right now.
                </p>
              ) : (
                <>
                  {/* Teachers */}
                  {teachers.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-pink-500" /> Instructors
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {teachers.map((m) => (
                          <div
                            key={m.userId}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-pink-500/5 border border-pink-500/10 dark:bg-pink-900/10 dark:border-pink-900/20"
                          >
                            <InteractiveAvatar
                              src={m.metadata?.profileImage}
                              fallbackText={m.metadata?.userName?.charAt(0) || "T"}
                              userId={m.userId}
                              showStatus
                              statusSize="xs"
                              className="w-7 h-7 shrink-0 rounded-lg ring-2 ring-pink-100 dark:ring-pink-900/30"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">
                                {m.metadata?.userName || "Instructor"}
                                {m.userId === currentUserId && (
                                  <span className="ml-1 text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1 py-0.5 rounded">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-pink-500 dark:text-pink-400 font-medium truncate">
                                {getActivity(m.metadata?.page)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Students */}
                  {students.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-purple-500" /> Students ({students.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {students.map((m) => (
                          <div
                            key={m.userId}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <InteractiveAvatar
                              src={m.metadata?.profileImage}
                              fallbackText={m.metadata?.userName?.charAt(0) || "S"}
                              userId={m.userId}
                              showStatus
                              statusSize="xs"
                              className="w-7 h-7 shrink-0 rounded-lg"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                {m.metadata?.userName || "Student"}
                                {m.userId === currentUserId && (
                                  <span className="ml-1 text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1 py-0.5 rounded">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                                {getActivity(m.metadata?.page)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Ambient Background Component
const GradientBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse" />
    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse" />
  </div>
);

export default TeacherGameArena;
