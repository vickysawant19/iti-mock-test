import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { Timer, AlertCircle, Check } from "lucide-react";
import { differenceInMinutes, differenceInSeconds, format } from "date-fns";

import MockTestGreet from "./components/MockTestGreet";
import questionpaperservice from "../../../appwrite/mockTest";
import { toast } from "react-toastify";
import { Query } from "appwrite";

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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader size={150} color={"#123abc"} loading={isLoading} />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
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
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p>Warning: Less than 5 minutes remaining!</p>
            </div>
          )}

          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Timer className="h-6 w-6" />
              <span
                className={`${
                  remainingSeconds <= 300 ? "text-red-600" : ""
                } font-mono`}
              >
                {formatTime(remainingSeconds)}
              </span>
            </div>

            {!submitted && (
              <button
                type="submit"
                disabled={isSubmitLoading}
                className="block bg-red-500 disabled:bg-gray-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md"
              >
                Submit Exam
              </button>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Question {currentQuestionIndex + 1} of{" "}
                {mockTest.questions.length}
              </h2>
              {mockTest.questions[currentQuestionIndex].userName && (
                <h6 className="text-xs font-thin text-slate-400">
                  Created by:{" "}
                  {mockTest.questions[currentQuestionIndex].userName}
                </h6>
              )}
            </div>

            <p className="text-gray-600 mb-6 font-semibold">
              {mockTest.questions[currentQuestionIndex].question}
            </p>

            <div className="space-y-3">
              {mockTest.questions[currentQuestionIndex].options.map(
                (option, index) => {
                  const isSelected =
                    mockTest.questions[currentQuestionIndex].response ===
                    String.fromCharCode(65 + index);

                  return (
                    <label
                      key={index}
                      className={`
                  block text-gray-700 cursor-pointer
                  p-2 rounded-lg border-2 transition-all duration-200
                  ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
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
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-300 text-gray-500"
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
                    </label>
                  );
                }
              )}
            </div>
          </div>
          {/* <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Question {currentQuestionIndex + 1} of{" "}
                {mockTest.questions.length}
              </h2>
              {mockTest.questions[currentQuestionIndex].userName && (
                <h6 className="text-xs font-thin text-slate-400">
                  Created by:{" "}
                  {mockTest.questions[currentQuestionIndex].userName}
                </h6>
              )}
            </div>
            <p className="text-gray-600 mb-4 font-semibold">
              {mockTest.questions[currentQuestionIndex].question}
            </p>
            <div className="space-y-2">
              {mockTest.questions[currentQuestionIndex].options.map(
                (option, index) => (
                  <label key={index} className="block text-gray-700">
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
                      className="mr-2"
                      checked={
                        mockTest.questions[currentQuestionIndex].response ===
                        String.fromCharCode(65 + index)
                      }
                    />
                    {String.fromCharCode(65 + index)}. {option}
                  </label>
                )
              )}
            </div>
          </div> */}

          <div
            className={`flex ${
              currentQuestionIndex > 0 ? "justify-between" : "justify-end"
            }`}
          >
            {currentQuestionIndex > 0 && (
              <button
                type="button"
                onClick={() => handleNavigation(-1)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md"
              >
                Previous
              </button>
            )}
            {currentQuestionIndex < mockTest.questions.length - 1 && (
              <button
                type="button"
                onClick={() => handleNavigation(1)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
              >
                Next
              </button>
            )}
          </div>

          <div className="flex flex-wrap mt-4 border justify-center">
            {mockTest.questions.map((ques, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`m-1 size-10 p-2 border rounded-md ${
                  currentQuestionIndex === index
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }
                ${ques.response ? "bg-green-400 " : ""}
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
