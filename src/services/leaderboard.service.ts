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
  constructor() {
    super(conf.gameStatsCollectionId);
  }

  /**
   * Retrieves the batch leaderboard sorted by XP, Accuracy, highest streak, and last active time.
   */
  async getBatchLeaderboard(batchId: string): Promise<LeaderboardEntry[]> {
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
      return statsList.map((stat, index) => {
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
    } catch (error) {
      console.error("[LeaderboardService] getBatchLeaderboard failed:", error);
      return [];
    }
  }
}

export const leaderboardService = new LeaderboardService();
export default leaderboardService;
