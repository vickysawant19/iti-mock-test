import React from "react";
import { Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BADGES } from "@/services/reward.service";

export default function TeacherPrizesTab({
  loadingGame,
  selectedStudent,
  setSelectedStudent,
  prizeType,
  setPrizeType,
  selectedBadge,
  setSelectedBadge,
  bonusXP,
  setBonusXP,
  bonusCoins,
  setBonusCoins,
  isDispatchingPrize,
  handleDispatchPrize,
  studentRows,
}) {
  if (loadingGame) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <>
      {/* Prize Dispatcher Form */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Award className="w-5 h-5 text-purple-500" />
          Badge & Prize Dispatcher
        </h3>
        <form onSubmit={handleDispatchPrize} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Select Student</label>
            <select
              required
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-bold text-slate-850 dark:text-white"
            >
              <option value="">-- Choose Student --</option>
              {studentRows.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.userName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Prize Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                <input
                  type="radio"
                  checked={prizeType === "bonus"}
                  onChange={() => setPrizeType("bonus")}
                />
                XP & Coins Bonus
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                <input
                  type="radio"
                  checked={prizeType === "badge"}
                  onChange={() => setPrizeType("badge")}
                />
                Achievement Badge
              </label>
            </div>
          </div>

          {prizeType === "badge" ? (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Select Badge</label>
              <select
                required
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-bold text-slate-850 dark:text-white"
              >
                <option value="">-- Choose Badge --</option>
                {Object.values(BADGES).map((badge) => (
                  <option key={badge.id} value={badge.id}>
                    🏆 {badge.title} - {badge.description}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Bonus XP</label>
                <input
                  type="number"
                  min="10"
                  value={bonusXP}
                  onChange={(e) => setBonusXP(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Bonus Coins</label>
                <input
                  type="number"
                  min="5"
                  value={bonusCoins}
                  onChange={(e) => setBonusCoins(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium text-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          <Button
            disabled={isDispatchingPrize}
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold py-3 text-xs shadow-md shadow-indigo-500/10 cursor-pointer"
          >
            {isDispatchingPrize ? "Dispatching..." : "Dispatch Prize"}
          </Button>
        </form>
      </div>
    </>
  );
}
