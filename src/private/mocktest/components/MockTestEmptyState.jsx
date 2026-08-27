import React from "react";
import { FileText, RotateCcw } from "lucide-react";

export function MockTestEmptyState({ isFiltered, handleResetFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
        <FileText className="w-8 h-8" />
      </div>
      <div className="max-w-md space-y-1">
        <p className="text-base font-bold text-slate-800 dark:text-slate-100">
          {isFiltered ? "No matching mock tests found" : "No mock tests generated yet"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {isFiltered
            ? "Try changing your search query, status filters, or sorting options."
            : "Generate a new mock test paper or enter a Paper ID to get started."}
        </p>
        {isFiltered && (
          <div className="pt-2">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MockTestEmptyState;
