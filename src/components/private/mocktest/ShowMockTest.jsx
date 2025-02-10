import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import questionpaperservice from "../../../appwrite/mockTest";
import { Query } from "appwrite";
import { toast } from "react-toastify";

const ShowMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const navigate = useNavigate();

  const checkProtection = async () => {
    try {
      //fetch paperId
      const userPaper = await questionpaperservice.listQuestions([
        Query.equal("$id", paperId),
        Query.select(["paperId"]),
      ]);

      const originalPaper = await questionpaperservice.listQuestions([
        Query.equal("paperId", userPaper[0].paperId),
        Query.equal("isOriginal", true),
        Query.select(["isProtected"]),
      ]);
      return originalPaper[0].isProtected;
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const isProtected = await checkProtection();
      if (isProtected) {
        toast.error("Protected Paper!\n You can't view result!\n");
        navigate("/all-mock-tests");
        return;
      }
      try {
        const response = await questionpaperservice.getQuestionPaper(paperId);
        if (response) {
          const test = { ...response };
          test.questions = test.questions.map((ques) => JSON.parse(ques));
          setMockTest(test);
        }
      } catch (error) {
        console.error("Error fetching mock test:", error);
      }
    };

    init();
  }, [paperId]);

  const getIndex = (res) => {
    return ["A", "B", "C", "D"].indexOf(res);
  };

  const getOption = (index) => {
    const options = ["A", "B", "C", "D"];
    return options[index];
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Mock Test Results
        </h1>
        {mockTest ? (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">{mockTest.title}</h2>
            <div className="mb-6">
              <p>
                <strong>Paper ID:</strong> {mockTest.paperId}
              </p>
              <p>
                <strong>User Name:</strong> {mockTest.userName || "N/A"}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(mockTest.$createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Score:</strong> {mockTest.score}/
                {mockTest.quesCount || 50}
              </p>
              <p>
                <strong>Total Questions:</strong> {mockTest.quesCount || 50}
              </p>
              <p>
                <strong>Trade Name:</strong> {mockTest.tradeName || "N/A"}
              </p>
              <p>
                <strong>Year:</strong> {mockTest.year || "N/A"}
              </p>
            </div>
            <div className="space-y-4">
              {mockTest.questions.map((question, index) => (
                <div
                  key={index}
                  className={`p-6 mb-4 rounded-lg shadow-md bg-white ${
                    question.response === question.correctAnswer
                      ? "border-l-4 border-green-500"
                      : "border-l-4 border-red-500"
                  }`}
                >
                  <h3 className="text-lg font-semibold mb-2 ">
                    {index + 1}. {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, idx) => (
                      <p
                        key={idx}
                        className={`p-2 rounded-md ${
                          idx === getIndex(question.correctAnswer)
                            ? "bg-green-100 text-green-800"
                            : idx === getIndex(question.response)
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getOption(idx)}. {option}
                        {idx === getIndex(question.correctAnswer) && (
                          <span className="ml-2 font-semibold">
                            (Correct Answer)
                          </span>
                        )}
                        {idx === getIndex(question.response) && (
                          <span className="ml-2 font-semibold">
                            (Selected Answer)
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-700">Loading...</p>
        )}
      </div>
    </div>
  );
};

export default ShowMockTest;
