import React, { useState } from "react";
import { Calendar, Phone, Award, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

/* ── Colour map for each question state ──────────────────────────────────── */
export const Q_STATE = {
  NOT_VISITED: "not_visited",
  NOT_ANSWERED: "not_answered",
  ANSWERED: "answered",
  MARKED: "marked",
  ANSWERED_MARKED: "answered_marked",
};

const stateStyle = {
  [Q_STATE.NOT_VISITED]:
    "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  [Q_STATE.NOT_ANSWERED]:
    "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  [Q_STATE.ANSWERED]:
    "bg-emerald-500 text-white border-emerald-500 shadow-sm",
  [Q_STATE.MARKED]:
    "bg-purple-500 text-white border-purple-500",
  [Q_STATE.ANSWERED_MARKED]:
    "bg-purple-600 text-white border-purple-600 ring-2 ring-emerald-400",
};

const legendItems = [
  { state: Q_STATE.ANSWERED, label: "Answered" },
  { state: Q_STATE.NOT_ANSWERED, label: "Not Answered" },
  { state: Q_STATE.NOT_VISITED, label: "Not Visited" },
  { state: Q_STATE.MARKED, label: "Marked for Review" },
  { state: Q_STATE.ANSWERED_MARKED, label: "Answered & Marked" },
];

function getState(visited, answered, marked) {
  if (answered && marked) return Q_STATE.ANSWERED_MARKED;
  if (answered) return Q_STATE.ANSWERED;
  if (marked) return Q_STATE.MARKED;
  if (visited) return Q_STATE.NOT_ANSWERED;
  return Q_STATE.NOT_VISITED;
}

const fixProfileImage = (url) => {
  if (!url) return url;
  // Replace both cloud.appwrite.io and any localhost proxy URLs with the production endpoint
  return url.replace("cloud.appwrite.io", "auth.itimitra.in");
};

/**
 * Full right-sidebar component:
 *   – Student profile card
 *   – Status legend
 *   – Question navigator grid
 *   – Submit panel (progress + button)
 *
 * On mobile it renders as a slide-up bottom drawer triggered by a handle.
 */
const QuestionPalette = ({
  questions,
  visitedSet,
  markedSet,
  currentQuestionIndex,
  isPaletteOpen,
  onTogglePalette,
  onSelectQuestion,
  profile,
  user,
  answeredCount,
  isSubmitLoading,
}) => {
  const total = questions.length;

  /* ── Stat counters ── */
  const counts = questions.reduce(
    (acc, q, i) => {
      const state = getState(visitedSet.has(i), !!q.response, markedSet.has(q.$id));
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    },
    {},
  );

  const profileName = profile?.name || user?.name || "Student";
  const profileTrade = profile?.trade || profile?.tradeName || "—";
  const profileMobile = profile?.phone || profile?.mobile || "—";
  const profileAvatar = fixProfileImage(profile?.profileImage || profile?.avatarUrl || profile?.profileimage || null);

  // Derive initials from name for Avatar fallback
  const initials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto bg-white dark:bg-slate-900">

      {/* ── Student Profile Card ── */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#1a3a6b] text-white">

        <div className="flex items-center gap-3">
          {/* Interactive Avatar Component */}
          <InteractiveAvatar
            src={profileAvatar}
            fallbackText={initials}
            userId={user?.$id}
            editable={false}
            className="w-14 h-14"
          />

          <div className="min-w-0">
            <div className="font-bold text-sm truncate">{profileName}</div>
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-blue-200">
                <Award className="w-3 h-3" /> {profileTrade}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-blue-200">
                <Phone className="w-3 h-3" /> {profileMobile}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-blue-200">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Legend ── */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Legend
        </div>
        <div className="space-y-1.5">
          {legendItems.map(({ state, label }) => (
            <div key={state} className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded flex-shrink-0 border text-[9px] font-bold flex items-center justify-center ${stateStyle[state]}`}
              >
                {counts[state] || 0}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Question Navigator ── */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Question Palette
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {questions.map((ques, index) => {
            const isCurrent = currentQuestionIndex === index;
            const state = getState(
              visitedSet.has(index),
              !!ques.response,
              markedSet.has(ques.$id),
            );

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onSelectQuestion(index);
                  if (window.innerWidth < 1024) onTogglePalette(false);
                }}
                className={`
                  relative w-full aspect-square rounded-md text-[10px] font-bold border-[1.5px] transition-all duration-150
                  flex items-center justify-center
                  ${stateStyle[state]}
                  ${isCurrent ? "ring-2 ring-offset-1 ring-amber-400 scale-110 z-10" : "hover:scale-105"}
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Submit Panel ── */}
      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex-shrink-0">
        {/* Attempt summary */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-center">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{answeredCount}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Answered</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
            <div className="text-lg font-bold text-red-500 dark:text-red-400">{total - answeredCount}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Unanswered</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Progress</span>
            <span>{Math.round((answeredCount / total) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1a3a6b] to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(answeredCount / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Submit button (Desktop Only) */}
        <Button
          type="submit"
          disabled={isSubmitLoading}
          className="hidden lg:flex w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-2.5 rounded-xl shadow-md items-center justify-center gap-2"
        >
          <CheckSquare className="w-4 h-4" />
          {isSubmitLoading ? "Submitting…" : "Review & Submit"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isPaletteOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => onTogglePalette(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 xl:w-80 flex-shrink-0 flex-col border-l border-slate-200 dark:border-slate-800 h-full overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile slide-up drawer */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
          isPaletteOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "80vh" }}
      >
        {/* Pull handle */}
        <div
          className="flex flex-col items-center py-2 bg-[#1a3a6b] rounded-t-2xl cursor-pointer shadow-[0_-6px_20px_rgba(0,0,0,0.2)]"
          onClick={() => onTogglePalette(!isPaletteOpen)}
        >
          <div className="w-10 h-1 bg-white/40 rounded-full mb-1" />
          <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase">
            Question Palette
          </span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 40px)" }}>
          {sidebarContent}
        </div>
      </div>

      {/* Mobile floating palette toggle (when drawer is closed) */}
      {!isPaletteOpen && (
        <button
          type="button"
          onClick={() => onTogglePalette(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 bg-[#1a3a6b] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <span className="w-5 h-5 bg-emerald-500 rounded-full text-[10px] flex items-center justify-center font-bold">
            {answeredCount}
          </span>
          Palette
        </button>
      )}
    </>
  );
};

export default QuestionPalette;
