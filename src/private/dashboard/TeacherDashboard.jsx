/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fixProfileImage } from "@/services/appwriteClient";
import { checkProfileCompletion } from "@/utils/profileCompletion";
import BatchOverviewCard from "./components/BatchOverviewCard";
import StudentTable from "./components/StudentTable";
import AttendanceTrendChart from "./components/AttendanceTrendChart";
import OnlineBatchMembers from "@/components/components/OnlineBatchMembers";
import { challengeService } from "@/services/challenge.service";
import { gameService } from "@/services/game.service";
import { leaderboardService } from "@/services/leaderboard.service";
import { BADGES } from "@/services/reward.service";
import { ID } from "appwrite";

const TeacherDashboard = ({
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

  // Tab: attendance or gamification
  const [activeTab, setActiveTab] = useState("attendance");

  // Gamification state
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingGame, setLoadingGame] = useState(false);

  // Form states
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeXP, setChallengeXP] = useState(100);
  const [challengeCoins, setChallengeCoins] = useState(50);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

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
    if (batchContext?.batchId && activeTab === "gamification") {
      fetchGamificationData();
    }
  }, [batchContext?.batchId, activeTab, fetchGamificationData]);

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
      });

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

        {/* Bottom Navigation Dock replaces old tabs on mobile and desktop */}

        <AnimatePresence mode="wait">
          {activeTab === "attendance" ? (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refetch}
                  disabled={isLoading}
                  className="text-xs font-semibold text-slate-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh Stats
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
                <>
                  {/* Student Table */}
                  <StudentTable studentRows={studentRows} selectedMonth={selectedMonth} />

                  {/* Live Batch Members List */}
                  <OnlineBatchMembers batchId={batchContext?.batchId} currentUserId={profile?.userId} />

                  {/* Visual Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <AttendanceTrendChart data={attendanceTrend} />

                    {/* Needs Attention List */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
                          Needs Attention
                        </h3>
                      </div>
                      <div className="p-4 space-y-2 max-h-56 overflow-y-auto">
                        {studentRows
                          .filter((s) => s.totalAttendancePercent < 75)
                          .sort((a, b) => a.totalAttendancePercent - b.totalAttendancePercent)
                          .slice(0, 8)
                          .map((s) => (
                            <div
                              key={s.studentId}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-red-50/40 dark:bg-red-900/10 border border-red-100/30 dark:border-red-900/20"
                            >
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                {s.userName}
                              </span>
                              <span className="text-xs font-extrabold text-red-600 dark:text-red-400 tabular-nums shrink-0">
                                {s.totalAttendancePercent}%
                              </span>
                            </div>
                          ))}
                        {studentRows.filter((s) => s.totalAttendancePercent < 75).length === 0 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                            All students have ≥75% attendance 🎉
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="gamification"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {loadingGame ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              ) : (
                <>
                  {/* Game Stats overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 text-white">
                      <div className="p-3 bg-pink-500/20 rounded-2xl text-pink-500">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Batch XP</p>
                        <p className="text-2xl font-black text-white mt-0.5">{totalBatchXP} XP</p>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 text-white">
                      <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-500">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Accuracy</p>
                        <p className="text-2xl font-black text-white mt-0.5">{avgAccuracy}%</p>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 text-white">
                      <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-500">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Level</p>
                        <p className="text-2xl font-black text-white mt-0.5">LVL {avgLevel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Launch Challenge Form */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <PlusCircle className="w-5 h-5 text-pink-500" />
                        Launch New Challenge
                      </h3>
                      <form onSubmit={handleCreateChallenge} className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Challenge Title</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. Solve 50 questions"
                            value={challengeTitle}
                            onChange={(e) => setChallengeTitle(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Description</label>
                          <textarea
                            required
                            rows="2"
                            placeholder="Detail the instructions or criteria for students..."
                            value={challengeDesc}
                            onChange={(e) => setChallengeDesc(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">XP Reward</label>
                            <input
                              type="number"
                              min="1"
                              value={challengeXP}
                              onChange={(e) => setChallengeXP(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Coins Reward</label>
                            <input
                              type="number"
                              min="1"
                              value={challengeCoins}
                              onChange={(e) => setChallengeCoins(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium"
                            />
                          </div>
                        </div>
                        <Button
                          disabled={isCreatingChallenge}
                          type="submit"
                          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold py-3 text-xs shadow-md shadow-pink-500/10 cursor-pointer"
                        >
                          {isCreatingChallenge ? "Launching..." : "Launch Challenge"}
                        </Button>
                      </form>
                    </div>

                    {/* Prize Dispatcher Form */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <Award className="w-5 h-5 text-purple-500" />
                        Badge & Prize Dispatcher
                      </h3>
                      <form onSubmit={handleDispatchPrize} className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Select Student</label>
                          <select
                            required
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-bold"
                          >
                            <option value="">-- Choose Student --</option>
                            {studentRows.map((s) => (
                              <option key={s.studentId} value={s.studentId}>
                                {s.userName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Prize Type</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <input
                                type="radio"
                                checked={prizeType === "bonus"}
                                onChange={() => setPrizeType("bonus")}
                              />
                              XP & Coins Bonus
                            </label>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <input
                                type="radio"
                                checked={prizeType === "badge"}
                                onChange={() => setPrizeType("badge")}
                              />
                              Achievement Badge
                            </label>
                          </div>
                        </div>

                        {prizeType === "badge" ? (
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Select Badge</label>
                            <select
                              required
                              value={selectedBadge}
                              onChange={(e) => setSelectedBadge(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-bold"
                            >
                              <option value="">-- Choose Badge --</option>
                              {Object.values(BADGES).map((badge) => (
                                <option key={badge.id} value={badge.id}>
                                  🏆 {badge.title} - {badge.description}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Bonus XP</label>
                              <input
                                type="number"
                                min="10"
                                value={bonusXP}
                                onChange={(e) => setBonusXP(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Bonus Coins</label>
                              <input
                                type="number"
                                min="5"
                                value={bonusCoins}
                                onChange={(e) => setBonusCoins(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium"
                              />
                            </div>
                          </div>
                        )}

                        <Button
                          disabled={isDispatchingPrize}
                          type="submit"
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold py-3 text-xs shadow-md shadow-indigo-500/10 cursor-pointer"
                        >
                          {isDispatchingPrize ? "Dispatching..." : "Dispatch Prize"}
                        </Button>
                      </form>
                    </div>
                  </div>

                  {/* Active Challenges List */}
                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Active Batch Challenges</h3>
                    </div>
                    <div className="divide-y divide-white/20 dark:divide-slate-800/40">
                      {challenges.map((challenge) => {
                        const completionsCount = challenge.completedStudents?.length || 0;
                        return (
                          <div key={challenge.$id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{challenge.title}</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">{challenge.description}</p>
                            </div>
                            <span className="text-[10px] font-extrabold bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {completionsCount} Completed
                            </span>
                          </div>
                        );
                      })}
                      {challenges.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-10">No challenges launched yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Batch Game Leaderboard */}
                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Batch Gamified Leaderboard</h3>
                    </div>
                    <div className="divide-y divide-white/20 dark:divide-slate-800/40">
                      {leaderboard.map((student, idx) => (
                        <div key={student.studentId} className="flex justify-between items-center px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-400 w-5">#{idx + 1}</span>
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarImage src={fixProfileImage(student.profileImage)} />
                              <AvatarFallback className="font-extrabold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 rounded-lg">
                                {student.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-bold text-slate-750 dark:text-slate-300">{student.userName}</p>
                              <p className="text-[9px] text-slate-400 font-medium">Level {student.level} • Wins: {student.wins} / Losses: {student.losses}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-pink-500">{student.xp} XP</span>
                            <p className="text-[9px] text-slate-400 font-bold">Accuracy: {student.accuracy}%</p>
                          </div>
                        </div>
                      ))}
                      {leaderboard.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-10">No game scores recorded.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 dark:bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-lg shadow-[0_-8px_30px_rgba(0,0,0,0.3)] px-3 py-1.5 pb-safe md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xs md:rounded-2xl md:border md:border-slate-800/80">
        <div className="flex items-center justify-around max-w-xs mx-auto relative h-11">
          {[
            { id: "attendance", label: "Attendance & Performance", shortLabel: "Attendance", icon: Users },
            { id: "gamification", label: "Gamification & Challenges", shortLabel: "Gamification", icon: Trophy },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center relative py-0.5 px-3 rounded-xl transition-all duration-200 cursor-pointer flex-1 ${
                  isActive ? "text-pink-500 scale-105 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-pink-500 animate-pulse" : "text-slate-500"}`} />
                <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight hidden md:block">{tab.label}</span>
                <span className="text-[8px] mt-0.5 whitespace-nowrap tracking-tight block md:hidden max-w-[80px] truncate">{tab.shortLabel}</span>
                {isActive && (
                  <motion.div
                    layoutId="teacherBottomTabDot"
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

export default TeacherDashboard;
