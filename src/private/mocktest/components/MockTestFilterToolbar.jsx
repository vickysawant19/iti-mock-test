import React from "react";
import { Search, Filter, X, RotateCcw, CheckCircle2, Clock, Layers } from "lucide-react";
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-xs space-y-3">
      {/* ── Top Row: Search Box + Quick Stats ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by paper title, trade, or Paper ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Total Count Chip */}
        {!loading && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs font-black text-indigo-700 dark:text-indigo-300 shrink-0">
            <Layers className="w-3.5 h-3.5" />
            <span>{totalCount} Total Tests</span>
          </div>
        )}
      </div>

      {/* ── Bottom Row: Filters (Status Pills + Type + Sort + Reset) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => handleStatusFilterChange("all")}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange("submitted")}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === "submitted"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs dark:bg-emerald-600 dark:border-emerald-500"
                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Submitted</span>
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange("pending")}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white border-amber-600 shadow-2xs dark:bg-amber-600 dark:border-amber-500"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </button>
        </div>

        {/* Dropdowns & Reset Action */}
        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          {/* Paper Type Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Type:</span>
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="border-0 shadow-none h-5 px-1 text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-semibold">All Types</SelectItem>
                <SelectItem value="original" className="text-xs font-semibold">Original Papers</SelectItem>
                <SelectItem value="attempt" className="text-xs font-semibold">Attempted Copies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Sort:</span>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="border-0 shadow-none h-5 px-1 w-[115px] font-bold text-xs text-slate-800 dark:text-slate-100 focus:ring-0 focus:ring-offset-0 bg-transparent">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-semibold text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MockTestFilterToolbar;
