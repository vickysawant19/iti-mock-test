import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import questionpaperservice from "../../appwrite/mockTest";
import MockTestGreet from "./MockTestGreet";
import { ClipLoader } from "react-spinners";

const StartMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isGreetShown, setIsGreetShown] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const fetchMockTest = async () => {
      try {
        const response = await questionpaperservice.getQuestionPaper(paperId);
        if (response) {
          const parsedQuestions = response.questions.map((question) =>
            JSON.parse(question)
          );
          setSubmitted(response.submitted);
          setMockTest({ ...response, questions: parsedQuestions });
        }
      } catch (error) {
        console.error("Error fetching mock test:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMockTest();
  }, [paperId]);
  console.log(mockTest);

  const handleStartExam = () => {
    setIsGreetShown(true);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const confirmation = confirm("Do you want to submit the exam?");
    if (!confirmation) {
      return;
    }
    setIsSubmitLoading(true);
    event.preventDefault();
    try {
      const responseArray = mockTest.questions.map((question) => ({
        questionId: question.$id,
        selectedAnswer: question.response,
      }));

      await questionpaperservice.updateAllResponses(paperId, responseArray);
      alert("Exam submitted successfully!");
      setSubmitted(true);
    } catch (error) {
      alert("Paper already submitted!", error);
      console.error("Error submitting exam:", error);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader size={150} color={"#123abc"} loading={isLoading} />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen  p-4 md:p-8">
      {!isGreetShown ? (
        <div>
          <MockTestGreet mockTest={mockTest} />
          <button
            onClick={handleStartExam}
            className="block w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
          >
            Start Exam
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 mt-10">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 ">
                Question {currentQuestionIndex + 1} of{" "}
                {mockTest.questions.length}
              </h2>
              {mockTest.questions[currentQuestionIndex].userName && (
                <h6 className="text-xs font-thin text-slate-400">
                  Created By:{" "}
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
                      value={String.fromCharCode(65 + index)} // A, B, C, D
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
          <div className="flex justify-between">
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
          <div className="mt-4">
            {submitted ? (
              <Link
                to={`/show-mock-test/${paperId}`}
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-center"
              >
                View Result
              </Link>
            ) : (
              <button
                type="submit"
                disabled={isSubmitLoading}
                className="block w-full bg-red-500 disabled:bg-gray-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md"
              >
                Submit Exam
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
