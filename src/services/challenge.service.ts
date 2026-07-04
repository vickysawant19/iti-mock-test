import { DatabaseService } from "./database.service";
import conf from "../config/config";
import { Query } from "./appwriteClient";
import { gameService } from "./game.service";
import { ID } from "appwrite";

export interface BatchChallenge {
  $id?: string;
  teacherId: string;
  batchId: string;
  title: string;
  description: string;
  rewardXP: number;
  rewardCoins: number;
  startDate?: string;
  endDate?: string;
  completedStudents?: string[];
  $createdAt?: string;
  $updatedAt?: string;
}

export class ChallengeService extends DatabaseService {
  constructor() {
    super(conf.challengesCollectionId);
  }

  /**
   * Creates a new challenge for a batch.
   */
  async createChallenge(data: Omit<BatchChallenge, "$id" | "$createdAt" | "$updatedAt">): Promise<BatchChallenge> {
    try {
      const challengeData = {
        ...data,
        completedStudents: data.completedStudents || [],
      };
      return await this.createRow<BatchChallenge>(challengeData, undefined, ID.unique());
    } catch (error) {
      console.error("[ChallengeService] createChallenge failed:", error);
      throw error;
    }
  }

  /**
   * Lists all challenges assigned to a batch.
   */
  async listChallenges(batchId: string): Promise<BatchChallenge[]> {
    try {
      const response = await this.listRows<BatchChallenge>([
        Query.equal("batchId", batchId),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]);
      return response.rows || [];
    } catch (error) {
      console.error("[ChallengeService] listChallenges failed:", error);
      return [];
    }
  }

  /**
   * Claims a completed challenge for a student, awarding XP and Coins.
   */
  async completeChallenge(
    challengeId: string,
    studentId: string,
    tradeId: string
  ): Promise<{ challenge: BatchChallenge; xpGained: number; coinsGained: number; stats: any }> {
    try {
      // 1. Get the challenge details
      const challenge = await this.getRow<BatchChallenge>(challengeId);
      if (!challenge) {
        throw new Error("Challenge not found.");
      }

      const completedList = challenge.completedStudents || [];

      // 2. Check if already completed
      if (completedList.includes(studentId)) {
        throw new Error("You have already claimed the rewards for this challenge.");
      }

      // 3. Append student to completed list
      const updatedList = [...completedList, studentId];
      const updatedChallenge = await this.updateRow<BatchChallenge>(challengeId, {
        completedStudents: updatedList,
      });

      // 4. Award XP and Coins to student
      const stats = await gameService.awardBonus(
        studentId,
        challenge.batchId,
        tradeId,
        challenge.rewardXP || 0,
        challenge.rewardCoins || 0
      );

      return {
        challenge: updatedChallenge,
        xpGained: challenge.rewardXP || 0,
        coinsGained: challenge.rewardCoins || 0,
        stats,
      };
    } catch (error: any) {
      console.error("[ChallengeService] completeChallenge failed:", error);
      throw error;
    }
  }
}

export const challengeService = new ChallengeService();
export default challengeService;
