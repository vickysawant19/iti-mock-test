import React from "react";

const AttendanceTableBody = ({
  students,
  monthDates,
  selectedMonth,
  holidays,
  attendanceMap,
  calculatePreviousMonthsData,
  formatDate,
  getDaysInMonth,
}) => {
  return (
    <tbody className="divide-y divide-gray-200">
      {students.map((student, idx) => {
        const studentRecords = attendanceMap.get(student.userId) || new Map();
        const prevMonthData = calculatePreviousMonthsData.get(
          student.userId
        ) || {
          workingDays: 0,
          presentDays: 0,
          absentDays: 0,
        };

        let presentDays = 0;
        let absentDays = 0;
        let workingDays = 0;

        monthDates.forEach((date) => {
          const fullDate = formatDate(
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              date
            ),
            "yyyy-MM-dd"
          );
          if (!holidays.has(fullDate)) {
            workingDays++;
            const status = studentRecords.get(fullDate);
            if (status === "Present") presentDays++;
            else if (status === "Absent") absentDays++;
          }
        });

        const percentage =
          workingDays > 0 ? ((presentDays / workingDays) * 100).toFixed(1) : 0;

        // Calculate total percentage including previous months
        const totalWorkingDays = prevMonthData.workingDays + workingDays;
        const totalPresentDays = prevMonthData.presentDays + presentDays;
        const totalPercentage =
          totalWorkingDays > 0
            ? ((totalPresentDays / totalWorkingDays) * 100).toFixed(1)
            : 0;

        return (
          <tr
            key={student.userId}
            className={`hover:bg-indigo-50 transition-colors ${
              idx % 2 === 0 ? "bg-gray-50" : "bg-white"
            }`}
          >
            <td className="py-3 px-4 border border-gray-300 sticky left-0 bg-inherit z-10 font-medium text-gray-900 w-48 min-w-48 max-w-48">
              <div className="flex flex-col">
                <span className="font-semibold">{student.userName}</span>
                <span className="text-xs text-gray-500">
                  ID: {student.studentId}
                </span>
              </div>
            </td>
            {monthDates.map((date) => {
              const fullDate = formatDate(
                new Date(
                  selectedMonth.getFullYear(),
                  selectedMonth.getMonth(),
                  date
                ),
                "yyyy-MM-dd"
              );
              const status = studentRecords.get(fullDate);
              const isHoliday = holidays.has(fullDate);
              const holidayData = holidays.get(fullDate);

              if (isHoliday) {
                if (idx === 0) {
                  return (
                    <td
                      key={date}
                      rowSpan={students.length + 3}
                      className="py-3 px-2 border border-gray-300 text-center relative bg-red-100 w-12 min-w-12 max-w-12"
                    >
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <div
                          className="whitespace-nowrap text-[10px] font-semibold text-red-700"
                          style={{
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                            transform: "rotate(180deg)",
                          }}
                        >
                          {holidayData?.holidayText || "Holiday"}
                        </div>
                      </div>
                    </td>
                  );
                }
                return null;
              }

              return (
                <td
                  key={date}
                  className="py-3 px-2 border border-gray-300 text-center w-16 min-w-16 max-w-16"
                >
                  {status ? (
                    status === "Present" ? (
                      <span className="text-green-600 font-bold text-sm">
                        P
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold text-sm">A</span>
                    )
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
              );
            })}
            <td className="py-3 px-3 border border-gray-300 text-center bg-blue-50 font-semibold w-24 min-w-24 max-w-24">
              {workingDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 text-center bg-blue-50 text-green-600 font-semibold w-24 min-w-24 max-w-24">
              {presentDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 text-center bg-blue-50 text-red-600 font-semibold w-24 min-w-24 max-w-24">
              {absentDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 text-center bg-blue-50 font-bold w-24 min-w-24 max-w-24">
              <span
                className={`${
                  percentage >= 75
                    ? "text-green-600"
                    : percentage >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {percentage}%
              </span>
            </td>
            <td className="py-3 px-3 border border-gray-300 text-center bg-green-50 font-semibold w-24 min-w-24 max-w-24">
              {prevMonthData.workingDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 text-center bg-green-50 text-green-600 font-semibold w-24 min-w-24 max-w-24">
              {prevMonthData.presentDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 text-center bg-green-50 text-red-600 font-semibold w-24 min-w-24 max-w-24">
              {prevMonthData.absentDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 text-center bg-green-50 font-bold w-24 min-w-24 max-w-24">
              <span
                className={`${
                  totalPercentage >= 75
                    ? "text-green-600"
                    : totalPercentage >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {totalPercentage}%
              </span>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
};

export default AttendanceTableBody;
