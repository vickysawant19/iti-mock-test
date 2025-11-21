import React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react";

const AttendanceHeader = ({
  selectedBatch,
  setSelectedBatch,

  batches,
  selectedMonth,
  handlePrevMonth,
  handleNextMonth,
  handleMonthChange,
  loading,
}) => {
  const loadingAttendance = loading.attendance;
  const loadingStats = loading.stats;
  const loadingBatch = loading.batch;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg p-2 pb-6 ">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        {/* Batch Selection */}
        <div className="flex-1">
          <label
            htmlFor="batch-select"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            Select Batch
          </label>
          <div className="relative">
            <select
              id="batch-select"
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
              }}
              disabled={loadingBatch}
              className="w-full px-4 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.$id} value={batch.$id}>
                  {batch.BatchName}
                </option>
              ))}
            </select>
            {loadingBatch && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            )}
          </div>
        </div>

        {/* Month Selection */}
        <div className="flex-1">
          <label
            htmlFor="month-select"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            Select Month
          </label>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              disabled={loadingAttendance || loadingStats}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:hover:shadow-md"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="relative flex-1">
              <input
                type="month"
                id="month-select"
                value={format(selectedMonth, "yyyy-MM")}
                onChange={handleMonthChange}
                disabled={loadingAttendance || loadingStats}
                className="w-full px-4 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {(loadingAttendance || loadingStats) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
              )}
            </div>

            <button
              onClick={handleNextMonth}
              disabled={loadingAttendance || loadingStats}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:hover:shadow-md"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;
