import React from "react";
import { getDaysInMonth } from "date-fns";
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
  onAttendanceStatusChange, // New prop
  updatingAttendance, // New prop
  isStudentUpdating, // New prop
}) => {
  const daysInMonth = getDaysInMonth(selectedMonth);
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="relative overflow-x-auto shadow-lg rounded-lg border border-gray-300">
      <div className="max-h-[80vh] overflow-y-auto">
        <table className="min-w-full bg-white text-xs border-collapse">
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
            onAttendanceStatusChange={onAttendanceStatusChange} // Pass new prop
            updatingAttendance={updatingAttendance} // Pass new prop
            isStudentUpdating={isStudentUpdating} // Pass new prop
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
