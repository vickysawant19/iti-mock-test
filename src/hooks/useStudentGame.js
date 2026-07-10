import { useState, useCallback, useEffect } from "react";
import { gameService } from "@/services/game.service";
import { leaderboardService } from "@/services/leaderboard.service";
import { challengeService } from "@/services/challenge.service";
import { rewardService } from "@/services/reward.service";
import conf from "@/config/config";

/**
 * useStudentGame Hook
 * Orchestrates gamified interactions for students.
 */
export function useStudentGame(studentId, batchId, tradeId) {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [activeSettings, setActiveSettings] = useState(null);
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);
  
  const [unlockedBadges, setUnlockedBadges] = useState([]);

  // Fetch student game stats
  const fetchStats = useCallback(async () => {
    if (!studentId || !batchId) return;
    setIsLoadingStats(true);
    try {
      const [data, settings] = await Promise.all([
        gameService.getStudentGameStats(studentId, batchId, tradeId),
        gameService.getBatchGameSettings(batchId).catch(() => null)
      ]);
      setStats(data);
      setActiveSettings(settings);
    } catch (err) {
      console.error("[useStudentGame] Error fetching stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [studentId, batchId, tradeId]);

  // Fetch random question
  const fetchQuestion = useCallback(async () => {
    if (!tradeId || !batchId) return;
    setIsLoadingQuestion(true);
    try {
      let settings = activeSettings;
      if (!settings) {
        settings = await gameService.getBatchGameSettings(batchId);
        setActiveSettings(settings);
      }
      console.log("[useStudentGame] fetchQuestion: settings =", settings);
      const data = await gameService.getRandomQuestion(tradeId, settings);
      console.log("[useStudentGame] fetchQuestion: question =", data);
      setCurrentQuestion(data);
    } catch (err) {
      console.error("[useStudentGame] Error fetching question:", err);
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [tradeId, batchId, activeSettings]);

  // Submit MCQ answer
  const submitAnswer = useCallback(async (isCorrect, isFiftyFiftyUsed) => {
    if (!studentId || !batchId || !tradeId) return null;
    try {
      const res = await gameService.submitAnswer(studentId, batchId, tradeId, isCorrect, isFiftyFiftyUsed);
      setStats(res.stats);

      // Check if any achievements unlocked
      const newUnlocks = await rewardService.checkAndUnlockAchievements(res.stats, batchId);
      if (newUnlocks.length > 0) {
        setUnlockedBadges((prev) => [...prev, ...newUnlocks]);
        // Refresh achievements list
        const achs = await rewardService.getStudentAchievements(studentId, batchId);
        setAchievements(achs);
      }

      // Refresh leaderboard list in background
      fetchLeaderboard();

      return res;
    } catch (err) {
      console.error("[useStudentGame] Error submitting answer:", err);
      return null;
    }
  }, [studentId, batchId, tradeId]);

  // Fetch batch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    if (!batchId) return;
    setIsLoadingLeaderboard(true);
    try {
      const data = await leaderboardService.getBatchLeaderboard(batchId);
      setLeaderboard(data);
    } catch (err) {
      console.error("[useStudentGame] Error fetching leaderboard:", err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [batchId]);

  // Fetch batch challenges
  const fetchChallenges = useCallback(async () => {
    if (!batchId) return;
    setIsLoadingChallenges(true);
    try {
      const data = await challengeService.listChallenges(batchId);
      setChallenges(data);
    } catch (err) {
      console.error("[useStudentGame] Error fetching challenges:", err);
    } finally {
      setIsLoadingChallenges(false);
    }
  }, [batchId]);

  // Claim challenge reward
  const claimChallengeReward = useCallback(async (challengeId) => {
    if (!studentId || !tradeId) return null;
    try {
      const res = await challengeService.completeChallenge(challengeId, studentId, tradeId);
      setStats(res.stats);
      
      // Update challenges list
      setChallenges((prev) =>
        prev.map((c) => (c.$id === challengeId ? res.challenge : c))
      );

      // Check achievements
      const newUnlocks = await rewardService.checkAndUnlockAchievements(res.stats, batchId);
      if (newUnlocks.length > 0) {
        setUnlockedBadges((prev) => [...prev, ...newUnlocks]);
        const achs = await rewardService.getStudentAchievements(studentId, batchId);
        setAchievements(achs);
      }

      fetchLeaderboard();

      return res;
    } catch (err) {
      console.error("[useStudentGame] Error claiming challenge reward:", err);
      throw err;
    }
  }, [studentId, batchId, tradeId, fetchLeaderboard]);

  // Fetch unlocked achievements
  const fetchAchievements = useCallback(async () => {
    if (!studentId || !batchId) return;
    try {
      const data = await rewardService.getStudentAchievements(studentId, batchId);
      setAchievements(data);
    } catch (err) {
      console.error("[useStudentGame] Error fetching achievements:", err);
    }
  }, [studentId, batchId]);

  // Load everything on mount/dependency change
  useEffect(() => {
    if (studentId && batchId) {
      fetchStats();
      fetchLeaderboard();
      fetchChallenges();
      fetchAchievements();
    }
  }, [studentId, batchId, fetchStats, fetchLeaderboard, fetchChallenges, fetchAchievements]);

  // Realtime subscription for game stats collection to update leaderboard live
  useEffect(() => {
    if (!batchId) return;

    let sub = null;
    let mounted = true;

    const setupRealtime = async () => {
      try {
        const { appwriteService } = await import("@/services/appwriteClient");
        const realtime = appwriteService.getRealtime();
        const { Channel } = await import("appwrite");
        const channel = Channel.tablesdb(conf.databaseId)
          .table(conf.gameStatsCollectionId)
          .row();

        sub = await realtime.subscribe(channel, (response) => {
          if (!mounted) return;
          const payload = response.payload;
          
          if (payload?.batchId === batchId) {
            // Trigger leaderboard reload
            fetchLeaderboard();
            
            // If the changed doc belongs to the current student, update local stats
            if (payload?.studentId === studentId) {
              setStats(payload);
            }
          }
        });
      } catch (err) {
        console.warn("[useStudentGame] Realtime subscription failed:", err);
      }
    };

    setupRealtime();

    return () => {
      mounted = false;
      if (sub && typeof sub.unsubscribe === "function") {
        sub.unsubscribe();
      }
    };
  }, [batchId, studentId, fetchLeaderboard]);

  // Realtime subscription for batch game settings
  useEffect(() => {
    if (!batchId) return;

    let settingsSub = null;
    let mounted = true;

    const setupSettingsRealtime = async () => {
      try {
        const { appwriteService } = await import("@/services/appwriteClient");
        const realtime = appwriteService.getRealtime();
        const { Channel } = await import("appwrite");
        const channel = Channel.tablesdb(conf.databaseId)
          .table("batch_game_settings")
          .row();

        settingsSub = await realtime.subscribe(channel, (response) => {
          if (!mounted) return;
          const payload = response.payload;
          
          if (payload?.batchId === batchId) {
            console.log("[useStudentGame] Realtime settings updated:", payload);
            setActiveSettings(payload);
            
            // Cache locally as fallback and update in-memory cache in gameService
            try {
              const cacheKey = `game_settings_${batchId}`;
              localStorage.setItem(cacheKey, JSON.stringify(payload));
              gameService.updateSettingsCache(batchId, payload);
            } catch (err) {
              console.warn("[useStudentGame] Failed to write/update settings cache on realtime event:", err);
            }
          }
        });
      } catch (err) {
        console.warn("[useStudentGame] Settings realtime subscription failed:", err);
      }
    };

    setupSettingsRealtime();

    return () => {
      mounted = false;
      if (settingsSub && typeof settingsSub.unsubscribe === "function") {
        settingsSub.unsubscribe();
      }
    };
  }, [batchId]);

  return {
    stats,
    leaderboard,
    challenges,
    achievements,
    activeSettings,
    currentQuestion,
    
    isLoadingStats,
    isLoadingQuestion,
    isLoadingLeaderboard,
    isLoadingChallenges,
    
    unlockedBadges,
    clearUnlockedBadges: () => setUnlockedBadges([]),
    
    fetchStats,
    fetchQuestion,
    submitAnswer,
    fetchLeaderboard,
    fetchChallenges,
    claimChallengeReward,
    fetchAchievements,

    spinLuckyWheel: useCallback(async (xpReward, coinsReward) => {
      if (!studentId || !batchId || !tradeId) return null;
      try {
        const res = await gameService.spinLuckyWheel(studentId, batchId, tradeId, xpReward, coinsReward);
        setStats(res);
        fetchLeaderboard();
        return res;
      } catch (err) {
        console.error("[useStudentGame] Error spinning lucky wheel:", err);
        return null;
      }
    }, [studentId, batchId, tradeId, fetchLeaderboard]),

    canSpin: useCallback(() => {
      return gameService.canSpinLuckyWheel(studentId, batchId, stats);
    }, [studentId, batchId, stats]),
  };
}

export default useStudentGame;
