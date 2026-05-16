import React, { useEffect, useRef, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { Timer, AlertCircle, Check } from "lucide-react";
import {  differenceInSeconds, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import MockTestGreet from "./components/MockTestGreet";
import mockTestService from "@/services/mocktest.service";
import { toast } from "react-toastify";
import { Query } from "appwrite";
import Loader from "@/components/components/Loader";

const StartMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const saveDebounceRef = useRef(null);
  const pendingQuestionsRef = useRef(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const [timeWarning, setTimeWarning] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isGreetShown, setIsGreetShown] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const strikesRef = useRef(0);
  const containerRef = useRef(null);
  const isConfirmingRef = useRef(false);

  const [searchParams] = useSearchParams();
  const encodedRedirect = searchParams.get("redirect");
  const decodedRedirect = encodedRedirect && encodedRedirect !== "null"
    ? decodeURIComponent(encodedRedirect)
    : "";

  const navigate = useNavigate();

  // ── Debounced cloud auto-save ────────────────────────────────────────────────
  // 800 ms in dev (fast realtime feedback), 5 s in production (API quota friendly)
  const SAVE_DEBOUNCE_MS = import.meta.env.DEV ? 800 : 5000;

  const triggerSave = (questions) => {
    pendingQuestionsRef.current = questions;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      if (!pendingQuestionsRef.current) return;
      try {
        await mockTestService.saveProgress(paperId, pendingQuestionsRef.current);
        pendingQuestionsRef.current = null;
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, SAVE_DEBOUNCE_MS);
  };

  const flushSave = async () => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null;
    }
    if (pendingQuestionsRef.current) {
      try {
        await mockTestService.saveProgress(paperId, pendingQuestionsRef.current);
        pendingQuestionsRef.current = null;
      } catch (err) {
        console.error("Flush save failed:", err);
      }
    }
  };

  const handleSubmitExam = async () => {
    setIsSubmitLoading(true);
    // Flush any pending auto-save before submit so updateAllResponses
    // sees the latest responses in the cloud paper.
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
  };

  useEffect(() => {
    const fetchMockTest = async () => {
      if (!paperId) {
        navigate(`/show-mock-test/${paperId}`);
        return;
      }
      try {
        const userTestResponse = await mockTestService.listQuestions([
          Query.equal("$id", paperId),
          Query.limit(1),
        ]);

        const userTest = userTestResponse[0];

        if (!userTest) {
          toast.error("Mock test not found!");
          navigate(`/all-mock-tests`);
        }

        if (userTest.submitted) {
          navigate(`/show-mock-test/${paperId}`);
          return;
        }

        userTest.questions = userTest.questions.map((question) =>
          JSON.parse(question)
        );

        if (userTest.isOriginal !== null && !userTest.isOriginal) {
          const originalTestResponse = await mockTestService.listQuestions(
            [
              Query.equal("paperId", userTest.paperId),
              Query.equal("isOriginal", true),
            ]
          );
          if (originalTestResponse.length === 0) {
            toast.error("Paper expired!");
            navigate(-1);
            return;
          }
          const originalTest = originalTestResponse[0];
          originalTest.questions = originalTest.questions.map((item) =>
            JSON.parse(item)
          );
          const QuestionsLookup = new Map(
            originalTest.questions.map((item) => [item.$id, item])
          );
          userTest.questions = userTest.questions.map((ques) => ({
            ...QuestionsLookup.get(ques.$id),
            response: ques.response,
          }));
        }
        // Calculate remaining time if exam already started
        if (userTest.startTime) {
          const startTime = new Date(userTest.startTime);
          const totalSeconds = (userTest.totalMinutes || 60) * 60;
          setRemainingSeconds(
            Math.max(
              0,
              totalSeconds - differenceInSeconds(new Date(), startTime)
            )
          );
          // We intentionally DO NOT set isGreetShown(true) here.
          // The browser requires a user click event to trigger fullscreen mode.
          // The user will see a "Resume Test" button on the greet screen instead.
        }
        setMockTest(userTest);
      } catch (error) {
        console.error("Error fetching mock test:", error);
        toast.error("Error loading mock test!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMockTest();
  }, [paperId]);

  const timerRef = useRef(null);

  useEffect(() => {
    const handleCopyPaste = (e) => {
      e.preventDefault();
      toast.error("Copying and pasting is disabled!");
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("Right-click is disabled!");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isGreetShown && !submitted) {
        handleStrike();
      }
    };

    const handleBlur = () => {
      if (isGreetShown && !submitted && !isConfirmingRef.current) {
        handleStrike();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isGreetShown && !submitted) {
        handleStrike();
      }
    };

    const handleStrike = () => {
      // Disable strikes during development for easier debugging
      if (import.meta.env.DEV) {
        console.log("Security strike ignored in development mode.");
        return;
      }

      strikesRef.current += 1;
      setStrikes(strikesRef.current);

      if (strikesRef.current === 1) {
        toast.warning("⚠️ WARNING (1/3): Tab switching or exiting full-screen is not allowed!", {
          position: "top-center",
          autoClose: 10000,
        });
      } else if (strikesRef.current === 2) {
        toast.warning("🚨 FINAL WARNING (2/3): One more violation will auto-submit your exam immediately!", {
          position: "top-center",
          autoClose: 10000,
        });
      } else if (strikesRef.current >= 3) {
        toast.error("🚨 EXAM TERMINATED (3/3): Multiple violations detected. Auto-submitting...", {
          position: "top-center",
        });
        handleSubmitExam();
      }
    };

    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isGreetShown, submitted]);

  // 1. Timer ticking effect based on absolute system time (fixes background tab pausing)
  useEffect(() => {
    if (!mockTest?.startTime || submitted) return;

    const startMs = new Date(mockTest.startTime).getTime();
    const totalSecs = (mockTest.totalMinutes || 60) * 60;

    timerRef.current = setInterval(() => {
      const elapsedSecs = Math.floor((Date.now() - startMs) / 1000);
      const remaining = Math.max(0, totalSecs - elapsedSecs);
      setRemainingSeconds(remaining);
      
      if (remaining <= 0) {
        clearInterval(timerRef.current);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [mockTest?.startTime, mockTest?.totalMinutes, submitted]);

  // 2. Watcher for timer thresholds
  useEffect(() => {
    if (remainingSeconds === null || submitted) return;

    if (remainingSeconds <= 300 && remainingSeconds > 0) {
      setTimeWarning(true);
    }

    if (remainingSeconds <= 0) {
      handleSubmitExam();
    }
  }, [remainingSeconds, submitted]);

  const handleStartExam = async () => {
    try {
      // Only set startTime if it's the first time starting the exam
      if (!mockTest.startTime) {
        const startTime = new Date();
        await mockTestService.updateTime(mockTest.$id, { startTime });
        setRemainingSeconds((mockTest.totalMinutes || 60) * 60);
        setMockTest((prev) => ({ ...prev, startTime: startTime.toISOString() }));
      }
      
      // Request Fullscreen
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
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

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null) return "00:00:00";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const handleOptionChange = (questionId, selectedAnswer) => {
    setMockTest((prevMockTest) => {
      const current = prevMockTest.questions.find((q) => q.$id === questionId);
      // Skip cloud write if the answer hasn't changed
      if (current?.response === selectedAnswer) return prevMockTest;

      const updatedQuestions = prevMockTest.questions.map((ques) => {
        if (ques.$id === questionId) {
          return { ...ques, response: selectedAnswer };
        }
        return ques;
      });
      // Debounced cloud auto-save — only triggered on actual answer change
      triggerSave(updatedQuestions);
      return { ...prevMockTest, questions: updatedQuestions };
    });
  };


  const handleNavigation = (step) => {
    setCurrentQuestionIndex((prev) => {
      const newIndex = prev + step;
      return newIndex >= 0 && newIndex < mockTest.questions.length
        ? newIndex
        : prev;
    });
  };

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

  return (
    <div ref={containerRef} className="bg-slate-50 dark:bg-slate-950 h-screen overflow-hidden flex flex-col select-none font-sans">
      {!isGreetShown ? (
        <MockTestGreet mockTest={mockTest} handleStartExam={handleStartExam} />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            isConfirmingRef.current = true;
            const confirmation = window.confirm(
              "Do you want to submit the exam?"
            );
            setTimeout(() => { isConfirmingRef.current = false; }, 500);
            if (confirmation) handleSubmitExam();
          }}
          className="flex-grow flex flex-col w-full max-w-[1600px] mx-auto overflow-hidden"
        >
          {/* Fixed Header */}
          <div className="flex-shrink-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:px-8 md:py-4 transition-all">
            {timeWarning && (
              <Alert variant="destructive" className="mb-3 flex items-center gap-2 border-red-500/50 bg-red-50 dark:bg-red-950/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium text-red-700 dark:text-red-300">
                  Warning: Less than 5 minutes remaining!
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-xl font-bold dark:text-slate-100">
                  <Timer className={`h-6 w-6 ${remainingSeconds <= 300 ? "text-red-500 animate-pulse" : "text-blue-500"}`} />
                  <span className={`${remainingSeconds <= 300 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"} font-mono tracking-tight`}>
                    {formatTime(remainingSeconds)}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {mockTest.questions.filter(q => q.response).length} of {mockTest.questions.length} Answered
                </div>
              </div>

              {!submitted && (
                <Button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md transition-all hover:scale-105 rounded-xl font-semibold px-6"
                >
                  Submit Exam
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(mockTest.questions.filter(q => q.response).length / mockTest.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
            
            {/* Left Scrollable Area: Question & Navigation */}
            <div className="flex-grow lg:w-3/4 overflow-y-auto p-4 md:p-8 scroll-smooth pb-24 lg:pb-8">
              <Card className="border-0 shadow-sm rounded-3xl dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <CardContent className="p-6 md:p-8 lg:p-10">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Question {currentQuestionIndex + 1} of {mockTest.questions.length}
                    </span>
                    {mockTest.questions[currentQuestionIndex].userName && (
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">
                        By {mockTest.questions[currentQuestionIndex].userName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base md:text-lg font-medium text-slate-800 dark:text-slate-100 mb-8 leading-relaxed">
                    {mockTest.questions[currentQuestionIndex].question}
                  </h3>

                  {mockTest.questions[currentQuestionIndex]?.images?.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-8">
                      {mockTest.questions[currentQuestionIndex].images.map(
                        (img) => {
                          const image = JSON.parse(img);
                          return (
                            <img
                              className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-h-64 object-contain bg-white dark:bg-slate-800"
                              key={image.id}
                              src={image.url}
                              alt={image.name}
                            />
                          );
                        }
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    {(mockTest.questions[currentQuestionIndex].options ?? []).map(
                      (option, index) => {
                        const isSelected =
                          mockTest.questions[currentQuestionIndex].response ===
                          String.fromCharCode(65 + index);

                        return (
                          <Label
                            key={index}
                            className={`
                              group relative flex items-center p-3 rounded-2xl border-2 cursor-pointer
                              transition-all duration-300 ease-in-out
                              ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500 shadow-sm scale-[1.01]"
                                  : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              }
                            `}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestionIndex}`}
                              value={String.fromCharCode(65 + index)}
                              onChange={() =>
                                handleOptionChange(
                                  mockTest.questions[currentQuestionIndex].$id,
                                  String.fromCharCode(65 + index)
                                )
                              }
                              checked={isSelected}
                              className="hidden"
                            />

                            <div
                              className={`
                                flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border-2 transition-colors duration-300
                                ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20"
                                    : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 group-hover:border-blue-400 dark:group-hover:border-blue-500"
                                }
                              `}
                            >
                              {isSelected ? (
                                <Check className="w-4 h-4 animate-in zoom-in-50" />
                              ) : (
                                <span className="font-semibold text-base">
                                  {String.fromCharCode(65 + index)}
                                </span>
                              )}
                            </div>

                            <span className={`ml-3 text-sm md:text-base transition-colors duration-300 ${isSelected ? "text-blue-900 dark:text-blue-100 font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                              {option}
                            </span>
                          </Label>
                        );
                      }
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className={`flex mt-8 mb-4 lg:mb-0 ${currentQuestionIndex > 0 ? "justify-between" : "justify-end"}`}>
                {currentQuestionIndex > 0 && (
                  <Button
                    type="button"
                    onClick={() => handleNavigation(-1)}
                    variant="outline"
                    className="rounded-xl px-6 py-6 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all font-semibold"
                  >
                    Previous
                  </Button>
                )}
                {currentQuestionIndex < mockTest.questions.length - 1 && (
                  <Button
                    type="button"
                    onClick={() => handleNavigation(1)}
                    className="rounded-xl px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 shadow-lg hover:shadow-xl transition-all hover:scale-105 font-semibold"
                  >
                    Next Question
                  </Button>
                )}
              </div>
            </div>

            {/* Right Scrollable Area: Question Palette */}
            <div className="lg:w-1/4 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 lg:overflow-y-auto p-4 md:p-6 backdrop-blur-sm">
              <div className="mb-6 hidden lg:block">
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Status Overview</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/20"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-md border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"></div>
                    <span>Unanswered</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-md bg-blue-500 ring-2 ring-blue-500/30"></div>
                    <span>Current</span>
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Question Navigator</h4>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {mockTest.questions.map((ques, index) => {
                  const isCurrent = currentQuestionIndex === index;
                  const isAnswered = !!ques.response;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`
                        w-11 h-11 md:w-12 md:h-12 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center
                        ${isCurrent ? "ring-4 ring-blue-500/30 scale-110 z-10" : "hover:scale-105"}
                        ${
                          isAnswered
                            ? isCurrent
                              ? "bg-emerald-500 text-white border-none shadow-md shadow-emerald-500/20"
                              : "bg-emerald-100 text-emerald-700 border-2 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800"
                            : isCurrent
                              ? "bg-blue-500 text-white border-none shadow-md shadow-blue-500/20"
                              : "bg-white text-slate-600 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default StartMockTest;
