import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const ModuleList = ({
  syllabus = [],
  setModuleId,
  setTopicId,
  topicId,
  moduleId,
  setShowTopicForm,
  setShowModuleForm
}) => {
  // State to track which module's topics are expanded
  const [expandedModule, setExpandedModule] = useState(null);

  // Toggle the expanded state of a module
  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };


  return (
    <div className="space-y-4">
      {syllabus.map((module) => (
        <div key={module.moduleId} className="border rounded-lg shadow-sm p-4">
          {/* Module Header */}
          <div
            className={`flex justify-between items-center cursor-pointer ${
              moduleId === module.moduleId
                ? " text-gray-950"
                : " text-gray-600"
            }`}
            onClick={() => {
              toggleModule(module.moduleId);
              setModuleId(module.moduleId);
            }}
          >
            <h3 className="text-lg font-semibold">{module.moduleName}</h3>
            {expandedModule === module.moduleId ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>

          {/* Topics Dropdown */}
          {expandedModule === module.moduleId && (
            <div className="mt-4 space-y-2">
              {module.topics.map((topic) => (
                <div
                  onClick={() => setTopicId(topic.topicId)}
                  key={topic.topicId}
                  className="pl-4"
                >
                  <h4 className={`font-medium ${topicId === topic.topicId ? "text-gray-950 underline" : "text-gray-600 no-underline"}`}>{topic.topicName}</h4>
                  <p className="text-sm text-gray-600">Hours: {topic.hours}</p>
                  <p className="text-sm text-gray-600">
                    Assessment: {topic.assessment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ModuleList;
