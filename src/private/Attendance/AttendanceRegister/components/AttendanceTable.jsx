import React, { useState } from "react";
import { Loader2, LayoutList, LayoutGrid } from "lucide-react";
import AttendanceTableHead from "./AttendanceTableHead";
import AttendanceTableBody from "./AttendanceTableBody";
import AttendanceTableFooter from "./AttendanceTableFooter";
import EmptyState from "./EmptyState";
import { DEFAULT_VISIBILITY, COLUMN_GROUP_LABELS } from "./ColumnGroupConfig";

const AttendanceTable = ({
  students,
  selectedMonth,
  holidays,
  attendanceMap,
  calculatePreviousMonthsData,
  formatDate,
  getDaysInMonth,
  onMarkAttendance,
  setEditStudentId,
  editStudentId,
  onAttendanceStatusChange,
  updatingAttendance,
  isStudentUpdating,
  loading,
  selectedBatch,
  handleAddHoliday,
  handleRemoveHoliday,
  batchStartDate,
}) => {
  const daysInMonth = getDaysInMonth(selectedMonth);
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Filter out days before the batch start date
  const firstValidDay = (() => {
    if (!batchStartDate) return 1;
    const sy = selectedMonth.getFullYear();
    const sm = selectedMonth.getMonth();
    const by = batchStartDate.getFullYear();
    const bm = batchStartDate.getMonth();
    // Only filter if viewing the exact batch start month
    if (sy === by && sm === bm) return batchStartDate.getDate();
    return 1;
  })();
  const monthDates = firstValidDay > 1
    ? allDays.filter((d) => d >= firstValidDay)
    : allDays;

  // Column group visibility state
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_VISIBILITY);
  const [compactView, setCompactView] = useState(false);

  const toggleGroup = (group) =>
    setColumnVisibility((prev) => ({ ...prev, [group]: !prev[group] }));

  // Loading states
  const loadingStudents = loading.students;
  const loadingAttendance = loading.attendance;
  const loadingStats = loading.stats;

  // Overall loading state for table data
  const isTableDataLoading = loadingStudents;

  // Determine what's currently loading for the message
  const getLoadingMessage = () => {
    if (loadingStudents) return "Loading Students";
    if (loadingAttendance) return "Loading Attendance";
    if (loadingStats) return "Loading Statistics";
    return "Loading";
  };

  // Show empty state when no batch is selected
  if (!selectedBatch) {
    return (
      <div className="p-8">
        <EmptyState message="Please select a batch to view attendance." />
      </div>
    );
  }

  // Show empty state when not loading and no students
  if (!loadingStudents && students.length === 0) {
    return (
      <div className="p-8">
        <EmptyState message="No students found in this batch." />
      </div>
    );
  }

  return (
    <div className={isTableDataLoading ? "min-h-screen" : ""}>
      {/* ── Ribbon Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-1">
          Show:
        </span>
        {Object.entries(COLUMN_GROUP_LABELS).map(([group, label]) => (
          <button
            key={group}
            onClick={() => toggleGroup(group)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
              columnVisibility[group]
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1 ml-4 " />
        <button
          onClick={() => setCompactView((v) => !v)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 flex items-center gap-2 ${
            compactView
              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
              : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-amber-400"
          }`}
        >
          {compactView ? (
            <>
              <LayoutList className="h-3.5 w-3.5" /> Compact
            </>
          ) : (
            <>
              <LayoutGrid className="h-3.5 w-3.5" /> Compact
            </>
          )}
        </button>
      </div>

      {/* ── Table Wrapper ── */}
      <div
        className={`relative overflow-x-auto shadow-lg border border-gray-300 dark:border-gray-700 ${
          isTableDataLoading ? "min-h-screen" : ""
        }`}
      >
        {/* Loading Overlay - only shows when loading table data */}
        {isTableDataLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg h-screen min-h-80">
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-gray-800 px-8 py-6 rounded-xl shadow-2xl border-2 border-indigo-200 dark:border-indigo-700">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
              <div className="text-center">
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  {getLoadingMessage()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(selectedMonth, "MMMM yyyy")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table Container */}
        {students.length > 0 && (
          <div
            className={`max-h-[80vh] overflow-y-auto transition-opacity duration-300 ${
              isTableDataLoading
                ? "opacity-30 pointer-events-none"
                : "opacity-100"
            }`}
          >
            <table className="min-w-full dark:bg-gray-800 text-xs border-separate border-spacing-0">
              <AttendanceTableHead
                monthDates={monthDates}
                selectedMonth={selectedMonth}
                formatDate={formatDate}
                onMarkAttendance={onMarkAttendance}
                loadingAttendance={loadingAttendance}
                holidays={holidays}
                handleAddHoliday={handleAddHoliday}
                handleRemoveHoliday={handleRemoveHoliday}
                columnVisibility={columnVisibility}
                compactView={compactView}
              />
              <AttendanceTableBody
                students={students}
                monthDates={monthDates}
                selectedMonth={selectedMonth}
                holidays={holidays}
                attendanceMap={attendanceMap}
                calculatePreviousMonthsData={calculatePreviousMonthsData}
                formatDate={formatDate}
                getDaysInMonth={getDaysInMonth}
                setEditStudentId={setEditStudentId}
                editStudentId={editStudentId}
                onAttendanceStatusChange={onAttendanceStatusChange}
                updatingAttendance={updatingAttendance}
                isStudentUpdating={isStudentUpdating}
                loadingAttendance={loadingAttendance}
                loadingStats={loadingStats}
                columnVisibility={columnVisibility}
                compactView={compactView}
              />
              <AttendanceTableFooter
                students={students}
                monthDates={monthDates}
                selectedMonth={selectedMonth}
                holidays={holidays}
                attendanceMap={attendanceMap}
                formatDate={formatDate}
                columnVisibility={columnVisibility}
              />
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTable;
