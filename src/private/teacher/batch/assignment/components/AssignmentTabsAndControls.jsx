import React from "react";

const AssignmentTabsAndControls = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  scoreFilter,
  setScoreFilter,
  handleReset,
  handleExport,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6 overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("table")}
          className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
            activeTab === "table"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          📊 Score Table
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
            activeTab === "analytics"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          📈 Analytics
        </button>
      </div>

      {/* Search and Filter Controls */}
      {activeTab === "table" && (
        <div className="p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="🔍 Search student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">All Scores</option>
              <option value="5">Score 5</option>
              <option value="4">Score 4</option>
              <option value="3">Score 3</option>
              <option value="2">Score 2</option>
              <option value="1">Score 1</option>
              <option value="0">Score 0</option>
              <option value="NA">Not Attempted</option>
            </select>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transform hover:scale-105 transition-all shadow-lg"
            >
              Reset
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all shadow-lg"
            >
              📥 Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentTabsAndControls;
