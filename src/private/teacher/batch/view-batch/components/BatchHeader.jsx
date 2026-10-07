import React from "react";
import { BookOpen, TrendingUp, Calendar, Clock } from "lucide-react";
import TabNavigation from "./TabNavigation";
import { getCurrentSession, formatSessionLabel } from "../../util/batchSessionUtil";

const BatchHeader = ({
  selectedBatchData,
  tradeData,
  studentCount,
  tabs,
  activeTab,
  setActiveTab,
}) => {
  const currentSession = getCurrentSession(selectedBatchData);
  const sessionLabel = currentSession ? formatSessionLabel(currentSession) : "";

  return (
    <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          {/* Left: Batch Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 rounded-lg bg-indigo-50 p-2.5 dark:bg-indigo-500/10">
              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-white sm:text-xl">
                {selectedBatchData?.BatchName || "Batch Details"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {tradeData?.tradeName && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <TrendingUp className="w-3 h-3" />
                    {tradeData.tradeName}
                  </span>
                )}
                {sessionLabel ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <Clock className="w-3 h-3" />
                    {sessionLabel}
                  </span>
                ) : selectedBatchData?.Year ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Calendar className="w-3 h-3" />
                    {selectedBatchData.Year}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right: Student Count */}
          {selectedBatchData && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Enrolled</p>
                <p className="text-lg font-semibold leading-tight tabular-nums text-slate-900 dark:text-white">{studentCount || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {selectedBatchData && (
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
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
