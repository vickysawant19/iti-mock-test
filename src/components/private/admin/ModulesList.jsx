import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  BookOpen,
  FileText,
  PlusCircle,
  Layers,
} from "lucide-react";

const ModuleList = ({
  syllabus = [],
  setModuleId,
  setTopicId,
  topicId,
  moduleId,
  setShow,
  itemRefs,
  loading,
}) => {
  const [expandedModule, setExpandedModule] = useState(null);

  const toggleModule = (id) => {
    setExpandedModule(expandedModule === id ? null : id);
  };

  const sortedSyllabus = [...syllabus].sort((a, b) => {
    const matchA = a.moduleId?.match(/\d+/);
    const matchB = b.moduleId?.match(/\d+/);
    const numA = matchA ? parseInt(matchA[0], 10) : 0;
    const numB = matchB ? parseInt(matchB[0], 10) : 0;
    return numA - numB;
  });

  const handleModuleClick = (module) => {
    toggleModule(module.moduleId);
    setModuleId(module.moduleId);
    setShow(new Set().add("showModules"));
    setTopicId("");
  };

  const handleTopicClick = (module, topic) => {
    setModuleId(module.moduleId);
    setTopicId(topic.topicId);
    setShow(new Set().add("showTopics"));
  };

  const handleAddModule = () => {
    setShow(new Set().add("AddModules"));
    setModuleId("");
    setTopicId("");
  };

  const handleAddTopic = (e) => {
    e.stopPropagation();
    setShow(new Set().add("AddTopics"));
    setTopicId("");
  };

  return (
    <div className="flex flex-col h-full bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Course Modules
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {syllabus.length} {syllabus.length === 1 ? "module" : "modules"}
              </p>
            </div>
          </div>
          {/* <button
            disabled={loading}
            onClick={handleAddModule}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Adding...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span className="font-medium">New Module</span>
              </>
            )}
          </button> */}
        </div>
      </div>

      {/* Module List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {sortedSyllabus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
              <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No modules yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Get started by adding your first module
            </p>
            <button
              onClick={handleAddModule}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Module
            </button>
          </div>
        ) : (
          sortedSyllabus.map((module, index) => {
            const isExpanded = expandedModule === module.moduleId;
            const isSelected = moduleId === module.moduleId;
            const topicCount = module.topics?.length || 0;

            return (
              <div
                key={module.moduleId || index}
                className={`group bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-100 dark:shadow-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                }`}
              >
                {/* Module Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => handleModuleClick(module)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-blue-100 dark:bg-blue-900/40"
                          : "bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
                      }`}
                    >
                      <BookOpen
                        className={`w-5 h-5 ${
                          isSelected
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        ref={(el) => {
                          if (itemRefs?.current) {
                            itemRefs.current[module.moduleId] = el;
                          }
                        }}
                        className={`font-semibold text-base leading-tight ${
                          isSelected
                            ? "text-blue-900 dark:text-blue-300"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {module.moduleId?.toUpperCase()} {module.moduleName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {topicCount} {topicCount === 1 ? "topic" : "topics"}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform" />
                    )}
                  </div>
                </div>

                {/* Topics Dropdown */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                    <div className="p-4 space-y-2">
                      {topicCount === 0 ? (
                        <div className="text-center py-6">
                          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            No topics added yet
                          </p>
                        </div>
                      ) : (
                        module.topics.map((topic, topicIndex) => {
                          const isTopicSelected = topicId === topic.topicId;
                          return (
                            <div
                              key={topic.topicId || topicIndex}
                              onClick={() => handleTopicClick(module, topic)}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                isTopicSelected
                                  ? "bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-600 shadow-sm"
                                  : "bg-white dark:bg-gray-800 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded ${
                                  isTopicSelected
                                    ? "bg-blue-200 dark:bg-blue-800"
                                    : "bg-gray-100 dark:bg-gray-700"
                                }`}
                              >
                                <FileText
                                  className={`w-4 h-4 ${
                                    isTopicSelected
                                      ? "text-blue-700 dark:text-blue-300"
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}
                                />
                              </div>
                              <span
                                className={`font-medium text-sm ${
                                  isTopicSelected
                                    ? "text-blue-900 dark:text-blue-200"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {topic.topicId} - {topic.topicName}
                              </span>
                            </div>
                          );
                        })
                      )}

                      <button
                        onClick={handleAddTopic}
                        className="flex items-center justify-center gap-2 mt-3 p-3 w-full text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg transition-all duration-200 font-medium hover:border-solid"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Topic</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ModuleList;
