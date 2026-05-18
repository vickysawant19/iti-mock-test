import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Loader from "@/components/components/Loader";
import mockTestService from "@/services/mocktest.service";
import { useUserProfile } from "@/hooks/useUserProfile";
import { selectUser } from "@/store/userSlice";

import MockTestGreet from "../components/MockTestGreet";
import { useAutoSave } from "./hooks/useAutoSave";
import { useAntiCheat } from "./hooks/useAntiCheat";
import { useExamTimer } from "./hooks/useExamTimer";
import { useMockTest } from "./hooks/useMockTest";
import ExamHeader from "./components/ExamHeader";
import QuestionCard from "./components/QuestionCard";
import QuestionPalette from "./components/QuestionPalette";
import InstructionModal from "./components/InstructionModal";

const StartMockTest = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { profile } = useUserProfile();
  const user = useSelector(selectUser);

  const encodedRedirect = searchParams.get("redirect");
  const decodedRedirect =
    encodedRedirect && encodedRedirect !== "null"
      ? decodeURIComponent(encodedRedirect)
      : "";

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isGreetShown, setIsGreetShown] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Track which questions have been visited (by index) and which are marked
  const [visitedSet, setVisitedSet] = useState(new Set([0]));
  const [markedSet, setMarkedSet] = useState(new Set());

  const containerRef = useRef(null);
  const [portalContainer, setPortalContainer] = useState(null);
  const isConfirmingRef = useRef(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [isLandscapeForced, setIsLandscapeForced] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const checkOrientation = () => {
      setIsMobilePortrait(window.innerWidth < 768 && window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // ── Block Back Navigation ──
  useEffect(() => {
    // Push a state so we have something to pop
    window.history.pushState(null, null, window.location.pathname);
    
    const handlePopState = () => {
      // Restore the state immediately to prevent going back
      window.history.pushState(null, null, window.location.pathname);
      toast.warning("Back navigation is disabled while you are in the mock test.");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { mockTest, setMockTest, isLoading, fetchMockTest } = useMockTest(paperId);
  const { triggerSave, flushSave } = useAutoSave(paperId);

  const requestSubmitExam = useCallback(() => {
    setIsSubmitModalOpen(true);
  }, []);

  const executeSubmitExam = useCallback(async () => {
    if (submitted) return;

    setIsSubmitModalOpen(false);
    setIsSubmitLoading(true);
    await flushSave();
    try {
      const responseArray = mockTest.questions.map((question) => ({
        questionId: question.$id,
        selectedAnswer: question.response,
      }));
      await mockTestService.updateAllResponses(paperId, {
        responses: responseArray,
        endTime: new Date(),
        hydratedQuestions: mockTest.questions,
      });
      toast.success("Exam submitted successfully!");
      setSubmitted(true);
      if (decodedRedirect) {
        navigate(decodedRedirect);
        return;
      }
      navigate(`/exam-summary/${paperId}`);
    } catch (error) {
      toast.error("Error submitting exam!");
      console.error("Error submitting exam:", error);
    } finally {
      setIsSubmitLoading(false);
    }
  }, [mockTest, paperId, submitted, decodedRedirect, flushSave, navigate]);

  const isAntiCheatActive = isGreetShown && !submitted;
  useAntiCheat({ isActive: isAntiCheatActive, onAutoSubmit: executeSubmitExam });

  const totalSeconds = mockTest ? (mockTest.totalMinutes || 60) * 60 : 0;

  const { remainingSeconds, timeWarning, formatTime } = useExamTimer({
    startTime: mockTest?.startTime,
    totalMinutes: mockTest?.totalMinutes,
    submitted,
    onExpire: executeSubmitExam,
  });

  // ── Data fetch on mount ───────────────────────────────────────────────────
  useEffect(() => {
    fetchMockTest();
    setPortalContainer(containerRef.current);
  }, [paperId]);

  // Mark question as visited when index changes
  useEffect(() => {
    setVisitedSet((prev) => {
      if (prev.has(currentQuestionIndex)) return prev;
      return new Set([...prev, currentQuestionIndex]);
    });
  }, [currentQuestionIndex]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStartExam = async () => {
    try {
      if (!mockTest.startTime) {
        const startTime = new Date();
        await mockTestService.updateTime(mockTest.$id, { startTime });
        setMockTest((prev) => ({ ...prev, startTime: startTime.toISOString() }));
      }
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setPortalContainer(containerRef.current);
        }
      } catch (err) {
        console.error("Fullscreen request failed:", err);
      }
      setIsGreetShown(true);
    } catch (error) {
      toast.error("Error starting exam!");
      console.error(error);
    }
  };

  const handleOptionChange = (questionId, selectedAnswer) => {
    setMockTest((prevMockTest) => {
      const current = prevMockTest.questions.find((q) => q.$id === questionId);
      if (current?.response === selectedAnswer) return prevMockTest;
      const updatedQuestions = prevMockTest.questions.map((ques) =>
        ques.$id === questionId ? { ...ques, response: selectedAnswer } : ques,
      );
      triggerSave(updatedQuestions);
      return { ...prevMockTest, questions: updatedQuestions };
    });
  };

  const handleNavigation = (step) => {
    setCurrentQuestionIndex((prev) => {
      const next = prev + step;
      return next >= 0 && next < mockTest.questions.length ? next : prev;
    });
  };

  const handleToggleMark = (questionId) => {
    setMarkedSet((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleShowInstructions = () => {
    setIsInstructionModalOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) return <Loader isLoading />;

  const answeredCount = mockTest?.questions.filter((q) => q.response).length ?? 0;

  return (
    <div
      ref={containerRef}
      className="bg-slate-100 dark:bg-slate-950 overflow-hidden w-full h-screen relative"
    >
      <div
        className="w-full h-full flex flex-col select-none font-sans"
        style={
          isMobilePortrait && isLandscapeForced && isGreetShown
            ? {
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "100vh",
                height: "100vw",
                transform: "translate(-50%, -50%) rotate(90deg)",
                transformOrigin: "center center",
              }
            : {}
        }
      >
        <InstructionModal
          open={isInstructionModalOpen}
          onOpenChange={setIsInstructionModalOpen}
          container={portalContainer}
        />

        <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
          <DialogContent container={portalContainer} className="!z-[100]">
            <DialogHeader>
              <DialogTitle>Submit Exam</DialogTitle>
              <DialogDescription>
                Are you sure you want to submit the exam? Once submitted, you cannot change your answers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={executeSubmitExam}>
                Submit Exam
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!isGreetShown ? (
          <MockTestGreet
            mockTest={mockTest}
            handleStartExam={handleStartExam}
            onShowInstructions={handleShowInstructions}
          />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              requestSubmitExam();
            }}
            className="flex-grow flex flex-col overflow-hidden"
          >
            {/* ── Top Header ── */}
            <ExamHeader
              remainingSeconds={remainingSeconds}
              totalSeconds={totalSeconds}
              timeWarning={timeWarning}
              formatTime={formatTime}
              onShowInstructions={handleShowInstructions}
              isMobilePortrait={isMobilePortrait}
              isLandscapeForced={isLandscapeForced}
              onToggleLandscape={() => setIsLandscapeForced(!isLandscapeForced)}
            />

            {/* ── Main 2-column layout ── */}
            <div className="flex-grow flex overflow-hidden">
              {/* Left: Question Area */}
              <QuestionCard
                question={mockTest.questions[currentQuestionIndex]}
                questionIndex={currentQuestionIndex}
                totalQuestions={mockTest.questions.length}
                isMarked={markedSet.has(mockTest.questions[currentQuestionIndex]?.$id)}
                onOptionChange={handleOptionChange}
                onNavigate={handleNavigation}
                onToggleMark={handleToggleMark}
                isSubmitLoading={isSubmitLoading}
                onSubmit={requestSubmitExam}
                isLandscapeForced={isLandscapeForced || !isMobilePortrait}
              />

              {/* Right: Sidebar / Drawer */}
              <QuestionPalette
                questions={mockTest.questions}
                visitedSet={visitedSet}
                markedSet={markedSet}
                currentQuestionIndex={currentQuestionIndex}
                isPaletteOpen={isPaletteOpen}
                onTogglePalette={setIsPaletteOpen}
                onSelectQuestion={setCurrentQuestionIndex}
                profile={profile}
                user={user}
                answeredCount={answeredCount}
                isSubmitLoading={isSubmitLoading}
                isLandscapeForced={isLandscapeForced || !isMobilePortrait}
              />
            </div>
          </form>
        )}

        {/* Fullscreen Enforcer Overlay */}
        {isGreetShown && !submitted && !isFullscreen && (
          <div className="fixed inset-0 z-[99] bg-black/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">You Exited Fullscreen!</h2>
            <p className="text-slate-300 mb-8 max-w-md text-sm md:text-base leading-relaxed">
              For security and anti-cheat reasons, this exam must be taken in full-screen mode. 
              Exiting full-screen mode counts as a violation. Please return to the exam immediately.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <Button
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105"
                onClick={async () => {
                  try {
                    if (containerRef.current?.requestFullscreen) {
                      await containerRef.current.requestFullscreen();
                    }
                  } catch (err) {
                    console.error("Failed to re-enter fullscreen:", err);
                    toast.error("Please tap anywhere and try again.");
                  }
                }}
              >
                Return to Exam
              </Button>
              
              <Button
                size="lg"
                className="w-full bg-transparent border-2 border-white/20 text-white hover:bg-white/10 py-6 text-lg rounded-xl transition-all"
                onClick={() => {
                  // If they choose to exit, trigger the submit flow
                  requestSubmitExam();
                }}
              >
                Submit & Exit Exam
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartMockTest;
