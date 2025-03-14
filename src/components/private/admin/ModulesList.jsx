import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, BookOpen, FileText } from "lucide-react";

const ModuleList = ({
  syllabus = [],
  setModuleId,
  setTopicId,
  topicId,
  moduleId,
  setShow,
}) => {
  const [expandedModule, setExpandedModule] = useState(null);

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 space-y-4 h-screen overflow-y-scroll scroll-smooth ">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Module List</h3>
      </div>

      <div className="space-y-3 ">
        {syllabus
          .sort((a, b) => {
            const numA = parseInt(a.moduleId.match(/\d+/)[0], 10);
            const numB = parseInt(b.moduleId.match(/\d+/)[0], 10);
            return numA - numB;
          })
          .map((module) => (
            <div
              key={module.moduleId}
              className={`border rounded-lg transition-all duration-200 ${
                moduleId === module.moduleId
                  ? "border-blue-300 shadow-md bg-blue-50"
                  : "border-gray-200 hover:border-blue-200 hover:shadow-sm"
              }`}
            >
              {/* Module Header */}
              <div
                className={`flex justify-between items-center p-4 cursor-pointer transition-colors duration-200 ${
                  moduleId === module.moduleId
                    ? "text-blue-900"
                    : "text-gray-700 hover:text-blue-800"
                }`}
                onClick={() => {
                  toggleModule(module.moduleId);
                  setModuleId(module.moduleId);
                  setShow(new Set().add("showModules"));
                  setTopicId("");
                }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium w-full text-ellipsis  line-clamp-2">
                    {module.moduleId.toUpperCase()} {module.moduleName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {module.topics?.length || 0} topics
                  </span>
                  {expandedModule === module.moduleId ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Topics Dropdown */}
              {expandedModule === module.moduleId && (
                <div className="border-t border-gray-100 bg-white rounded-b-lg">
                  <div className="p-4 space-y-2">
                    {module?.topics?.map((topic) => (
                      <div
                        key={topic.topicId}
                        onClick={() => {
                          setModuleId(module.moduleId);
                          setTopicId(topic.topicId);
                          setShow(new Set().add("showTopics"));
                        }}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors duration-200 ${
                          topicId === topic.topicId
                            ? "bg-blue-100 text-blue-900"
                            : "hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <h4 className="font-medium">
                          {topic.topicId}-{topic.topicName}
                        </h4>
                      </div>
                    ))}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShow(new Set().add("AddTopics"));
                        setTopicId("");
                      }}
                      className="flex items-center gap-2 mt-3 p-2 w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Add New Topic</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default ModuleList;
