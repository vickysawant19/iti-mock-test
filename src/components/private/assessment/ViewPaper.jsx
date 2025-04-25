import React, { useEffect, useState } from "react";
import questionpaperservice from "../../../appwrite/mockTest";
import { Query } from "appwrite";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  User,
  Clipboard,
  AlertTriangle,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../store/profileSlice";

const ViewPaper = ({ paperId, showPaper }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [paperData, setPaperData] = useState(null);
  const [questions, setQuestions] = useState([]);

  const profile = useSelector(selectProfile);

  const fetchPaper = async () => {
    setIsLoading(true);
    try {
      const data = await questionpaperservice.listQuestions([
        Query.equal("paperId", paperId),
        Query.or([
          Query.equal("isOriginal", true),
          Query.and([
            Query.equal("userId", profile.userId),
            Query.equal("submitted", true),
          ]),
        ]),
        Query.orderAsc("$createdAt"),
      ]);

      if (!data?.length) {
        setPaperData(null);
        return;
      }

      const { originalPaper, userPaper } = data.reduce(
        (acc, paper) => {
          if (paper.isOriginal && !acc.originalPaper) {
            acc.originalPaper = paper;
          }
          if (paper.userId === profile.userId && !acc.userPaper) {
            acc.userPaper = paper;
          }
          return acc;
        },
        { originalPaper: null, userPaper: null }
      );

      if (!originalPaper || !userPaper) {
        console.error(!originalPaper ? "Original Paper missing!" : "User Paper missing!");
        setPaperData(null);
        return;
      }
      const questionsMap = originalPaper.questions.reduce((map, ques) => {
        const question = JSON.parse(ques);
        map.set(question.$id, question);
        return map;
      }, new Map());

      const newPaper = {
        ...userPaper,
        questions: userPaper.questions.map((p) => {
          const userPaperParse = JSON.parse(p);
          return {
            ...questionsMap.get(userPaperParse.$id),
            response: userPaperParse.response,
          };
        }),
      };
      setPaperData(newPaper);
      setQuestions(newPaper.questions);
    } catch (error) {
      console.log("Error fetching paper:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (paperId && paperData?.paperId !== paperId && showPaper) {
      fetchPaper();
    }
  }, [paperId, showPaper]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!paperData) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-sm shadow-sm">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
          <p className="text-red-700">
            You have not attained this Assessment.
            <br />
            <span className="text-red-400 text-sm">
              No paper found with the given ID.
            </span>
          </p>
        </div>
      </div>
    );
  }

  const startTime = paperData.startTime ? new Date(paperData.startTime) : null;
  const endTime = paperData.endTime ? new Date(paperData.endTime) : null;

  return (
    <div className="">
      {/* Paper Header */}
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {paperData.tradeName || "Unnamed Paper"}
        </h1>
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex items-center text-gray-600">
            <User className="h-4 w-4 mr-1" />
            <span>{paperData.userName || "Anonymous"}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clipboard className="h-4 w-4 mr-1" />
            <span>Paper ID: {paperData.paperId}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>Duration: {paperData.totalMinutes} minutes</span>
          </div>
          {startTime && (
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span>Started: {format(startTime, "PPp")}</span>
            </div>
          )}
          {endTime && (
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span>Ended: {format(endTime, "PPp")}</span>
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <Award className="h-4 w-4 mr-1" />
            <span>
              Score: {paperData.score}/{paperData.quesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => {
          const isCorrect = question.response === question.correctAnswer;

          return (
            <div
              key={question.$id || index}
              className={`border rounded-lg overflow-hidden shadow-sm
                ${
                  isCorrect
                    ? "border-l-4 border-l-green-500"
                    : "border-l-4 border-l-red-500"
                }`}
            >
              <div className="p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg text-gray-800">
                    Question {index + 1}
                  </h3>
                  {isCorrect ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      <span>Correct</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-5 w-5 mr-1" />
                      <span>Incorrect</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-gray-700">{question.question}</p>
              </div>

              <div className="p-4 bg-white">
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => {
                    const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D
                    const isSelected = question.response === optionLetter;
                    const isCorrectOption =
                      question.correctAnswer === optionLetter;

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-md border flex items-start
                          ${
                            isSelected && isCorrectOption
                              ? "bg-green-50 border-green-300"
                              : ""
                          }
                          ${
                            isSelected && !isCorrectOption
                              ? "bg-red-50 border-red-300"
                              : ""
                          }
                          ${
                            !isSelected && isCorrectOption
                              ? "bg-green-50 border-green-300"
                              : ""
                          }
                          ${
                            !isSelected && !isCorrectOption
                              ? "bg-gray-50 border-gray-200"
                              : ""
                          }
                        `}
                      >
                        <div className="w-6 shrink-0 text-center mr-3">
                          {optionLetter}.
                        </div>
                        <div className="grow">{option}</div>
                        <div className="shrink-0 ml-2">
                          {isSelected && isCorrectOption && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {isSelected && !isCorrectOption && (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          {!isSelected && isCorrectOption && (
                            <CheckCircle className="h-5 w-5 text-green-600 opacity-50" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="font-semibold text-lg text-blue-800 mb-2">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span>Correct Answers: {paperData.score}</span>
          </div>
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <span>
              Incorrect Answers: {paperData.quesCount - paperData.score}
            </span>
          </div>
          <div className="flex items-center">
            <Award className="h-5 w-5 text-blue-600 mr-2" />
            <span>
              Score: {Math.round((paperData.score / paperData.quesCount) * 100)}
              %
            </span>
          </div>
          {startTime && endTime && (
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <span>
                Time Taken: {Math.round((endTime - startTime) / 60000)} minutes
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewPaper;
