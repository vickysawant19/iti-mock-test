import React, { useMemo } from "react";
import { ClipboardList, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const AttendanceHeader = ({
  selectedBatch,
  setSelectedBatch,
  batches,
  selectedMonth,
  handlePrevMonth,
  handleNextMonth,
  handleMonthChange,
  loading,
  batchStartDate,
  batchEndDate,
}) => {
  const loadingAttendance = loading.attendance;
  const loadingStats     = loading.stats;
  const loadingBatch     = loading.batch;
  const isLoading        = loadingAttendance || loadingStats;

  const now = new Date();
  const curYear  = getYear(now);
  const curMonth = getMonth(now); // 0-indexed

  // Batch constraints
  const minYear  = batchStartDate ? getYear(batchStartDate)  : curYear;
  const minMonth = batchStartDate ? getMonth(batchStartDate) : 0; // 0-indexed

  const maxYear  = batchEndDate ? getYear(batchEndDate)  : curYear;
  const maxMonth = batchEndDate ? getMonth(batchEndDate) : curMonth;

  const activeYear  = getYear(selectedMonth);
  const activeMonth = getMonth(selectedMonth); // 0-indexed

  // Years: batch start year → batch end year (or current year)
  const yearOptions = useMemo(() => {
    const yrs = [];
    for (let y = minYear; y <= Math.max(curYear, maxYear); y++) yrs.push(y);
    return yrs;
  }, [minYear, curYear, maxYear]);

  // Months: filter based on selected year
  const availableMonths = useMemo(() => {
    return MONTH_NAMES.map((label, index) => ({ label, index })).filter(({ index }) => {
      if (activeYear === minYear && index < minMonth) return false;
      if (activeYear === maxYear && index > maxMonth) return false;
      return true;
    });
  }, [activeYear, minYear, minMonth, maxYear, maxMonth]);

  // Navigate to a new Date — always clamp
  const navigateTo = (newDate) => {
    handleMonthChange({ target: { value: format(newDate, "yyyy-MM") } });
  };

  const onMonthSelect = (monthIndex) => {
    let d = setMonth(new Date(selectedMonth), monthIndex);
    // clamp min
    if (batchStartDate && d < batchStartDate) d = new Date(batchStartDate);
    // clamp max
    const maxDate = batchEndDate || now;
    if (d > maxDate) d = new Date(maxDate);
    
    navigateTo(d);
  };

  const onYearSelect = (year) => {
    let month = activeMonth;
    if (year === minYear && month < minMonth) month = minMonth;
    if (year === maxYear && month > maxMonth) month = maxMonth;
    let d = setYear(setMonth(new Date(selectedMonth), month), year);
    
    // clamp min
    if (batchStartDate && d < batchStartDate) d = new Date(batchStartDate);
    // clamp max
    const maxDate = batchEndDate || now;
    if (d > maxDate) d = new Date(maxDate);

    navigateTo(d);
  };

  const isAtMin = activeYear === minYear && activeMonth <= minMonth;
  const isAtMax = activeYear === maxYear  && activeMonth >= maxMonth;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/85 px-4 py-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">

        {/* ── Page Title ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-700 shadow-sm">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
              Attendance Register
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight hidden sm:block">
              {format(selectedMonth, "MMMM yyyy")}
            </p>
          </div>
        </div>

        {/* ── Divider (desktop) ── */}
        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700/80 flex-shrink-0" />

        {/* ── Controls Row ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">

          {/* Batch Selector */}
          <div className="relative flex-1 min-w-0">
            <select
              id="batch-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              disabled={loadingBatch}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.$id} value={batch.$id}>
                  {batch.BatchName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              {loadingBatch ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

          {/* ── Month / Year Navigator ── */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Prev month arrow */}
            <button
              onClick={handlePrevMonth}
              disabled={isLoading || isAtMin}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Month select */}
            <div className="relative">
              <select
                id="register-month-select"
                value={activeMonth}
                disabled={isLoading}
                onChange={(e) => onMonthSelect(Number(e.target.value))}
                className="pl-3 pr-7 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none font-semibold"
              >
                {availableMonths.map(({ label, index }) => (
                  <option key={label} value={index}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Year select */}
            <div className="relative">
              <select
                id="register-year-select"
                value={activeYear}
                disabled={isLoading}
                onChange={(e) => onYearSelect(Number(e.target.value))}
                className="pl-3 pr-7 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none font-semibold"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Loading spinner overlay */}
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500 flex-shrink-0" />
            )}

            {/* Next month arrow */}
            <button
              onClick={handleNextMonth}
              disabled={isLoading || isAtMax}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;
