import { gameService, StudentGameStats } from "./game.service";
import { cosmeticsService } from "./cosmetics.service";

export interface PowerUpsState {
  xpBoosterUntil?: string | null;
  streakShieldsCount?: number;
  extraSpins?: number;
}

export interface PowerUpItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
}

export const POWER_UP_ITEMS: PowerUpItem[] = [
  { id: "xp_booster", name: "XP Booster", desc: "2× XP for 1 hour", cost: 50 },
  { id: "streak_shield", name: "Streak Shield", desc: "Protect your streak for 1 day", cost: 30 },
  { id: "lucky_spin", name: "Lucky Spin ×2", desc: "Extra wheel spin today", cost: 20 }
];

export class PowerUpsService {
  /**
   * Safely retrieves the current power-ups state from student game stats.
   */
  getPowerUpsState(stats: StudentGameStats | null | undefined): PowerUpsState {
    const cosmetics = cosmeticsService.parseCosmetics(stats);
    return cosmetics.powerups || { streakShieldsCount: 0, extraSpins: 0 };
  }

  /**
   * Purchase a power-up using coins.
   */
  async purchasePowerUp(
    studentId: string,
    batchId: string,
    tradeId: string,
    powerUpId: string
  ): Promise<StudentGameStats> {
    const stats = await gameService.getStudentGameStats(studentId, batchId, tradeId);
    const item = POWER_UP_ITEMS.find((i) => i.id === powerUpId);

    if (!item) {
      throw new Error(`Power-up ${powerUpId} not found.`);
    }

    if (stats.coins < item.cost) {
      throw new Error("Insufficient coins to purchase this power-up.");
    }

    // Parse existing cosmetic/power-up JSON state
    const cosmeticsState = cosmeticsService.parseCosmetics(stats);
    if (!cosmeticsState.powerups) {
      cosmeticsState.powerups = { streakShieldsCount: 0, extraSpins: 0 };
    }

    const powerups = cosmeticsState.powerups;

    // Apply specific purchase logic
    if (powerUpId === "xp_booster") {
      const durationMs = 60 * 60 * 1000; // 1 hour
      const currentBoosterUntil = powerups.xpBoosterUntil ? new Date(powerups.xpBoosterUntil).getTime() : 0;
      const nowMs = Date.now();
      const baseTime = currentBoosterUntil > nowMs ? currentBoosterUntil : nowMs;
      powerups.xpBoosterUntil = new Date(baseTime + durationMs).toISOString();
    } else if (powerUpId === "streak_shield") {
      powerups.streakShieldsCount = (powerups.streakShieldsCount || 0) + 1;
    } else if (powerUpId === "lucky_spin") {
      powerups.extraSpins = (powerups.extraSpins || 0) + 1;
    }

    // Deduct coins and update state
    stats.coins -= item.cost;
    stats.unlockedCosmetics = JSON.stringify(cosmeticsState);

    if (stats.$id) {
      return await gameService.updateRow<StudentGameStats>(stats.$id, {
        coins: stats.coins,
        unlockedCosmetics: stats.unlockedCosmetics,
      });
    }

    return stats;
  }
}

export const powerUpsService = new PowerUpsService();
export default powerUpsService;
