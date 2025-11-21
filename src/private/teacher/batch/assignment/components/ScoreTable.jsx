import React from "react";
import ScoreBadge from "./ScoreBadge";

const ScoreTable = ({
  filteredStudents,
  handleStudentClick,
  assignmentScore,
  getStudentScore,
  handleSort,
  sortConfig,
  hasData,
  pagination,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {assignmentScore.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className=" left-0 z-20 px-4 py-3 text-left font-bold text-white uppercase tracking-wider bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 border-r border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Student Name
                    {sortConfig.key === "name" && (
                      <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                {assignmentScore.map((assignment, idx) => (
                  <th
                    key={`${assignment.assessmentPaperId}-${idx}`}
                    onClick={() => handleSort(assignment.assessmentPaperId)}
                    className="px-3 py-3 text-center min-w-[100px] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div
                      className="font-bold text-white uppercase tracking-wide truncate"
                      title={assignment.moduleName}
                    >
                      {assignment.moduleId}
                    </div>
                    <div className="text-indigo-100 mt-1 font-mono truncate">
                      {assignment.assessmentPaperId.substring(0, 8)}...
                    </div>
                  </th>
                ))}
                <th
                  onClick={() => handleSort("average")}
                  className="px-4 py-3 text-center font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    Average
                    {sortConfig.key === "average" && (
                      <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student, idx) => {
                const studentName =
                  student.userName || student.name || "Unknown";

                return (
                  <tr
                    key={student.userId}
                    onClick={() => handleStudentClick(student)}
                    className={`hover:bg-indigo-50 transition-all cursor-pointer ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="left-0 z-10 px-4 py-2 whitespace-nowrap font-semibold text-gray-800 bg-inherit border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg">
                          {studentName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{studentName}</span>
                      </div>
                    </td>
                    {assignmentScore.map((assignment, assignmentIdx) => {
                      const studentScore = getStudentScore(
                        assignment.assessmentPaperId,
                        student.userId
                      );

                      return (
                        <td
                          key={`${assignment.assessmentPaperId}-${assignmentIdx}`}
                          className="px-3 py-2 text-center"
                        >
                          <div className="flex justify-center items-center">
                            <ScoreBadge score={studentScore} />
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 text-white font-bold text-base shadow-lg">
                        {student.average}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          {!hasData ? (
            <div className="animate-fadeIn">
              <div className="text-8xl mb-4">📋</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Get Started
              </h3>
              <p className="text-base text-gray-600 max-w-md mx-auto">
                Select a subject and year from the filters above to view
                assignment data
              </p>
            </div>
          ) : pagination.isLoading ? (
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <svg
                className="animate-spin h-16 w-16 text-indigo-600"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-700">
                Loading assignment data...
              </p>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <div className="text-8xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Data Available
              </h3>
              <p className="text-base text-gray-600">
                No assignment data found for the selected filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreTable;
