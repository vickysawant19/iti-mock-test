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
}) => {
  const daysInMonth = getDaysInMonth(selectedMonth);
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-300">
      <table className="min-w-full bg-white text-xs border-collapse">
        <AttendanceTableHead
          monthDates={monthDates}
          selectedMonth={selectedMonth}
          holidays={holidays}
          formatDate={formatDate}
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
  );
};

export default AttendanceTable;
