import React from "react";
import { Gamepad2 } from "lucide-react";

export default function ActiveGameSettingsCard({
  batchContext = {},
  activeSettings = {},
}) {
  const renderFilterScope = () => {
    const filter = activeSettings?.questionFilter;
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

    const fallbackText = modsStr.includes(",") 
      ? `Modules (${modsStr.split(",").length})`
      : modsStr
      ? `Module: ${modsStr}`
      : "";

    const modulesDisplay = activeSettings?.selectedModuleName || (modsStr ? fallbackText : "");

    let mainText = "All Subject Questions";
    if (filter === "first_year") mainText = "First Year Only";
    else if (filter === "second_year") mainText = "Second Year Only";
    else if (filter === "module") mainText = modulesDisplay ? `Scope: ${modulesDisplay}` : "Specific Modules";

    return (
      <div className="flex flex-col items-center sm:items-start min-h-[28px] justify-center">
        <span className="text-xs font-bold text-slate-800 dark:text-white mt-1 uppercase leading-snug truncate max-w-[190px] sm:max-w-full" title={mainText}>
          {mainText}
        </span>
        {tagsStr && (
          <span className="text-[9px] text-pink-500 font-extrabold block mt-0.5 normal-case font-sans truncate max-w-[190px] sm:max-w-full" title={`Tags: ${tagsStr}`}>
            Tags: {tagsStr}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 h-fit lg:col-span-2">
      <div className="flex items-center gap-2.5 mb-4 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="p-2 bg-pink-500/10 rounded-xl">
          <Gamepad2 className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Active Batch Game Settings</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Configured by Batch Instructor for {batchContext?.batchName || "your batch"}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
        <div className="bg-slate-100/50 dark:bg-slate-950/60 border border-slate-200/65 dark:border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Question Filter Scope</span>
          {renderFilterScope()}
        </div>
        
        <div className="bg-slate-100/50 dark:bg-slate-950/60 border border-slate-200/65 dark:border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Correct Answer Payout</span>
          <span className="text-xs font-bold text-slate-800 dark:text-white mt-1">
            ⭐ +{activeSettings?.correctAnswerXp !== undefined ? activeSettings.correctAnswerXp : 10} XP
            {" | "}
            🪙 +{activeSettings?.correctAnswerCoins !== undefined ? activeSettings.correctAnswerCoins : 5} Coins
          </span>
        </div>
        
        <div className="bg-slate-100/50 dark:bg-slate-950/60 border border-slate-200/65 dark:border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Streak Bonus</span>
          <span className="text-xs font-bold text-slate-800 dark:text-white mt-1">
            🔥 +{activeSettings?.streakXpBonus !== undefined ? activeSettings.streakXpBonus : 2} XP per consecutive day
          </span>
        </div>
      </div>
    </div>
  );
}
