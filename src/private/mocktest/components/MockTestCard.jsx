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
import { selectUserBatches } from "@/store/activeBatchSlice";

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
    if (!userBatches || userBatches.length === 0) {
      toast.error("No active batches found to notify.");
      return;
    }
    setIsNotifying(true);
    try {
      const batchIds = userBatches.map((b) => b.$id);
      const existingNotifs =
        await notificationService.getNotificationsByBatch(batchIds);

      let notifiedCount = 0;
      for (const batch of userBatches) {
        const alreadyExists = existingNotifs.some(
          (n) => n.batchId === batch.$id && n.paperId === test.paperId,
        );

        if (!alreadyExists) {
          await notificationService.createNotification({
            message: `New Mock Test: ${test.title ? `${test.title} (${test.tradeName})` : test.tradeName} — ID: ${test.paperId}`,
            type: "mock_test_assigned",
            batchId: batch.$id,
            teacherId: user.$id,
            paperId: test.paperId,
          });
          notifiedCount++;
        }
      }

      if (notifiedCount > 0) {
        toast.success(`Notified ${notifiedCount} batch(es)!`);
      } else {
        toast.info("Batches were already notified for this test.");
      }
    } catch (error) {
      toast.error("Failed to notify batches.");
    } finally {
      setIsNotifying(false);
    }
  };

  const onToggleProtection = async () => {
    setIsLoading(true);
    try {
      const data = await mockTestService.updateQuestion(test.$id, {
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col gap-3.5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-500">
      
      {/* ── Header (ID & Badges) ── */}
      <div className="flex justify-between items-start gap-2">
        <span 
          onClick={handleCopyId}
          className="text-[0.75rem] font-mono font-bold text-indigo-800 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 px-2.5 py-1 rounded-md tracking-wider break-all cursor-pointer hover:bg-indigo-200 transition-colors flex items-center gap-1.5"
          title="Click to copy Paper ID"
        >
          {test.paperId}
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-400/80 hover:text-indigo-600" />}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {test.isOriginal && (
            <span className="text-[0.65rem] font-extrabold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded tracking-wider dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
              Original
            </span>
          )}
          <span 
            className="flex items-center justify-center text-slate-300 dark:text-slate-500 cursor-pointer" 
            title={test.isProtected ? 'Protected' : 'Unprotected'}
            onClick={test.isOriginal ? onToggleProtection : undefined}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : test.isProtected ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
          </span>
        </div>
      </div>

      {/* ── Body (Title & Meta Info) ── */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[1.1rem] font-bold leading-snug text-slate-900 dark:text-white line-clamp-2">
          {test.title || test.tradeName || "No Title"}
        </h3>
        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-1.5">
          <span>{test.tradeName}</span>
          {test.year && (
            <>
              <span className="text-slate-300 dark:text-slate-600 leading-none">•</span>
              <span>{test.year} Year</span>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="text-[0.75rem] font-semibold text-slate-500 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 px-2 py-1 rounded-md flex items-center gap-1.5" title="Date Created">
            <Calendar className="w-3 h-3 stroke-[2.5]" />
            {format(new Date(test.$createdAt), "dd MMM yy, hh:mm a")}
          </span>
          <span className="text-[0.75rem] font-semibold text-slate-500 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 px-2 py-1 rounded-md flex items-center gap-1.5" title="Questions">
            <FileText className="w-3 h-3 stroke-[2.5]" />
            {test.quesCount ?? "50"} Qs
          </span>
          <span className="text-[0.75rem] font-semibold text-slate-500 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 px-2 py-1 rounded-md flex items-center gap-1.5" title="Duration">
            <Clock className="w-3 h-3 stroke-[2.5]" />
            {test.totalMinutes ?? "—"} min
          </span>
          <span className="text-[0.75rem] font-semibold text-slate-500 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 px-2 py-1 rounded-md flex items-center gap-1.5 capitalize" title="Difficulty">
            <BarChart className="w-3 h-3 stroke-[2.5]" />
            {test.difficultyLevel ?? "mixed"}
          </span>
        </div>
      </div>

      {/* ── Status & Score Row ── */}
      <div className="flex justify-between items-center py-3 border-y border-dashed border-slate-200 dark:border-slate-700 mt-1">
        <span className={`text-[0.7rem] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider ${isSubmitted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
          {isSubmitted ? 'Submitted' : 'Pending'}
        </span>
        <div className="text-right">
          {isSubmitted ? (
            <>
              <span className="text-[1.4rem] font-black leading-none text-slate-900 dark:text-white">{test.score ?? 0}</span>
              <span className="text-[0.8rem] font-bold text-slate-400 dark:text-slate-500"> / {test.quesCount ? test.quesCount : "-"}</span>
            </>
          ) : (
            <span className="text-[1.25rem] font-black text-slate-400 dark:text-slate-600 leading-none">—</span>
          )}
        </div>
      </div>

      {/* ── Bottom: Actions ── */}
      <div className="flex justify-between items-center gap-2 mt-auto pt-1">
        {/* Main Button */}
        {isSubmitted ? (
          <Link to={`/show-mock-test/${test.$id}`} className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-[0.85rem] font-bold py-2 px-2 rounded-xl transition-all whitespace-nowrap overflow-hidden text-ellipsis border-2 bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-indigo-500 dark:text-indigo-400">
            <Eye className="w-4 h-4 stroke-[2.5]" /> View Result
          </Link>
        ) : (
          <Link to={`/start-mock-test/${test.$id}`} className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-[0.85rem] font-bold py-2 px-2 rounded-xl transition-all whitespace-nowrap overflow-hidden text-ellipsis border-2 border-transparent bg-indigo-600 text-white shadow-[0_2px_4px_rgba(79,70,229,0.2)] hover:bg-indigo-700 hover:scale-[1.02]">
            <PlayCircle className="w-4 h-4 stroke-[2.5] fill-current" /> Start
          </Link>
        )}

        {/* Secondary Icons */}
        <div className="flex gap-1 shrink-0">
          <Link to={`/mock-test-result/${test.paperId}`} className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 hover:-translate-y-[1px] transition-all flex items-center justify-center dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-indigo-400" title="Live Scores (Other Students)">
            <ClipboardList className="w-[18px] h-[18px] stroke-[2.5]" />
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 hover:-translate-y-[1px] transition-all flex items-center justify-center dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-indigo-400" title="Share Paper">
                <Share2 className="w-[18px] h-[18px] stroke-[2.5]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 z-50">
              {navigator.share && (
                <DropdownMenuItem
                  onClick={() => handleShare(test.paperId)}
                  className="cursor-pointer font-medium"
                >
                  <Share2 className="w-4 h-4 mr-2 text-slate-500" /> Share via App
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleCopyMessage(test.paperId)}
                className="cursor-pointer font-medium"
              >
                {copiedMessage ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2 text-slate-500" />
                )}
                Copy Message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {test.isOriginal && (
            <>
              <button onClick={handleNotifyBatch} disabled={isNotifying} className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 hover:-translate-y-[1px] transition-all flex items-center justify-center dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-indigo-400 disabled:opacity-50" title="Notify Students">
                {isNotifying ? <Loader2 className="w-[18px] h-[18px] stroke-[2.5] animate-spin" /> : <BellRing className="w-[18px] h-[18px] stroke-[2.5]" />}
              </button>
              <button onClick={() => handleDelete(test.$id)} disabled={!!isDeleting[test.$id]} className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 hover:-translate-y-[1px] transition-all flex items-center justify-center dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400 disabled:opacity-50" title="Delete Paper">
                {isDeleting[test.$id] ? <Loader2 className="w-[18px] h-[18px] stroke-[2.5] animate-spin" /> : <Trash2 className="w-[18px] h-[18px] stroke-[2.5]" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockTestCard;
