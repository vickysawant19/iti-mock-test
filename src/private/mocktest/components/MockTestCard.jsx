import React, { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  PlayCircle,
  Eye,
  Share2,
  Trash2,
  ClipboardList,
  Calendar,
  FileText,
  Target,
  Hash,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Lock,
  Unlock,
  GraduationCap,
  Copy,
  Check,
  BellRing,
  BarChart,
  AlertTriangle,
} from "lucide-react";
import mockTestService from "@/services/mocktest.service";
import notificationService from "@/services/notification.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUserBatches, selectActiveBatch } from "@/store/activeBatchSlice";

const MockTestCard = ({
  setMockTests,
  test,
  user,
  handleDelete,
  isDeleting,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const userBatches = useSelector(selectUserBatches);
  const activeBatch = useSelector(selectActiveBatch);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(test.paperId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const el = document.createElement("textarea");
      el.value = test.paperId;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleCopyMessage = async (paperId) => {
    const examUrl = `${window.location.origin}/attain-test?paperid=${paperId}`;
    const titleLine = test.title ? `\n\n📋 *Test:* ${test.title}` : "";
    const shareText = `🎉 *_MSQs Exam Paper_* 🎉\n\n_Hey there!_\n_Check out this Exam Paper_\n Paper ID: *${paperId}*${titleLine}\n\n📚 *Trade:* ${test.tradeName || "Unknown"}\n💯 *Total Questions:* ${test.quesCount}\n⏳ *Duration:* ${test.totalMinutes || 0} Minutes\n📈 *Difficulty:* ${test.difficultyLevel || "mixed"}\n\n👉 Click the link below to get started:\n${examUrl}\n\n*Remember to submit on complete!*\n\n Good luck and happy Exam!`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 1500);
      toast.success("Message copied to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy message");
    }
  };

  const handleShare = async (paperId) => {
    const examUrl = `${window.location.origin}/attain-test?paperid=${paperId}`;
    const titleLine = test.title ? `\n\n📋 *Test:* ${test.title}` : "";
    const shareText = `🎉 *_MSQs Exam Paper_* 🎉\n\n_Hey there!_\n_Check out this Exam Paper_\n Paper ID: *${paperId}*${titleLine}\n\n📚 *Trade:* ${test.tradeName || "Unknown"}\n💯 *Total Questions:* ${test.quesCount}\n⏳ *Duration:* ${test.totalMinutes || 0} Minutes\n📈 *Difficulty:* ${test.difficultyLevel || "mixed"}\n\n👉 Click the link below to get started:\n${examUrl}\n\n*Remember to submit on complete!*\n\n Good luck and happy Exam!`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: test.title || test.tradeName || "Mock Test",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleNotifyBatch = async () => {
    if (!activeBatch || !activeBatch.$id) {
      toast.error("Please select an active batch first to send notifications.");
      return;
    }
    setIsNotifying(true);
    try {
      const existingNotifs =
        await notificationService.getNotificationsByBatch([activeBatch.$id]);

      const existingNotif = existingNotifs.find(
        (n) => n.batchId === activeBatch.$id && n.paperId === test.paperId,
      );

      const notifMessage = `New Mock Test: ${test.title ? `${test.title} (${test.tradeName})` : test.tradeName} — ID: ${test.paperId}`;

      if (existingNotif) {
        const confirmReNotify = window.confirm(
          `Batch "${activeBatch.BatchName || "Active Batch"}" was already notified. Send re-notification reminder to all students in this batch?`
        );

        if (confirmReNotify) {
          await notificationService.reNotifyBatch(
            existingNotif.$id,
            `[REMINDER] ${notifMessage}`
          );
          toast.success(
            `Re-notified batch "${activeBatch.BatchName || "Active Batch"}" successfully!`
          );
        }
      } else {
        await notificationService.createNotification({
          message: notifMessage,
          type: "mock_test_assigned",
          batchId: activeBatch.$id,
          teacherId: user.$id,
          paperId: test.paperId,
          teamId: activeBatch.teamId || null,
        });
        toast.success(
          `Notified active batch "${activeBatch.BatchName || "Active Batch"}" successfully!`
        );
      }
    } catch (error) {
      console.error("Notify batch error:", error);
      toast.error("Failed to notify active batch.");
    } finally {
      setIsNotifying(false);
    }
  };

  const onToggleProtection = async () => {
    setIsLoading(true);
    try {
      const data = await mockTestService.updateQuestionPaper(test.$id, {
        isProtected: !test.isProtected,
      });
      setMockTests((prev) =>
        prev.map((item) => (item.$id === data.$id ? data : item)),
      );
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitted = test.submitted;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-4.5 shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/50 group">
      
      {/* ── Header (ID & Badges) ── */}
      <div className="flex justify-between items-start gap-2">
        <span 
          onClick={handleCopyId}
          className="text-[11px] font-mono font-black text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-200/80 dark:border-indigo-800/60 tracking-wider break-all cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5"
          title="Click to copy Paper ID"
        >
          <span>{test.paperId}</span>
          {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3 text-indigo-400 dark:text-indigo-400" />}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {test.isOriginal && (
            <span className="text-[10px] font-extrabold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md tracking-wider dark:bg-amber-950/50 dark:border-amber-800/80 dark:text-amber-300">
              Original
            </span>
          )}
          <span 
            className="flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded cursor-pointer transition-colors" 
            title={test.isProtected ? 'Protected' : 'Unprotected'}
            onClick={test.isOriginal ? onToggleProtection : undefined}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> : test.isProtected ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 text-emerald-500" />}
          </span>
        </div>
      </div>

      {/* ── Body (Title & Meta Info) ── */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm sm:text-[0.95rem] font-bold leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
          {test.title || test.tradeName || "Mock Test Paper"}
        </h3>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-1.5">
          <span>{test.tradeName}</span>
          {test.year && (
            <>
              <span className="text-slate-300 dark:text-slate-600 leading-none">•</span>
              <span>Year {test.year}</span>
            </>
          )}
        </div>
        
        {/* Meta details strip */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/80 dark:text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1" title="Date Created">
            <Calendar className="w-3 h-3 text-slate-400" />
            {format(new Date(test.$createdAt), "dd MMM yy, hh:mm a")}
          </span>
          <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/80 dark:text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1" title="Questions">
            <FileText className="w-3 h-3 text-slate-400" />
            {test.quesCount ?? "50"} Qs
          </span>
          <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/80 dark:text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1" title="Duration">
            <Clock className="w-3 h-3 text-slate-400" />
            {test.totalMinutes ?? "—"}m
          </span>
          <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/80 dark:text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1 capitalize" title="Difficulty">
            <BarChart className="w-3 h-3 text-slate-400" />
            {test.difficultyLevel ?? "mixed"}
          </span>
        </div>
      </div>

      {/* ── Status & Score Row ── */}
      <div className="flex justify-between items-center py-2.5 border-y border-slate-100 dark:border-slate-800/80 mt-auto">
        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border ${isSubmitted ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300'}`}>
          {isSubmitted ? 'Submitted' : 'Pending'}
        </span>
        <div className="text-right">
          {isSubmitted ? (
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">{test.score ?? 0}</span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500"> / {test.quesCount ? test.quesCount : "-"}</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-slate-400 dark:text-slate-600 leading-none">Not Taken</span>
          )}
        </div>
      </div>

      {/* ── Bottom: Actions ── */}
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="flex items-center gap-2">
          {/* Main Action Button */}
          {isSubmitted ? (
            <Link
              to={`/show-mock-test/${test.$id}`}
              className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 px-2 rounded-lg transition-all border bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" /> View Result
            </Link>
          ) : (
            <Link
              to={`/start-mock-test/${test.$id}`}
              className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-xs font-black py-1.5 px-2 rounded-lg transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs active:scale-98"
            >
              <PlayCircle className="w-3.5 h-3.5 fill-current" /> Start Exam
            </Link>
          )}

          {/* Live Scores Button */}
          <Link
            to={`/mock-test-result/${test.paperId}`}
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 px-2 rounded-lg transition-all border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs"
            title="Live Scores (Other Students)"
          >
            <ClipboardList className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Live Scores
          </Link>
        </div>

        {/* Secondary Icons Toolbar */}
        <div className="flex justify-end items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-slate-700 dark:hover:text-indigo-400 transition-all flex items-center justify-center text-xs font-bold gap-1 px-2 cursor-pointer"
                title="Share Paper"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 z-50">
              {navigator.share && (
                <DropdownMenuItem
                  onClick={() => handleShare(test.paperId)}
                  className="cursor-pointer text-xs font-semibold"
                >
                  <Share2 className="w-3.5 h-3.5 mr-2 text-slate-500" /> Share via App
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleCopyMessage(test.paperId)}
                className="cursor-pointer text-xs font-semibold"
              >
                {copiedMessage ? (
                  <Check className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-2 text-slate-500" />
                )}
                Copy Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {test.isOriginal && (
            <>
              <button
                onClick={handleNotifyBatch}
                disabled={isNotifying}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-slate-700 dark:hover:text-indigo-400 disabled:opacity-50 text-xs font-bold gap-1 px-2 transition-all flex items-center justify-center cursor-pointer"
                title="Notify Active Batch Students"
              >
                {isNotifying ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <BellRing className="w-3 h-3" />
                )}
                <span>Notify</span>
              </button>
              <button
                onClick={() => handleDelete(test.$id)}
                disabled={!!isDeleting[test.$id]}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-slate-700 dark:hover:text-rose-400 disabled:opacity-50 text-xs font-bold gap-1 px-2 transition-all flex items-center justify-center cursor-pointer"
                title="Delete Paper"
              >
                {isDeleting[test.$id] ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockTestCard;
