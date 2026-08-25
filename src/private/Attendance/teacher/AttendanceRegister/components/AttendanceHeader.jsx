import React, { useMemo } from "react";
import { ClipboardList, Loader2, ChevronLeft, ChevronRight, ChevronDown, ShieldCheck, LayoutList, LayoutGrid } from "lucide-react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { DEFAULT_VISIBILITY, COLUMN_GROUP_LABELS } from "./ColumnGroupConfig";

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const AttendanceHeader = ({
  selectedBatch,
  setSelectedBatch,
  batches = [],
  selectedMonth,
  handlePrevMonth,
  handleNextMonth,
  handleMonthChange,
  loading = {},
  batchStartDate,
  batchEndDate,
  onVerifyStats,
  isVerifyingStats = false,
  columnVisibility = DEFAULT_VISIBILITY,
  setColumnVisibility,
  compactView = false,
  setCompactView,
}) => {
  const loadingAttendance = loading.attendance;
  const loadingStats     = loading.stats;
  const loadingBatch     = loading.batch;
  const isLoading        = loadingAttendance || loadingStats;

  const now = new Date();
  const curYear  = getYear(now);
  const curMonth = getMonth(now);

  const minYear  = batchStartDate ? getYear(batchStartDate)  : curYear;
  const minMonth = batchStartDate ? getMonth(batchStartDate) : 0;

  const maxYear  = batchEndDate ? getYear(batchEndDate)  : curYear;
  const maxMonth = batchEndDate ? getMonth(batchEndDate) : curMonth;

  const activeYear  = getYear(selectedMonth);
  const activeMonth = getMonth(selectedMonth);

  const yearOptions = useMemo(() => {
    const yrs = [];
    for (let y = minYear; y <= Math.max(curYear, maxYear); y++) yrs.push(y);
    return yrs;
  }, [minYear, curYear, maxYear]);

  const availableMonths = useMemo(() => {
    return MONTH_NAMES.map((label, index) => ({ label, index })).filter(({ index }) => {
      if (activeYear === minYear && index < minMonth) return false;
      if (activeYear === maxYear && index > maxMonth) return false;
      return true;
    });
  }, [activeYear, minYear, minMonth, maxYear, maxMonth]);

  const navigateTo = (newDate) => {
    handleMonthChange({ target: { value: format(newDate, "yyyy-MM") } });
  };

  const onMonthSelect = (monthIndex) => {
    let d = setMonth(new Date(selectedMonth), monthIndex);
    if (batchStartDate && d < batchStartDate) d = new Date(batchStartDate);
    const maxDate = batchEndDate || now;
    if (d > maxDate) d = new Date(maxDate);
    navigateTo(d);
  };

  const onYearSelect = (year) => {
    let month = activeMonth;
    if (year === minYear && month < minMonth) month = minMonth;
    if (year === maxYear && month > maxMonth) month = maxMonth;
    let d = setYear(setMonth(new Date(selectedMonth), month), year);
    if (batchStartDate && d < batchStartDate) d = new Date(batchStartDate);
    const maxDate = batchEndDate || now;
    if (d > maxDate) d = new Date(maxDate);
    navigateTo(d);
  };

  const isAtMin = activeYear === minYear && activeMonth <= minMonth;
  const isAtMax = activeYear === maxYear  && activeMonth >= maxMonth;

  const toggleGroup = (group) => {
    if (setColumnVisibility) {
      setColumnVisibility((prev) => ({ ...prev, [group]: !prev[group] }));
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-2xl p-2.5 sm:p-3 text-white shadow-md border border-blue-400/30 dark:border-indigo-500/20 mb-2 mx-1.5 sm:mx-3 mt-1.5">
      {/* Ambient background glow orbs */}
      <div className="absolute top-[-70px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-30px] w-[160px] h-[160px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-2">
        {/* Top Controls Container (Responsive Flex Stack) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          
          {/* Header Title + Mobile Verify Stats Button */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <ClipboardList className="h-4 w-4 text-white/90" />
              <span className="font-extrabold text-xs sm:text-sm tracking-tight whitespace-nowrap">
                Attendance Register
              </span>
            </div>

            {/* Mobile Verify Stats Button */}
            {typeof onVerifyStats === "function" && (
              <button
                type="button"
                onClick={onVerifyStats}
                disabled={isLoading || isVerifyingStats || !selectedBatch}
                className="sm:hidden px-2.5 py-1 text-[11px] font-black bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 rounded-lg transition-all flex items-center gap-1 shadow-xs disabled:opacity-40 cursor-pointer shrink-0 border border-amber-300/60"
                title="Audit and verify monthly attendance statistics"
              >
                {isVerifyingStats ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-amber-950" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-950" />
                    <span>Verify Stats</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Batch Selector & Month Navigator Stack */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto flex-1 min-w-0 sm:justify-end">
            {/* Batch Selector */}
            <div className="relative w-full sm:w-auto sm:min-w-[180px] sm:max-w-[280px]">
              <select
                id="batch-select"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={loadingBatch}
                className="w-full px-2.5 py-1.5 text-xs font-bold bg-white/20 dark:bg-slate-900/80 backdrop-blur-md text-white border border-white/30 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300 transition-all disabled:opacity-50 appearance-none pr-7 cursor-pointer truncate"
              >
                <option value="" className="text-slate-900 dark:text-slate-100">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch.$id} value={batch.$id} className="text-slate-900 dark:text-slate-100">
                    {batch.BatchName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80">
                {loadingBatch ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-white/90" />
                )}
              </div>
            </div>

            {/* Month & Year Navigator */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto shrink-0">
              <div className="flex items-center gap-0.5 bg-black/20 dark:bg-slate-900/70 backdrop-blur-md p-0.5 rounded-lg border border-white/25 dark:border-slate-800 flex-1 sm:flex-none justify-between sm:justify-start">
                <button
                  onClick={handlePrevMonth}
                  disabled={isLoading || isAtMin}
                  className="p-1 rounded-md bg-white/20 hover:bg-white/30 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all disabled:opacity-30 cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center">
                  {/* Month Select */}
                  <div className="relative">
                    <select
                      id="register-month-select"
                      value={activeMonth}
                      disabled={isLoading}
                      onChange={(e) => onMonthSelect(Number(e.target.value))}
                      className="bg-transparent text-white font-extrabold text-xs px-1.5 py-0.5 focus:outline-none cursor-pointer appearance-none pr-4"
                    >
                      {availableMonths.map(({ label, index }) => (
                        <option key={label} value={index} className="text-slate-900 dark:text-slate-100">
                          {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-white/70" />
                  </div>

                  {/* Year Select */}
                  <div className="relative">
                    <select
                      id="register-year-select"
                      value={activeYear}
                      disabled={isLoading}
                      onChange={(e) => onYearSelect(Number(e.target.value))}
                      className="bg-transparent text-white font-extrabold text-xs px-1 py-0.5 focus:outline-none cursor-pointer appearance-none pr-4"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y} className="text-slate-900 dark:text-slate-100">
                          {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-white/70" />
                  </div>
                </div>

                {isLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white/90 flex-shrink-0 mx-0.5" />
                )}

                <button
                  onClick={handleNextMonth}
                  disabled={isLoading || isAtMax}
                  className="p-1 rounded-md bg-white/20 hover:bg-white/30 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all disabled:opacity-30 cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Desktop Verify Stats Button */}
              {typeof onVerifyStats === "function" && (
                <button
                  type="button"
                  onClick={onVerifyStats}
                  disabled={isLoading || isVerifyingStats || !selectedBatch}
                  className="hidden sm:flex px-2.5 py-1 text-[11px] font-black bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 rounded-lg transition-all items-center gap-1 shadow-xs disabled:opacity-40 cursor-pointer shrink-0 border border-amber-300/60"
                  title="Audit and verify monthly attendance statistics"
                >
                  {isVerifyingStats ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-amber-950" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-950" />
                      <span>Verify Stats</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Integrated Controls Strip */}
        <div className="pt-2 border-t border-white/20 dark:border-white/10 flex flex-wrap items-center justify-between gap-1.5 bg-black/15 dark:bg-slate-900/50 backdrop-blur-md rounded-xl p-1.5 px-2.5 border border-white/15 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white/80 uppercase tracking-wider text-[10px] mr-0.5">
              Show:
            </span>
            {Object.entries(COLUMN_GROUP_LABELS).map(([group, label]) => (
              <button
                key={group}
                onClick={() => toggleGroup(group)}
                className={`px-2.5 py-0.5 font-extrabold rounded-lg border transition-all cursor-pointer text-[11px] ${
                  columnVisibility && columnVisibility[group]
                    ? "bg-white text-indigo-700 border-white shadow-2xs dark:bg-indigo-500 dark:text-white dark:border-indigo-400"
                    : "bg-white/10 dark:bg-slate-800/80 text-white/80 border-white/20 dark:border-slate-700 hover:bg-white/20 dark:hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCompactView && setCompactView((v) => !v)}
            className={`px-2.5 py-0.5 font-extrabold rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
              compactView
                ? "bg-amber-400 text-amber-950 border-amber-300 shadow-2xs"
                : "bg-white/15 text-white border-white/25 hover:bg-white/25"
            }`}
          >
            {compactView ? (
              <>
                <LayoutList className="h-3 w-3" /> Compact
              </>
            ) : (
              <>
                <LayoutGrid className="h-3 w-3" /> Compact
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;
