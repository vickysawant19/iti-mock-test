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
} from "lucide-react";
import mockTestService from "@/services/mocktest.service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";

// ─── Small stat cell ──────────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, iconClass = "text-gray-400" }) => (
  <div className="flex items-center gap-2 min-w-0">
    <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} />
    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}:</span>
    <span className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{value}</span>
  </div>
);

// ─── Action button ────────────────────────────────────────────────────────────
const ActionBtn = React.forwardRef(({ onClick, asLink, to, color, icon: Icon, label, disabled, loading, ...props }, ref) => {
  const base =
    "flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 h-7 sm:h-9 rounded sm:rounded-lg text-[10px] sm:text-xs font-semibold text-white whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const colors = {
    blue:   "bg-blue-500 hover:bg-blue-600 active:bg-blue-700",
    green:  "bg-green-500 hover:bg-green-600 active:bg-green-700",
    purple: "bg-violet-500 hover:bg-violet-600 active:bg-violet-700",
    gray:   "bg-gray-500 hover:bg-gray-600 active:bg-gray-700",
    orange: "bg-orange-500 hover:bg-orange-600 active:bg-orange-700",
    red:    "bg-red-500 hover:bg-red-600 active:bg-red-700",
  };

  const content = (
    <>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      <span>{loading ? "…" : label}</span>
    </>
  );

  if (asLink && to) {
    return (
      <Link ref={ref} to={to} className={`${base} ${colors[color]}`} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button ref={ref} onClick={onClick} disabled={disabled || loading} className={`${base} ${colors[color]}`} {...props}>
      {content}
    </button>
  );
});
ActionBtn.displayName = "ActionBtn";

// ─── MockTestCard ─────────────────────────────────────────────────────────────
const MockTestCard = ({ setMockTests, test, user, handleDelete, isDeleting }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(test.paperId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback for older browsers
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

  const [copiedMessage, setCopiedMessage] = useState(false);

  const handleCopyMessage = async (paperId) => {
    const examUrl = `${window.location.origin}/attain-test?paperid=${paperId}`;
    const shareText = `🎉 *_MSQs Exam Paper_* 🎉\n\n_Hey there!_\n_Check out this Exam Paper_\n Paper ID: *${paperId}*\n\n📚 *Trade:* ${test.tradeName || "Unknown"}\n💯 *Total Questions:* ${test.quesCount}\n⏳ *Duration:* ${test.totalMinutes || 0} Minutes\n\n👉 Click the link below to get started:\n${examUrl}\n\n*Remember to submit on complete!*\n\n Good luck and happy Exam!`;
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
    const shareText = `🎉 *_MSQs Exam Paper_* 🎉\n\n_Hey there!_\n_Check out this Exam Paper_\n Paper ID: *${paperId}*\n\n📚 *Trade:* ${test.tradeName || "Unknown"}\n💯 *Total Questions:* ${test.quesCount}\n⏳ *Duration:* ${test.totalMinutes || 0} Minutes\n\n👉 Click the link below to get started:\n${examUrl}\n\n*Remember to submit on complete!*\n\n Good luck and happy Exam!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mock Test Paper", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const onToggleProtection = async () => {
    setIsLoading(true);
    try {
      const data = await mockTestService.updateQuestion(test.$id, {
        isProtected: !test.isProtected,
      });
      setMockTests((prev) => prev.map((item) => (item.$id === data.$id ? data : item)));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitted = test.submitted;

  return (
    <div className="flex flex-col h-full rounded-none sm:rounded-2xl border-none sm:border sm:border-gray-200 sm:dark:border-gray-700 bg-white dark:bg-gray-800 sm:shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative">

      {/* ── Header ── */}
      <div className="p-2 sm:px-4 sm:pt-4 sm:pb-3 border-b border-gray-100 dark:border-gray-700">
        {/* Date row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 sm:mb-2 gap-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400 dark:text-gray-500 text-[9px] sm:text-xs">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{format(new Date(test.$createdAt), "dd MMM yy, hh:mm a")}</span>
          </div>
          {/* Status pill */}
          <div className="flex items-center">
            {isSubmitted ? (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Submitted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Pending
              </span>
            )}
          </div>
        </div>

        {/* Trade name */}
        <div className="flex items-start gap-1.5 sm:gap-2">
          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h2 className="text-xs sm:text-base font-bold text-gray-800 dark:text-gray-100 leading-tight sm:leading-snug line-clamp-2">
              {test.tradeName || "No Trade Name"}
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {test.year ? `${test.year} Year` : ""}
              {test.isOriginal && (
                <span className="ml-1 sm:ml-2 inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                  Original
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="flex-1 p-2 sm:px-4 sm:py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
        {/* Paper ID with copy button */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 col-span-1 sm:col-span-1">
          <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-indigo-400" />
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 shrink-0">ID:</span>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200 truncate font-mono">{test.paperId}</span>
          <button
            onClick={handleCopyId}
            title="Copy Paper ID"
            className="shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {copied
              ? <Check className="w-3 h-3 text-green-500" />
              : <Copy className="w-3 h-3 text-gray-400 hover:text-indigo-500" />}
          </button>
        </div>
        <Stat icon={FileText}     label="Questions"  value={test.quesCount ?? "50"}               iconClass="text-blue-400"   />
        <Stat icon={Clock}        label="Duration"   value={`${test.totalMinutes ?? "—"} min`}    iconClass="text-violet-400" />
        <Stat icon={Target}       label="Score"      value={test.score ?? "—"}                    iconClass="text-green-400"  />
        {isSubmitted && test.endTime && (
          <div className="col-span-2">
            <Stat icon={CheckCircle2} label="Submitted" value={format(new Date(test.endTime), "dd MMM, hh:mm a")} iconClass="text-green-400" />
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="mt-auto p-2 sm:p-3 grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
        {/* Start / Show */}
        {isSubmitted ? (
          <ActionBtn asLink to={`/show-mock-test/${test.$id}`} color="green" icon={Eye} label="Show Test" />
        ) : (
          <ActionBtn asLink to={`/start-mock-test/${test.$id}`} color="blue" icon={PlayCircle} label="Start" />
        )}

        {/* Scores */}
        <ActionBtn asLink to={`/mock-test-result/${test.paperId}`} color="purple" icon={ClipboardList} label="Scores" />

        {/* Share Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ActionBtn color="gray" icon={Share2} label="Share" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 z-50">
            {navigator.share && (
              <DropdownMenuItem onClick={() => handleShare(test.paperId)} className="cursor-pointer">
                <Share2 className="w-4 h-4 mr-2 text-gray-500" /> Share via App
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleCopyMessage(test.paperId)} className="cursor-pointer">
              {copiedMessage ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2 text-gray-500" />}
              Copy Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Original-only actions */}
        {test.isOriginal && (
          <>
            <ActionBtn
              onClick={onToggleProtection}
              color="orange"
              icon={test.isProtected ? Lock : Unlock}
              label={test.isProtected ? "Protected" : "Unprotect"}
              loading={isLoading}
            />
            <ActionBtn
              onClick={() => handleDelete(test.$id)}
              color="red"
              icon={Trash2}
              label="Delete"
              disabled={!!isDeleting[test.$id]}
              loading={!!isDeleting[test.$id]}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MockTestCard;
