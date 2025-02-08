import React from "react";
import { Clock, Book, ClipboardList, Edit2, Bookmark } from "lucide-react";

const ShowTopic = ({ topic, setShow }) => {
  if (!topic) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bookmark className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">
              {topic.topicName}
            </h3>
          </div>
          <button
            onClick={() => setShow(new Set().add("AddTopics"))}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Topic Hours */}
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-gray-900 font-medium">Duration</p>
            <p className="text-gray-600">{topic.topicHours} hours</p>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Book className="w-5 h-5 text-gray-500" />
            <h4 className="text-gray-900 font-medium">Learning Resources</h4>
          </div>
          <ul className="grid gap-2 pl-8">
            {typeof topic.topicResource === "object" &&
              topic?.topicResource.map((resource, index) => (
                <li
                  key={index}
                  className="text-gray-600 flex items-center gap-2 before:content-['•'] before:text-blue-500 before:mr-2"
                >
                  {resource}
                </li>
              ))}
          </ul>
        </div>

        {/* Assessment */}
        <div className="flex items-start gap-3">
          <ClipboardList className="w-5 h-5 text-gray-500 mt-1" />
          <div>
            <h4 className="text-gray-900 font-medium">Assessment Method</h4>
            <p className="text-gray-600 mt-1">{topic.topicAssessment}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowTopic;
