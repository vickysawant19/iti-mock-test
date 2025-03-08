import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import questionpaperservice from "../../../appwrite/mockTest";
import { Query } from "appwrite";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store/userSlice";

const OPTIONS = ["A", "B", "C", "D"];

const ShowMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const user = useSelector(selectUser);

  const isTeacher = user.labels.includes("Teacher");

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
        console.log(userPaper);

        if (userPaper.isOriginal !== null && !userPaper.isOriginal) {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Mock Test Results
        </h1>
        {/* Header Skeleton */}
        <div className="p-1 max-w-md  bg-white animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
        </div>

        {/* Question Skeleton */}
        <div className="h-20 bg-gray-300 rounded w-full mb-4 mt-6 p-4"></div>

        {/* Options Skeleton */}
        {[...Array(2)].map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2 mb-6 mt-2">
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
    <div className=" min-h-screen">
      <div className="container mx-auto">
        {isLoading ? (
          <SkeletonLoader />
        ) : mockTest ? (
          <div className="bg-gray-100 p-4 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Mock Test Results
            </h1>
            <div className="mb-6">
              <p>
                <strong>User Name:</strong> {mockTest.userName || "N/A"}
              </p>
              <p>
                <strong>Trade Name:</strong> {mockTest.tradeName || "N/A"}
              </p>
              <p>
                <strong>Year:</strong> {mockTest.year || "N/A"}
              </p>
              <p>
                <strong>Paper ID:</strong> {mockTest.paperId}
              </p>

              <p>
                <strong>Created At:</strong>{" "}
                {new Date(mockTest.$createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Score:</strong> {mockTest.score}/
                {mockTest.quesCount || "NA"}
              </p>
              <p>
                <strong>Total Questions:</strong> {mockTest.quesCount || "NA"}
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
                  <div className=" mb-2 flex justify-between flex-col">
                    {isTeacher ? (
                      <Link
                        className="text-gray-500 text-xs mb-2 h-fit w-fit"
                        to={`/edit/${question.$id}`}
                      >
                        {question.$id}
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-xs bg-red-400">
                        {question.$id}
                      </span>
                    )}
                    <h1 className="text-lg font-semibold">
                      {index + 1}. {question.question}{" "}
                    </h1>
                  </div>
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
