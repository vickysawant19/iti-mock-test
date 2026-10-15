import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookmarkPlus,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Globe,
  Bug,
  Image as ImageIcon,
  HelpCircle,
  ZoomIn,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveQuestion } from "@/utils/questionV2Helper";
import {
  questionSlideVariants,
  optionsListVariants,
  optionCardVariants,
  springSnappy,
} from "../motionVariants";

/**
 * QuestionCard with full Version 2 (schemaVersion: 2) Multilingual Support
 * & Framer Motion directional slide, shared layout pill, and tactile MCQ rings.
 */
const QuestionCard = ({
  question,
  questionIndex,
  navDirection = 1,
  totalQuestions,
  isMarked,
  onOptionChange,
  onNavigate,
  onToggleMark,
  isSubmitLoading,
  onSubmit,
  isLandscapeForced,
}) => {
  // Local language view toggle: "bilingual" (default), "english", or "marathi"
  const [langMode, setLangMode] = useState("bilingual");
  const [showDebug, setShowDebug] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Normalize and resolve question fields (V1, V2, bilingual, images, options)
  const resolved = resolveQuestion(question, langMode);

  // Fallback handler if question has no valid ID
  const qId = question?.$id || question?.id || `temp-q-${questionIndex}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 min-w-0 font-sans relative">
      {/* ── Scrollable content area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">

          {/* Question meta bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#1a3a6b] text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-sm">
                Question {questionIndex + 1}
                <span className="opacity-60 font-normal">/ {totalQuestions}</span>
              </span>

              {/* Version & Language Badge */}
              {resolved.schemaVersion === 2 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  ⚡ V2 {resolved.isBilingual ? "Bilingual" : resolved.languageType}
                </span>
              )}

              {/* Debug Trigger (Dev Mode) */}
              {(import.meta.env.DEV || resolved.isMissing) && (
                <button
                  type="button"
                  onClick={() => setShowDebug(!showDebug)}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border transition-all ${
                    resolved.isMissing
                      ? "bg-red-50 text-red-600 border-red-300 dark:bg-red-950/50 dark:text-red-400"
                      : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 hover:bg-amber-100"
                  }`}
                  title="Toggle question diagnostics"
                >
                  <Bug className="w-3 h-3" />
                  {resolved.isMissing ? "⚠️ Error Info" : "Debug"}
                </button>
              )}
            </div>

            {/* Language Switcher & Controls */}
            <div className="flex items-center gap-2">
              {/* Language Switcher with Shared layoutId Pill */}
              {resolved.isBilingual && (
                <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 relative">
                  {[
                    { id: "bilingual", label: "Both" },
                    { id: "english", label: "EN" },
                    { id: "marathi", label: "मराठी" },
                  ].map((mode) => {
                    const active = langMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setLangMode(mode.id)}
                        className={`relative px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors z-10 ${
                          active
                            ? "text-white"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="langSwitchPill"
                            transition={springSnappy}
                            className="absolute inset-0 bg-[#1a3a6b] dark:bg-indigo-600 rounded-md -z-10 shadow-sm"
                          />
                        )}
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Clear Option (Mobile) */}
              <button
                type="button"
                onClick={() => onOptionChange(qId, null)}
                className={`${isLandscapeForced ? 'hidden' : 'flex lg:hidden'} items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-500 active:bg-red-50 active:text-red-600 transition-all`}
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>

              {/* Mark for Review */}
              <button
                type="button"
                onClick={() => onToggleMark(qId)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
                  isMarked
                    ? "bg-purple-100 border-purple-400 text-purple-700 dark:bg-purple-900/40 dark:border-purple-600 dark:text-purple-300"
                    : "bg-white border-slate-300 text-slate-600 hover:border-purple-400 hover:text-purple-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400"
                }`}
              >
                <motion.span
                  animate={isMarked ? { rotate: [0, -14, 14, 0], scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.35 }}
                >
                  {isMarked ? (
                    <BookmarkCheck className="w-3.5 h-3.5 fill-purple-700 dark:fill-purple-300" />
                  ) : (
                    <BookmarkPlus className="w-3.5 h-3.5" />
                  )}
                </motion.span>
                {isMarked ? "Marked" : "Mark for Review"}
              </button>
            </div>
          </div>

          {/* ── Diagnostic Debug Drawer (Collapsible) ── */}
          {showDebug && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                <span className="flex items-center gap-1.5">
                  <Bug className="w-4 h-4 text-amber-600" />
                  Question Diagnostic Details (Dev Mode)
                </span>
                <span className="text-[10px] uppercase tracking-wider bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded">
                  Index #{questionIndex}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <p><strong>Question ID:</strong> <code className="bg-white/80 dark:bg-slate-900 px-1 py-0.5 rounded">{qId}</code></p>
                <p><strong>Schema Version:</strong> {resolved.schemaVersion}</p>
                <p><strong>Language Type:</strong> {resolved.languageType} ({resolved.isBilingual ? "Bilingual" : "Single"})</p>
                <p><strong>Has Valid Text:</strong> {resolved.questionEnglish || resolved.questionMarathi ? "Yes" : "No"}</p>
                <p><strong>Resolved Options:</strong> {resolved.options.length} items</p>
                <p><strong>Resolved Images:</strong> {resolved.images.length} items</p>
                <p><strong>Correct Answer:</strong> {resolved.correctAnswer || "Not loaded"}</p>
                <p><strong>Student Response:</strong> {question?.response || "None"}</p>
              </div>
              {resolved.missingReason && (
                <div className="p-2 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 font-medium">
                  ⚠️ Issue: {resolved.missingReason}
                </div>
              )}
              <details className="pt-1">
                <summary className="cursor-pointer text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  View Raw JSON Payload
                </summary>
                <pre className="mt-1 p-2 bg-slate-900 text-slate-100 rounded text-[10px] overflow-x-auto max-h-40">
                  {JSON.stringify(question, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* ── Direction-Aware Slide Presentation ── */}
          <AnimatePresence mode="wait" custom={navDirection}>
            <motion.div
              key={qId || questionIndex}
              custom={navDirection}
              variants={questionSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              {/* ── CASE 1: Broken / Missing Question Fallback ── */}
              {resolved.isMissing ? (
                <div className="p-8 my-6 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
                      Question Not Available
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      {resolved.missingReason || "This question document could not be retrieved from the Question Bank."}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 inline-block">
                    Question Ref: <code className="font-mono text-red-600 font-bold">{qId}</code>
                  </div>

                  <p className="text-xs text-slate-400">
                    You can skip this question using the Next button below. Your exam progress will not be interrupted.
                  </p>
                </div>
              ) : (
                /* ── CASE 2: Valid Question Content Display ── */
                <div className="pt-2 md:pt-4 space-y-6">
                  
                  {/* Question Text Box */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    {/* English Content */}
                    {(langMode === "english" || langMode === "bilingual" || !resolved.questionMarathi) && (
                      <p className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed select-text">
                        {resolved.questionEnglish || resolved.questionRaw}
                      </p>
                    )}

                    {/* Marathi Content (Styled in separate clean block for bilingual) */}
                    {(langMode === "marathi" || (langMode === "bilingual" && resolved.questionMarathi)) && (
                      <div className={`${resolved.isBilingual && langMode === "bilingual" ? "pt-2 border-t border-slate-100 dark:border-slate-800" : ""}`}>
                        {resolved.isBilingual && langMode === "bilingual" && (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded mb-1">
                            मराठी
                          </span>
                        )}
                        <p className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed select-text font-serif">
                          {resolved.questionMarathi}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Question Diagrams & Images (V1 and V2) */}
                  {resolved.images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {resolved.images.map((img, idx) => (
                        <motion.div
                          key={img.id || idx}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setZoomedImage(img.url)}
                          className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm"
                        >
                          <img
                            src={img.url}
                            alt={img.name || `Question Image ${idx + 1}`}
                            className="rounded-lg max-h-72 object-contain bg-slate-50 dark:bg-slate-800"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Staggered Options List */}
                  <motion.div
                    variants={optionsListVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {resolved.options.map((option) => {
                      const letter = option.letter;
                      const isSelected = question?.response === letter;

                      return (
                        <motion.label
                          key={option.index}
                          variants={optionCardVariants}
                          whileHover={{ scale: 1.008, x: 2 }}
                          whileTap={{ scale: 0.985 }}
                          className={`group flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                            isSelected
                              ? "border-[#1a3a6b] bg-blue-50/80 dark:bg-blue-950/40 dark:border-blue-500 shadow-sm"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${questionIndex}`}
                            value={letter}
                            checked={isSelected}
                            onChange={() => onOptionChange(qId, letter)}
                            className="sr-only"
                          />

                          {/* Tactile Animated Option Letter Bubble */}
                          <motion.div
                            animate={
                              isSelected
                                ? { scale: [1, 1.15, 1] }
                                : { scale: 1 }
                            }
                            transition={
                              isSelected
                                ? { duration: 0.22, ease: "easeInOut" }
                                : { duration: 0.15 }
                            }
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all ${
                              isSelected
                                ? "bg-[#1a3a6b] border-[#1a3a6b] text-white shadow-sm"
                                : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:border-blue-400 group-hover:text-blue-600"
                            }`}
                          >
                            {letter}
                          </motion.div>

                          {/* Option Text Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* English Option */}
                            {(langMode === "english" || langMode === "bilingual" || !option.marathi) && (
                              <div
                                className={`text-xs sm:text-sm leading-relaxed transition-colors select-text ${
                                  isSelected
                                    ? "text-[#1a3a6b] dark:text-blue-200 font-semibold"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {option.english || option.raw}
                              </div>
                            )}

                            {/* Marathi Option */}
                            {(langMode === "marathi" || (langMode === "bilingual" && option.marathi)) && (
                              <div
                                className={`text-xs sm:text-sm leading-relaxed font-serif select-text ${
                                  isSelected
                                    ? "text-[#1a3a6b]/90 dark:text-blue-300/90 font-medium"
                                    : "text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                {option.marathi}
                              </div>
                            )}

                            {/* Option Diagram (if provided in V2 optionImageUrls) */}
                            {option.imageUrl && (
                              <div className="pt-2">
                                <img
                                  src={option.imageUrl}
                                  alt={`Option ${letter} visual`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setZoomedImage(option.imageUrl);
                                  }}
                                  className="max-h-36 rounded-lg border border-slate-200 dark:border-slate-700 object-contain bg-white dark:bg-slate-800 cursor-zoom-in"
                                  loading="lazy"
                                />
                              </div>
                            )}
                          </div>
                        </motion.label>
                      );
                    })}
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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
              if (!isMarked) onToggleMark(qId);
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
            onClick={() => onOptionChange(qId, null)}
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
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 border-slate-300 dark:border-slate-700 disabled:opacity-40 font-semibold h-9 md:h-10 transition-transform active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          <Button
            type="button"
            onClick={() => onNavigate(1)}
            disabled={questionIndex >= totalQuestions - 1}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 bg-[#1a3a6b] hover:bg-[#15305c] text-white disabled:opacity-40 font-semibold shadow-md h-9 md:h-10 transition-transform active:scale-95"
          >
            <span className="hidden sm:inline">Save & Next</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Lightbox Diagram Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={springSnappy}
              className="relative max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={zoomedImage}
                alt="Enlarged Diagram"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionCard;
