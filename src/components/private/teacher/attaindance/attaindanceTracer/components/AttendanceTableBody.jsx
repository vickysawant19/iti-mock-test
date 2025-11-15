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
  loadingAttendance = false,
  loadingStats = false,
}) => {
  return (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
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

        const totalWorkingDays = prevMonthData.workingDays + workingDays;
        const totalPresentDays = prevMonthData.presentDays + presentDays;
        const totalPercentage =
          totalWorkingDays > 0
            ? ((totalPresentDays / totalWorkingDays) * 100).toFixed(1)
            : 0;

        const studentUpdating = isStudentUpdating(student.userId);

        return (
          <tr
            key={student.userId}
            className={`hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all duration-200 ${
              idx % 2 === 0
                ? "bg-white dark:bg-slate-800"
                : "bg-slate-50 dark:bg-slate-850"
            } ${
              editStudentId === student.userId
                ? "bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-400 dark:ring-amber-600"
                : ""
            } ${studentUpdating ? "opacity-60" : ""}`}
          >
            {/* Previous Month Stats with Loading State */}
            <td className="py-2 px-2 border border-slate-300 dark:border-slate-600 text-center bg-emerald-50 dark:bg-emerald-900/30 font-semibold text-xs sm:text-sm relative">
              {loadingStats ? (
                <div className="flex items-center justify-center">
                  <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                prevMonthData.workingDays
              )}
            </td>
            <td className="py-2 px-2 border border-slate-300 dark:border-slate-600 text-center bg-emerald-50 dark:bg-emerald-900/30 text-green-700 dark:text-green-400 font-semibold text-xs sm:text-sm relative">
              {loadingStats ? (
                <div className="flex items-center justify-center">
                  <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                prevMonthData.presentDays
              )}
            </td>
            <td className="py-2 px-2 border border-slate-300 dark:border-slate-600 text-center bg-emerald-50 dark:bg-emerald-900/30 text-red-700 dark:text-red-400 font-semibold text-xs sm:text-sm relative">
              {loadingStats ? (
                <div className="flex items-center justify-center">
                  <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                prevMonthData.absentDays
              )}
            </td>
            <td className="py-2 px-2 border border-slate-300 dark:border-slate-600 text-center bg-emerald-50 dark:bg-emerald-900/30 font-bold text-xs sm:text-sm relative">
              {loadingStats ? (
                <div className="flex items-center justify-center">
                  <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <span
                  className={`${
                    totalPercentage >= 75
                      ? "text-green-700 dark:text-green-400"
                      : totalPercentage >= 50
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {totalPercentage}%
                </span>
              )}
            </td>

            {/* Student Name */}
            <td className="py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 sticky left-0 bg-inherit z-10 font-medium text-slate-900 dark:text-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex flex-col flex-1 w-28 sm:w-48 min-w-28 sm:min-w-48">
                  <span className="font-semibold text-xs sm:text-sm text-wrap">{student.userName}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    ID: {student.studentId}
                  </span>
                </div>
                {studentUpdating && !loadingAttendance && (
                  <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                )}
              </div>
            </td>
            
            {/* Edit Button */}
            <td className="py-2 sm:py-3 px-2 sm:px-4 border border-slate-300 dark:border-slate-600 sticky left-32 sm:left-48 bg-inherit z-10 font-medium text-slate-900 dark:text-slate-100">
              <button
                onClick={() => {
                  if (editStudentId === student.userId) {
                    setEditStudentId(null);
                    return;
                  }
                  setEditStudentId(student.userId);
                }}
                disabled={loadingAttendance || studentUpdating}
                className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                  editStudentId === student.userId
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {editStudentId === student.userId ? (
                  <>
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Done</span>
                  </>
                ) : (
                  <>
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </>
                )}
              </button>
            </td>

            {/* Daily Attendance Cells */}
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
                      className="py-3 px-2 border border-slate-300 dark:border-slate-600 text-center relative bg-rose-100 dark:bg-rose-900/30"
                    >
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <div
                          className="whitespace-nowrap text-[10px] font-semibold text-rose-800 dark:text-rose-300"
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
                  className={`py-2 sm:py-3 px-1 sm:px-2 border border-slate-300 dark:border-slate-600 text-center relative ${
                    editStudentId === student.userId && !isHoliday
                      ? "bg-amber-50 dark:bg-amber-900/20"
                      : ""
                  } ${cellUpdating ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                >
                  {cellUpdating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-100/70 dark:bg-indigo-900/50 z-10">
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
                      className={`px-2 py-1 text-xs font-bold rounded shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[2rem] ${
                        status === "present"
                          ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
                          : status === "absent"
                          ? "bg-red-600 text-white hover:bg-red-700 shadow-md"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
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
                      <span className="text-green-700 font-bold text-sm dark:text-green-400">
                        P
                      </span>
                    ) : (
                      <span className="text-red-700 font-bold text-sm dark:text-red-400">
                        A
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">-</span>
                  )}
                </td>
              );
            })}

            {/* Current Month Summary - No Loading State Needed */}
            <td className="py-2 px-2 border border-slate-300 dark:border-slate-600 text-center bg-sky-50 dark:bg-sky-900/30 font-semibold text-xs sm:text-sm">
              {workingDays}
            </td>
            <td className="py-2 px-2 border border-slate-300 dark:border-slate-600 text-center bg-sky-50 dark:bg-sky-900/30 text-green-700 dark:text-green-400 font-semibold text-xs sm:text-sm">
              {presentDays}
            </td>
            <td className="py-2 px-2 border border-slate-300 dark:border-slate-600 text-center bg-sky-50 dark:bg-sky-900/30 text-red-700 dark:text-red-400 font-semibold text-xs sm:text-sm">
              {absentDays}
            </td>
            <td className="py-2 px-2 border border-slate-300 dark:border-slate-600 text-center bg-sky-50 dark:bg-sky-900/30 font-bold text-xs sm:text-sm">
              <span
                className={`${
                  percentage >= 75
                    ? "text-green-700 dark:text-green-400"
                    : percentage >= 50
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {percentage}%
              </span>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
};

export default AttendanceTableBody;