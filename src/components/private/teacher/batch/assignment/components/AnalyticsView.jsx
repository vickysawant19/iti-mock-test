import React from "react";

const AnalyticsView = ({
  topPerformers,
  moduleAverages,
  scoreDistribution,
  handleStudentClick,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Performers Leaderboard */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-3xl">🏆</span> Top Performers Leaderboard
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topPerformers.map((student, index) => {
            const name = student.userName || student.name || "Unknown";
            let rankClass = "";
            let medal = "";

            if (index === 0) {
              rankClass = "from-yellow-400 to-yellow-600";
              medal = "🥇";
            } else if (index === 1) {
              rankClass = "from-gray-300 to-gray-500";
              medal = "🥈";
            } else if (index === 2) {
              rankClass = "from-orange-400 to-orange-600";
              medal = "🥉";
            } else {
              rankClass = "from-indigo-400 to-purple-600";
            }

            return (
              <div
                key={student.userId}
                className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-4 flex items-center gap-4 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl cursor-pointer"
                onClick={() => handleStudentClick(student)}
              >
                <div
                  className={`shrink-0 w-14 h-14 rounded-full bg-linear-to-br ${rankClass} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}
                >
                  {medal || index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{name}</div>
                  <div className="text-sm text-gray-600">
                    Average:{" "}
                    <span className="font-semibold text-indigo-600">
                      {student.average}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Completed: {student.completed}/{student.total}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Performance Chart */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-3xl">📊</span> Average Scores by Module
        </h3>
        <div className="flex items-end justify-around h-64 gap-2 px-4">
          {moduleAverages.map((module, index) => {
            const height = (parseFloat(module.average) / 5) * 100;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  className="w-full bg-linear-to-t from-indigo-600 to-purple-600 rounded-t-lg relative transform hover:scale-105 transition-all cursor-pointer shadow-lg"
                  style={{ height: `${height}%`, minHeight: "20px" }}
                  title={`${module.moduleName}: ${module.average}`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 font-bold text-indigo-600 text-sm whitespace-nowrap">
                    {module.average}
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-700 mt-2 text-center truncate w-full">
                  {module.moduleId}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Distribution */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-3xl">📈</span> Score Distribution
        </h3>
        <div className="flex items-end justify-around h-64 gap-3 px-4">
          {Object.entries(scoreDistribution).map(([score, count]) => {
            const maxCount = Math.max(...Object.values(scoreDistribution));
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

            let gradient = "from-gray-400 to-gray-600";
            if (score === "5") gradient = "from-green-400 to-emerald-600";
            else if (score === "4") gradient = "from-blue-400 to-cyan-600";
            else if (score === "3") gradient = "from-yellow-400 to-amber-600";
            else if (score === "2") gradient = "from-orange-400 to-orange-600";
            else if (score === "1" || score === "0")
              gradient = "from-red-400 to-rose-600";

            return (
              <div
                key={score}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  className={`w-full bg-linear-to-t ${gradient} rounded-t-lg relative transform hover:scale-105 transition-all cursor-pointer shadow-lg`}
                  style={{ height: `${height}%`, minHeight: "20px" }}
                  title={`Score ${score}: ${count} occurrences`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 font-bold text-gray-700 text-sm">
                    {count}
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-700 mt-2">
                  {score}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
