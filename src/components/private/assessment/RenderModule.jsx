import React, { useEffect, useState } from "react";

import {
  BookOpen,
  Clock,
  FileText,
  Check,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";

import { format } from "date-fns";
import { createSearchParams, Link, useNavigate } from "react-router-dom";
import ViewPaper from "./ViewPaper";
import questionpaperservice from "../../../appwrite/mockTest";
import { toast } from "react-toastify";

const RenderModule = ({ module, papersData, redirect }) => {
  const [showPaper, setShowPaper] = useState(false);
  const selectedPaper = papersData.get(module.assessmentPaperId);

  const navigate = useNavigate();

  const attemptAssessmentAgain = async () => {
    try {
      if (!selectedPaper?.isOriginal) {
        await questionpaperservice.deleteQuestionPaper(selectedPaper.$id);
        navigate(
          `/attain-test?paperid=${
            module.assessmentPaperId
          }&redirect=${encodeURIComponent(redirect)}`
        );
      } else {
        toast.error("Not allowed for Teacher!");
      }
    } catch (error) {
      console.log("error", error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div
        className={`${
          selectedPaper?.submitted ? "bg-green-100" : "bg-yellow-100"
        } p-4 border-b`}
      >
        <h2 className="text-lg font-semibold text-gray-800">
          {module.moduleId}: {module.moduleName}
        </h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center">
            <Clock className="text-blue-500 mr-2" size={18} />
            <span className="text-sm text-gray-700">
              Duration: {module.moduleDuration} hours
            </span>
          </div>
          <div className="flex items-center">
            <FileText className="text-blue-500 mr-2" size={18} />
            <span className="text-sm text-gray-700">
              Paper ID: {module.assessmentPaperId}
            </span>
          </div>
        </div>

        {module.moduleDescription && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
              <BookOpen className="text-blue-500 mr-2" size={16} />
              Description
            </h3>
            <p className="text-gray-700 text-sm">{module.moduleDescription}</p>
          </div>
        )}

        {module.learningOutcome && module.learningOutcome !== "-" && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-2">
              Learning Outcomes
            </h3>
            <p className="text-gray-700 text-sm">{module.learningOutcome}</p>
          </div>
        )}

        {module.evalutionPoints && module.evalutionPoints.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-2">
              Evaluation Points
            </h3>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {module.evalutionPoints.map((point) => (
                  <div key={point.id} className="flex justify-between">
                    <span className="text-sm text-gray-700">
                      {point.evaluation}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {point.points} points
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          {selectedPaper?.submitted ? (
            <div className="bg-green-50 p-4 rounded-md border border-green-100">
              <div className="flex items-center mb-2">
                <Check className="text-green-500 mr-2" size={18} />
                <h3 className="font-medium text-green-700">
                  Assessment Completed
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Paper ID:</span>
                  <Link
                    to={`/mock-test-result/${selectedPaper.paperId}`}
                    className="flex gap-2 items-center justify-center hover:underline text-blue-900"
                  >
                    <span className="font-medium">{selectedPaper.paperId}</span>
                    <ExternalLink />
                  </Link>
                </div>
                <div>
                  <span className="text-gray-500 block">Score:</span>
                  <span className="font-medium">
                    {selectedPaper.score}/{selectedPaper.quesCount}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Submitted On:</span>
                  <span className="font-medium">
                    {format(selectedPaper.endTime, "dd-MM-yyyy hh:mm a")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            module.assessmentPaperId && (
              <Link
                to={`/attain-test?paperid=${
                  module.assessmentPaperId
                }&redirect=${encodeURIComponent(redirect)}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Attend Exam
              </Link>
            )
          )}
        </div>

        {module?.assessmentPaperId && selectedPaper?.submitted && (
          <div className="w-full justify-center items-center">
            <div className=" flex gap-4">
              <button
                className="flex bg-blue-700 px-4 py-2 text-white rounded-md my-4"
                type="button"
                onClick={() => setShowPaper((prev) => !prev)}
              >
                {!showPaper ? "Show Paper" : "Hide Paper"}
              </button>

              {selectedPaper?.submitted && (
                <button
                  className="flex bg-teal-700 px-4 py-2 text-white rounded-md my-4"
                  type="button"
                  onClick={() => attemptAssessmentAgain()}
                >
                  <RefreshCcw />
                  Attempt Again
                </button>
              )}
            </div>

            <div
              className={`${
                showPaper ? "block" : "hidden"
              } transition-all ease-in-out duration-300`}
            >
              <ViewPaper
                showPaper={showPaper}
                key={module.assessmentPaperId}
                paperId={module.assessmentPaperId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderModule;
