import { DatabaseService } from "./database.service";
import conf from "../config/config";
import { Query } from "./appwriteClient";
import { ID } from "appwrite";
import { StudentGameStats } from "./game.service";

export interface StudentAchievement {
  $id?: string;
  studentId: string;
  achievementId: string;
  unlockedAt: string;
  batchId: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string; // Icon identifier (e.g. fire, zap, target, trophy, book)
  color: string; // Tailwind class (e.g. text-orange-500)
}

export const BADGES: Record<string, BadgeDefinition> = {
  streak_7: {
    id: "streak_7",
    title: "7-Day Streak",
    description: "Achieve a question streak of 7 or more answers",
    icon: "Flame",
    color: "from-orange-400 to-red-500 text-white",
  },
  accuracy_100: {
    id: "accuracy_100",
    title: "Perfect Accuracy",
    description: "Achieve 100% accuracy with at least 10 questions attempted",
    icon: "Target",
    color: "from-emerald-400 to-teal-500 text-white",
  },
  theory_master: {
    id: "theory_master",
    title: "Theory Master",
    description: "Attempt 50 or more trade theory questions",
    icon: "BookOpen",
    color: "from-blue-400 to-indigo-500 text-white",
  },
  fast_learner: {
    id: "fast_learner",
    title: "Fast Learner",
    description: "Reach Level 5 in gamified training",
    icon: "Zap",
    color: "from-amber-400 to-yellow-500 text-black",
  },
  batch_champ: {
    id: "batch_champ",
    title: "Batch Champion",
    description: "Reach Level 10 and secure a top position",
    icon: "Trophy",
    color: "from-pink-500 to-purple-600 text-white",
  },
};

export class RewardService extends DatabaseService {
  constructor() {
    super(conf.achievementsCollectionId);
  }

  /**
   * Retrieves all unlocked achievements for a student in a batch.
   */
  async getStudentAchievements(studentId: string, batchId: string): Promise<StudentAchievement[]> {
    try {
      const response = await this.listRows<StudentAchievement>([
        Query.equal("studentId", studentId),
        Query.equal("batchId", batchId),
        Query.limit(50),
      ]);
      return response.rows || [];
    } catch (error) {
      console.error("[RewardService] getStudentAchievements failed:", error);
      return [];
    }
  }

  /**
   * Evaluates student game stats and unlocks any newly earned achievements.
   */
  async checkAndUnlockAchievements(
    stats: StudentGameStats,
    batchId: string
  ): Promise<BadgeDefinition[]> {
    try {
      const unlocked = await this.getStudentAchievements(stats.studentId, batchId);
      const unlockedIds = new Set(unlocked.map((a) => a.achievementId));

      const newUnlocks: BadgeDefinition[] = [];

      // Check conditions
      // 1. Streak 7
      if (stats.highestStreak >= 7 && !unlockedIds.has("streak_7")) {
        newUnlocks.push(BADGES.streak_7);
      }
      // 2. Accuracy 100 (min 10 questions attempted)
      if (stats.questionsAttempted >= 10 && stats.accuracy === 100 && !unlockedIds.has("accuracy_100")) {
        newUnlocks.push(BADGES.accuracy_100);
      }
      // 3. Theory Master
      if (stats.questionsAttempted >= 50 && !unlockedIds.has("theory_master")) {
        newUnlocks.push(BADGES.theory_master);
      }
      // 4. Fast Learner (Level 5)
      if (stats.level >= 5 && !unlockedIds.has("fast_learner")) {
        newUnlocks.push(BADGES.fast_learner);
      }
      // 5. Batch Champion (Level 10)
      if (stats.level >= 10 && !unlockedIds.has("batch_champ")) {
        newUnlocks.push(BADGES.batch_champ);
      }

      // Create new achievements in DB
      for (const badge of newUnlocks) {
        try {
          await this.createRow<StudentAchievement>({
            studentId: stats.studentId,
            achievementId: badge.id,
            unlockedAt: new Date().toISOString(),
            batchId: batchId,
          }, undefined, ID.unique());
        } catch (err) {
          console.error(`[RewardService] Failed to save achievement ${badge.id}:`, err);
        }
      }

      return newUnlocks;
    } catch (error) {
      console.error("[RewardService] checkAndUnlockAchievements failed:", error);
      return [];
    }
  }
}

export const rewardService = new RewardService();
export default rewardService;
