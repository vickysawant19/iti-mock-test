import React from "react";
import { Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Specify which questions are served to students in Game Mode</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {/* Selector option */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Question Filter Mode</label>
                <select
                  value={questionFilter}
                  onChange={(e) => setQuestionFilter(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-850 dark:text-white font-medium"
                >
                  <option value="all">All Subject Questions (Default)</option>
                  <option value="first_year">First Year Questions Only</option>
                  <option value="second_year">Second Year Questions Only</option>
                  <option value="module">Specific Module Only</option>
                </select>
              </div>

              {/* Module Selector dropdown, only visible if filter mode is "module" */}
              {questionFilter === "module" && (
                <div className="space-y-2 animate-float-in">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Select Trade Module</label>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-850 dark:text-white font-medium"
                  >
                    <option value="">-- Choose Module --</option>
                    {modulesList.map((m) => (
                      <option key={m.$id} value={m.moduleId}>
                        {m.moduleId} — {m.moduleName} (Year {m.year})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800 my-2" />

          {/* Part 2: Rewards and Payout Setting values */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Correct Answer Rewards</label>
            <p className="text-[10px] text-slate-455 dark:text-slate-400 font-medium">Fine-tune the gaming payouts awarded to students upon successfully clearing nodes</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">XP Payout per Answer</label>
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
