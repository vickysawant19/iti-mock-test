import React from "react";
import { PlusCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHALLENGE_TEMPLATES } from "@/services/challenge.service";

export default function TeacherChallengesTab({
  loadingGame,
  selectedTemplateId,
  setSelectedTemplateId,
  challengeTitle,
  setChallengeTitle,
  challengeDesc,
  setChallengeDesc,
  challengeType,
  setChallengeType,
  challengeTarget,
  setChallengeTarget,
  challengeXP,
  setChallengeXP,
  challengeCoins,
  setChallengeCoins,
  isCreatingChallenge,
  handleCreateChallenge,
  challenges,
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
      {/* Launch Challenge Form */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <PlusCircle className="w-5 h-5 text-pink-500" />
          Launch New Challenge
        </h3>
        <form onSubmit={handleCreateChallenge} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Predefined Challenge Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-bold text-slate-800 dark:text-white"
            >
              {CHALLENGE_TEMPLATES.map((t) => (
                <option key={t.templateId} value={t.templateId}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Challenge Title</label>
            <input
              required
              disabled={selectedTemplateId !== "custom"}
              type="text"
              placeholder="e.g. Solve 50 questions"
              value={challengeTitle}
              onChange={(e) => setChallengeTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium disabled:opacity-60 text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Description</label>
            <textarea
              required
              disabled={selectedTemplateId !== "custom"}
              rows="2"
              placeholder="Detail the instructions or criteria for students..."
              value={challengeDesc}
              onChange={(e) => setChallengeDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium disabled:opacity-60 text-slate-800 dark:text-white"
            />
          </div>

          {/* Render type and target editors if custom, or a read-only preview badge if preset */}
          {selectedTemplateId === "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tracking Metric (Type)</label>
                <select
                  value={challengeType}
                  onChange={(e) => setChallengeType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-bold text-slate-800 dark:text-white"
                >
                  <option value="questions">Questions Answered</option>
                  <option value="correct_answers">Correct Answers</option>
                  <option value="correct_streak">Consecutive Correct Answers</option>
                  <option value="xp">XP Earned</option>
                  <option value="manual">Manual (Claim Only)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Target Count</label>
                <input
                  type="number"
                  min="0"
                  value={challengeTarget}
                  onChange={(e) => setChallengeTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium text-slate-800 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-purple-500/5 border border-purple-500/10 p-3 text-[10px] text-purple-400 font-extrabold flex justify-between select-none">
              <span className="flex items-center gap-1">🎯 Tracking: <span className="uppercase text-slate-200 font-black">{challengeType}</span></span>
              <span className="flex items-center gap-1">📈 Target: <span className="text-slate-200 font-black">{challengeTarget}</span></span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">XP Reward</label>
              <input
                type="number"
                min="1"
                value={challengeXP}
                onChange={(e) => setChallengeXP(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Coins Reward</label>
              <input
                type="number"
                min="1"
                value={challengeCoins}
                onChange={(e) => setChallengeCoins(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <Button
            disabled={isCreatingChallenge}
            type="submit"
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold py-3 text-xs shadow-md shadow-pink-500/10 cursor-pointer"
          >
            {isCreatingChallenge ? "Launching..." : "Launch Challenge"}
          </Button>
        </form>
      </div>

      {/* Active Challenges List */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Active Batch Challenges</h3>
        </div>
        <div className="divide-y divide-white/20 dark:divide-slate-800/40">
          {challenges.map((challenge) => {
            const completionsCount = challenge.completedStudents?.length || 0;
            const totalStudents = studentRows?.length || 0;
            return (
              <div key={challenge.$id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">{challenge.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{challenge.description}</p>
                  {challenge.type && challenge.type !== "manual" && (
                    <span className="inline-block mt-1 text-[9px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase">
                      Metric: {challenge.type} • Target: {challenge.target}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-extrabold bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {completionsCount} / {totalStudents} Completed
                </span>
              </div>
            );
          })}
          {challenges.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-10">No challenges launched yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
