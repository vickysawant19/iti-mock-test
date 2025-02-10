import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { Timer, AlertCircle } from "lucide-react";
import { differenceInMinutes, differenceInSeconds, format } from "date-fns";

import MockTestGreet from "./components/MockTestGreet";
import questionpaperservice from "../../../appwrite/mockTest";
import { toast } from "react-toastify";

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

  useEffect(() => {
    const fetchMockTest = async () => {
      try {
        const response = await questionpaperservice.getQuestionPaper(paperId);
        if (response) {
          const parsedQuestions = response.questions.map((question) =>
            JSON.parse(question)
          );

          if (response.submitted) {
            navigate(`/show-mock-test/${paperId}`);
            return;
          }

          // Calculate remaining time if exam already started
          if (response.startTime) {
            const startTime = new Date(response.startTime);
            const totalSeconds = (response.totalMinutes || 60) * 60;
            const elapsedSeconds = differenceInSeconds(new Date(), startTime);
            const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

            setRemainingSeconds(remainingSeconds);
            setIsGreetShown(true);
          }

          setMockTest({ ...response, questions: parsedQuestions });
        } else {
          toast.error("Mock test not found!");
          navigate(`/all-mock-tests`);
        }
      } catch (error) {
        console.error("Error fetching mock test:", error);
        toast.error("Error loading mock test!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMockTest();
  }, [paperId]);

  useEffect(() => {
    if (remainingSeconds === null || submitted) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }

        // Show warning when 5 minutes remaining
        if (prev === 300) {
          // 5 minutes = 300 seconds
          setTimeWarning(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
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
      return { ...prevMockTest, questions: updatedQuestions };
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

          <div className="bg-white p-4 rounded-lg shadow-md">
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
          </div>

          <div
            className={`flex ${
              currentQuestionIndex > 0 ? "justify-between" : "justify-end"
            }`}
          >
            {currentQuestionIndex > 0 && (
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))
                }
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md"
              >
                Previous
              </button>
            )}
            {currentQuestionIndex < mockTest.questions.length - 1 && (
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(prev + 1, mockTest.questions.length - 1)
                  )
                }
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
