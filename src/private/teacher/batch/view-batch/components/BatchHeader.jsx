import React from "react";
import { BookOpen, TrendingUp, Calendar } from "lucide-react";
import TabNavigation from "./TabNavigation";

const BatchHeader = ({
  selectedBatchData,
  tradeData,
  studentCount,
  tabs,
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Batch Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-2xl shrink-0">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                {selectedBatchData?.BatchName || "Batch Details"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {tradeData?.tradeName && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 px-2.5 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {tradeData.tradeName}
                  </span>
                )}
                {selectedBatchData?.Year && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 px-2.5 py-0.5 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {selectedBatchData.Year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Student Count */}
          {selectedBatchData && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Enrolled</p>
                <p className="text-xl font-black text-blue-700 dark:text-blue-300 leading-none">{studentCount || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {selectedBatchData && (
          <div className="mt-4">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchHeader;
