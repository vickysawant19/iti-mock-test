/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Award, XCircle, CheckCircle, ArrowRight, Sparkles, X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/game.service";

// Tracks whether we're on a narrow viewport so the sheet can slide up from the
// bottom on mobile, but fade/scale in as a centered card on larger screens.
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : true
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export default function QuestionModal({ isOpen, onClose, tradeId, batchId, onAnswerSubmit, stats }) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState(null); // { isCorrect, xpGained, coinsGained, levelUp }
  const [shake, setShake] = useState(false);
  const [isFiftyFiftyUsed, setIsFiftyFiftyUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  
  // Advanced Gamification states
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimeout, setIsTimeout] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [sessionCombo, setSessionCombo] = useState(() => {
    return parseInt(localStorage.getItem("session_combo") || "0", 10);
  });
  const timerRef = useRef(null);

  const isMobile = useIsMobile();
  const sheetRef = useRef(null);

  const optionLabels = ["A", "B", "C", "D"];

  // Fetch question on mount
  useEffect(() => {
    if (isOpen && tradeId) {
      setLoading(true);
      setQuestion(null);
      setSelectedOption(null);
      setSubmitted(false);
      setGradingResult(null);
      setShake(false);
      setIsFiftyFiftyUsed(false);
      setEliminatedOptions([]);
      
      // Reset timer and confidence
      setTimeLeft(30);
      setIsTimeout(false);
      setConfidence(null);

      const loadQuestion = async () => {
        try {
          const settings = batchId ? await gameService.getBatchGameSettings(batchId) : undefined;
          const q = await gameService.getRandomQuestion(tradeId, settings);
          setQuestion(q);
        } catch (err) {
          console.error("[QuestionModal] Failed to load question:", err);
        } finally {
          setLoading(false);
        }
      };

      loadQuestion();
    }
  }, [isOpen, tradeId, batchId]);

  // Countdown timer effect
  useEffect(() => {
    if (isOpen && !loading && question && !submitted) {
      setTimeLeft(30);
      setIsTimeout(false);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // No penalty on timeout — just stop the timer silently
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, loading, question, submitted]);

  if (!isOpen) return null;

  const isDifficult = (() => {
    if (!question) return false;
    const text = (question.question || "").toLowerCase();
    return text.length > 110 || text.includes("calculate") || text.includes("formula") || text.includes("convert") || text.includes("what is the value") || text.includes("resistance") || text.includes("voltage") || text.includes("current");
  })();

  const handleTimeout = () => {
    // No-op: timer expires silently, no penalty applied
  };

  const handleSelect = (idx) => {
    if (submitted || eliminatedOptions.includes(idx)) return;
    setSelectedOption(idx);
  };

  const handleFiftyFifty = () => {
    if (isFiftyFiftyUsed || submitted || !question) return;

    const correctLetter = question.correctAnswer;
    const correctIdx = optionLabels.indexOf(correctLetter);
    const incorrectIndexes = [0, 1, 2, 3].filter((idx) => idx !== correctIdx);
    const shuffled = incorrectIndexes.sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);

    setIsFiftyFiftyUsed(true);
    setEliminatedOptions(toEliminate);

    if (selectedOption !== null && toEliminate.includes(selectedOption)) {
      setSelectedOption(null);
    }
  };

  const handleSubmit = async () => {
    if (selectedOption === null || submitted || !question) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const selectedLetter = optionLabels[selectedOption];
    const isCorrect = selectedLetter === question.correctAnswer;

    setSubmitted(true);

    if (isCorrect) {
      const newCombo = sessionCombo + 1;
      setSessionCombo(newCombo);
      localStorage.setItem("session_combo", newCombo.toString());
    } else {
      setSessionCombo(0);
      localStorage.setItem("session_combo", "0");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    try {
      const res = await onAnswerSubmit(isCorrect, isFiftyFiftyUsed);
      setGradingResult({
        isCorrect,
        xpGained: res?.xpGained !== undefined ? res.xpGained : isCorrect ? (isFiftyFiftyUsed ? 5 : 10) : -3,
        coinsGained: res?.coinsGained !== undefined ? res.coinsGained : isCorrect ? 5 : 0,
        streakBonus: res?.streakBonus || 0,
        levelUp: res?.levelUp || false,
      });
    } catch (err) {
      console.error(err);
      setGradingResult({
        isCorrect,
        xpGained: isCorrect ? (isFiftyFiftyUsed ? 5 : 10) : -3,
        coinsGained: isCorrect ? 5 : 0,
        streakBonus: 0,
        levelUp: false,
      });
    }
  };

  const handleClose = () => {
    if (submitted) return; // once graded, must use "Continue Journey"
    onClose();
  };

  // Removed: handleDragEnd — swipe-to-dismiss is disabled

  // Confetti burst for correct answers
  const renderConfetti = () => {
    const colors = ["#ec4899", "#a855f7", "#3b82f6", "#eab308", "#10b981"];
    return Array.from({ length: 40 }).map((_, i) => {
      const color = colors[i % colors.length];
      const randomX = Math.random() * 300 - 150;
      const randomY = Math.random() * -300 - 100;
      return (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: randomX, y: randomY, scale: [0, 1, 0.8, 0], rotate: Math.random() * 360 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: "8px",
            height: "8px",
            borderRadius: i % 2 === 0 ? "50%" : "2px",
            backgroundColor: color,
            zIndex: 100,
          }}
        />
      );
    });
  };

  const sheetVariants = isMobile
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : { initial: { y: 24, opacity: 0, scale: 0.95 }, animate: { y: 0, opacity: 1, scale: 1 }, exit: { y: 24, opacity: 0, scale: 0.95 } };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Sheet / Card */}
      <AnimatePresence>
        <motion.div
          ref={sheetRef}
          key="question-modal"
          initial={sheetVariants.initial}
          animate={{
            ...sheetVariants.animate,
            x: shake ? [0, -10, 10, -10, 10, 0] : 0,
          }}
          exit={sheetVariants.exit}
          transition={{
            default: { type: "spring", damping: 30, stiffness: 300 },
            x: { duration: 0.5, ease: "easeInOut" },
          }}
          drag={false}
          className={[
            "relative z-10 flex w-full flex-col overflow-hidden border border-slate-800 bg-slate-900 text-white shadow-2xl",
            "max-h-[92dvh] rounded-t-[2rem] md:max-h-[85vh] md:max-w-lg md:rounded-3xl",
          ].join(" ")}
        >
          {/* Confetti only for difficult questions */}
          {submitted && gradingResult?.isCorrect && isDifficult && (
            <div className="pointer-events-none absolute left-1/2 top-1/3 z-50">{renderConfetti()}</div>
          )}


          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 pb-3 pt-1 md:pt-5 bg-slate-950/20">
            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 text-sm font-black tracking-tight text-pink-500">
                <Award className="h-4.5 w-4.5 text-pink-500 shrink-0" />
                GAMIFIED CHALLENGE
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Session Combo Meter */}
              {sessionCombo > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 text-[9px] font-black text-orange-400"
                  title="Session Combo Streak"
                >
                  <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                  x{sessionCombo}
                </motion.span>
              )}
              {/* XP Preview Indicator */}
              {question && (
                <span className="flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[9px] font-black text-purple-300">
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  +{isFiftyFiftyUsed ? 5 : 10} XP
                </span>
              )}
              {!submitted && (
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
                <p className="text-sm font-bold text-slate-400">Summoning random question...</p>
              </div>
            ) : !question ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <XCircle className="mb-3 h-12 w-12 text-red-500" />
                <p className="text-sm font-bold text-slate-200">No questions found</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  Your trade doesn't have any theory questions loaded yet. Let your instructor know.
                </p>
                <Button onClick={onClose} className="mt-6 rounded-xl bg-slate-800 px-6 hover:bg-slate-700">
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timer animation bar */}
                {!submitted && (
                  <div className="relative w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{
                        width: `${(timeLeft / 30) * 100}%`,
                        backgroundColor: timeLeft <= 10 ? "#ef4444" : timeLeft <= 18 ? "#eab308" : "#10b981",
                      }}
                      transition={{ duration: 1, ease: "linear" }}
                      className={`h-full ${timeLeft <= 10 ? "animate-pulse" : ""}`}
                    />
                  </div>
                )}

                {/* Difficulty & Stage Indicator */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Challenge {((stats?.wins || 0) % 10) + 1} of 10
                  </span>
                  {isDifficult && (
                    <span className="flex items-center gap-1 rounded bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-red-400 animate-pulse">
                      🔥 Hard Question
                    </span>
                  )}
                </div>

                {/* Question */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-base font-bold leading-relaxed text-slate-100">{question.question}</p>
                </div>

                {/* Lifeline */}
                {!submitted && !isFiftyFiftyUsed && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleFiftyFifty}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-600/20 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-purple-300 shadow-lg shadow-purple-950/20 transition-all hover:bg-purple-600/30 hover:text-purple-200 active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      50:50 Lifeline (−50% XP)
                    </button>
                  </div>
                )}
                {!submitted && isFiftyFiftyUsed && (
                  <div className="flex justify-end">
                    <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-purple-400/80">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500/40" />
                      Lifeline used (half XP mode)
                    </div>
                  </div>
                )}

                {/* Options */}
                <div className="space-y-2.5">
                  {question.options.map((option, idx) => {
                    const letter = optionLabels[idx];
                    const isSelected = selectedOption === idx;
                    const isCorrectAnswer = letter === question.correctAnswer;
                    const isEliminated = eliminatedOptions.includes(idx);

                    let optionStyle = "border-slate-800 hover:border-slate-700 bg-slate-950/20";
                    let checkIcon = null;

                    if (isEliminated) {
                      optionStyle = "border-slate-900/50 bg-slate-950/5 opacity-25 pointer-events-none cursor-not-allowed";
                    } else if (submitted) {
                      if (isCorrectAnswer) {
                        optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
                        checkIcon = <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />;
                      } else if (isSelected) {
                        optionStyle = "border-red-500 bg-red-500/10 text-red-300";
                        checkIcon = <XCircle className="h-4 w-4 shrink-0 text-red-400" />;
                      } else {
                        optionStyle = "border-slate-800 opacity-50";
                      }
                    } else if (isSelected) {
                      optionStyle = "border-pink-500 bg-pink-500/5 text-pink-400";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={submitted || isEliminated}
                        onClick={() => handleSelect(idx)}
                        className={`flex w-full min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-bold transition-all duration-200 active:scale-[0.99] ${optionStyle}`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${isEliminated ? "bg-slate-950 text-slate-700" : isSelected ? "bg-pink-500 text-white" : "bg-slate-800 text-slate-300"
                            }`}
                        >
                          {letter}
                        </span>
                        <span className="min-w-0 flex-1 break-words">
                          {isEliminated ? (
                            <span className="text-[9px] italic uppercase tracking-widest opacity-40">Eliminated</span>
                          ) : (
                            option
                          )}
                        </span>
                        {checkIcon}
                      </button>
                    );
                  })}
                </div>

                {/* Confidence meter */}
                {selectedOption !== null && !submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3.5 text-center space-y-2"
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      How confident are you in this answer?
                    </p>
                    <div className="flex justify-center gap-3">
                      {[
                        { level: "low", label: "Low", emoji: "😟" },
                        { level: "medium", label: "Medium", emoji: "🤔" },
                        { level: "high", label: "High", emoji: "😎" },
                      ].map((item) => (
                        <button
                          key={item.level}
                          type="button"
                          onClick={() => setConfidence(item.level)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                            confidence === item.level
                              ? "bg-pink-500 border-pink-400 text-white shadow-md shadow-pink-500/20 scale-105"
                              : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-350"
                          }`}
                        >
                          <span>{item.emoji}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Result panel */}
                <AnimatePresence>
                  {submitted && gradingResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center ${gradingResult.isCorrect
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/30 bg-red-500/10 text-red-300"
                        }`}
                    >
                      {isTimeout ? (
                        <>
                          <p className="text-sm font-black">⏰ Time's Up!</p>
                          <p className="text-xs font-bold text-slate-300">
                            Penalty: <span className="text-red-400">-3 XP</span>
                          </p>
                        </>
                      ) : gradingResult.isCorrect ? (
                        <>
                          <p className="text-sm font-black">🎉 Correct answer!</p>
                          <p className="text-xs font-bold text-slate-300">
                            XP earned:{" "}
                            <span className="text-emerald-400">
                              +{gradingResult.xpGained} XP
                              {gradingResult.streakBonus > 0 ? ` (+${gradingResult.streakBonus} streak bonus)` : ""}
                            </span>{" "}
                            · Coins: <span className="text-yellow-400">+{gradingResult.coinsGained}</span>
                          </p>
                          {gradingResult.levelUp && (
                            <motion.p
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="mt-1 text-xs font-black text-yellow-300"
                            >
                              🌟 Level up! You reached Level {stats?.level}! 🌟
                            </motion.p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-black">❌ Incorrect</p>
                          <p className="text-xs font-bold text-slate-300">
                            Penalty: <span className="text-red-400">{gradingResult.xpGained} XP</span>
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Explanation */}
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-1.5"
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-pink-500">
                      Answer Explanation
                    </p>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {(() => {
                        if (question.explanation) return question.explanation;
                        const correctLetter = question.correctAnswer;
                        const correctIdx = optionLabels.indexOf(correctLetter);
                        const correctText = question.options[correctIdx];
                        return `Option ${correctLetter} ("${correctText}") is correct because it represents the verified standard theory solution in the training database.`;
                      })()}
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Sticky footer action — only when a question is loaded */}
          {!loading && question && (
            <div
              className="shrink-0 border-t border-slate-800 bg-slate-900 px-5 pt-3"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              {!submitted ? (
                <Button
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                  className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-sm font-black text-white shadow-lg shadow-pink-500/20 hover:from-pink-600 hover:to-purple-700 disabled:opacity-40"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={onClose}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-800 py-6 text-sm font-black text-white hover:bg-slate-700"
                >
                  Continue Journey <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}