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
  type?: string;     // e.g. "questions", "correct_answers", "correct_streak", "xp", "manual"
  target?: number;   // target target value, e.g. 10
  $createdAt?: string;
  $updatedAt?: string;
}

export interface BatchChallengeProgress {
  $id?: string;
  challengeId: string;
  studentId: string;
  batchId: string;
  progress: number;
  claimed: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

export const CHALLENGE_TEMPLATES = [
  { templateId: "answer_10_questions", type: "questions", title: "Answer 10 Questions", description: "Answer 10 questions in any subject.", target: 10, defaultXP: 80, defaultCoins: 20 },
  { templateId: "answer_25_questions", type: "questions", title: "Answer 25 Questions", description: "Solve 25 questions to build confidence.", target: 25, defaultXP: 150, defaultCoins: 40 },
  { templateId: "answer_50_questions", type: "questions", title: "Answer 50 Questions", description: "Become a master! Solve 50 questions.", target: 50, defaultXP: 250, defaultCoins: 75 },
  { templateId: "get_10_correct", type: "correct_answers", title: "Get 10 Correct Answers", description: "Get 10 answers right to prove your understanding.", target: 10, defaultXP: 100, defaultCoins: 25 },
  { templateId: "get_25_correct", type: "correct_answers", title: "Get 25 Correct Answers", description: "Get 25 answers correct.", target: 25, defaultXP: 200, defaultCoins: 50 },
  { templateId: "get_50_correct", type: "correct_answers", title: "Get 50 Correct Answers", description: "Incredible accuracy! Get 50 correct answers.", target: 50, defaultXP: 350, defaultCoins: 100 },
  { templateId: "earn_500_xp", type: "xp", title: "Earn 500 XP", description: "Earn 500 XP from games and activities.", target: 500, defaultXP: 120, defaultCoins: 30 },
  { templateId: "earn_1000_xp", type: "xp", title: "Earn 1000 XP", description: "Gain 1000 XP through hard work and mastery.", target: 1000, defaultXP: 200, defaultCoins: 60 },
  { templateId: "correct_streak_5", type: "correct_streak", title: "Get 5-Streak Correct", description: "Get 5 correct answers in a row without making a mistake.", target: 5, defaultXP: 150, defaultCoins: 40 },
  { templateId: "correct_streak_10", type: "correct_streak", title: "Get 10-Streak Correct", description: "Unstoppable! Get 10 correct answers in a row.", target: 10, defaultXP: 250, defaultCoins: 75 },
  { templateId: "custom", type: "manual", title: "Custom Challenge", description: "A special manual challenge assigned by your teacher.", target: 0, defaultXP: 100, defaultCoins: 50 }
];

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
        type: data.type || "manual",
        target: data.target || 0,
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
   * Lists active challenges with student's current progress attached.
   */
  async listChallengesWithProgress(
    batchId: string,
    studentId: string
  ): Promise<(BatchChallenge & { progress: number; claimed: boolean })[]> {
    try {
      const challenges = await this.listChallenges(batchId);
      const progressService = new DatabaseService(conf.challengesProgressCollectionId);

      const progressRes = await progressService.listRows<BatchChallengeProgress>([
        Query.equal("batchId", batchId),
        Query.equal("studentId", studentId),
        Query.limit(100)
      ]);

      const progressMap = new Map<string, BatchChallengeProgress>();
      for (const p of progressRes.rows) {
        progressMap.set(p.challengeId, p);
      }

      return challenges.map(c => {
        const pDoc = c.$id ? progressMap.get(c.$id) : null;
        const isClaimedInChallenge = c.$id && (c.completedStudents || []).includes(studentId) ? true : false;
        return {
          ...c,
          progress: pDoc ? pDoc.progress : 0,
          claimed: pDoc ? pDoc.claimed : isClaimedInChallenge
        };
      });
    } catch (err) {
      console.error("[ChallengeService] listChallengesWithProgress failed:", err);
      return [];
    }
  }

  /**
   * Increments progress for matching active challenges of a given type.
   */
  async incrementChallengeProgress(
    batchId: string,
    studentId: string,
    type: string,
    amount: number = 1
  ): Promise<void> {
    try {
      const challenges = await this.listChallenges(batchId);
      const matchingChallenges = challenges.filter(c => c.type === type);
      if (matchingChallenges.length === 0) return;

      const progressService = new DatabaseService(conf.challengesProgressCollectionId);

      for (const challenge of matchingChallenges) {
        if (!challenge.$id) continue;

        // Skip if student already completed
        if ((challenge.completedStudents || []).includes(studentId)) continue;

        let progressDoc: BatchChallengeProgress | null = null;
        try {
          const res = await progressService.listRows<BatchChallengeProgress>([
            Query.equal("challengeId", challenge.$id),
            Query.equal("studentId", studentId),
            Query.limit(1)
          ]);
          if (res.total > 0) {
            progressDoc = res.rows[0];
          }
        } catch (err) {
          console.warn("[ChallengeService] error fetching progress:", err);
        }

        if (!progressDoc) {
          try {
            progressDoc = await progressService.createRow<BatchChallengeProgress>({
              challengeId: challenge.$id,
              studentId,
              batchId,
              progress: 0,
              claimed: false
            }, undefined, ID.unique());
          } catch (err) {
            console.warn("[ChallengeService] error creating progress row:", err);
            continue;
          }
        }

        if (progressDoc && !progressDoc.claimed) {
          const maxTarget = challenge.target || 0;
          const newProgress = Math.min((progressDoc.progress || 0) + amount, maxTarget);
          if (newProgress !== progressDoc.progress && progressDoc.$id) {
            await progressService.updateRow<BatchChallengeProgress>(progressDoc.$id, {
              progress: newProgress
            });
          }
        }
      }
    } catch (err) {
      console.error("[ChallengeService] incrementChallengeProgress failed:", err);
    }
  }

  /**
   * Resets progress for matching active challenges of a given type.
   */
  async resetChallengeProgress(
    batchId: string,
    studentId: string,
    type: string
  ): Promise<void> {
    try {
      const challenges = await this.listChallenges(batchId);
      const matchingChallenges = challenges.filter(c => c.type === type);
      if (matchingChallenges.length === 0) return;

      const progressService = new DatabaseService(conf.challengesProgressCollectionId);

      for (const challenge of matchingChallenges) {
        if (!challenge.$id) continue;
        if ((challenge.completedStudents || []).includes(studentId)) continue;

        try {
          const res = await progressService.listRows<BatchChallengeProgress>([
            Query.equal("challengeId", challenge.$id),
            Query.equal("studentId", studentId),
            Query.limit(1)
          ]);
          if (res.total > 0) {
            const pDoc = res.rows[0];
            if (pDoc.$id && !pDoc.claimed && pDoc.progress !== 0) {
              await progressService.updateRow<BatchChallengeProgress>(pDoc.$id, {
                progress: 0
              });
            }
          }
        } catch (err) {
          console.warn("[ChallengeService] error resetting progress:", err);
        }
      }
    } catch (err) {
      console.error("[ChallengeService] resetChallengeProgress failed:", err);
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

      // 4. Set progress claimed status to true
      const progressService = new DatabaseService(conf.challengesProgressCollectionId);
      try {
        const res = await progressService.listRows<BatchChallengeProgress>([
          Query.equal("challengeId", challengeId),
          Query.equal("studentId", studentId),
          Query.limit(1)
        ]);
        if (res.total > 0) {
          const pDoc = res.rows[0];
          if (pDoc.$id) {
            await progressService.updateRow<BatchChallengeProgress>(pDoc.$id, {
              claimed: true,
              progress: challenge.target || pDoc.progress
            });
          }
        } else {
          await progressService.createRow<BatchChallengeProgress>({
            challengeId,
            studentId,
            batchId: challenge.batchId,
            progress: challenge.target || 0,
            claimed: true
          }, undefined, ID.unique());
        }
      } catch (err) {
        console.warn("[ChallengeService] Failed to update progress row to claimed:", err);
      }

      // 5. Award XP and Coins to student
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

  /**
   * Fetches completion progress/status for all students in a batch for a given challenge.
   */
  async getChallengeProgressForBatch(
    challengeId: string,
    batchId: string
  ): Promise<BatchChallengeProgress[]> {
    try {
      const progressService = new DatabaseService(conf.challengesProgressCollectionId);
      const response = await progressService.listRows<BatchChallengeProgress>([
        Query.equal("challengeId", challengeId),
        Query.equal("batchId", batchId),
        Query.limit(100),
      ]);
      return response.rows || [];
    } catch (error: any) {
      console.error("[ChallengeService] getChallengeProgressForBatch failed:", error);
      return [];
    }
  }
}

export const challengeService = new ChallengeService();
export default challengeService;
