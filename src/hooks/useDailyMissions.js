import { useState, useCallback, useEffect } from "react";
import { dailyMissionsService } from "@/services/dailyMissions.service";

/**
 * useDailyMissions
 * Loads today's missions for a student, handles progress updates and claiming.
 */
export function useDailyMissions(studentId, batchId) {
  const [missions, setMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

  const fetchMissions = useCallback(async () => {
    if (!studentId || !batchId) return;
    setIsLoading(true);
    try {
      const data = await dailyMissionsService.getTodayMissions(studentId, batchId);
      setMissions(data);
    } catch (err) {
      console.error("[useDailyMissions] fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, batchId]);

  // Load on mount / when student/batch changes
  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  /**
   * Claim a completed mission and return the reward.
   */
  const claimMission = useCallback(async (missionDocId) => {
    if (claimingId) return null;
    setClaimingId(missionDocId);
    try {
      const reward = await dailyMissionsService.claimMission(missionDocId);
      if (reward) {
        // Optimistically mark as claimed in local state
        setMissions((prev) =>
          prev.map((m) => (m.$id === missionDocId ? { ...m, claimed: true } : m))
        );
      }
      return reward;
    } catch (err) {
      console.error("[useDailyMissions] claimMission failed:", err);
      return null;
    } finally {
      setClaimingId(null);
    }
  }, [claimingId]);

  /**
   * Increment progress on missions of a given type (call after game events).
   */
  const incrementProgress = useCallback(async (type, amount = 1) => {
    if (!studentId) return;
    try {
      await dailyMissionsService.incrementProgress(studentId, type, amount);
      // Refresh local state after increment
      await fetchMissions();
    } catch (err) {
      console.error("[useDailyMissions] incrementProgress failed:", err);
    }
  }, [studentId, fetchMissions]);

  // Derived counts
  const completedCount = missions.filter((m) => (m.progress || 0) >= m.target).length;
  const claimedCount = missions.filter((m) => m.claimed).length;
  const totalCount = missions.length;
  const allClaimed = totalCount > 0 && claimedCount === totalCount;

  return {
    missions,
    isLoading,
    claimingId,
    completedCount,
    claimedCount,
    totalCount,
    allClaimed,
    fetchMissions,
    claimMission,
    incrementProgress,
  };
}

export default useDailyMissions;
