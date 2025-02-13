import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import questionpaperservice from "../../../appwrite/mockTest";
import { Query } from "appwrite";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";

const OPTIONS = ["A", "B", "C", "D"];

const ShowMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!paperId) return;

    const init = async () => {
      localStorage.removeItem(paperId);
      setIsLoading(true);
      try {
        const userPaperResponse = await questionpaperservice.listQuestions([
          Query.equal("$id", paperId),
        ]);

        if (!userPaperResponse.length) {
          throw new Error("Paper not found");
        }

        const userPaper = userPaperResponse[0];

        userPaper.questions = userPaper.questions.map((question) =>
          JSON.parse(question)
        );

        if (!userPaper.isOriginal) {
          const originalPaperResponse =
            await questionpaperservice.listQuestions([
              Query.equal("paperId", userPaper.paperId),
              Query.equal("isOriginal", true),
            ]);
          const originalPaper = originalPaperResponse[0];

          if (originalPaper.isProtected) {
            toast.error("Protected Paper!\n You can't view result!\n");
            navigate("/all-mock-tests");
            return;
          }
          const questionMap = new Map(
            originalPaper.questions.map((q) => [
              JSON.parse(q).$id,
              JSON.parse(q),
            ])
          );

          userPaper.questions = userPaper.questions.map((q) => ({
            ...questionMap.get(q.$id),
            response: q.response,
          }));
        }

        setMockTest(userPaper);
      } catch (error) {
        console.error("Error fetching mock test:", error);
        toast.error("Failed to load the mock test.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [paperId, navigate]);

  const getIndex = (res) => OPTIONS.indexOf(res);

  const SkeletonLoader = () => {
    return (
      <div className="p-4 mx-auto bg-white shadow-md rounded-md animate-pulse">
        {/* Header Skeleton */}
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex mb-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded w-2/4 ml-2"></div>
          </div>
        ))}

        {/* Question Skeleton */}
        <div className="h-20 bg-gray-300 rounded w-full mb-4 mt-6"></div>

        {/* Options Skeleton */}
        {[...Array(2)].map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2 mb-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-10 bg-gray-300 rounded w-full"
              ></div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Mock Test Results
        </h1>
        {isLoading ? (
          <SkeletonLoader />
        ) : mockTest ? (
          <div className="bg-white p-6 rounded-lg shadow-lg">
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
                        {OPTIONS[idx]}. {option}
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
