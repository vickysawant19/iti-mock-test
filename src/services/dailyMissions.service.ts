import { DatabaseService } from "./database.service";
import conf from "../config/config";
import { Query } from "./appwriteClient";
import { ID } from "appwrite";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyMission {
  $id?: string;
  studentId: string;
  batchId: string;
  date: string;           // "YYYY-MM-DD"
  missionId: string;      // "answer_10_questions"
  type: string;           // "questions" | "xp" | "login" | "correct_streak"
  label: string;          // "Answer 10 Questions"
  progress: number;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  claimed: boolean;
  $createdAt?: string;
}

// ─── Mission Templates ────────────────────────────────────────────────────────

const MISSION_POOL = [
  { missionId: "answer_10_questions", type: "questions",       label: "Answer 10 Questions",         target: 10,  rewardXp: 50,  rewardCoins: 10 },
  { missionId: "answer_20_questions", type: "questions",       label: "Answer 20 Questions",         target: 20,  rewardXp: 100, rewardCoins: 20 },
  { missionId: "answer_5_questions",  type: "questions",       label: "Answer 5 Questions",          target: 5,   rewardXp: 25,  rewardCoins: 5  },
  { missionId: "earn_100_xp",         type: "xp",              label: "Earn 100 XP Today",           target: 100, rewardXp: 30,  rewardCoins: 10 },
  { missionId: "earn_200_xp",         type: "xp",              label: "Earn 200 XP Today",           target: 200, rewardXp: 60,  rewardCoins: 20 },
  { missionId: "earn_300_xp",         type: "xp",              label: "Earn 300 XP Today",           target: 300, rewardXp: 100, rewardCoins: 30 },
  { missionId: "login_today",         type: "login",           label: "Login Today",                 target: 1,   rewardXp: 20,  rewardCoins: 5  },
  { missionId: "correct_streak_3",    type: "correct_streak",  label: "Get 3 Correct in a Row",      target: 3,   rewardXp: 40,  rewardCoins: 10 },
  { missionId: "correct_streak_5",    type: "correct_streak",  label: "Get 5 Correct in a Row",      target: 5,   rewardXp: 75,  rewardCoins: 15 },
  { missionId: "get_10_correct",      type: "correct_answers", label: "Get 10 Correct Answers",      target: 10,  rewardXp: 60,  rewardCoins: 15 },
];

// Deterministically pick 4 missions per student per day (seeded by date + studentId)
function pickDailyMissions(studentId: string, date: string) {
  const seed = [...(studentId + date)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffled = [...MISSION_POOL].sort((a, b) => {
    const ha = Math.sin(seed + a.missionId.length) * 10000;
    const hb = Math.sin(seed + b.missionId.length) * 10000;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });
  return shuffled.slice(0, 4);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class DailyMissionsService extends DatabaseService {
  constructor() {
    super("daily_missions");
  }

  /**
   * Returns today's missions for a student, creating them if they don't exist yet.
   */
  async getTodayMissions(studentId: string, batchId: string): Promise<DailyMission[]> {
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    try {
      const res = await this.listRows<DailyMission>([
        Query.equal("studentId", studentId),
        Query.equal("date", today),
        Query.limit(10),
      ]);

      if (res.total > 0) {
        return res.rows;
      }

      // First visit of the day — generate and store missions
      return await this.generateMissions(studentId, batchId, today);
    } catch (err) {
      console.error("[DailyMissionsService] getTodayMissions failed:", err);
      return [];
    }
  }

  /**
   * Creates today's mission documents in the database.
   */
  private async generateMissions(studentId: string, batchId: string, date: string): Promise<DailyMission[]> {
    const templates = pickDailyMissions(studentId, date);
    const created: DailyMission[] = [];

    for (const tpl of templates) {
      try {
        const doc = await this.createRow<DailyMission>({
          studentId,
          batchId,
          date,
          missionId: tpl.missionId,
          type: tpl.type,
          label: tpl.label,
          progress: 0,
          target: tpl.target,
          rewardXp: tpl.rewardXp,
          rewardCoins: tpl.rewardCoins,
          claimed: false,
        }, undefined, ID.unique());
        created.push(doc);
      } catch (err) {
        console.warn("[DailyMissionsService] Failed to create mission:", tpl.missionId, err);
      }
    }

    return created;
  }

  /**
   * Increments progress on all matching missions of a given type.
   * Call after each game event (e.g., answering a question correctly).
   */
  async incrementProgress(
    studentId: string,
    type: string,
    amount: number = 1
  ): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await this.listRows<DailyMission>([
        Query.equal("studentId", studentId),
        Query.equal("date", today),
        Query.equal("type", type),
        Query.limit(5),
      ]);

      for (const mission of res.rows) {
        if (mission.claimed) continue;
        const newProgress = Math.min((mission.progress || 0) + amount, mission.target);
        if (mission.$id && newProgress !== mission.progress) {
          await this.updateRow<DailyMission>(mission.$id, { progress: newProgress });
        }
      }
    } catch (err) {
      console.warn("[DailyMissionsService] incrementProgress failed:", err);
    }
  }

  /**
   * Marks a completed mission as claimed and returns the reward amounts.
   */
  async claimMission(missionId: string): Promise<{ xpReward: number; coinsReward: number } | null> {
    try {
      const mission = await this.getRow<DailyMission>(missionId);
      if (!mission || mission.claimed) return null;
      if ((mission.progress || 0) < mission.target) return null;

      await this.updateRow<DailyMission>(missionId, { claimed: true });
      return { xpReward: mission.rewardXp || 0, coinsReward: mission.rewardCoins || 0 };
    } catch (err) {
      console.error("[DailyMissionsService] claimMission failed:", err);
      return null;
    }
  }
}

export const dailyMissionsService = new DailyMissionsService();
export default dailyMissionsService;
