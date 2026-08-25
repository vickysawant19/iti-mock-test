import React from "react";
import { Gamepad2, Layers, Flame, Coins, Tag, BookOpen, CheckCircle2 } from "lucide-react";

export default function ActiveGameSettingsCard({
  batchContext = {},
  activeSettings = {},
}) {
  const filter = activeSettings?.questionFilter || "all";
  let modsStr = "";
  let tagsStr = "";

  if (activeSettings?.selectedModuleId) {
    if (activeSettings.selectedModuleId.includes("|")) {
      const parts = activeSettings.selectedModuleId.split("|");
      modsStr = parts[0] || "";
      tagsStr = parts[1] || "";
    } else {
      modsStr = activeSettings.selectedModuleId;
    }
  }

  // Extract array of module names
  let moduleNamesList = [];
  if (activeSettings?.selectedModuleName) {
    const rawName = activeSettings.selectedModuleName;
    if (rawName.includes(" | ")) {
      moduleNamesList = rawName.split(" | ").map((s) => s.trim()).filter(Boolean);
    } else if (rawName.includes(" ; ")) {
      moduleNamesList = rawName.split(" ; ").map((s) => s.trim()).filter(Boolean);
    } else if (modsStr && modsStr.includes(",")) {
      // Legacy fallback: if modsStr has module IDs (e.g. "M1,M2"), don't over-split internal commas
      const modIds = modsStr.split(",").map((s) => s.trim()).filter(Boolean);
      moduleNamesList = modIds.map((id) => `Module ${id}: ${rawName}`);
    } else {
      moduleNamesList = [rawName];
    }
  } else if (modsStr) {
    moduleNamesList = modsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((id) => `Module ${id}`);
  }

  // Extract array of tags
  let tagList = [];
  if (tagsStr) {
    tagList = tagsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  let scopeBadgeTitle = "All Subject Questions";
  let scopeBadgeDesc = "Questions will be drawn randomly from all available subject modules.";
  if (filter === "first_year") {
    scopeBadgeTitle = "First Year Topics Only";
    scopeBadgeDesc = "Questions are restricted exclusively to 1st-year curriculum modules.";
  } else if (filter === "second_year") {
    scopeBadgeTitle = "Second Year Topics Only";
    scopeBadgeDesc = "Questions are restricted exclusively to 2nd-year curriculum modules.";
  } else if (filter === "module") {
    scopeBadgeTitle = moduleNamesList.length > 0 
      ? `Specific Selected Modules (${moduleNamesList.length})`
      : "Specific Selected Modules";
    scopeBadgeDesc = "Questions will only appear from the specific active modules listed below.";
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 h-fit lg:col-span-2 shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5 border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
        <div className="p-2.5 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 text-pink-500 rounded-2xl">
          <Gamepad2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">
            Active Batch Game Settings
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Configured by Instructor for <span className="font-semibold text-slate-700 dark:text-slate-200">{batchContext?.batchName || "your batch"}</span>
          </p>
        </div>
      </div>
      
      {/* ── Top Row: Payouts & Streak Rewards (2-column layout) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
        {/* Payouts */}
        <div className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Correct Answer Payout
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-800 dark:text-white flex-wrap">
              <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-300/60 dark:border-amber-800/60">
                ⭐ +{activeSettings?.correctAnswerXp !== undefined ? activeSettings.correctAnswerXp : 10} XP
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-300/60 dark:border-emerald-800/60">
                🪙 +{activeSettings?.correctAnswerCoins !== undefined ? activeSettings.correctAnswerCoins : 5} Coins
              </span>
            </div>
          </div>
        </div>
        
        {/* Active Streak Bonus */}
        <div className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Daily Streak Bonus
            </span>
            <div className="mt-1 text-xs font-bold text-slate-800 dark:text-white">
              <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 px-2.5 py-1 rounded-lg border border-orange-300/60 dark:border-orange-800/60">
                🔥 +{activeSettings?.streakXpBonus !== undefined ? activeSettings.streakXpBonus : 2} XP / consecutive day
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Full-Width Section: Question Filter Scope & Module List ── */}
      <div className="bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Active Question Filter Scope
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-600 text-white shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {scopeBadgeTitle}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
          {scopeBadgeDesc}
        </p>

        {/* Selected Modules Full Display List */}
        {filter === "module" && (
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Included Modules ({moduleNamesList.length}):
            </div>
            
            {moduleNamesList.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1">
                {moduleNamesList.map((modName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/80"
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{modName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                No specific modules selected.
              </div>
            )}
          </div>
        )}

        {/* Filter Tags List (if any) */}
        {tagList.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-pink-500" />
              Filter Tags ({tagList.length}):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagList.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 px-2.5 py-1 rounded-lg text-xs font-bold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
