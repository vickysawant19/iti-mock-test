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
import questionpaperservice from "@/appwrite/mockTest";
import { toast } from "react-toastify";
import { Query } from "appwrite";
import Loader from "@/components/components/Loader";

const StartMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const [timeWarning, setTimeWarning] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isGreetShown, setIsGreetShown] = useState(false);

  const [searchParams] = useSearchParams();
  const encodedRedirect = searchParams.get("redirect");
  const decodedRedirect = encodedRedirect
    ? decodeURIComponent(encodedRedirect)
    : "";

  const navigate = useNavigate();

  const handleSubmitExam = async () => {
    setIsSubmitLoading(true);
    try {
      const responseArray = mockTest.questions.map((question) => ({
        questionId: question.$id,
        selectedAnswer: question.response,
      }));

      await questionpaperservice.updateAllResponses(paperId, {
        responses: responseArray,
        endTime: new Date(),
      });
      toast.success("Exam submitted successfully!");
      localStorage.removeItem(paperId);
      setSubmitted(true);
      if (decodedRedirect) {
        navigate(decodedRedirect);
        return;
      }
      navigate(`/all-mock-tests`);
      // navigate(`/show-mock-test/${paperId}`);
    } catch (error) {
      toast.error("Error submitting exam!");
      console.error("Error submitting exam:", error);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const saveMockTestToLocalStorage = (test) => {
    localStorage.setItem(paperId, JSON.stringify(test));
  };

  useEffect(() => {
    const fetchMockTest = async () => {
      if (!paperId) {
        navigate(`/show-mock-test/${paperId}`);
        return;
      }
      try {
        const existingTest = JSON.parse(localStorage.getItem(paperId));
        if (existingTest && existingTest.startTime) {
          const startTime = new Date(existingTest.startTime);
          const totalSeconds = (existingTest.totalMinutes || 60) * 60;
          setRemainingSeconds(
            Math.max(
              0,
              totalSeconds - differenceInSeconds(new Date(), startTime)
            )
          );
          setIsGreetShown(true);
          setMockTest(existingTest);
          return;
        }

        const userTestResponse = await questionpaperservice.listQuestions([
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
          const originalTestResponse = await questionpaperservice.listQuestions(
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
        saveMockTestToLocalStorage(userTest);
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
      alert("Copying and pasting is disabled on this page.");
    };

    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);

    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
    };
  }, []);

  useEffect(() => {
    if (remainingSeconds === null || submitted) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        if (prev === 300) setTimeWarning(true); // Show warning at 5 minutes
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [remainingSeconds, submitted]);

  const handleStartExam = async () => {
    try {
      const startTime = new Date();
      const res = await questionpaperservice.updateTime(mockTest.$id, {
        startTime,
      });
      setRemainingSeconds((mockTest.totalMinutes || 60) * 60); // Convert minutes to seconds
      setMockTest({
        ...res,
        questions: res.questions.map((item) => JSON.parse(item)),
      });
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
      const updatedQuestions = prevMockTest.questions.map((ques) => {
        if (ques.$id === questionId) {
          return { ...ques, response: selectedAnswer };
        }
        return ques;
      });
      saveMockTestToLocalStorage({
        ...prevMockTest,
        questions: updatedQuestions,
      });
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
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
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
                {mockTest.questions[currentQuestionIndex].options.map(
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
