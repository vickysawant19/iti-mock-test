import React, { useEffect, useState } from "react";
import {
  Clock,
  Book,
  ClipboardList,
  Edit2,
  Bookmark,
  LucideDelete,
  Delete,
} from "lucide-react";
import { use } from "react";
import moduleServices from "@/appwrite/moduleServices";

const ShowTopic = ({
  setShow,
  setNewModules,
  newModules,
  moduleId,
  topicId,
}) => {
  const [topic, setTopic] = useState(
    newModules
      .find((m) => m.moduleId === moduleId)
      .topics.find((t) => t.topicId === topicId) || {}
  );

  useEffect(() => {
    setTopic(
      newModules
        .find((m) => m.moduleId === moduleId)
        .topics.find((t) => t.topicId === topicId) || {}
    );
  }, [newModules, moduleId, topicId]);

  const handleDeleteTopic = async () => {
    if (!moduleId || !topicId) return;
    if (!confirm("Deleteing Topic with Topic Id:", topicId)) return;
    try {
      const moduleToUpdate = newModules.find((m) => m.moduleId === moduleId);
      const response = await moduleServices.updateNewModulesData({
        ...moduleToUpdate,
        topics: moduleToUpdate.topics.filter((t) => t.topicId !== topicId),
      });
      setNewModules((prev) => {
        return prev.map((m) => (m.moduleId === moduleId ? response : m));
      });
      setTopic(null);
      setShow(new Set().add("showModules"));
    } catch (error) {}
  };

  if (!topic) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden dark:bg-gray-800 dark:shadow-none">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-700">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {topic.topicName}
            </h3>
          </div>
          <div className="flex ">
            <button
              onClick={() => setShow(new Set().add("AddTopics"))}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => handleDeleteTopic()}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
            >
              <Delete className="w-4 h-4" />
              <span>delete</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 ">
        {/* Topic Hours */}
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <p className="text-gray-900 font-medium dark:text-gray-200">
              Duration
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {topic.topicHours} hours
            </p>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Book className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h4 className="text-gray-900 font-medium dark:text-gray-200">
              Learning Resources
            </h4>
          </div>
          <ul className="grid gap-2 pl-8">
            {typeof topic.topicResource === "object" &&
              topic?.topicResource.map((resource, index) => (
                <li
                  key={index}
                  className="text-gray-600 flex items-center gap-2 before:content-['•'] before:text-blue-500 before:mr-2 dark:text-gray-400 dark:before:text-blue-400"
                >
                  {resource}
                </li>
              ))}
          </ul>
        </div>

        {/* Assessment */}
        <div className="flex items-start gap-3">
          <ClipboardList className="w-5 h-5 text-gray-500 mt-1 dark:text-gray-400" />
          <div>
            <h4 className="text-gray-900 font-medium dark:text-gray-200">
              Assessment Method
            </h4>
            <p className="text-gray-600 mt-1 dark:text-gray-400">
              {topic.topicAssessment}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowTopic;
