import React from "react";
import { ClipLoader } from "react-spinners";

const BatchSelector = ({
  selectedBatch,
  setSelectedBatch,
  batches,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center">
      <div className="flex-grow">
        <label
          htmlFor="batch-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select Batch
        </label>
        <div className="relative">
          <select
            id="batch-select"
            className="w-full md:w-64 p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
        <p className="text-sm text-gray-500">
          {batches.length} {batches.length === 1 ? "batch" : "batches"}{" "}
          available
        </p>
      </div>
    </div>
  );
};

export default BatchSelector;
