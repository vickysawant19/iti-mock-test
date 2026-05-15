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
          setIsGreetShown(true);
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

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isGreetShown && !submitted) {
        handleStrike();
      }
    };

    const handleStrike = () => {
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

    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
      const startTime = new Date();
      // Only persist the startTime — do NOT spread the cloud response back into
      // state, because saveProgress() already replaced cloud questions with
      // lightweight { $id, response } pairs. The in-memory questions (merged
      // from the original paper) are fully populated and must be kept.
      await mockTestService.updateTime(mockTest.$id, { startTime });
      setRemainingSeconds((mockTest.totalMinutes || 60) * 60);
      setMockTest((prev) => ({ ...prev, startTime: startTime.toISOString() }));
      
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
    <div ref={containerRef} className="bg-gray-100 dark:bg-gray-900 min-h-screen select-none">
      {!isGreetShown ? (
        <MockTestGreet mockTest={mockTest} handleStartExam={handleStartExam} />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const confirmation = window.confirm(
              "Do you want to submit the exam?"
            );
            if (confirmation) handleSubmitExam();
          }}
          className="space-y-6 p-4"
        >
          {timeWarning && (
            <Alert variant="destructive" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: Less than 5 minutes remaining!
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-lg font-semibold dark:text-gray-200">
              <Timer className="h-6 w-6" />
              <span
                className={`${
                  remainingSeconds <= 300
                    ? "text-red-600 dark:text-red-400"
                    : ""
                } font-mono`}
              >
                {formatTime(remainingSeconds)}
              </span>
            </div>

            {!submitted && (
              <Button
                type="submit"
                disabled={isSubmitLoading}
                variant="destructive"
              >
                Submit Exam
              </Button>
            )}
          </div>

          <Card className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Question {currentQuestionIndex + 1} of{" "}
                  {mockTest.questions.length}
                </h2>
                {mockTest.questions[currentQuestionIndex].userName && (
                  <h6 className="text-xs font-thin text-slate-400 dark:text-slate-500">
                    Created by:{" "}
                    {mockTest.questions[currentQuestionIndex].userName}
                  </h6>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6 font-semibold">
                {mockTest.questions[currentQuestionIndex].question}
              </p>

              <div className="flex gap-2 m-2">
                {mockTest.questions[currentQuestionIndex]?.images?.map(
                  (img) => {
                    const image = JSON.parse(img);
                    return (
                      <img
                        className="min-h-32 max-h-60"
                        key={image.id}
                        src={image.url}
                        alt={image.name}
                      />
                    );
                  }
                )}
              </div>

              <div className="space-y-3">
                {(mockTest.questions[currentQuestionIndex].options ?? []).map(
                  (option, index) => {
                    const isSelected =
                      mockTest.questions[currentQuestionIndex].response ===
                      String.fromCharCode(65 + index);

                    return (
                      <Label
                        key={index}
                        className={`
                          block text-gray-700 dark:text-gray-200 cursor-pointer
                          p-2 rounded-lg border-2 transition-all duration-200
                          ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-600"
                              : "border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }
                        `}
                      >
                        <div className="flex items-center">
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
                              w-8 h-8 flex items-center p-2 justify-center rounded-full border-2
                              ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500 text-white dark:border-blue-600 dark:bg-blue-600"
                                  : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                              }
                            `}
                          >
                            {isSelected ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <span className="font-medium">
                                {String.fromCharCode(65 + index)}
                              </span>
                            )}
                          </div>

                          <span className="ml-4">{option}</span>
                        </div>
                      </Label>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>

          <div
            className={`flex ${
              currentQuestionIndex > 0 ? "justify-between" : "justify-end"
            }`}
          >
            {currentQuestionIndex > 0 && (
              <Button
                type="button"
                onClick={() => handleNavigation(-1)}
                variant="secondary"
                className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                Previous
              </Button>
            )}
            {currentQuestionIndex < mockTest.questions.length - 1 && (
              <Button
                type="button"
                onClick={() => handleNavigation(1)}
                className="dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Next
              </Button>
            )}
          </div>

          <div className="flex flex-wrap mt-4 border dark:border-gray-700 justify-center p-2 rounded-md">
            {mockTest.questions.map((ques, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`m-1 size-10 p-2 border rounded-md transition-colors
                  ${
                    currentQuestionIndex === index
                      ? "bg-blue-500 dark:bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }
                  ${
                    ques.response
                      ? "bg-green-400 dark:bg-green-700 text-white"
                      : ""
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </form>
      )}
    </div>
  );
};

export default StartMockTest;
