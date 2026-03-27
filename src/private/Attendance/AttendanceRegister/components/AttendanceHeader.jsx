import React from "react";
import { ClipboardList, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

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
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">

        {/* ── Page Title ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-700 shadow-sm">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
              Attendance Register
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight hidden sm:block">
              {format(selectedMonth, "MMMM yyyy")}
            </p>
          </div>
        </div>

        {/* ── Divider (desktop) ── */}
        <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-600 flex-shrink-0" />

        {/* ── Controls Row ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">

          {/* Batch Selector */}
          <div className="relative flex-1 min-w-0">
            <select
              id="batch-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              disabled={loadingBatch}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.$id} value={batch.$id}>
                  {batch.BatchName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              {loadingBatch ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handlePrevMonth}
              disabled={loadingAttendance || loadingStats}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative">
              <input
                type="month"
                id="month-select"
                value={format(selectedMonth, "yyyy-MM")}
                onChange={handleMonthChange}
                disabled={loadingAttendance || loadingStats}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {(loadingAttendance || loadingStats) && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                </div>
              )}
            </div>

            <button
              onClick={handleNextMonth}
              disabled={loadingAttendance || loadingStats}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;
