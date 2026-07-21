import { DatabaseService } from "./database.service";
import conf from "../config/config";
import { Query } from "./appwriteClient";
import userProfileService from "../appwrite/userProfileService";
import { StudentGameStats } from "./game.service";

// Helper to get local date string in YYYY-MM-DD format (respecting user's local timezone / IST)
function getLocalDateString(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split("T")[0];
}

export interface LeaderboardEntry extends StudentGameStats {
  userName: string;
  profileImage: string | null;
  lastseen: string | null;
  rank: number;
}

export class LeaderboardService extends DatabaseService {
  private leaderboardCache = new Map<string, { time: number; data: LeaderboardEntry[] }>();
  private leaderboardRequests = new Map<string, Promise<LeaderboardEntry[]>>();
  private profileCache = new Map<string, { userName: string; profileImage: string | null; lastseen: string | null }>();

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

        // 2. Fetch user profiles for these studentIds to get their names, avatars, and lastseen times
        const studentIds = statsList.map((s) => s.studentId);

        if (studentIds.length > 0) {
          try {
            const profiles = await userProfileService.getBatchUserProfile([
              Query.equal("userId", studentIds),
              Query.limit(100),
              Query.select(["userId", "userName", "profileImage", "lastseen"]),
            ]);
            profiles.forEach((p) => {
              this.profileCache.set(p.userId, {
                userName: p.userName || "Student",
                profileImage: p.profileImage || null,
                lastseen: p.lastseen || null,
              });
            });
          } catch (profileError) {
            console.error("[LeaderboardService] Failed to load user profiles:", profileError);
          }
        }

        // Map profiles for quick lookup
        const profileMap: Record<string, { userName: string; profileImage: string | null; lastseen: string | null }> = {};
        studentIds.forEach((id) => {
          profileMap[id] = this.profileCache.get(id) || {
            userName: "Unknown Student",
            profileImage: null,
            lastseen: null,
          };
        });

        // 3. Map to final LeaderboardEntry structures with local timezone resets (streaks and daily stats)
        const now = new Date();
        const todayDate = getLocalDateString(now);

        const mappedList = statsList.map((stat) => {
          const profile = profileMap[stat.studentId] || {
            userName: "Unknown Student",
            profileImage: null,
            lastseen: null,
          };

          const isStale = stat.dailyStatsDate !== todayDate;

          let currentStreak = stat.currentStreak || 0;
          if (stat.lastQuestionTime) {
            const lastTime = new Date(stat.lastQuestionTime);
            const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const d2 = new Date(lastTime.getFullYear(), lastTime.getMonth(), lastTime.getDate());
            const diffTime = d1.getTime() - d2.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 2) {
              currentStreak = 0;
            }
          }

          return {
            ...stat,
            currentStreak,
            dailyWins: isStale ? 0 : (stat.dailyWins || 0),
            dailyLosses: isStale ? 0 : (stat.dailyLosses || 0),
            dailyQuestionsAttempted: isStale ? 0 : (stat.dailyQuestionsAttempted || 0),
            dailyStatsDate: isStale ? todayDate : stat.dailyStatsDate,
            userName: profile.userName,
            profileImage: profile.profileImage,
            lastseen: profile.lastseen,
            rank: 1, // Placeholder
          };
        });

        // 4. Sort students based on game metrics:
        // Highest Level -> Highest XP -> Highest Accuracy -> Highest Streak -> Latest Active
        mappedList.sort((a, b) => {
          const levelA = a.level || 1;
          const levelB = b.level || 1;
          if (levelB !== levelA) {
            return levelB - levelA;
          }
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

        // 5. Assign final ranks
        const result = mappedList.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

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
