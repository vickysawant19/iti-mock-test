import React from "react";
import ScoreBadge from "./ScoreBadge";

const StudentDetailsModal = ({
  showModal,
  setShowModal,
  selectedStudent,
  assignmentScore,
  getStudentScore,
}) => {
  if (!showModal || !selectedStudent) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-linear-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              {selectedStudent.userName || selectedStudent.name || "Unknown"}
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              Student Performance Details
            </p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Overall Stats */}
          <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-indigo-600">
                  {selectedStudent.average}
                </div>
                <div className="text-sm text-gray-600 mt-1">Average Score</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {selectedStudent.completed}
                </div>
                <div className="text-sm text-gray-600 mt-1">Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-pink-600">
                  {selectedStudent.total}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total</div>
              </div>
            </div>
          </div>

          {/* Module Scores */}
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Module Scores
          </h3>
          <div className="space-y-3">
            {assignmentScore.map((assignment, index) => {
              const score = getStudentScore(
                assignment.assessmentPaperId,
                selectedStudent.userId
              );

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {assignment.moduleId} - {assignment.moduleName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">
                      {assignment.assessmentPaperId}
                    </div>
                  </div>
                  <div>
                    <ScoreBadge score={score} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
