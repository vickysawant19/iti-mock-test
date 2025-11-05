import React from "react";

const PaginationControls = ({ pagination, handlePageChange, totalPages }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1 || pagination.isLoading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg disabled:transform-none"
          >
            ← Previous
          </button>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={
              pagination.currentPage >= totalPages || pagination.isLoading
            }
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg disabled:transform-none"
          >
            Next →
          </button>
        </div>

        <div className="text-center sm:text-right">
          <p className="text-base font-bold text-gray-900">
            Page {pagination.currentPage} of {totalPages}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {pagination.totalItems} total modules
          </p>
        </div>

        {pagination.isLoading && (
          <div className="flex items-center gap-2 text-indigo-600">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
            <span className="text-sm font-semibold">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaginationControls;
