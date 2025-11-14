import React from "react";
import { LoaderCircle, Pencil, Check } from "lucide-react";

const AttendanceTableBody = ({
  students,
  monthDates,
  selectedMonth,
  holidays,
  attendanceMap,
  calculatePreviousMonthsData,
  formatDate,
  getDaysInMonth,
  setEditStudentId,
  editStudentId,
  onAttendanceStatusChange,
  updatingAttendance,
  isStudentUpdating,
  loadingAttendance = false, // New prop
}) => {
  return (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
            if (status === "present") presentDays++;
            else if (status === "absent") absentDays++;
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

        // Check if this student is currently being updated
        const studentUpdating = isStudentUpdating(student.userId);

        return (
          <tr
            key={student.userId}
            className={`hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-all duration-200 ${
              idx % 2 === 0
                ? "bg-gray-50 dark:bg-gray-800"
                : "bg-white dark:bg-gray-900"
            } ${
              editStudentId === student.userId
                ? "bg-yellow-100 dark:bg-yellow-900"
                : ""
            } ${studentUpdating ? "opacity-60" : ""}`}
          >
            <td className="py-3 px-4 border border-gray-300 dark:border-gray-700 sticky left-0 bg-inherit z-10 font-medium text-gray-900 dark:text-gray-100 w-48 min-w-48 max-w-48">
              <div className="flex items-center gap-2">
                <div className="flex flex-col flex-1">
                  <span className="font-semibold">{student.userName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {student.studentId}
                  </span>
                </div>
                {/* Show spinner if student row is updating */}
                {studentUpdating && !loadingAttendance && (
                  <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                )}
              </div>
            </td>
            
            <td className="py-3 px-4 border border-gray-300 dark:border-gray-700 sticky left-48 bg-inherit z-10 font-medium text-gray-900 dark:text-gray-100 w-16 min-w-16 max-w-16">
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    if (editStudentId === student.userId) {
                      setEditStudentId(null);
                      return;
                    }
                    setEditStudentId(student.userId);
                  }}
                  disabled={loadingAttendance || studentUpdating}
                  className={`px-2 py-1 text-xs bg-indigo-500 dark:bg-indigo-700 text-white rounded hover:bg-indigo-600 dark:hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {editStudentId === student.userId ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                </button>
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
              const cellUpdating = updatingAttendance.get(`${student.userId}-${fullDate}`);

              if (isHoliday) {
                if (idx === 0) {
                  return (
                    <td
                      key={date}
                      rowSpan={students.length}
                      className="py-3 px-2 border border-gray-300 dark:border-gray-700 text-center relative bg-red-100 dark:bg-red-900 w-12 min-w-12 max-w-12"
                    >
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <div
                          className="whitespace-nowrap text-[10px] font-semibold text-red-700 dark:text-red-300"
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
                  className={`py-3 px-2 border border-gray-300 dark:border-gray-700 text-center w-16 min-w-16 max-w-16 relative ${
                    editStudentId === student.userId && !isHoliday
                      ? "bg-yellow-50 dark:bg-yellow-900"
                      : ""
                  } ${cellUpdating ? "bg-blue-50 dark:bg-blue-900" : ""}`}
                >
                  {/* Cell-specific loading overlay */}
                  {cellUpdating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-100/50 dark:bg-indigo-900/50">
                      <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                    </div>
                  )}

                  {editStudentId === student.userId && !isHoliday ? (
                    <button
                      onClick={() =>
                        onAttendanceStatusChange(
                          student.userId,
                          fullDate,
                          status === "present" ? "absent" : "present"
                        )
                      }
                      disabled={
                        loadingAttendance || 
                        studentUpdating || 
                        cellUpdating
                      }
                      className={`px-2 py-1 text-xs rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        status === "present"
                          ? "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200 hover:bg-green-300 dark:hover:bg-green-600"
                          : "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-200 hover:bg-red-300 dark:hover:bg-red-600"
                      }`}
                    >
                      {status === "present"
                        ? "P"
                        : status === "absent"
                        ? "A"
                        : "-"}
                    </button>
                  ) : status ? (
                    status === "present" ? (
                      <span className="text-green-600 font-bold text-sm dark:text-green-400">
                        P
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold text-sm dark:text-red-400">
                        A
                      </span>
                    )
                  ) : (
                    <span className="text-gray-300 dark:text-gray-500">-</span>
                  )}
                </td>
              );
            })}

            {/* Statistics columns */}
            <td className="py-3 px-3 border border-gray-300 dark:border-gray-700 text-center bg-blue-50 dark:bg-blue-900 font-semibold w-24 min-w-24 max-w-24">
              {workingDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 dark:border-gray-700 text-center bg-blue-50 dark:bg-blue-900 text-green-600 dark:text-green-400 font-semibold w-24 min-w-24 max-w-24">
              {presentDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 dark:border-gray-700 text-center bg-blue-50 dark:bg-blue-900 text-red-600 dark:text-red-400 font-semibold w-24 min-w-24 max-w-24">
              {absentDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 dark:border-gray-700 text-center bg-blue-50 dark:bg-blue-900 font-bold w-24 min-w-24 max-w-24">
              <span
                className={`${
                  percentage >= 75
                    ? "text-green-600 dark:text-green-400"
                    : percentage >= 50
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {percentage}%
              </span>
            </td>
            <td className="py-3 px-3 border border-gray-300 dark:border-gray-700 text-center bg-green-50 dark:bg-green-900 font-semibold w-24 min-w-24 max-w-24">
              {prevMonthData.workingDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 dark:border-gray-700 text-center bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400 font-semibold w-24 min-w-24 max-w-24">
              {prevMonthData.presentDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 dark:border-gray-700 text-center bg-green-50 dark:bg-green-900 text-red-600 dark:text-red-400 font-semibold w-24 min-w-24 max-w-24">
              {prevMonthData.absentDays}
            </td>
            <td className="py-3 px-3 border border-gray-300 dark:border-gray-700 text-center bg-green-50 dark:bg-green-900 font-bold w-24 min-w-24 max-w-24">
              <span
                className={`${
                  totalPercentage >= 75
                    ? "text-green-600 dark:text-green-400"
                    : totalPercentage >= 50
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
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