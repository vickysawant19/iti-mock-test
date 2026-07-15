import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Coins, 
  Sparkles, 
  Check, 
  Loader2, 
  ShoppingBag, 
  Lock,
  User,
  Tags,
  BadgeAlert,
  Smile,
  Tv
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { COSMETIC_ITEMS, cosmeticsService } from "@/services/cosmetics.service";

const CosmeticStoreTab = ({ stats, purchaseCosmetic, equipCosmetic, hideHeader = false }) => {
  const [activeCategory, setActiveCategory] = useState("avatar");
  const [isPurchasing, setIsPurchasing] = useState(null);
  const [isEquipping, setIsEquipping] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const userCoins = stats?.coins || 0;
  
  // Parse cosmetics state from stats
  const cosmeticsState = cosmeticsService.parseCosmetics(stats);
  const unlockedIds = cosmeticsState.unlocked || [];
  const equipped = cosmeticsState.equipped || {};

  const categories = [
    { id: "avatar", label: "Avatars", icon: User },
    { id: "frame", label: "Frames", icon: Sparkles },
    { id: "title", label: "Titles", icon: Tags },
    { id: "border", label: "Borders", icon: Tv },
    { id: "emoji", label: "Emojis", icon: Smile },
  ];

  const filteredItems = COSMETIC_ITEMS.filter((item) => item.category === activeCategory);

  const handlePurchase = async (itemId) => {
    setErrorMsg("");
    setIsPurchasing(itemId);
    try {
      await purchaseCosmetic(itemId);
    } catch (err) {
      setErrorMsg(err.message || "Failed to purchase item.");
    } finally {
      setIsPurchasing(null);
    }
  };

  const handleEquip = async (category, itemId) => {
    setErrorMsg("");
    setIsEquipping(itemId);
    try {
      // Toggle equip: if already equipped, pass null to unequip, otherwise itemId
      const isCurrentlyEquipped = equipped[category] === itemId;
      await equipCosmetic(category, isCurrentlyEquipped ? null : itemId);
    } catch (err) {
      setErrorMsg(err.message || "Failed to equip item.");
    } finally {
      setIsEquipping(null);
    }
  };

  // Preview renderer helper
  const renderItemPreview = (item) => {
    switch (item.category) {
      case "avatar":
        return (
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-md">
            <img src={item.value} alt={item.name} className="w-full h-full object-cover" />
          </div>
        );
      case "frame":
        return (
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Mock Avatar */}
            <div className="w-12 h-12 rounded-full bg-slate-700/80 overflow-hidden border border-white/10">
              <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=preview" alt="preview" className="w-full h-full object-cover" />
            </div>
            {/* Frame overlay */}
            <div className={`absolute inset-0 rounded-full pointer-events-none ${item.value}`} />
          </div>
        );
      case "title":
        return (
          <span className="text-[10px] font-black text-yellow-400 bg-yellow-950/40 px-2.5 py-1 rounded border border-yellow-500/20 uppercase tracking-widest animate-pulse shadow-sm">
            {item.value}
          </span>
        );
      case "emoji":
        return (
          <span className="text-4xl animate-bounce" style={{ animationDuration: "3s" }}>
            {item.value}
          </span>
        );
      case "border":
        return (
          <div className={`w-full h-10 rounded-lg flex items-center justify-center p-[2px] ${item.value}`}>
            <span className="text-[9px] font-black uppercase text-slate-350 tracking-wider">Border Preview</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card with Coins info */}
      {!hideHeader && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-600/90 via-purple-600/90 to-blue-600/90 border border-white/20 p-6 text-white shadow-xl">
          <div className="absolute top-[-20%] right-[-10%] w-60 h-60 rounded-full bg-white/10 blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center justify-center sm:justify-start gap-2">
                <ShoppingBag className="w-6 h-6 animate-pulse" />
                Cosmetic Store
              </h2>
              <p className="text-xs text-pink-100 mt-1 font-medium">
                Spend your training coins on exclusive cosmetics to customize your gamer profile!
              </p>
            </div>

            {/* Current balance card */}
            <div className="bg-slate-950/50 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg shrink-0">
              <Coins className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: "8s" }} />
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider leading-none">Your Coins Balance</p>
                <p className="text-xl font-black text-white mt-1 leading-none tabular-nums">{userCoins}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
          <BadgeAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Category Sub-tabs Switcher */}
      <div className="flex items-center gap-4 sm:gap-6 md:gap-8 border-b border-slate-200 dark:border-[#221a48] pb-0 relative z-10 select-none w-full overflow-x-auto scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setErrorMsg("");
                setActiveCategory(cat.id);
              }}
              className={`relative flex items-center gap-2 py-3 px-1 cursor-pointer transition-all duration-200 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${
                isActive
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-pink-500" : "text-slate-400"}`} />
              <span>{cat.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeCategoryUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Store Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const isUnlocked = unlockedIds.includes(item.id);
          const isEquipped = equipped[item.category] === item.id;
          const canAfford = userCoins >= item.cost;

          return (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-3xl border p-4 flex flex-col items-center justify-between text-center transition-all duration-300 ${
                isEquipped
                  ? "bg-gradient-to-b from-slate-900 via-slate-950 to-pink-950/20 border-pink-500 shadow-lg text-white scale-[1.02]"
                  : "bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 text-slate-850 dark:text-slate-200"
              } group`}
            >
              {/* Item Preview Card */}
              <div className="w-full aspect-video bg-slate-950/5 dark:bg-slate-950/40 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-center mb-4 relative overflow-hidden group-hover:bg-slate-950/10 dark:group-hover:bg-slate-950/60 transition-all duration-300">
                {/* Decorative radial gradients */}
                <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent opacity-50 pointer-events-none" />
                {renderItemPreview(item)}
              </div>

              {/* Text Info */}
              <div className="mb-4">
                <h4 className="text-sm font-black tracking-tight leading-tight group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
                  {item.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px] leading-normal font-medium mx-auto">
                  {item.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="w-full">
                {isUnlocked ? (
                  <Button
                    onClick={() => handleEquip(item.category, item.id)}
                    disabled={isEquipping !== null}
                    className={`w-full h-9 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-all duration-200 active:scale-95 ${
                      isEquipped
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10"
                        : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {isEquipping === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEquipped ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Equipped
                      </>
                    ) : (
                      "Equip"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePurchase(item.id)}
                    disabled={isPurchasing !== null || !canAfford}
                    className={`w-full h-9 rounded-xl font-black text-xs cursor-pointer shadow-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${
                      canAfford
                        ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-450 hover:to-amber-550 text-slate-950 shadow-yellow-500/10"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-white/5"
                    }`}
                  >
                    {isPurchasing === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Coins className="w-4 h-4 text-slate-950 shrink-0" />
                        Buy: {item.cost}
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Locked/Unlocked ribbon top right */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {isUnlocked ? (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-extrabold uppercase px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Owned
                  </span>
                ) : (
                  <span className="p-1 rounded-lg bg-slate-950/20 text-slate-400 dark:text-slate-500 border border-white/5">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CosmeticStoreTab;
