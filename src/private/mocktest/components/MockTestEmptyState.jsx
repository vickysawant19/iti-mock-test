import React from "react";
import { FileText } from "lucide-react";

export function MockTestEmptyState({ isFiltered, handleResetFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          {isFiltered ? "No matching mock tests" : "No mock tests yet"}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {isFiltered
            ? "Try resetting filters or search query."
            : "Generate a mock test to see it appear here."}
        </p>
        {isFiltered && (
          <button
            onClick={handleResetFilters}
            className="mt-3 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

export default MockTestEmptyState;
