import React, { useState } from "react";
import AttendanceTableHead from "./AttendanceTableHead";
import AttendanceTableBody from "./AttendanceTableBody";
import AttendanceTableFooter from "./AttendanceTableFooter";
import AttendanceTableSkeleton from "./AttendanceTableSkeleton";
import EmptyState from "./EmptyState";
import { useAttendanceMatrix } from "../hooks/useAttendanceMatrix";

const AttendanceTable = ({
  students,
  selectedMonth,
  holidays,
  attendanceMap,
  rawAttendanceMap,
  currentMonthlyStatsMap,
  calculatePreviousMonthsData,
  formatDate,
  getDaysInMonth,
  onMarkAttendance,
  onAttendanceStatusChange,
  updatingAttendance,
  isStudentUpdating,
  loading,
  selectedBatch,
  handleAddHoliday,
  handleRemoveHoliday,
  handleClearDayAttendance,
  batchStartDate,
  batchEndDate,
  onOpenStudentAttendanceModal,
  onOpenStudentProfile,
  columnVisibility,
  setColumnVisibility,
  compactView: compactViewProp,
  setCompactView: setCompactViewProp,
}) => {
  const [internalCompactView, setInternalCompactView] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024;
    }
    return false;
  });

  const compactView = compactViewProp !== undefined ? compactViewProp : internalCompactView;
  const setCompactView = setCompactViewProp || setInternalCompactView;
  const daysInMonth = getDaysInMonth(selectedMonth);
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Filter out days before the batch start date or after the batch end date
  const { firstValidDay, lastValidDay } = (() => {
    let start = 1;
    let end = daysInMonth;

    if (batchStartDate) {
      const sy = selectedMonth.getFullYear();
      const sm = selectedMonth.getMonth();
      const by = batchStartDate.getFullYear();
      const bm = batchStartDate.getMonth();
      // Only filter if viewing the exact batch start month
      if (sy === by && sm === bm) start = batchStartDate.getDate();
    }

    if (batchEndDate) {
      const sy = selectedMonth.getFullYear();
      const sm = selectedMonth.getMonth();
      const ey = batchEndDate.getFullYear();
      const em = batchEndDate.getMonth();
      // Only filter if viewing the exact batch end month
      if (sy === ey && sm === em) end = batchEndDate.getDate();
    }

    return { firstValidDay: start, lastValidDay: end };
  })();

  const monthDates = allDays.filter((d) => d >= firstValidDay && d <= lastValidDay);

  // Pre-compute matrix data once for both AttendanceTableBody and AttendanceTableFooter
  const matrixData = useAttendanceMatrix({
    students,
    monthDates,
    selectedMonth,
    holidays,
    attendanceMap,
    rawAttendanceMap,
    calculatePreviousMonthsData,
    formatDate,
  });

  // Dynamic Student Name Column Resizing
  const [customNameWidth, setCustomNameWidth] = useState(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const defaultNameWidth = compactView ? (isMobile ? 120 : 140) : (isMobile ? 140 : 180);
  const nameWidth = customNameWidth !== null ? customNameWidth : defaultNameWidth;

  const handleResizeNameWidth = (newW) => {
    setCustomNameWidth(Math.max(90, Math.min(450, newW)));
  };

  const handleResetNameWidth = () => {
    setCustomNameWidth(null);
  };

  const toggleGroup = (group) =>
    setColumnVisibility((prev) => ({ ...prev, [group]: !prev[group] }));

  // Loading states
  const loadingStudents = loading?.students;
  const loadingAttendance = loading?.attendance;
  const loadingStats = loading?.stats;

  // Background fetch state (when students exist)
  const isFetching = Boolean(loadingStudents || loadingAttendance || loadingStats);

  // Determine what's currently loading for the message
  const getLoadingMessage = () => {
    if (loadingStudents) return "Syncing Students";
    if (loadingAttendance) return "Loading Attendance";
    if (loadingStats) return "Updating Statistics";
    return "Updating";
  };

  // Show empty state when no batch is selected
  if (!selectedBatch) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <EmptyState message="Please select a batch to view attendance." />
      </div>
    );
  }

  // Show skeleton when loading students and no students present yet
  if (loadingStudents && (!students || students.length === 0)) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="attendance-scroll relative min-h-0 min-w-0 flex-1 overflow-auto border border-slate-300 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="sticky top-0 left-0 right-0 z-50 h-1 w-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 animate-pulse" />
          </div>
          <AttendanceTableSkeleton
            columnVisibility={columnVisibility}
            compactView={compactView}
            nameWidthProp={nameWidth}
            daysCount={monthDates.length || 30}
          />
        </div>
      </div>
    );
  }

  // Show empty state when not loading and no students
  if (!loadingStudents && (!students || students.length === 0)) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <EmptyState message="No students found in this batch." />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* ── Table Wrapper — single scroll container for BOTH axes so sticky freeze works ── */}
      <div
        className="attendance-scroll relative min-h-0 min-w-0 flex-1 overflow-auto border border-slate-300 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Subtle Top Loading Line */}
        {isFetching && (
          <div className="sticky top-0 left-0 right-0 z-50 h-1 w-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 animate-pulse" />
          </div>
        )}

        {/* Floating Non-blocking Status Pill */}
        {isFetching && (
          <div className="pointer-events-none absolute top-3 right-5 z-40 flex items-center gap-2 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <span>{getLoadingMessage()}...</span>
          </div>
        )}

        {students && students.length > 0 && (
          <div
            className={`transition-opacity duration-200 ${
              isFetching ? "opacity-90" : "opacity-100"
            }`}
          >
            <table className="min-w-full dark:bg-slate-900 text-xs border-separate border-spacing-0">
              <AttendanceTableHead
                monthDates={monthDates}
                selectedMonth={selectedMonth}
                formatDate={formatDate}
                onMarkAttendance={onMarkAttendance}
                loadingAttendance={loadingAttendance}
                holidays={holidays}
                attendanceMap={attendanceMap}
                handleAddHoliday={handleAddHoliday}
                handleRemoveHoliday={handleRemoveHoliday}
                handleClearDayAttendance={handleClearDayAttendance}
                columnVisibility={columnVisibility}
                compactView={compactView}
                nameWidthProp={nameWidth}
                onResizeNameWidth={handleResizeNameWidth}
                onResetNameWidth={handleResetNameWidth}
              />
              <AttendanceTableBody
                students={students}
                monthDates={monthDates}
                selectedMonth={selectedMonth}
                holidays={holidays}
                attendanceMap={attendanceMap}
                rawAttendanceMap={rawAttendanceMap}
                currentMonthlyStatsMap={currentMonthlyStatsMap}
                calculatePreviousMonthsData={calculatePreviousMonthsData}
                formatDate={formatDate}
                onAttendanceStatusChange={onAttendanceStatusChange}
                updatingAttendance={updatingAttendance}
                isStudentUpdating={isStudentUpdating}
                loadingAttendance={loadingAttendance}
                loadingStats={loadingStats}
                columnVisibility={columnVisibility}
                compactView={compactView}
                nameWidthProp={nameWidth}
                onOpenStudentAttendanceModal={onOpenStudentAttendanceModal}
                onOpenStudentProfile={onOpenStudentProfile}
                matrixData={matrixData}
                selectedBatch={selectedBatch}
              />
              <AttendanceTableFooter
                students={students}
                monthDates={monthDates}
                selectedMonth={selectedMonth}
                holidays={holidays}
                attendanceMap={attendanceMap}
                formatDate={formatDate}
                dailyColumnTotals={matrixData.dailyColumnTotals}
                columnVisibility={columnVisibility}
                compactView={compactView}
                nameWidthProp={nameWidth}
              />
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTable;
