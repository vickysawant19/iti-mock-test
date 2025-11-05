import React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const AttendanceHeader = ({
  selectedBatch,
  setSelectedBatch,
  batches,
  selectedMonth,
  handlePrevMonth,
  handleNextMonth,
  handleMonthChange,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        <div className="flex-1">
          <label
            htmlFor="batch-select"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Select Batch
          </label>
          <select
            id="batch-select"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-4 py-2.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {batches.map((batch) => (
              <option key={batch.$id} value={batch.$id}>
                {batch.BatchName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label
            htmlFor="month-select"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Select Month
          </label>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
              title="Previous Month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <input
              type="month"
              id="month-select"
              value={format(selectedMonth, "yyyy-MM")}
              onChange={handleMonthChange}
              className="flex-1 px-4 py-2.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleNextMonth}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
              title="Next Month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold text-lg">P</span>
            <span className="text-gray-700">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-lg">A</span>
            <span className="text-gray-700">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-200 border border-red-400 rounded"></div>
            <span className="text-gray-700">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">-</span>
            <span className="text-gray-700">No Record</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;
