import React from "react";

const ShowModules = ({ module }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 space-y-4">
      {/* Module Name */}
      <h2 className="text-2xl font-bold text-gray-800">{module.moduleName}</h2>

      {/* Module Duration */}
      <p className="text-gray-600">
        <span className="font-medium">Duration:</span> {module.moduleDuration} hours
      </p>

      {/* Learning Outcome */}
      <p className="text-gray-700">
        <span className="font-medium">Learning Outcome:</span> {module.learningOutcome}
      </p>

      {/* Module Description */}
      <p className="text-gray-700">
        <span className="font-medium">Description:</span> {module.moduleDescription}
      </p>

      {/* Total Hours */}
      <p className="text-gray-600">
        <span className="font-medium">Total Hours:</span> {module.hours}
      </p>
    </div>
  );
};

export default ShowModules;