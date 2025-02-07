import React from "react";

const ShowTopic = ({ topic }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 space-y-4">
      {/* Topic Name */}
      <h3 className="text-xl font-bold text-gray-800">{topic.topicName}</h3>

      {/* Topic Hours */}
      <p className="text-gray-600">
        <span className="font-medium">Hours:</span> {topic.hours}
      </p>

      {/* Resources */}
      <div>
        <p className="font-medium text-gray-700">Resources:</p>
        <ul className="list-disc pl-5 space-y-1">
          {topic.resources.map((resource, index) => (
            <li key={index} className="text-gray-600">
              {resource}
            </li>
          ))}
        </ul>
      </div>

      {/* Assessment */}
      <p className="text-gray-700">
        <span className="font-medium">Assessment:</span> {topic.assessment}
      </p>
    </div>
  );
};

export default ShowTopic;