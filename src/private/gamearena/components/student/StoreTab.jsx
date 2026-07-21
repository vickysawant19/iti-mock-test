/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  Zap,
  Coins,
  Loader2,
  ShoppingBag,
  Sparkles,
  Star,
  Gift,
} from "lucide-react";
import { toast } from "react-toastify";
import CosmeticStoreTab from "./CosmeticStoreTab";

const SpendSection = ({ stats, purchasePowerUp }) => {
  const [isPurchasing, setIsPurchasing] = useState(null);

  // Parse inventory from unlockedCosmetics JSON
  let powerups = { streakShieldsCount: 0, extraSpins: 0, xpBoosterUntil: null };
  try {
    if (stats?.unlockedCosmetics) {
      const parsed = typeof stats.unlockedCosmetics === "string"
        ? JSON.parse(stats.unlockedCosmetics)
        : stats.unlockedCosmetics;
      if (parsed?.powerups) {
        powerups = parsed.powerups;
      }
    }
  } catch (err) {
    console.warn("Failed to parse powerups inside StoreTab", err);
  }

  // Calculate remaining booster time
  const xpBoosterUntil = powerups.xpBoosterUntil ? new Date(powerups.xpBoosterUntil).getTime() : 0;
  const now = Date.now();
  const boosterDiffMs = xpBoosterUntil - now;
  const boosterMinutesLeft = boosterDiffMs > 0 ? Math.ceil(boosterDiffMs / (1000 * 60)) : 0;

  const items = [
    { id: "xp_booster", icon: Sparkles, label: "XP Booster", desc: "2× XP for 1 hour", cost: 50, color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
    { id: "streak_shield", icon: Star, label: "Streak Shield", desc: "Protect your streak for 1 day", cost: 30, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
    { id: "lucky_spin", icon: Gift, label: "Lucky Spin ×2", desc: "Extra wheel spin today", cost: 20, color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
  ];

  const handleBuy = async (item) => {
    if (isPurchasing) return;
    setIsPurchasing(item.id);
    try {
      await purchasePowerUp(item.id);
      toast.success(`${item.label} purchased successfully! 🎉`);
    } catch (err) {
      toast.error(err.message || `Failed to purchase ${item.label}.`);
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <div className="bg-white/40 dark:bg-[#110d29]/30 backdrop-blur-md border border-slate-200/85 dark:border-[#221a48] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-[#221a48] flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-pink-500/10 rounded-xl">
            <ShoppingBag className="w-4 h-4 text-pink-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">
              Spend Coins (Power-ups)
            </h3>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
              Use your coins to unlock power-ups
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-black text-yellow-500 shrink-0">
          <Coins className="w-3.5 h-3.5" />
          {stats?.coins ?? 0}
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        {items.map((item) => {
          const canAfford = (stats?.coins ?? 0) >= item.cost;
          const isCurrentPurchasing = isPurchasing === item.id;
          
          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 p-3 rounded-xl border ${item.bg} transition-all`}
            >
              <div className={`p-2 rounded-xl bg-white/60 dark:bg-slate-900/40 shrink-0 ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{item.label}</p>
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase ${
                    item.id === "xp_booster" && boosterMinutesLeft > 0
                      ? "bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/50 dark:border-slate-700/50"
                  }`}>
                    {item.id === "xp_booster" ? (boosterMinutesLeft > 0 ? `Active (${boosterMinutesLeft}m)` : "Inactive") :
                     item.id === "streak_shield" ? `Owned: ${powerups.streakShieldsCount || 0}` :
                     `Spins: ${powerups.extraSpins || 0}`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{item.desc}</p>
              </div>
              <button
                disabled={!canAfford || isCurrentPurchasing}
                onClick={() => handleBuy(item)}
                className={`shrink-0 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer min-w-[62px] h-8 ${
                  canAfford && !isCurrentPurchasing
                    ? "bg-yellow-500 hover:bg-yellow-400 text-white shadow-sm shadow-yellow-500/20 active:scale-95"
                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isCurrentPurchasing ? (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                ) : (
                  <>
                    <Coins className="w-3 h-3" />
                    {item.cost}
                  </>
                )}
              </button>
            </div>
          );
        })}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 font-medium pt-1">
          More power-ups coming soon ✨
        </p>
      </div>
    </div>
  );
};

export default function StoreTab({
  stats,
  purchaseCosmetic,
  equipCosmetic,
  purchasePowerUp,
}) {
  return (
    <div className="space-y-6">
      {/* Spend Coins on Power-ups */}
      <SpendSection stats={stats} purchasePowerUp={purchasePowerUp} />

      {/* Spend Coins on Avatars/Cosmetics */}
      <div className="space-y-3">
        <div className="px-1 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">
            Avatar Shop
          </h3>
        </div>
        <CosmeticStoreTab
          stats={stats}
          purchaseCosmetic={purchaseCosmetic}
          equipCosmetic={equipCosmetic}
          hideHeader={true}
        />
      </div>
    </div>
  );
}
