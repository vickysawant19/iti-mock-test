import { DatabaseService } from "./database.service";
import conf from "../config/config";
import { Query } from "./appwriteClient";
import subjectService from "../appwrite/subjectService";
import { ID } from "appwrite";

export interface StudentGameStats {
  $id?: string;
  studentId: string;
  batchId: string;
  tradeId: string;
  xp: number;
  coins: number;
  level: number;
  wins: number;
  losses: number;
  accuracy: number;
  questionsAttempted: number;
  currentStreak: number;
  highestStreak: number;
  lastQuestionTime?: string;
  lastActive?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export class GameService extends DatabaseService {
  constructor() {
    super(conf.gameStatsCollectionId);
  }

  /**
   * Fetches or automatically initializes a student's gamified stats record for a batch.
   */
  async getStudentGameStats(
    studentId: string,
    batchId: string,
    tradeId: string
  ): Promise<StudentGameStats> {
    try {
      const response = await this.listRows<StudentGameStats>([
        Query.equal("studentId", studentId),
        Query.equal("batchId", batchId),
        Query.limit(1),
      ]);

      if (response.total > 0) {
        return response.rows[0];
      }

      // Initialize default stats
      const newStats: Omit<StudentGameStats, "$id" | "$createdAt" | "$updatedAt"> = {
        studentId,
        batchId,
        tradeId: tradeId || "unknown",
        xp: 0,
        coins: 0,
        level: 1,
        wins: 0,
        losses: 0,
        accuracy: 0,
        questionsAttempted: 0,
        currentStreak: 0,
        highestStreak: 0,
        lastQuestionTime: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      return await this.createRow<StudentGameStats>(newStats, undefined, ID.unique());
    } catch (error: any) {
      console.error("[GameService] getStudentGameStats failed, using fallback:", error);
      // Fallback in case table doesn't exist yet in Appwrite console
      return {
        studentId,
        batchId,
        tradeId: tradeId || "unknown",
        xp: 0,
        coins: 0,
        level: 1,
        wins: 0,
        losses: 0,
        accuracy: 0,
        questionsAttempted: 0,
        currentStreak: 0,
        highestStreak: 0,
      };
    }
  }

  /**
   * Fetches exactly ONE random Theory question for the student's trade.
   * Utilizes a count query + random offset + limit(1) to minimize database reads.
   */
  async getRandomQuestion(tradeId: string): Promise<any | null> {
    try {
      // Find Trade Theory subject ID (with localStorage caching)
      let subjectId = "";
      const subjectCacheKey = "theory_subject_id";
      try {
        const cached = typeof window !== "undefined" ? localStorage.getItem(subjectCacheKey) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.id === "string" && parsed.expiry > Date.now()) {
            subjectId = parsed.id;
          }
        }
      } catch (err) {
        console.warn("[GameService] Failed to read subject ID from localStorage", err);
      }

      if (!subjectId) {
        try {
          let theorySubject = await subjectService.getSubjectByName("Trade Theory");
          if (!theorySubject) {
            theorySubject = await subjectService.getSubjectByName("Theory");
          }
          if (theorySubject) {
            subjectId = theorySubject.$id;
            try {
              if (typeof window !== "undefined") {
                const cacheExpiry = Date.now() + 2 * 60 * 60 * 1050; // 2 hours + buffer
                localStorage.setItem(subjectCacheKey, JSON.stringify({ id: subjectId, expiry: cacheExpiry }));
              }
            } catch (err) {
              console.warn("[GameService] Failed to write subject ID to localStorage", err);
            }
          }
        } catch (err) {
          console.warn("[GameService] Failed to fetch subject ID, proceeding without subject filter", err);
        }
      }

      // Build initial query
      const baseQueries = [Query.equal("tradeId", tradeId)];
      if (subjectId) {
        baseQueries.push(Query.equal("subjectId", subjectId));
      }

      // Step 1: Get count of questions (with localStorage caching)
      const cacheKey = `ques_count_${tradeId}_${subjectId || "no_sub"}`;
      let total: number | null = null;
      try {
        const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.total === "number" && parsed.expiry > Date.now()) {
            total = parsed.total;
          }
        }
      } catch (err) {
        console.warn("[GameService] Failed to read from localStorage", err);
      }

      const { databases } = await import("./appwriteClient");

      if (total === null) {
        const countRes = await databases.listDocuments(
          conf.databaseId,
          conf.quesCollectionId,
          [...baseQueries, Query.limit(1), Query.select(["$id"])]
        );
        total = countRes.total;
        
        try {
          if (typeof window !== "undefined") {
            const cacheExpiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
            localStorage.setItem(cacheKey, JSON.stringify({ total, expiry: cacheExpiry }));
          }
        } catch (err) {
          console.warn("[GameService] Failed to write to localStorage", err);
        }
      }

      if (total === 0) {
        // Fallback: search questions with just tradeId if subject matches 0
        const backupCacheKey = `ques_count_backup_${tradeId}`;
        let backupTotal: number | null = null;
        try {
          const cached = typeof window !== "undefined" ? localStorage.getItem(backupCacheKey) : null;
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed.total === "number" && parsed.expiry > Date.now()) {
              backupTotal = parsed.total;
            }
          }
        } catch (err) {
          console.warn("[GameService] Failed to read backup localStorage", err);
        }

        if (backupTotal === null) {
          const backupRes = await databases.listDocuments(
            conf.databaseId,
            conf.quesCollectionId,
            [Query.equal("tradeId", tradeId), Query.limit(1), Query.select(["$id"])]
          );
          backupTotal = backupRes.total;
          
          try {
            if (typeof window !== "undefined") {
              const cacheExpiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
              localStorage.setItem(backupCacheKey, JSON.stringify({ total: backupTotal, expiry: cacheExpiry }));
            }
          } catch (err) {
            console.warn("[GameService] Failed to write backup localStorage", err);
          }
        }

        if (backupTotal === 0) return null;
        
        const randomOffset = Math.floor(Math.random() * backupTotal);
        const finalRes = await databases.listDocuments(
          conf.databaseId,
          conf.quesCollectionId,
          [Query.equal("tradeId", tradeId), Query.limit(1), Query.offset(randomOffset)]
        );
        return finalRes.documents[0] || null;
      }

      // Step 2: Generate random offset & get question
      const randomOffset = Math.floor(Math.random() * total);
      const finalRes = await databases.listDocuments(
        conf.databaseId,
        conf.quesCollectionId,
        [...baseQueries, Query.limit(1), Query.offset(randomOffset)]
      );

      return finalRes.documents[0] || null;
    } catch (error) {
      console.error("[GameService] getRandomQuestion failed:", error);
      return null;
    }
  }

  /**
   * Processes a question response: awards/deducts XP & coins and handles level ups.
   */
  async submitAnswer(
    studentId: string,
    batchId: string,
    tradeId: string,
    isCorrect: boolean,
    isFiftyFiftyUsed?: boolean
  ): Promise<{ stats: StudentGameStats; xpGained: number; coinsGained: number; levelUp: boolean }> {
    const stats = await this.getStudentGameStats(studentId, batchId, tradeId);
    
    const oldLevel = stats.level;
    let xpGained = 0;
    let coinsGained = 0;

    stats.questionsAttempted += 1;

    // Daily active streak calculation (Duolingo style)
    const now = new Date();
    let diffDays = 0;

    if (stats.lastQuestionTime) {
      const lastTime = new Date(stats.lastQuestionTime);
      const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const d2 = new Date(lastTime.getFullYear(), lastTime.getMonth(), lastTime.getDate());
      const diffTime = d1.getTime() - d2.getTime();
      diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    } else {
      // First time answering correctly
      diffDays = 999;
    }

    if (isCorrect) {
      xpGained = isFiftyFiftyUsed ? 5 : 10;
      coinsGained = 5;
      stats.xp += xpGained;
      stats.coins += coinsGained;
      stats.wins += 1;

      // Update streak only on correct answer
      if (diffDays === 1) {
        // Consecutive day correct activity
        stats.currentStreak += 1;
      } else if (diffDays >= 2 || !stats.lastQuestionTime) {
        // Missed day or first time answering correctly
        stats.currentStreak = 1;
      }
      // If diffDays === 0, keep current streak (can only increase once per day)

      if (stats.currentStreak > stats.highestStreak) {
        stats.highestStreak = stats.currentStreak;
      }

      // Mark the time of the last correct answer
      stats.lastQuestionTime = now.toISOString();
    } else {
      xpGained = -3;
      stats.xp = Math.max(0, stats.xp + xpGained); // Floor at 0
      stats.losses += 1;

      // If they missed consecutive days, their streak is broken
      if (diffDays >= 2) {
        stats.currentStreak = 0;
      }
    }

    // Level formula: 100 XP per level
    stats.level = Math.floor(stats.xp / 100) + 1;
    stats.accuracy = parseFloat(((stats.wins / stats.questionsAttempted) * 100).toFixed(1));
    stats.lastActive = now.toISOString();

    const levelUp = stats.level > oldLevel;

    // Update in DB (if the document has an ID, update it; otherwise return mock values)
    let updatedStats = stats;
    if (stats.$id) {
      try {
        updatedStats = await this.updateRow<StudentGameStats>(stats.$id, {
          xp: stats.xp,
          coins: stats.coins,
          level: stats.level,
          wins: stats.wins,
          losses: stats.losses,
          accuracy: stats.accuracy,
          questionsAttempted: stats.questionsAttempted,
          currentStreak: stats.currentStreak,
          highestStreak: stats.highestStreak,
          lastQuestionTime: stats.lastQuestionTime,
          lastActive: stats.lastActive,
        });
      } catch (err) {
        console.warn("[GameService] Failed to update stats in DB, proceeding with in-memory state:", err);
      }
    }

    return {
      stats: updatedStats,
      xpGained,
      coinsGained,
      levelUp,
    };
  }

  /**
   * Grants bonus XP and coins to a student (e.g. from teacher prizes or challenge claims).
   */
  async awardBonus(
    studentId: string,
    batchId: string,
    tradeId: string,
    xpBonus: number,
    coinsBonus: number
  ): Promise<StudentGameStats> {
    const stats = await this.getStudentGameStats(studentId, batchId, tradeId);
    stats.xp += xpBonus;
    stats.coins += coinsBonus;
    stats.level = Math.floor(stats.xp / 100) + 1;
    stats.lastActive = new Date().toISOString();

    if (stats.$id) {
      return await this.updateRow<StudentGameStats>(stats.$id, {
        xp: stats.xp,
        coins: stats.coins,
        level: stats.level,
        lastActive: stats.lastActive,
      });
    }

    return stats;
  }
}

export const gameService = new GameService();
export default gameService;
