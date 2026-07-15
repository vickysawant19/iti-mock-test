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

const RATE = 10; // 10 XP = 1 Coin

const XpConverter = ({ stats, convertXpToCoins }) => {
  const maxXp = stats?.xp || 0;
  const maxConvertable = Math.floor(maxXp / RATE) * RATE;
  const [xpToConvert, setXpToConvert] = useState(RATE);
  const [converting, setConverting] = useState(false);
  const [msg, setMsg] = useState("");

  const safeXp = Math.min(xpToConvert, maxConvertable);
  const coinsPreview = Math.floor(safeXp / RATE);

  return (
    <div className="bg-white/40 dark:bg-[#110d29]/30 backdrop-blur-md border border-slate-200/85 dark:border-[#221a48] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-[#221a48] flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-xl">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">
              XP ➔ Coins Exchange
            </h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Rate: {RATE} XP = 1 Coin
            </p>
          </div>
        </div>
        {/* Balances */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-xs font-black text-amber-500">
              <Zap className="w-3.5 h-3.5" />
              {stats?.xp ?? 0}
            </span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">XP</span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-xs font-black text-yellow-500">
              <Coins className="w-3.5 h-3.5" />
              {stats?.coins ?? 0}
            </span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Coins</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {maxConvertable < RATE ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Zap className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium">
              You need at least{" "}
              <span className="font-bold text-amber-500">{RATE} XP</span> to convert.
            </p>
          </div>
        ) : (
          <>
            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-500 dark:text-slate-400">Amount to convert</span>
                <span className="text-amber-500">{safeXp} XP</span>
              </div>
              <input
                type="range"
                min={RATE}
                max={maxConvertable}
                step={RATE}
                value={safeXp}
                onChange={(e) => setXpToConvert(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-amber-500 bg-slate-200 dark:bg-slate-800"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                <span>{RATE} XP (min)</span>
                <span>{maxConvertable} XP (max)</span>
              </div>
            </div>

            {/* Preview pill */}
            <div className="flex items-center justify-center gap-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border border-amber-500/20 dark:border-amber-500/10">
              <div className="flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-xl font-black text-amber-500 tabular-nums">{safeXp}</span>
                <span className="text-xs font-bold text-slate-400">XP</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              <div className="flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-xl font-black text-yellow-500 tabular-nums">{coinsPreview}</span>
                <span className="text-xs font-bold text-slate-400">Coins</span>
              </div>
            </div>

            {/* Feedback */}
            {msg === "success" && (
              <p className="text-xs font-bold text-emerald-500 text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Converted {safeXp} XP ➔ {coinsPreview} Coins!
              </p>
            )}
            {msg && msg !== "success" && (
              <p className="text-xs font-bold text-red-500 text-center">{msg}</p>
            )}

            {/* Confirm button */}
            <button
              disabled={converting || safeXp < RATE}
              onClick={async () => {
                setConverting(true);
                setMsg("");
                try {
                  await convertXpToCoins(safeXp, RATE);
                  setMsg("success");
                  setTimeout(() => setMsg(""), 3500);
                } catch (err) {
                  setMsg(err.message || "Conversion failed.");
                } finally {
                  setConverting(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-[0.98]"
            >
              {converting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Convert {safeXp} XP ➔ {coinsPreview} Coins
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

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
  convertXpToCoins,
  purchaseCosmetic,
  equipCosmetic,
}) {
  return (
    <div className="space-y-6">
      {/* XP to Coins Exchange */}
      <XpConverter stats={stats} convertXpToCoins={convertXpToCoins} />

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
