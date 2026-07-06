import { DatabaseService } from "./database.service";
import conf from "../config/config";
import { Query } from "./appwriteClient";
import userProfileService from "../appwrite/userProfileService";
import { StudentGameStats } from "./game.service";

export interface LeaderboardEntry extends StudentGameStats {
  userName: string;
  profileImage: string | null;
  rank: number;
}

export class LeaderboardService extends DatabaseService {
  private leaderboardCache = new Map<string, { time: number; data: LeaderboardEntry[] }>();
  private leaderboardRequests = new Map<string, Promise<LeaderboardEntry[]>>();

  constructor() {
    super(conf.gameStatsCollectionId);
  }

  /**
   * Retrieves the batch leaderboard sorted by XP, Accuracy, highest streak, and last active time.
   */
  async getBatchLeaderboard(batchId: string): Promise<LeaderboardEntry[]> {
    const now = Date.now();

    // 1. Check completed cache (valid for 5 seconds)
    if (this.leaderboardCache.has(batchId)) {
      const cached = this.leaderboardCache.get(batchId)!;
      if (now - cached.time < 5000) {
        return cached.data;
      }
    }

    // 2. Check active requests cache to deduplicate simultaneous calls
    if (this.leaderboardRequests.has(batchId)) {
      return this.leaderboardRequests.get(batchId)!;
    }

    const promise = (async () => {
      try {
        // 1. Fetch game stats for all students in this batch
        const response = await this.listRows<StudentGameStats>([
          Query.equal("batchId", batchId),
          Query.limit(100),
        ]);

        const statsList = response.rows || [];
        if (statsList.length === 0) return [];

        // 2. Fetch user profiles for these studentIds to get their names and avatars
        const studentIds = statsList.map((s) => s.studentId);
        const profiles = await userProfileService.getBatchUserProfile([
          Query.equal("userId", studentIds),
          Query.limit(100),
          Query.select(["userId", "userName", "profileImage"]),
        ]);

        // Map profiles for quick lookup
        const profileMap: Record<string, { userName: string; profileImage: string | null }> = {};
        profiles.forEach((p) => {
          profileMap[p.userId] = {
            userName: p.userName || "Student",
            profileImage: p.profileImage || null,
          };
        });

        // 3. Sort students based on game metrics:
        // Highest XP -> Highest Accuracy -> Highest Streak -> Latest Active
        statsList.sort((a, b) => {
          if (b.xp !== a.xp) {
            return b.xp - a.xp;
          }
          if (b.accuracy !== a.accuracy) {
            return b.accuracy - a.accuracy;
          }
          if (b.highestStreak !== a.highestStreak) {
            return b.highestStreak - a.highestStreak;
          }
          
          const dateA = new Date(a.lastActive || a.lastQuestionTime || 0).getTime();
          const dateB = new Date(b.lastActive || b.lastQuestionTime || 0).getTime();
          return dateB - dateA;
        });

        // 4. Map to final LeaderboardEntry structures with ranks
        const result = statsList.map((stat, index) => {
          const profile = profileMap[stat.studentId] || {
            userName: "Unknown Student",
            profileImage: null,
          };

          return {
            ...stat,
            userName: profile.userName,
            profileImage: profile.profileImage,
            rank: index + 1,
          };
        });

        this.leaderboardCache.set(batchId, { time: Date.now(), data: result });
        return result;
      } catch (error) {
        console.error("[LeaderboardService] getBatchLeaderboard failed:", error);
        return [];
      } finally {
        this.leaderboardRequests.delete(batchId);
      }
    })();

    this.leaderboardRequests.set(batchId, promise);
    return promise;
  }
}

export const leaderboardService = new LeaderboardService();
export default leaderboardService;
