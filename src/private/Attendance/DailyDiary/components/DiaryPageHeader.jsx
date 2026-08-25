import React from "react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { Sparkles, BookOpen } from "lucide-react";

export const DiaryPageHeader = React.memo(({
  profile,
  subtitle,
  title,
  extraId,
  batchName,
  activeTab,
  onTabChange,
  badgeText,
  gradient = "from-blue-600 via-indigo-600 to-purple-700",
}) => {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${gradient} dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-3xl p-5 sm:p-6 mb-4 text-white shadow-xl border border-blue-400/30 dark:border-indigo-500/20`}>
      {/* Ambient background glow orbs */}
      <div className="absolute top-[-90px] right-[-60px] w-[300px] h-[300px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-40px] w-[240px] h-[240px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[180px] h-[180px] rounded-full bg-pink-400/10 dark:bg-pink-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center flex-shrink-0">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-white/40 to-white/10 dark:from-indigo-500 dark:to-purple-500 blur-xs opacity-70" />
            <InteractiveAvatar
              src={profile?.profileImage}
              fallbackText={profile?.userName?.charAt(0) || profile?.name?.charAt(0) || "U"}
              userId={profile?.userId}
              editable={false}
              className="w-14 h-14 relative shadow-md border-2 border-white/50 dark:border-white/40 rounded-full"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white dark:bg-indigo-500/20 dark:text-indigo-300 border border-white/30 dark:border-indigo-500/30">
                <Sparkles className="w-3 h-3 text-amber-300 dark:text-indigo-400" />
                {badgeText || "Daily Diary Hub"}
              </span>
              {extraId && (
                <span className="text-[10px] font-mono font-bold text-white/90 dark:text-white/60 bg-black/15 dark:bg-white/10 px-2 py-0.5 rounded-md">
                  {extraId}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-white/80 dark:text-indigo-300 hidden sm:inline-block" />
              {title || "Daily Diary Management"}
            </h1>

            <div className="text-xs text-white/90 dark:text-white/80 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white dark:text-indigo-200">{profile?.userName || profile?.name || "User"}</span>
              {batchName && (
                <>
                  <span className="opacity-40">|</span>
                  <span className="bg-purple-900/30 dark:bg-purple-500/20 text-purple-100 dark:text-purple-200 px-2 py-0.5 rounded-md text-[11px] font-medium border border-purple-400/30 dark:border-purple-500/30">
                    {batchName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {onTabChange && (
          <div className="flex flex-row p-1.5 bg-black/15 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800 self-start lg:self-auto w-full sm:w-auto shadow-inner">
            <button
              onClick={() => onTabChange("monthly")}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                activeTab === "monthly"
                  ? "bg-white text-indigo-700 dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500 dark:text-white shadow-md transform scale-[1.02]"
                  : "text-white/80 hover:text-white hover:bg-white/15 dark:hover:bg-white/10"
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => onTabChange("weekly")}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                activeTab === "weekly"
                  ? "bg-white text-indigo-700 dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500 dark:text-white shadow-md transform scale-[1.02]"
                  : "text-white/80 hover:text-white hover:bg-white/15 dark:hover:bg-white/10"
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => onTabChange("daily")}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                activeTab === "daily"
                  ? "bg-white text-indigo-700 dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500 dark:text-white shadow-md transform scale-[1.02]"
                  : "text-white/80 hover:text-white hover:bg-white/15 dark:hover:bg-white/10"
              }`}
            >
              Daily View
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default DiaryPageHeader;
