/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  Zap,
  Coins,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  Star,
  Gift,
} from "lucide-react";
import CosmeticStoreTab from "./CosmeticStoreTab";

const SpendSection = ({ stats }) => {
  const items = [
    { icon: Sparkles, label: "XP Booster", desc: "2× XP for 1 hour", cost: 50, color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
    { icon: Star, label: "Streak Shield", desc: "Protect your streak for 1 day", cost: 30, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: Gift, label: "Lucky Spin ×2", desc: "Extra wheel spin today", cost: 20, color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
  ];

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
          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 p-3 rounded-xl border ${item.bg} transition-all`}
            >
              <div className={`p-2 rounded-xl bg-white/60 dark:bg-slate-900/40 shrink-0 ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{item.label}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{item.desc}</p>
              </div>
              <button
                disabled={!canAfford}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  canAfford
                    ? "bg-yellow-500 hover:bg-yellow-400 text-white shadow-sm shadow-yellow-500/20 active:scale-95"
                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Coins className="w-3 h-3" />
                {item.cost}
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
}) {
  return (
    <div className="space-y-6">
      {/* Spend Coins on Power-ups */}
      <SpendSection stats={stats} />

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
