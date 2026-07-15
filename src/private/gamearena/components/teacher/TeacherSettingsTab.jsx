import React from "react";
import { Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import VerifiedTagInput from "@/components/components/VerifiedTagInput";

export default function TeacherSettingsTab({
  isLoadingSettings,
  questionFilter,
  setQuestionFilter,
  selectedModuleId,
  setSelectedModuleId,
  modulesList,
  correctAnswerXp,
  setCorrectAnswerXp,
  correctAnswerCoins,
  setCorrectAnswerCoins,
  streakXpBonus,
  setStreakXpBonus,
  isSavingSettings,
  handleSaveSettings,
}) {
  const [localModules, setLocalModules] = React.useState([]);
  const [localTags, setLocalTags] = React.useState([]);

  // Sync state from selectedModuleId safely
  React.useEffect(() => {
    let modsArr = [];
    let tagsArr = [];
    if (selectedModuleId) {
      if (selectedModuleId.includes("|")) {
        const parts = selectedModuleId.split("|");
        if (parts[0]) {
          modsArr = parts[0].split(",").map((m) => m.trim()).filter(Boolean);
        }
        if (parts[1]) {
          tagsArr = parts[1].split(",").map((t) => t.trim()).filter(Boolean);
        }
      } else {
        modsArr = [selectedModuleId];
      }
    }

    if (JSON.stringify(modsArr) !== JSON.stringify(localModules)) {
      setLocalModules(modsArr);
    }
    if (JSON.stringify(tagsArr) !== JSON.stringify(localTags)) {
      setLocalTags(tagsArr);
    }
  }, [selectedModuleId, localModules, localTags]);

  const syncConfig = (modsArrVal, tagsArrVal) => {
    const serialized = modsArrVal.join(",") + "|" + tagsArrVal.join(",");
    setSelectedModuleId(serialized);
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div className="p-2 bg-pink-500/10 rounded-xl">
          <Settings className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Batch Game Configuration</h3>
          <p className="text-[11px] text-slate-400 font-medium">Control the question scope and gameplay rewards for batch members</p>
        </div>
      </div>

      {isLoadingSettings ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* Part 1: Question Pool Scope Filter */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Question Source Pool</label>
            <p className="text-[10px] text-slate-455 dark:text-slate-400 font-medium">Specify which questions are served to students in Game Mode</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Selector option */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Question Filter Mode</label>
                <select
                  value={questionFilter}
                  onChange={(e) => {
                    setQuestionFilter(e.target.value);
                    // Reset module ID if not in module mode, preserving tags
                    syncConfig([], localTags);
                  }}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-850 dark:text-white font-medium cursor-pointer"
                >
                  <option value="all">All Subject Questions (Default)</option>
                  <option value="first_year">First Year Questions Only</option>
                  <option value="second_year">Second Year Questions Only</option>
                  <option value="module">Specific Modules Only</option>
                </select>
              </div>

              {/* Module Selector checkbox grid list, only visible if filter mode is "module" */}
              {questionFilter === "module" && (
                <div className="space-y-1.5 md:col-span-2 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 animate-float-in">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">
                    Select Target Modules ({localModules.length} selected)
                  </label>
                  {modulesList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1.5 border border-slate-200/50 dark:border-slate-700/50 rounded-xl bg-white/50 dark:bg-slate-850/50 custom-scrollbar">
                      {modulesList.map((m) => {
                        const isChecked = localModules.includes(m.moduleId);
                        return (
                          <label key={m.$id} className="flex items-center space-x-2 p-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              className="w-3.5 h-3.5 text-pink-500 rounded border-slate-350 dark:border-slate-750 focus:ring-pink-500/20 cursor-pointer"
                              onChange={(e) => {
                                const nextMods = e.target.checked
                                  ? [...localModules, m.moduleId]
                                  : localModules.filter((id) => id !== m.moduleId);
                                setLocalModules(nextMods);
                                syncConfig(nextMods, localTags);
                              }}
                            />
                            <span className="text-[10px] font-semibold text-slate-750 dark:text-slate-300 leading-none">
                              {m.moduleId} — {m.moduleName} (Yr {m.year === "FIRST" ? "1" : "2"})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-450 font-semibold italic">No modules loaded for this trade</p>
                  )}
                </div>
              )}

              {/* Optional tags selector, visible for ALL modes */}
              <div className="space-y-2 md:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-850 mt-2">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Filter by Tags (Optional)</label>
                <p className="text-[9px] text-slate-450 font-semibold mb-1">Questions served will be matched against these tags if specified</p>
                <VerifiedTagInput
                  value={localTags}
                  onChange={(newTags) => {
                    setLocalTags(newTags);
                    syncConfig(localModules, newTags);
                  }}
                  placeholder="Search and select gameplay tags..."
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800 my-2" />

          {/* Part 2: Rewards and Payout Setting values */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Correct Answer Rewards</label>
            <p className="text-[10px] text-slate-455 dark:text-slate-400 font-medium">Fine-tune the gaming payouts awarded to students upon successfully clearing nodes</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">XP Payout per Answer</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={correctAnswerXp}
                  onChange={(e) => setCorrectAnswerXp(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Coins Payout per Answer</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={correctAnswerCoins}
                  onChange={(e) => setCorrectAnswerCoins(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Daily Streak XP Bonus</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={streakXpBonus}
                  onChange={(e) => setStreakXpBonus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium text-slate-850 dark:text-white"
                />
                <span className="text-[8px] text-slate-400 font-bold block mt-1">Bonus XP = (current streak days) × value</span>
              </div>
            </div>
          </div>

          {/* Part 3: Form Submit Action */}
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isSavingSettings}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer h-10 px-6"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                "Save Game Configuration"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
