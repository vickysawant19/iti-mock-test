import React from "react";

const AttendanceTableHead = ({
  monthDates,
  selectedMonth,
  holidays,
  formatDate,
  onMarkAttendance,
}) => {
  return (
    <thead className="bg-linear-to-r from-indigo-600 to-indigo-700 text-white">
      <tr>
        <th className="py-3 px-4 border border-indigo-500 sticky left-0 bg-indigo-600 z-20 font-semibold text-left w-48 min-w-48 max-w-48">
          Student Name
        </th>
        <th className="py-3 px-4 border border-indigo-500 sticky left-48 bg-indigo-600 z-20 font-semibold text-left w-16 min-w-16 max-w-16">
          Action
        </th>
        {monthDates.map((date) => {
          const currentDate = new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth(),
            date
          );
          const day = formatDate(currentDate, "EEE");
          const fullDate = formatDate(currentDate, "yyyy-MM-dd");
          const isHoliday = holidays.has(fullDate);

          return (
            <th
              key={date}
              className={`py-3 px-2 border ${
                isHoliday ? "bg-red-600 border-red-500" : "border-indigo-500"
              } w-16 min-w-16 max-w-16`}
            >
              <div className={`text-center ${isHoliday ? "text-white" : ""}`}>
                <div className="font-bold">{date}</div>
                <div className="text-xs font-normal">{day}</div>
              </div>
            </th>
          );
        })}
        <th className="py-3 px-3 border border-indigo-500 bg-blue-700 font-semibold w-24 min-w-24 max-w-24">
          Working Days
        </th>
        <th className="py-3 px-3 border border-indigo-500 bg-blue-700 font-semibold w-24 min-w-24 max-w-24">
          Present
        </th>
        <th className="py-3 px-3 border border-indigo-500 bg-blue-700 font-semibold w-24 min-w-24 max-w-24">
          Absent
        </th>
        <th className="py-3 px-3 border border-indigo-500 bg-blue-700 font-semibold w-24 min-w-24 max-w-24">
          %
        </th>
        <th className="py-3 px-3 border border-indigo-500 bg-green-700 font-semibold w-24 min-w-24 max-w-24">
          Prev Working
        </th>
        <th className="py-3 px-3 border border-indigo-500 bg-green-700 font-semibold w-24 min-w-24 max-w-24">
          Prev Present
        </th>
        <th className="py-3 px-3 border border-indigo-500 bg-green-700 font-semibold w-24 min-w-24 max-w-24">
          Prev Absent
        </th>
        <th className="py-3 px-3 border border-indigo-500 bg-green-700 font-semibold w-24 min-w-24 max-w-24">
          Total %
        </th>
      </tr>
      <tr className="bg-gray-100">
        <td className="py-2 px-4 border font-bold border-gray-300 sticky left-0 bg-gray-100 z-10 text-black">
          Mark Attendance
        </td>
        <td className="py-2 px-4 border font-bold border-gray-300 sticky left-48 bg-gray-100 z-10 text-black"></td>
        {monthDates.map((date) => {
          const fullDate = formatDate(
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date
            ),
            "yyyy-MM-dd"
          );
          const isHoliday = holidays.has(fullDate);
          return (
            <td
              key={`mark-${date}`}
              className={`py-2 px-2 border border-gray-300 text-center ${
                isHoliday ? "bg-red-100 " : ""
              }`}
            >
              {!isHoliday && (
                <button
                  onClick={() => onMarkAttendance(fullDate)}
                  className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
                >
                  Mark
                </button>
              )}
            </td>
          );
        })}
        <td colSpan="8" className="py-2 px-3 border border-gray-300"></td>
      </tr>
    </thead>
  );
};

export default AttendanceTableHead;
