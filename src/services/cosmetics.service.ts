import { DatabaseService } from "./database.service";
import { gameService, StudentGameStats } from "./game.service";
import userProfileService from "../appwrite/userProfileService";

// ─── Cosmetic Item Types ──────────────────────────────────────────────────────

export interface CosmeticItem {
  id: string;
  name: string;
  category: "avatar" | "frame" | "title" | "emoji" | "border";
  cost: number;
  description: string;
  value: string; // Style value, text title, emoji character, or image URL
}

// ─── Cosmetic Registry ────────────────────────────────────────────────────────

export const COSMETIC_ITEMS: CosmeticItem[] = [
  // Avatars
  { id: "avatar_pixel_knight", name: "Pixel Knight", category: "avatar", cost: 100, description: "A classic retro knight avatar.", value: "/cosmetics/avatar_pixel_knight.svg" },
  { id: "avatar_cyberpunk", name: "Cyber Cyberpunk", category: "avatar", cost: 250, description: "Future neon digital hacker.", value: "/cosmetics/avatar_cyberpunk.svg" },
  { id: "avatar_coding_guru", name: "Coding Guru", category: "avatar", cost: 500, description: "With glasses and matrix background.", value: "/cosmetics/avatar_coding_guru.svg" },
  { id: "avatar_legendary_wizard", name: "Legendary Wizard", category: "avatar", cost: 1000, description: "Arcane scholar of computational magic.", value: "/cosmetics/avatar_legendary_wizard.svg" },

  // Frames
  { id: "frame_bronze", name: "Bronze Frame", category: "frame", cost: 50, description: "Solid bronze avatar frame.", value: "border-2 border-amber-700" },
  { id: "frame_silver", name: "Silver Frame", category: "frame", cost: 150, description: "Shiny silver metallic frame.", value: "border-2 border-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.6)]" },
  { id: "frame_gold", name: "Gold Frame", category: "frame", cost: 300, description: "Pulsing gold frame for elite players.", value: "border-2 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.8)] animate-pulse" },
  { id: "frame_neon", name: "Neon Glow", category: "frame", cost: 600, description: "Vibrant color-cycling neon ring.", value: "border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,1)] animate-pulse bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" },

  // Titles
  { id: "title_rookie", name: "Rookie Tester", category: "title", cost: 30, description: "Just starting out in the arena.", value: "Rookie Tester" },
  { id: "title_bug_hunter", name: "Bug Hunter", category: "title", cost: 100, description: "Finds the errors in the machine.", value: "Bug Hunter" },
  { id: "title_code_warrior", name: "Code Warrior", category: "title", cost: 250, description: "Fights the compiler and wins.", value: "Code Warrior" },
  { id: "title_grandmaster", name: "Grandmaster", category: "title", cost: 750, description: "The ultimate training rank.", value: "Grandmaster" },

  // Emojis
  { id: "emoji_laugh_robot", name: "Laughing Robot", category: "emoji", cost: 25, description: "Custom chat emoji: 🤖", value: "🤖" },
  { id: "emoji_cool_brain", name: "Cool Brain", category: "emoji", cost: 50, description: "Custom chat emoji: 🧠", value: "🧠" },
  { id: "emoji_fire_coding", name: "Fire Coding", category: "emoji", cost: 100, description: "Custom chat emoji: 💻", value: "💻" },
  { id: "emoji_golden_crown", name: "Golden Crown", category: "emoji", cost: 200, description: "Custom chat emoji: 👑", value: "👑" },

  // Borders
  { id: "border_sunset", name: "Sunset Gradient", category: "border", cost: 120, description: "Warm orange-red profile border.", value: "border-2 border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.3)] bg-gradient-to-r from-orange-950/20 via-slate-900 to-red-950/20" },
  { id: "border_nebula", name: "Space Nebula", category: "border", cost: 250, description: "Cosmic purple-blue profile border.", value: "border-2 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-gradient-to-r from-purple-950/20 via-slate-900 to-blue-950/20" },
  { id: "border_emerald", name: "Royal Emerald", category: "border", cost: 500, description: "Green glassmorphism profile border.", value: "border-2 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.3)] bg-gradient-to-r from-emerald-950/20 via-slate-900 to-teal-950/20" },
  { id: "border_void", name: "Mythic Void", category: "border", cost: 1000, description: "Obsidian border with dark particles.", value: "border-2 border-pink-500/80 shadow-[0_0_30px_rgba(236,72,153,0.4)] bg-gradient-to-r from-[#110C24] via-[#1A123C] to-[#251A56]" },
];

export interface UnlockedCosmeticsState {
  unlocked: string[];
  equipped: {
    avatar?: string | null;
    frame?: string | null;
    title?: string | null;
    emoji?: string | null;
    border?: string | null;
  };
}

// ─── Cosmetics Service ────────────────────────────────────────────────────────

export class CosmeticsService extends DatabaseService {
  constructor() {
    super("student_game_stats");
  }

  /**
   * Safely parses the unlockedCosmetics JSON list inside student_game_stats.
   */
  parseCosmetics(stats: StudentGameStats | null | undefined): UnlockedCosmeticsState {
    if (!stats || !stats.unlockedCosmetics) {
      return { unlocked: [], equipped: {} };
    }
    try {
      return typeof stats.unlockedCosmetics === "string"
        ? JSON.parse(stats.unlockedCosmetics)
        : stats.unlockedCosmetics;
    } catch (e) {
      console.warn("[CosmeticsService] Failed to parse unlockedCosmetics JSON:", e);
      return { unlocked: [], equipped: {} };
    }
  }

  /**
   * Purchase a cosmetic item using earned coins.
   */
  async purchaseCosmetic(
    studentId: string,
    batchId: string,
    tradeId: string,
    itemId: string
  ): Promise<StudentGameStats> {
    const stats = await gameService.getStudentGameStats(studentId, batchId, tradeId);
    const item = COSMETIC_ITEMS.find((i) => i.id === itemId);

    if (!item) {
      throw new Error(`Item ${itemId} not found in store.`);
    }

    if (stats.coins < item.cost) {
      throw new Error("Insufficient coins to purchase this item.");
    }

    const state = this.parseCosmetics(stats);

    if (state.unlocked.includes(itemId)) {
      throw new Error("Item is already purchased.");
    }

    // Purchase calculations
    stats.coins -= item.cost;
    state.unlocked.push(itemId);
    stats.unlockedCosmetics = JSON.stringify(state);

    if (stats.$id) {
      return await this.updateRow<StudentGameStats>(stats.$id, {
        coins: stats.coins,
        unlockedCosmetics: stats.unlockedCosmetics,
      });
    }

    return stats;
  }

  /**
   * Equip or unequip a purchased cosmetic item.
   */
  async equipCosmetic(
    studentId: string,
    batchId: string,
    tradeId: string,
    category: "avatar" | "frame" | "title" | "emoji" | "border",
    itemId: string | null
  ): Promise<StudentGameStats> {
    const stats = await gameService.getStudentGameStats(studentId, batchId, tradeId);
    const state = this.parseCosmetics(stats);

    if (itemId !== null && !state.unlocked.includes(itemId)) {
      throw new Error("Cannot equip an item that has not been purchased.");
    }

    // Update equipment selection
    state.equipped = {
      ...state.equipped,
      [category]: itemId,
    };
    stats.unlockedCosmetics = JSON.stringify(state);

    let updatedStats = stats;

    if (stats.$id) {
      updatedStats = await this.updateRow<StudentGameStats>(stats.$id, {
        unlockedCosmetics: stats.unlockedCosmetics,
      });
    }

    return updatedStats;
  }
}

export const cosmeticsService = new CosmeticsService();
export default cosmeticsService;
