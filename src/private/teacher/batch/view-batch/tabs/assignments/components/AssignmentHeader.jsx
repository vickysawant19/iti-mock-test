import React from "react";

const AssignmentHeader = ({ students, assignmentScore, modules }) => {
  return (
    <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 mb-6 text-white animate-gradient">
      <h1 className="text-3xl sm:text-4xl font-bold mb-3">
        📊 Assignment Tracker
      </h1>
      <p className="text-indigo-100 text-sm sm:text-base mb-4">
        Track student performance across modules and assessments
      </p>

      <div className="flex flex-wrap gap-6 mt-6">
        <div className="bg-white/20 backdrop-blur-lg rounded-xl px-6 py-3 transform hover:scale-105 transition-all">
          <div className="text-3xl font-bold">{students?.length || 0}</div>
          <div className="text-sm text-indigo-100">Students</div>
        </div>
        <div className="bg-white/20 backdrop-blur-lg rounded-xl px-6 py-3 transform hover:scale-105 transition-all">
          <div className="text-3xl font-bold">{assignmentScore.length}</div>
          <div className="text-sm text-indigo-100">Modules</div>
        </div>
        <div className="bg-white/20 backdrop-blur-lg rounded-xl px-6 py-3 transform hover:scale-105 transition-all">
          <div className="text-3xl font-bold">{modules.data.length}</div>
          <div className="text-sm text-indigo-100">Total Available</div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentHeader;
