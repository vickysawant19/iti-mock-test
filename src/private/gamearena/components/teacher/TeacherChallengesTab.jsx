import React, { useState, useEffect } from "react";
import { PlusCircle, CheckCircle, Loader2, ChevronDown, Share2, Check, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHALLENGE_TEMPLATES, challengeService } from "@/services/challenge.service";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import notificationService from "@/services/notification.service";

function ChallengeRow({ challenge, studentRows }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [studentProgress, setStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const user = useSelector((state) => state.user?.user);

  const handleNotify = async () => {
    setIsNotifying(true);
    try {
      const existingNotifs = await notificationService.getNotificationsByBatch([challenge.batchId]);
      const existing = existingNotifs.find(
        (n) => n.batchId === challenge.batchId && n.paperId === challenge.$id
      );

      if (existing) {
        const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        await notificationService.updateNotification(existing.$id, {
          message: `RE-NOTIFICATION: New Challenge: ${challenge.title} — Reward: ${challenge.rewardXP || 0} XP, ${challenge.rewardCoins || 0} Coins (Sent: ${timeStr})`,
          readBy: [],
        });
        toast.success("Notification resent to all batch members!");
      } else {
        await notificationService.createNotification({
          message: `New Challenge: ${challenge.title} — Reward: ${challenge.rewardXP || 0} XP, ${challenge.rewardCoins || 0} Coins`,
          type: "challenge_assigned",
          batchId: challenge.batchId,
          teacherId: user?.$id || "",
          paperId: challenge.$id,
        });
        toast.success("Notification sent to all batch members!");
      }
    } catch (err) {
      console.error("Failed to notify batch:", err);
      toast.error("Failed to send notification.");
    } finally {
      setIsNotifying(false);
    }
  };

  const completionsCount = challenge.completedStudents?.length || 0;
  const totalStudents = studentRows?.length || 0;

  const handleShare = async () => {
    const text = `🔔 *New Batch Challenge Active!* 🔔\n\n🏆 *${challenge.title}*\n📝 ${challenge.description}\n\n🎁 *Rewards:*\n✨ *${challenge.rewardXP || 0} XP*\n🪙 *${challenge.rewardCoins || 0} Coins*\n\nLog in to the ITI Mitra portal and start solving now! 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "New ITI Mitra Challenge",
          text: text,
        });
      } catch (err) {
        console.error("Web Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        const encoded = encodeURIComponent(text);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    }
  };

  useEffect(() => {
    if (isExpanded && studentProgress === null && !loadingProgress) {
      const fetchProgress = async () => {
        setLoadingProgress(true);
        try {
          const data = await challengeService.getChallengeProgressForBatch(challenge.$id, challenge.batchId);
          setStudentProgress(data);
        } catch (err) {
          console.error("[ChallengeRow] Failed to fetch progress:", err);
          setStudentProgress([]);
        } finally {
          setLoadingProgress(false);
        }
      };
      fetchProgress();
    }
  }, [isExpanded, challenge.$id, challenge.batchId, studentProgress, loadingProgress]);

  // Map each student in studentRows to their progress
  const studentsWithProgress = studentRows.map((student) => {
    const isCompleted = (challenge.completedStudents || []).includes(student.studentId);
    
    // Find matching progress doc
    const progressDoc = studentProgress?.find((p) => p.studentId === student.studentId);
    const claimed = progressDoc?.claimed || false;
    const progressVal = progressDoc?.progress || 0;

    return {
      student,
      isCompleted: isCompleted || claimed,
      progress: isCompleted || claimed ? (challenge.target || 0) : progressVal,
    };
  });

  // Filter out students who haven't started (not completed and progress is 0)
  const activeStudents = studentsWithProgress.filter(
    (item) => item.isCompleted || item.progress > 0
  );

  return (
    <div className="border-b border-white/10 dark:border-slate-800/40 last:border-b-0">
      {/* Clickable Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all cursor-pointer select-none"
      >
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">{challenge.title}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{challenge.description}</p>
          {challenge.type && challenge.type !== "manual" && (
            <span className="inline-block mt-1 text-[9px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase">
              Metric: {challenge.type} • Target: {challenge.target}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-extrabold bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
            <CheckCircle className="w-3.5 h-3.5" />
            {completionsCount} / {totalStudents} Completed
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              copied
                ? "bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/25 dark:border-emerald-800/50"
                : "bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/10"
            }`}
            title={copied ? "Copied to clipboard!" : "Share challenge details"}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNotify();
            }}
            disabled={isNotifying}
            className="p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-150 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Notify batch members"
          >
            {isNotifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
            ) : (
              <BellRing className="w-3.5 h-3.5" />
            )}
          </button>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${isExpanded ? "rotate-180 text-pink-500" : ""}`} />
        </div>
      </div>

      {/* Expanded progress list */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 pb-5 bg-slate-50/30 dark:bg-slate-900/10 border-t border-white/5 dark:border-slate-800/20 overflow-hidden"
          >
            {loadingProgress ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                Fetching student progress...
              </div>
            ) : (
              <div className="pt-4 space-y-3">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Student Status Breakdown</h5>
                {activeStudents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">No students have started this challenge yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeStudents.map(({ student, isCompleted, progress }) => {
                      const target = challenge.target || 0;
                      const hasProgress = progress > 0;
                      const percent = target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0;
                      
                      return (
                        <div
                          key={student.studentId}
                          className="bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/50 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <InteractiveAvatar
                              src={student.profileImage}
                              fallbackText={student.userName?.charAt(0) || "?"}
                              userId={student.studentId}
                              userName={student.userName}
                              lastseen={student.lastseen}
                              showStatus={true}
                              statusSize="xs"
                              className="h-8 w-8 rounded-lg shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-750 dark:text-slate-350 truncate">{student.userName}</p>
                              {student.registerId && (
                                <p className="text-[8px] font-mono text-slate-400 dark:text-slate-500 truncate">{student.registerId}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-1">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Completed
                              </span>
                            ) : hasProgress && target > 0 ? (
                              <div className="flex flex-col items-end w-20 sm:w-24">
                                <div className="flex justify-between w-full text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-0.5">
                                  <span>{progress}/{target}</span>
                                  <span>{percent}%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full border border-slate-200/55 dark:border-slate-700/55">
                                Not Started
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


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
          {challenges.map((challenge) => (
            <ChallengeRow
              key={challenge.$id}
              challenge={challenge}
              studentRows={studentRows}
            />
          ))}
          {challenges.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-10">No challenges launched yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
