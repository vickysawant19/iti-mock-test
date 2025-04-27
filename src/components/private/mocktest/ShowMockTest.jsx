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

        const userPaper = { ...userPaperResponse[0] };

        userPaper.questions = userPaper.questions
          .map((questionStr) => {
            try {
              return JSON.parse(questionStr);
            } catch (err) {
              console.error("Error parsing user paper question:", err);
              return null;
            }
          })
          .filter(Boolean);

        if (userPaper.isOriginal !== null && !userPaper.isOriginal) {
          const originalPaperResponse =
            await questionpaperservice.listQuestions([
              Query.equal("paperId", userPaper.paperId),
              Query.equal("isOriginal", true),
            ]);

          if (!originalPaperResponse?.length) {
            toast.error("Something went Wrong!\n");
            navigate("/all-mock-tests");
            return;
          }
          const originalPaper = { ...originalPaperResponse[0] };

          if (originalPaper.isProtected) {
            toast.error("Protected Paper!\n You can't view result!\n");
            navigate("/all-mock-tests");
            return;
          }

          const questionMap = originalPaper.questions.reduce((map, qStr) => {
            try {
              const q = JSON.parse(qStr);
              map.set(q.$id, q);
            } catch (err) {
              console.error("Error parsing original paper question:", err);
            }
            return map;
          }, new Map());

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
      <div className="p-4 mx-auto bg-white shadow-md rounded-md animate-pulse dark:bg-gray-800 dark:shadow-none">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center dark:text-gray-100">
          Mock Test Results
        </h1>
        {/* Header Skeleton */}
        <div className="p-1 max-w-md bg-white animate-pulse dark:bg-gray-800">
          <div className="h-4 bg-gray-300 rounded-sm w-3/4 mb-2 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-300 rounded-sm w-1/2 mb-2 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-300 rounded-sm w-1/3 mb-2 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-300 rounded-sm w-full mb-2 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-300 rounded-sm w-full mb-2 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-300 rounded-sm w-full mb-2 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-300 rounded-sm w-1/2 mb-2 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-300 rounded-sm w-3/4 mb-2 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-300 rounded-sm w-1/3 mb-2 dark:bg-gray-700"></div>
        </div>

        {/* Question Skeleton */}
        <div className="h-20 bg-gray-300 rounded-sm w-full mb-4 mt-6 p-4 dark:bg-gray-700"></div>

        {/* Options Skeleton */}
        {[...Array(2)].map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2 mb-6 mt-2">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-10 bg-gray-300 rounded-sm w-full dark:bg-gray-700"
              ></div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto">
        {isLoading ? (
          <SkeletonLoader />
        ) : mockTest ? (
          <div className="bg-gray-100 p-4 rounded-lg shadow-lg dark:bg-gray-800 dark:shadow-none">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center dark:text-gray-100">
              Mock Test Results
            </h1>
            <div className="mb-6">
              <p className="text-gray-800 dark:text-gray-200">
                <strong>User Name:</strong> {mockTest.userName || "N/A"}
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>Trade Name:</strong> {mockTest.tradeName || "N/A"}
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>Year:</strong> {mockTest.year || "N/A"}
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>Paper ID:</strong> {mockTest.paperId}
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>Created At:</strong>{" "}
                {new Date(mockTest.$createdAt).toLocaleString()}
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>Score:</strong> {mockTest.score}/
                {mockTest.quesCount || "NA"}
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>Total Questions:</strong> {mockTest.quesCount || "NA"}
              </p>
            </div>
            <div className="space-y-4">
              {mockTest.questions.map((question, index) => (
                <div
                  key={index}
                  className={`p-6 mb-4 rounded-lg shadow-md bg-white dark:bg-gray-700 ${
                    question.response === question.correctAnswer
                      ? "border-l-4 border-green-500 dark:border-green-400"
                      : "border-l-4 border-red-500 dark:border-red-400"
                  }`}
                >
                  <div className="mb-2 flex justify-between flex-col">
                    {isTeacher ? (
                      <Link
                        className="text-gray-500 text-xs mb-2 h-fit w-fit dark:text-gray-300"
                        to={`/edit/${question.$id}`}
                      >
                        {question.$id}
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-xs bg-red-400 dark:bg-red-500 dark:text-gray-100">
                        {question.$id}
                      </span>
                    )}
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {index + 1}. {question.question}{" "}
                    </h1>
                  </div>

                  <div className="flex gap-2 m-2">
                    {question?.images?.map((img) => {
                      const image = JSON.parse(img);
                      return (
                        <img
                          className="max-h-32"
                          key={image.id}
                          src={
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQysm7d0JnuK4_jPG6U3Fyd1cRzbb78Z_7-4g&s"
                          }
                          alt={image.name}
                        />
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, idx) => (
                      <p
                        key={idx}
                        className={`p-2 rounded-md ${
                          idx === getIndex(question.correctAnswer)
                            ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                            : idx === getIndex(question.response)
                            ? "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {OPTIONS[idx]}. {option}
                        {idx === getIndex(question.correctAnswer) && (
                          <span className="ml-2 font-semibold text-green-800 dark:text-green-100">
                            (Correct Answer)
                          </span>
                        )}
                        {idx === getIndex(question.response) && (
                          <span className="ml-2 font-semibold text-red-800 dark:text-red-100">
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
          <p className="text-center text-gray-700 dark:text-gray-300">
            Loading...
          </p>
        )}
      </div>
    </div>
  );
};

export default ShowMockTest;
