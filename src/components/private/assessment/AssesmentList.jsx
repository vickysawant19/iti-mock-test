import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Clock,
  Check,
  AlertCircle,
} from "lucide-react";

import RenderModule from "./RenderModule";

const AssessmentList = ({ modulesData, papersData, redirect }) => {
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedModuleId, setExpandedModuleId] = useState(null);

  const handleModuleClick = (module) => {
    setSelectedModule(module);

    // For mobile: toggle the expanded state
    if (expandedModuleId === module.moduleId) {
      setExpandedModuleId(null);
    } else {
      setExpandedModuleId(module.moduleId);
    }
  };

  return (
    <div className="px-4 md:px-6 py-4 bg-gray-50 min-h-screen">
      {/* Desktop View */}
      <div className="hidden md:flex flex-row gap-6">
        {/* Module List */}
        <div className="w-1/3 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h2 className="font-semibold flex items-center">
              <ClipboardList className="mr-2" size={18} />
              Available Assessments
            </h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {modulesData && modulesData.length > 0 ? (
              modulesData.map((module) => {
                const modulePaper = papersData.get(module.assessmentPaperId);
                const isSubmitted = modulePaper?.submitted;

                return (
                  <div
                    key={module.moduleId}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                      isSubmitted
                        ? "border-l-green-500 opacity-80"
                        : "border-l-yellow-100"
                    } ${
                      selectedModule &&
                      selectedModule.moduleId === module.moduleId
                        ? "bg-blue-50"
                        : ""
                    }`}
                    onClick={() => handleModuleClick(module)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 flex items-center">
                          {isSubmitted && (
                            <Check
                              size={16}
                              className="text-green-500 mr-1 flex-shrink-0"
                            />
                          )}
                          <span className="text-ellipsis line-clamp-1">
                            {module.moduleId}: {module.moduleName}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center">
                          <Clock size={14} className="mr-1" />
                          {module.moduleDuration} hours
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 flex-shrink-0"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                <AlertCircle className="mx-auto mb-2" size={24} />
                No assessments available
              </div>
            )}
          </div>
        </div>

        {/* Module Details */}
        <div className="w-2/3">
          {selectedModule ? (
            <RenderModule
              key={selectedModule.moduleId}
              module={selectedModule}
              papersData={papersData}
              redirect={redirect}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500 h-full flex flex-col items-center justify-center">
              <ClipboardList size={48} className="text-gray-300 mb-4" />
              <p>Select an assessment from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile View - Accordion Style */}
      <div className="md:hidden space-y-4">
        {modulesData && modulesData.length > 0 ? (
          modulesData.map((module) => {
            const modulePaper = papersData.get(module.assessmentPaperId);
            const isSubmitted = modulePaper?.submitted;
            const isExpanded = expandedModuleId === module.moduleId;

            return (
              <div
                key={module.moduleId}
                className="bg-white rounded-lg shadow-md overflow-hidden text-ellipsis "
              >
                <div
                  className={`p-4 cursor-pointer border-l-4 ${
                    isSubmitted
                      ? "border-l-green-500 opacity-80"
                      : "border-l-yellow-200"
                  }`}
                  onClick={() => handleModuleClick(module)}
                >
                  <div className="flex justify-between items-center ">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 flex items-center r">
                        {isSubmitted && (
                          <Check
                            size={16}
                            className="text-green-500 mr-1 flex-shrink-0"
                          />
                        )}
                        <span className="text-ellipsis line-clamp-1">
                          {module.moduleId}: {module.moduleName}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <Clock size={14} className="mr-1" />
                        {module.moduleDuration} hours
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown
                        size={18}
                        className="text-gray-400 flex-shrink-0"
                      />
                    ) : (
                      <ChevronRight
                        size={18}
                        className="text-gray-400 flex-shrink-0"
                      />
                    )}
                  </div>
                </div>

                {/* Expandable content */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <RenderModule
                      key={module.moduleId}
                      module={module}
                      papersData={papersData}
                      redirect={redirect}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            <AlertCircle className="mx-auto mb-2" size={24} />
            No assessments available
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentList;
