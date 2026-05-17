import React from "react";
import { BookmarkPlus, BookmarkCheck, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Renders the current question card with MCQ options and prev/next navigation.
 * Props:
 *  - question         : current question object
 *  - questionIndex    : 0-based index
 *  - totalQuestions   : total count
 *  - isMarked         : boolean — marked for review
 *  - onOptionChange   : (questionId, letter) => void
 *  - onNavigate       : (step: +1 | -1) => void
 *  - onToggleMark     : (questionId) => void
 */
const QuestionCard = ({
  question,
  questionIndex,
  totalQuestions,
  isMarked,
  onOptionChange,
  onNavigate,
  onToggleMark,
  isSubmitLoading,
  onSubmit,
  isLandscapeForced,
}) => {
  return (
    /* Outer: fill remaining height, split into scroll area + sticky footer */
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 min-w-0">

      {/* ── Scrollable content area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-4">

          {/* Question meta bar */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#1a3a6b] text-white text-xs font-bold px-3 py-1.5 rounded-md">
              Question {questionIndex + 1}
              <span className="opacity-60 font-normal">/ {totalQuestions}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOptionChange(question.$id, null)}
                className={`${isLandscapeForced ? 'hidden' : 'flex lg:hidden'} items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-500 active:bg-red-50 active:text-red-600 transition-all`}
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>

              <button
                type="button"
                onClick={() => onToggleMark(question.$id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
                  isMarked
                    ? "bg-purple-100 border-purple-400 text-purple-700 dark:bg-purple-900/40 dark:border-purple-600 dark:text-purple-300"
                    : "bg-white border-slate-300 text-slate-600 hover:border-purple-400 hover:text-purple-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400"
                }`}
              >
                {isMarked ? (
                  <BookmarkCheck className="w-3.5 h-3.5" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5" />
                )}
                {isMarked ? "Marked" : "Mark for Review"}
              </button>
            </div>
          </div>

          {/* Question content */}
          <div className="pt-2 md:pt-4">
            <div className="px-1 md:px-2">
              <p className="text-sm md:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed mb-6 select-text">
                {question.question}
              </p>

              {question?.images?.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-6">
                  {question.images.map((img) => {
                    const image = JSON.parse(img);
                    return (
                      <img
                        key={image.id}
                        src={image.url}
                        alt={image.name}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 max-h-60 object-contain bg-slate-50 dark:bg-slate-800"
                      />
                    );
                  })}
                </div>
              )}

              <div className="space-y-3">
                {(question.options ?? []).map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const isSelected = question.response === letter;
                  return (
                    <label
                      key={index}
                      className={`group flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-[#1a3a6b] bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${questionIndex}`}
                        value={letter}
                        checked={isSelected}
                        onChange={() => onOptionChange(question.$id, letter)}
                        className="sr-only"
                      />
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all ${
                          isSelected
                            ? "bg-[#1a3a6b] border-[#1a3a6b] text-white"
                            : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 group-hover:border-blue-400"
                        }`}
                      >
                        {letter}
                      </div>
                      <span
                        className={`mt-0.5 text-xs md:text-sm leading-relaxed transition-colors ${
                          isSelected
                            ? "text-[#1a3a6b] dark:text-blue-200 font-medium"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom navigation bar ── */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        
        {/* Left Side: Submit (Mobile) + Actions (Desktop) + Counter */}
        <div className="flex items-center gap-3">
          {/* Submit Button (Mobile Only) */}
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitLoading}
            className={`${isLandscapeForced ? 'hidden' : 'flex lg:hidden'} items-center gap-1.5 rounded-lg px-4 py-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 font-bold shadow-md transition-all active:scale-95 text-xs h-9`}
          >
            {isSubmitLoading ? "..." : "Submit"}
          </Button>

          {/* Mark for Review & Next (Desktop) */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!isMarked) onToggleMark(question.$id);
              if (questionIndex < totalQuestions - 1) onNavigate(1);
            }}
            className={`${isLandscapeForced ? 'flex' : 'hidden lg:flex'} items-center gap-1.5 rounded-lg px-4 py-2.5 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20 font-semibold transition-colors h-10`}
          >
            <BookmarkCheck className="w-4 h-4" />
            Mark for Review & Next
          </Button>

          {/* Clear Response (Desktop) */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOptionChange(question.$id, null)}
            className={`${isLandscapeForced ? 'flex' : 'hidden lg:flex'} items-center gap-1.5 rounded-lg px-4 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold transition-colors h-10`}
          >
            <RotateCcw className="w-4 h-4" />
            Clear Response
          </Button>

          <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
            {questionIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Right Side: Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => onNavigate(-1)}
            disabled={questionIndex === 0}
            variant="outline"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 border-slate-300 dark:border-slate-700 disabled:opacity-40 font-semibold h-9 md:h-10"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          <Button
            type="button"
            onClick={() => onNavigate(1)}
            disabled={questionIndex >= totalQuestions - 1}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 bg-[#1a3a6b] hover:bg-[#15305c] text-white disabled:opacity-40 font-semibold shadow-md h-9 md:h-10"
          >
            <span className="hidden sm:inline">Save & Next</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
