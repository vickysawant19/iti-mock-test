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
} from "lucide-react";
import mockTestService from "@/services/mocktest.service";

// ─── Small stat cell ──────────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, iconClass = "text-gray-400" }) => (
  <div className="flex items-center gap-2 min-w-0">
    <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} />
    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}:</span>
    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{value}</span>
  </div>
);

// ─── Action button ────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, asLink, to, color, icon: Icon, label, disabled, loading }) => {
  const base =
    "flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-white whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed";
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
      <Link to={to} className={`${base} ${colors[color]}`}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${colors[color]}`}>
      {content}
    </button>
  );
};

// ─── MockTestCard ─────────────────────────────────────────────────────────────
const MockTestCard = ({ setMockTests, test, user, handleDelete, isDeleting }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async (paperId) => {
    const examUrl = `${window.location.origin}/attain-test?paperid=${paperId}`;
    const shareText = `🎉 *_MSQs Exam Paper_* 🎉\n\n_Hey there!_\n_Check out this Exam Paper_\n Paper ID: *${paperId}*\n\n📚 *Trade:* ${test.tradeName}\n💯 *Total Questions:* ${test.quesCount}\n⏳ *Duration:* ${test.totalMinutes} Minutes\n\n👉 Click the link below to get started:\n${examUrl}\n\n*Remember to submit on complete!*\n\n Good luck and happy Exam!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mock Test Paper", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Link copied to clipboard!");
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
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        {/* Date row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(test.$createdAt), "dd MMM yyyy, hh:mm a")}</span>
          </div>
          {/* Status pill */}
          {isSubmitted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-3 h-3" /> Submitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <XCircle className="w-3 h-3" /> Pending
            </span>
          )}
        </div>

        {/* Trade name */}
        <div className="flex items-start gap-2">
          <GraduationCap className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
              {test.tradeName || "No Trade Name"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {test.year ? `${test.year} Year` : ""}
              {test.isOriginal && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                  Original
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="flex-1 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
        <Stat icon={Hash}         label="Paper ID"  value={test.paperId}                          iconClass="text-indigo-400" />
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
      <div className="mt-auto p-3 flex flex-wrap gap-2">
        {/* Start / Show */}
        {isSubmitted ? (
          <ActionBtn asLink to={`/show-mock-test/${test.$id}`} color="green" icon={Eye} label="Show Test" />
        ) : (
          <ActionBtn asLink to={`/start-mock-test/${test.$id}`} color="blue" icon={PlayCircle} label="Start" />
        )}

        {/* Scores */}
        <ActionBtn asLink to={`/mock-test-result/${test.paperId}`} color="purple" icon={ClipboardList} label="Scores" />

        {/* Share */}
        <ActionBtn onClick={() => handleShare(test.paperId)} color="gray" icon={Share2} label="Share" />

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
