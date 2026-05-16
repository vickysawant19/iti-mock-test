import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

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

  // Track which questions have been visited (by index) and which are marked
  const [visitedSet, setVisitedSet] = useState(new Set([0]));
  const [markedSet, setMarkedSet] = useState(new Set());

  const containerRef = useRef(null);
  const [portalContainer, setPortalContainer] = useState(null);
  const isConfirmingRef = useRef(false);

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { mockTest, setMockTest, isLoading, fetchMockTest } = useMockTest(paperId);
  const { triggerSave, flushSave } = useAutoSave(paperId);

  const handleSubmitExam = useCallback(async () => {
    if (submitted) return;

    isConfirmingRef.current = true;
    const ok = window.confirm("Are you sure you want to submit the exam?");
    setTimeout(() => {
      isConfirmingRef.current = false;
    }, 500);
    if (!ok) return;

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
      });
      toast.success("Exam submitted successfully!");
      setSubmitted(true);
      if (decodedRedirect) {
        navigate(decodedRedirect);
        return;
      }
      navigate(`/all-mock-tests`);
    } catch (error) {
      toast.error("Error submitting exam!");
      console.error("Error submitting exam:", error);
    } finally {
      setIsSubmitLoading(false);
    }
  }, [mockTest, paperId, submitted, decodedRedirect, flushSave, navigate]);

  const isAntiCheatActive = isGreetShown && !submitted;
  useAntiCheat({ isActive: isAntiCheatActive, onAutoSubmit: handleSubmitExam });

  const totalSeconds = mockTest ? (mockTest.totalMinutes || 60) * 60 : 0;

  const { remainingSeconds, timeWarning, formatTime } = useExamTimer({
    startTime: mockTest?.startTime,
    totalMinutes: mockTest?.totalMinutes,
    submitted,
    onExpire: handleSubmitExam,
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
      className="bg-slate-100 dark:bg-slate-950 h-screen overflow-hidden flex flex-col select-none font-sans"
    >
      <InstructionModal
        open={isInstructionModalOpen}
        onOpenChange={setIsInstructionModalOpen}
        container={portalContainer}
      />

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
            handleSubmitExam();
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
              onSubmit={handleSubmitExam}
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
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default StartMockTest;
