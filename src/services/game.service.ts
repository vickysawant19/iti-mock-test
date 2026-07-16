import { DatabaseService } from "./database.service";
import conf from "../config/config";
import { Query } from "./appwriteClient";
import subjectService from "../appwrite/subjectService";
import { ID } from "appwrite";

// Helper to get local date string in YYYY-MM-DD format (respecting user's local timezone / IST)
function getLocalDateString(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split("T")[0];
}

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
  lastWheelSpinTime?: string;
  unlockedCosmetics?: string;
  // Daily stats
  dailyWins?: number;
  dailyLosses?: number;
  dailyQuestionsAttempted?: number;
  dailyStatsDate?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface BatchGameSettings {
  $id?: string;
  batchId: string;
  questionFilter: string; // "all" | "first_year" | "second_year" | "module"
  selectedModuleId?: string;
  selectedModuleName?: string;
  correctAnswerXp: number;
  correctAnswerCoins: number;
  streakXpBonus: number;
  $createdAt?: string;
  $updatedAt?: string;
}

export class GameService extends DatabaseService {
  private settingsCache = new Map<string, BatchGameSettings>();

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
        currentStreak: 1,
        highestStreak: 1,
        lastQuestionTime: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        dailyWins: 0,
        dailyLosses: 0,
        dailyQuestionsAttempted: 0,
        dailyStatsDate: getLocalDateString(),
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
        currentStreak: 1,
        highestStreak: 1,
      };
    }
  }

  /**
   * Fetches exactly ONE random Theory question for the student's trade.
   * Utilizes a count query + random offset + limit(1) to minimize database reads.
   */
   async getRandomQuestion(tradeId: string, settings?: BatchGameSettings): Promise<any | null> {
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

      // Apply settings filter if available
      let settingsSuffix = "all";
      if (settings) {
        // Extract moduleId(s) and tags list (format: "m15,m16|tag1,tag2")
        let modulesList: string[] = [];
        let tagsList: string[] = [];

        if (settings.selectedModuleId) {
          if (settings.selectedModuleId.includes("|")) {
            const parts = settings.selectedModuleId.split("|");
            if (parts[0]) {
              modulesList = parts[0].split(",").map(m => m.trim()).filter(Boolean);
            }
            if (parts[1]) {
              tagsList = parts[1].split(",").map(t => t.trim()).filter(Boolean);
            }
          } else {
            // Backward compatibility
            modulesList = [settings.selectedModuleId];
          }
        }

        if (settings.questionFilter === "first_year") {
          baseQueries.push(Query.equal("year", "FIRST"));
          settingsSuffix = "first_year";
        } else if (settings.questionFilter === "second_year") {
          baseQueries.push(Query.equal("year", "SECOND"));
          settingsSuffix = "second_year";
        } else if (settings.questionFilter === "module" && modulesList.length > 0) {
          if (modulesList.length === 1) {
            baseQueries.push(Query.equal("moduleId", modulesList[0]));
          } else {
            baseQueries.push(
              Query.or(
                modulesList.map(m => Query.equal("moduleId", m))
              )
            );
          }
          settingsSuffix = `module_${modulesList.join("_")}`;
        }

        // Apply optional tags filter if configured
        if (tagsList.length > 0) {
          if (tagsList.length === 1) {
            baseQueries.push(Query.contains("tags", tagsList[0]));
          } else {
            baseQueries.push(
              Query.or(
                tagsList.map(t => Query.contains("tags", t))
              )
            );
          }
          settingsSuffix += `_tags_${tagsList.join("_")}`;
        }
      }


      // Step 1: Get count of questions (with localStorage caching)
      const cacheKey = `ques_count_${tradeId}_${subjectId || "no_sub"}_${settingsSuffix}`;
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
  ): Promise<{ stats: StudentGameStats; xpGained: number; coinsGained: number; streakBonus?: number; levelUp: boolean }> {
    const stats = await this.getStudentGameStats(studentId, batchId, tradeId);
    const settings = await this.getBatchGameSettings(batchId);
    
    const oldLevel = stats.level;
    let xpGained = 0;
    let coinsGained = 0;
    let streakBonus = 0;

    stats.questionsAttempted += 1;

    // Daily stats: reset if date changed
    const now = new Date();
    const todayDate = getLocalDateString(now);
    if (stats.dailyStatsDate !== todayDate) {
      stats.dailyWins = 0;
      stats.dailyLosses = 0;
      stats.dailyQuestionsAttempted = 0;
      stats.dailyStatsDate = todayDate;
    }
    stats.dailyQuestionsAttempted = (stats.dailyQuestionsAttempted || 0) + 1;

    // Daily active streak calculation (Duolingo style)

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
      const baseXP = settings?.correctAnswerXp !== undefined ? Number(settings.correctAnswerXp) : 10;
      const baseCoins = settings?.correctAnswerCoins !== undefined ? Number(settings.correctAnswerCoins) : 5;
      
      // Calculate streak bonus
      streakBonus = 0;
      if (diffDays === 1 || stats.currentStreak > 0) {
        const bonusPerDay = settings?.streakXpBonus !== undefined ? Number(settings.streakXpBonus) : 2;
        streakBonus = stats.currentStreak * bonusPerDay;
      }

      xpGained = isFiftyFiftyUsed ? Math.round(baseXP / 2) : baseXP;
      xpGained += streakBonus;
      coinsGained = baseCoins;
      
      stats.xp += xpGained;
      stats.coins += coinsGained;
      stats.wins += 1;
      stats.dailyWins = (stats.dailyWins || 0) + 1;

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
      stats.dailyLosses = (stats.dailyLosses || 0) + 1;

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

    // Update in DB
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
          dailyWins: stats.dailyWins,
          dailyLosses: stats.dailyLosses,
          dailyQuestionsAttempted: stats.dailyQuestionsAttempted,
          dailyStatsDate: stats.dailyStatsDate,
        });
      } catch (err) {
        console.warn("[GameService] Failed to update stats in DB, proceeding with in-memory state:", err);
      }
    }

    return {
      stats: updatedStats,
      xpGained,
      coinsGained,
      streakBonus,
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

  /**
   * Converts a student's XP into coins at the given rate.
   * Default rate: 10 XP → 1 coin.
   * @param xpAmount  The amount of XP to convert (must be > 0 and ≤ current XP).
   * @param rate      XP per 1 coin (default 10).
   */
  async convertXpToCoins(
    studentId: string,
    batchId: string,
    tradeId: string,
    xpAmount: number,
    rate: number = 10
  ): Promise<{ stats: StudentGameStats; coinsGained: number }> {
    if (xpAmount <= 0) throw new Error("XP amount must be greater than 0");

    const stats = await this.getStudentGameStats(studentId, batchId, tradeId);

    if ((stats.xp || 0) < xpAmount) {
      throw new Error(`Not enough XP. You have ${stats.xp} XP.`);
    }

    const coinsGained = Math.floor(xpAmount / rate);
    if (coinsGained < 1) {
      throw new Error(`Minimum conversion is ${rate} XP for 1 coin.`);
    }

    stats.xp = Math.max(0, stats.xp - xpAmount);
    stats.coins = (stats.coins || 0) + coinsGained;
    stats.level = Math.floor(stats.xp / 100) + 1;
    stats.lastActive = new Date().toISOString();

    let updatedStats = stats;
    if (stats.$id) {
      updatedStats = await this.updateRow<StudentGameStats>(stats.$id, {
        xp: stats.xp,
        coins: stats.coins,
        level: stats.level,
        lastActive: stats.lastActive,
      });
    }

    return { stats: updatedStats, coinsGained };
  }


  /**
   * Processes a daily spin reward for the lucky wheel.
   * Leverages both localStorage and database fields for last spin tracking.
   */
  async spinLuckyWheel(
    studentId: string,
    batchId: string,
    tradeId: string,
    xpReward: number,
    coinsReward: number
  ): Promise<StudentGameStats> {
    const stats = await this.getStudentGameStats(studentId, batchId, tradeId);
    stats.xp += xpReward;
    stats.coins += coinsReward;
    stats.level = Math.floor(stats.xp / 100) + 1;
    stats.lastActive = new Date().toISOString();
    const spinTime = new Date().toISOString();

    const storageKey = `last_wheel_spin_${studentId}_${batchId}`;
    try {
      localStorage.setItem(storageKey, spinTime);
    } catch (e) {
      console.warn("Failed to save spin time to localStorage", e);
    }

    if (stats.$id) {
      try {
        const { databases } = await import("./appwriteClient");
        const updated = await databases.updateDocument(
          conf.databaseId,
          conf.gameStatsCollectionId,
          stats.$id,
          {
            xp: stats.xp,
            coins: stats.coins,
            level: stats.level,
            lastActive: stats.lastActive,
            lastWheelSpinTime: spinTime,
          }
        );
        return updated as unknown as StudentGameStats;
      } catch (err: any) {
        console.warn(
          "[GameService] Failed to write lastWheelSpinTime to database. Falling back to writing standard fields.",
          err
        );
        return await this.updateRow<StudentGameStats>(stats.$id, {
          xp: stats.xp,
          coins: stats.coins,
          level: stats.level,
          lastActive: stats.lastActive,
        });
      }
    }

    return stats;
  }

  /**
   * Checks if the student is eligible to spin the wheel today (calendar day comparison).
   */
  canSpinLuckyWheel(studentId: string, batchId: string, stats?: StudentGameStats | null): boolean {
    const storageKey = `last_wheel_spin_${studentId}_${batchId}`;
    let lastSpinStr: string | null = null;

    try {
      lastSpinStr = localStorage.getItem(storageKey);
    } catch (e) {}

    if (!lastSpinStr && stats && stats.lastWheelSpinTime) {
      lastSpinStr = stats.lastWheelSpinTime;
    }

    if (!lastSpinStr) return true;

    const lastSpin = new Date(lastSpinStr);
    const now = new Date();

    return (
      lastSpin.getFullYear() !== now.getFullYear() ||
      lastSpin.getMonth() !== now.getMonth() ||
      lastSpin.getDate() !== now.getDate()
    );
  }

  /**
   * Fetches the batch-specific game configuration settings (question filters and rewards).
   * Automatically falls back to localStorage or default configurations on failure.
   */
  async getBatchGameSettings(batchId: string): Promise<BatchGameSettings> {
    if (this.settingsCache.has(batchId)) {
      return this.settingsCache.get(batchId)!;
    }

    const cacheKey = `game_settings_${batchId}`;
    const defaultSettings: BatchGameSettings = {
      batchId,
      questionFilter: "all",
      correctAnswerXp: 10,
      correctAnswerCoins: 5,
      streakXpBonus: 2,
    };

    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const settings = JSON.parse(cached) as BatchGameSettings;
          this.settingsCache.set(batchId, settings);
          return settings;
        }
      }
    } catch (err) {
      console.warn("[GameService] Failed to read settings from cache:", err);
    }

    try {
      const { databases } = await import("./appwriteClient");
      const response = await databases.listDocuments(
        conf.databaseId,
        "batch_game_settings",
        [Query.equal("batchId", batchId), Query.limit(1)]
      );
      if (response.total > 0) {
        const settings = response.documents[0] as unknown as BatchGameSettings;
        if (typeof window !== "undefined") {
          localStorage.setItem(cacheKey, JSON.stringify(settings));
        }
        this.settingsCache.set(batchId, settings);
        return settings;
      }
    } catch (dbError) {
      console.warn("[GameService] Appwrite batch_game_settings fetch failed, using fallback:", dbError);
    }

    return defaultSettings;
  }

  /**
   * Upserts the batch-specific game configuration settings.
   */
  async saveBatchGameSettings(
    batchId: string,
    settings: Omit<BatchGameSettings, "$id" | "$createdAt" | "$updatedAt">
  ): Promise<BatchGameSettings> {
    const cacheKey = `game_settings_${batchId}`;
    try {
      const { databases } = await import("./appwriteClient");
      
      let existingId = "";
      try {
        const response = await databases.listDocuments(
          conf.databaseId,
          "batch_game_settings",
          [Query.equal("batchId", batchId), Query.limit(1)]
        );
        if (response.total > 0) {
          existingId = response.documents[0].$id;
        }
      } catch (err) {
        console.warn("[GameService] Failed to check existing settings:", err);
      }

      let result: BatchGameSettings;
      if (existingId) {
        const updated = await databases.updateDocument(
          conf.databaseId,
          "batch_game_settings",
          existingId,
          settings
        );
        result = updated as unknown as BatchGameSettings;
      } else {
        const created = await databases.createDocument(
          conf.databaseId,
          "batch_game_settings",
          ID.unique(),
          settings
        );
        result = created as unknown as BatchGameSettings;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      }
      this.settingsCache.set(batchId, result);
      return result;
    } catch (error: any) {
      console.error("[GameService] saveBatchGameSettings failed, using fallback:", error);
      const fallbackResult = {
        $id: "local_" + Date.now(),
        ...settings,
      } as BatchGameSettings;
      if (typeof window !== "undefined") {
        localStorage.setItem(cacheKey, JSON.stringify(fallbackResult));
      }
      this.settingsCache.set(batchId, fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * Fetches all modules for a given trade under "Trade Theory" or "Theory".
   */
  async getModulesForTrade(tradeId: string): Promise<any[]> {
    try {
      const subjectService = (await import("../appwrite/subjectService")).default;
      const moduleServices = (await import("../appwrite/moduleServices")).default;
      
      let theorySubject = await subjectService.getSubjectByName("Trade Theory");
      if (!theorySubject) {
        theorySubject = await subjectService.getSubjectByName("Theory");
      }
      const subjectId = theorySubject ? theorySubject.$id : "";
      if (!subjectId) return [];

      const [year1Modules, year2Modules] = await Promise.all([
        moduleServices.getNewModulesData(tradeId, subjectId, "FIRST").catch(() => []),
        moduleServices.getNewModulesData(tradeId, subjectId, "SECOND").catch(() => []),
      ]);
      
      return [...(year1Modules || []), ...(year2Modules || [])];
    } catch (e) {
      console.error("[GameService] getModulesForTrade failed:", e);
      return [];
    }
  }

  /**
   * Updates the in-memory cache for a batch's game settings (typically called on realtime updates).
   */
  updateSettingsCache(batchId: string, settings: BatchGameSettings): void {
    this.settingsCache.set(batchId, settings);
  }
}

export const gameService = new GameService();
export default gameService;
