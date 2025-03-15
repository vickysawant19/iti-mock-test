import React from 'react'

import { Link } from "react-router-dom";
import {
  ClipboardList,
  ChevronRight,
  BookOpen,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";

const AssesmentList = ({modulesData, papersData,setSelectedModule, selectedModule}) => {
  return (
    <div className="px-4 md:px-6 py-4">
    <div className="flex flex-col md:flex-row gap-6">
      {/* Module List */}
      <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h2 className="font-semibold flex items-center">
            <ClipboardList className="mr-2" size={18} />
            Available Assessments
          </h2>
        </div>
        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {modulesData && modulesData.length > 0 ? (
            modulesData.map((module) => (
              <div
                key={module.$id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4  ${
                  papersData.get(module.assessmentPaperId).submitted
                    ? "border-green-400"
                    : "border-red-500"
                } ${
                  selectedModule && selectedModule.$id === module.$id
                    ? "bg-blue-50"
                    : ""
                }`}
                onClick={() => setSelectedModule(module)}
              >
                {console.log(
                  "paperd",
                  papersData.get(module.assessmentPaperId).submitted
                )}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">
                      {module.moduleId}: {module.moduleName}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Duration: {module.moduleDuration} hours
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No assessments available for this selection
            </div>
          )}
        </div>
      </div>

      {/* Module Details */}
      <div className="w-full md:w-2/3 bg-white rounded-lg shadow-md overflow-hidden">
        {selectedModule ? (
          <div>
            <div className="bg-gray-50 p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedModule.moduleId}: {selectedModule.moduleName}
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <Clock className="text-blue-500 mr-2" size={18} />
                  <span className="text-sm text-gray-700">
                    Duration: {selectedModule.moduleDuration} hours
                  </span>
                </div>
                <div className="flex items-center">
                  <FileText className="text-blue-500 mr-2" size={18} />
                  <span className="text-sm text-gray-700">
                    Paper ID: {selectedModule.assessmentPaperId}
                  </span>
                </div>
              </div>

              {selectedModule.moduleDescription && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                    <BookOpen className="text-blue-500 mr-2" size={16} />
                    Description
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {selectedModule.moduleDescription}
                  </p>
                </div>
              )}

              {selectedModule.learningOutcome &&
                selectedModule.learningOutcome !== "-" && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-800 mb-2">
                      Learning Outcomes
                    </h3>
                    <p className="text-gray-700 text-sm">
                      {selectedModule.learningOutcome}
                    </p>
                  </div>
                )}

              {selectedModule.evalutionPoints &&
                selectedModule.evalutionPoints.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-800 mb-2">
                      Evaluation Points
                    </h3>
                    <div className="bg-gray-50 rounded-md p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedModule.evalutionPoints.map((point) => (
                          <div
                            key={point.id}
                            className="flex justify-between"
                          >
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
                <Link
                  to={`/attain-test?paperid=${selectedModule.assessmentPaperId}`}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Attend Exam
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500">
            Select an assessment from the list to view details
          </div>
        )}
      </div>
    </div>
  </div>
  )
}

export default AssesmentList