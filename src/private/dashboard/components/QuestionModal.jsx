/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Award, XCircle, CheckCircle, Volume2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/game.service";

export default function QuestionModal({ isOpen, onClose, tradeId, batchId, onAnswerSubmit, stats }) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState(null); // { isCorrect, xpGained, coinsGained, levelUp }
  const [shake, setShake] = useState(false);
  const [isFiftyFiftyUsed, setIsFiftyFiftyUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);

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

      const loadQuestion = async () => {
        try {
          console.log("[QuestionModal] loadQuestion: batchId =", batchId, "tradeId =", tradeId);
          const settings = batchId ? await gameService.getBatchGameSettings(batchId) : undefined;
          console.log("[QuestionModal] loadQuestion: settings fetched =", settings);
          const q = await gameService.getRandomQuestion(tradeId, settings);
          console.log("[QuestionModal] loadQuestion: question fetched =", q);
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

  if (!isOpen) return null;

  const handleSelect = (idx) => {
    if (submitted || eliminatedOptions.includes(idx)) return;
    setSelectedOption(idx);
  };

  const handleFiftyFifty = () => {
    if (isFiftyFiftyUsed || submitted || !question) return;

    const correctLetter = question.correctAnswer;
    const correctIdx = optionLabels.indexOf(correctLetter);

    // Filter incorrect options
    const incorrectIndexes = [0, 1, 2, 3].filter((idx) => idx !== correctIdx);

    // Shuffle and pick 2 to eliminate
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

    const selectedLetter = optionLabels[selectedOption];
    const isCorrect = selectedLetter === question.correctAnswer;

    setSubmitted(true);

    if (isCorrect) {
      // Confetti is triggered by submitted state and gradingResult
    } else {
      // Shake animation
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    try {
      const res = await onAnswerSubmit(isCorrect, isFiftyFiftyUsed);
      setGradingResult({
        isCorrect,
        xpGained: res?.xpGained !== undefined ? res.xpGained : (isCorrect ? (isFiftyFiftyUsed ? 5 : 10) : -3),
        coinsGained: res?.coinsGained !== undefined ? res.coinsGained : (isCorrect ? 5 : 0),
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

  // Custom inline confetti particle generator
  const renderConfetti = () => {
    const colors = ["#ec4899", "#a855f7", "#3b82f6", "#eab308", "#10b981"];
    return Array.from({ length: 40 }).map((_, i) => {
      const color = colors[i % colors.length];
      const randomX = Math.random() * 300 - 150; // Random X spread
      const randomY = Math.random() * -300 - 100; // Random height
      return (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: randomX,
            y: randomY,
            scale: [0, 1, 0.8, 0],
            rotate: Math.random() * 360,
          }}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={submitted ? undefined : onClose}
      />

      {/* Modal Card */}
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            x: shake ? [0, -10, 10, -10, 10, 0] : 0,
          }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 z-10 text-white"
        >
          {/* Confetti container */}
          {submitted && gradingResult?.isCorrect && (
            <div className="absolute top-1/2 left-1/2 pointer-events-none z-50">
              {renderConfetti()}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-base font-black tracking-tight text-pink-500 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-pink-500" />
              GAMIFIED CHALLENGE
            </h3>
            {stats && (
              <span className="text-[10px] font-extrabold bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
                Combo Streak: 🔥 {stats?.currentStreak || 0}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
              <p className="text-sm text-slate-400 font-bold">Summoning random question...</p>
            </div>
          ) : !question ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <XCircle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-sm font-bold text-slate-200">No questions found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Your trade does not have any theory questions loaded. Let your instructor know.
              </p>
              <Button onClick={onClose} className="mt-6 bg-slate-800 hover:bg-slate-700 rounded-xl px-6">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {/* Question Text */}
              <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                <p className="text-sm font-bold leading-relaxed text-slate-200">
                  {question.question}
                </p>
              </div>

              {/* Lifeline Button */}
              {!submitted && !isFiftyFiftyUsed && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleFiftyFifty}
                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 rounded-xl px-4 py-2 text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-lg shadow-purple-950/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    50:50 Lifeline (-50% XP)
                  </Button>
                </div>
              )}
              {!submitted && isFiftyFiftyUsed && (
                <div className="flex justify-end">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2 text-[10px] font-extrabold tracking-wider uppercase text-purple-400/80 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500/40" />
                    Lifeline Used (Half XP Mode)
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
                      checkIcon = <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
                    } else if (isSelected) {
                      optionStyle = "border-red-500 bg-red-500/10 text-red-300 animate-shake";
                      checkIcon = <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
                    } else {
                      optionStyle = "border-slate-800 opacity-50";
                    }
                  } else if (isSelected) {
                    optionStyle = "border-pink-500 bg-pink-500/5 text-pink-400 scale-[1.01]";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={submitted || isEliminated}
                      onClick={() => handleSelect(idx)}
                      className={`flex items-center gap-3 w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition-all duration-200 cursor-pointer ${optionStyle}`}
                    >
                      <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black shrink-0 ${
                        isEliminated ? "bg-slate-950 text-slate-700" : (isSelected ? "bg-pink-500 text-white" : "bg-slate-800 text-slate-300")
                      }`}>
                        {letter}
                      </span>
                      <span className="flex-1 min-w-0 break-words">
                        {isEliminated ? (
                          <span className="italic tracking-widest text-[9px] opacity-40 uppercase">Eliminated</span>
                        ) : (
                          option
                        )}
                      </span>
                      {checkIcon}
                    </button>
                  );
                })}
              </div>

              {/* Reward/Result Panel */}
              <AnimatePresence>
                {submitted && gradingResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border text-center ${
                      gradingResult.isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    {gradingResult.isCorrect ? (
                      <>
                        <p className="text-sm font-black flex items-center gap-1">
                          🎉 CORRECT ANSWER!
                        </p>
                        <p className="text-xs font-bold text-slate-300">
                          XP Earned: <span className="text-emerald-400">+{gradingResult.xpGained} XP{gradingResult.streakBonus > 0 ? ` (+${gradingResult.streakBonus} Streak Bonus)` : ""}</span> | Coins: <span className="text-yellow-400">+{gradingResult.coinsGained} Coins</span>
                        </p>
                        {gradingResult.levelUp && (
                          <motion.p
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-xs font-black text-yellow-300 mt-1 animate-pulse"
                          >
                            🌟 LEVEL UP! You reached Level {stats?.level}! 🌟
                          </motion.p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-black flex items-center gap-1">
                          ❌ INCORRECT
                        </p>
                        <p className="text-xs font-bold text-slate-300">
                          Penalty: <span className="text-red-400">{gradingResult.xpGained} XP</span>
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                {!submitted ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black py-5 rounded-2xl shadow-lg shadow-pink-500/20 cursor-pointer"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={onClose}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Continue Journey <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
