import React from "react";

const AssignmentFilters = ({
  subjectData,
  handleSubjectChange,
  year,
  handleYearChange,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">🔍</span> Filters
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="transform hover:scale-[1.02] transition-transform">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={subjectData.selectedSubject?.$id || ""}
            onChange={handleSubjectChange}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-300"
          >
            <option value="">Select Subject</option>
            {subjectData.data.map((item) => (
              <option value={item.$id} key={item.$id}>
                {item.subjectName}
              </option>
            ))}
          </select>
        </div>

        <div className="transform hover:scale-[1.02] transition-transform">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Year
          </label>
          <select
            value={year.selectedYear || ""}
            onChange={handleYearChange}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-300"
          >
            <option value="">Select Year</option>
            {year.data.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AssignmentFilters;
