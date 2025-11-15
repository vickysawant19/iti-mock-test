import React from "react";
import { getDaysInMonth } from "date-fns";
import { Loader2 } from "lucide-react";
import AttendanceTableHead from "./AttendanceTableHead";
import AttendanceTableBody from "./AttendanceTableBody";
import AttendanceTableFooter from "./AttendanceTableFooter";

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
  loadingAttendance = false,
  loadingStats = false,
}) => {
  const daysInMonth = getDaysInMonth(selectedMonth);
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="relative overflow-x-auto shadow-lg rounded-lg border border-gray-300 dark:border-gray-700">
      {/* Loading Overlay */}
      {loadingAttendance && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3 bg-white dark:bg-gray-800 px-8 py-6 rounded-xl shadow-2xl border-2 border-indigo-200 dark:border-indigo-700">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Loading Attendance
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatDate(selectedMonth, "MMMM yyyy")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Container with opacity transition */}
      <div 
        className={`max-h-[80vh] overflow-y-auto transition-opacity duration-300 ${
          loadingAttendance ? 'opacity-30 pointer-events-none' : 'opacity-100'
        }`}
      >
        <table className="min-w-full bg-white dark:bg-gray-800 text-xs border-collapse">
          <AttendanceTableHead
            monthDates={monthDates}
            selectedMonth={selectedMonth}
            holidays={holidays}
            formatDate={formatDate}
            onMarkAttendance={onMarkAttendance}
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
          />
          <AttendanceTableFooter
            students={students}
            monthDates={monthDates}
            selectedMonth={selectedMonth}
            holidays={holidays}
            attendanceMap={attendanceMap}
            formatDate={formatDate}
          />
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;