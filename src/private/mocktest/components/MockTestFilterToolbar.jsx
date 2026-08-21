import React from "react";
import { Search, Filter, X, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MockTestFilterToolbar({
  totalCount,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  handleStatusFilterChange,
  typeFilter,
  handleTypeFilterChange,
  sortBy,
  handleSortChange,
  handleResetFilters,
  isFiltered,
  sortOptions,
}) {
  return (
    <div className="flex flex-col gap-3 mb-6 px-1">
      {/* ── Search & Filter Controls Toolbar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xs">
        {/* Search Field & Count Badge */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, trade, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!loading && (
            <span className="text-[0.75rem] font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-400 px-3 py-1.5 rounded-xl whitespace-nowrap">
              {totalCount} {totalCount === 1 ? "Test" : "Tests"}
            </span>
          )}
        </div>

        {/* Filter Controls (Status, Type, Sort) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 mr-1">
            <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Filter:</span>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-900/60 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-gray-700">
            <label className="text-[0.75rem] font-semibold text-slate-500 dark:text-slate-400">Status:</label>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="border-0 shadow-none h-5 px-1 text-xs font-semibold text-slate-900 dark:text-white bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">All Statuses</SelectItem>
                <SelectItem value="submitted" className="text-xs font-medium">Submitted Only</SelectItem>
                <SelectItem value="pending" className="text-xs font-medium">Pending Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Paper Type Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-900/60 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-gray-700">
            <label className="text-[0.75rem] font-semibold text-slate-500 dark:text-slate-400">Type:</label>
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="border-0 shadow-none h-5 px-1 text-xs font-semibold text-slate-900 dark:text-white bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">All Types</SelectItem>
                <SelectItem value="original" className="text-xs font-medium">Original Papers</SelectItem>
                <SelectItem value="attempt" className="text-xs font-medium">Attempted Copies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-900/60 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-gray-700">
            <label className="text-[0.75rem] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Sort:</label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="border-0 shadow-none h-5 px-1 w-[125px] font-semibold text-xs text-slate-900 dark:text-white focus:ring-0 focus:ring-offset-0 bg-transparent">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-medium text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[0.75rem] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MockTestFilterToolbar;
