import React from "react";
import { ClipLoader } from "react-spinners";

const BatchSelector = ({
  selectedBatch,
  setSelectedBatch,
  batches,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-xs p-4 mb-6 flex items-center dark:bg-gray-800 dark:border dark:border-gray-700">
      <div className="grow">
        <label
          htmlFor="batch-select"
          className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
        >
          Select Batch
        </label>
        <div className="relative">
          <select
            id="batch-select"
            className="w-full md:w-64 p-3 rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            disabled={isLoading || batches.length === 0}
          >
            {batches.length === 0 ? (
              <option value="">No batches available</option>
            ) : (
              batches.map((item) => (
                <option key={item.$id} value={item.$id}>
                  {item.BatchName}
                </option>
              ))
            )}
          </select>
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <ClipLoader size={20} color="#2563eb" loading={true} />
            </div>
          )}
        </div>
      </div>
      <div className="hidden md:block ml-4 text-right">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {batches.length} {batches.length === 1 ? "batch" : "batches"}{" "}
          available
        </p>
      </div>
    </div>
  );
};

export default BatchSelector;
