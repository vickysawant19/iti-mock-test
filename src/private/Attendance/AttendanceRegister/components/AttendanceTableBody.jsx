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
  columnVisibility = { previous: true, daily: true, summary: true },
  compactView = false,
}) => {
  const cell = compactView ? "py-1 px-1" : "py-2 px-2";
  const stickyCell = compactView ? "py-1 px-2" : "py-2 sm:py-3 px-2 sm:px-4";
  const textSize = compactView ? "text-xs" : "text-xs sm:text-sm";

  return (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
      {students.map((student, idx) => {
        const studentRecords = attendanceMap.get(student.userId) || new Map();
        const prevMonthData = calculatePreviousMonthsData.get(student.userId) || {
          prevMonthWorkingDays: 0,
          prevMonthPresentDays: 0,
          prevMonthAbsentDays: 0,
        };

        let currentMonthPresentDays = 0;
        let currentMonthAbsentDays = 0;
        let currentMonthWorkingDays = 0;

        monthDates.forEach((date) => {
          const fullDate = formatDate(
            new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), date),
            "yyyy-MM-dd"
          );
          if (!holidays.has(fullDate)) {
            currentMonthWorkingDays++;
            const status = studentRecords.get(fullDate);
            if (status === "present") currentMonthPresentDays++;
            else if (status === "absent") currentMonthAbsentDays++;
          }
        });

        const currentMonthPercentage =
          currentMonthWorkingDays > 0
            ? ((currentMonthPresentDays / currentMonthWorkingDays) * 100).toFixed(1)
            : 0;

        const prevMonthWorkingDays = prevMonthData.presentDays + prevMonthData.absentDays;
        const prevMonthPresentDays = prevMonthData.presentDays;
        const prevMonthPercentage =
          prevMonthWorkingDays > 0
            ? ((prevMonthPresentDays / prevMonthWorkingDays) * 100).toFixed(1)
            : 0;

        const studentUpdating = isStudentUpdating(student.userId);

        return (
          <tr
            key={student.userId}
            className={`hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all duration-200 ${
              idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-850"
            } ${
              editStudentId === student.userId
                ? "bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-400 dark:ring-amber-600"
                : ""
            } ${studentUpdating ? "opacity-60" : ""}`}
          >
            {/* GROUP: Previous Month Stats */}
            {columnVisibility.previous && (
              <>
                <td className={`${cell} border border-slate-300 dark:border-slate-600 text-center bg-emerald-50 dark:bg-emerald-900/30 font-semibold ${textSize} relative`}>
                  {loadingStats ? (
                    <div className="flex items-center justify-center">
                      <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    prevMonthData.workingDays
                  )}
                </td>
                <td className={`${cell} border border-slate-300 dark:border-slate-600 text-center bg-emerald-50 dark:bg-emerald-900/30 text-green-700 dark:text-green-400 font-semibold ${textSize} relative`}>
                  {loadingStats ? (
                    <div className="flex items-center justify-center">
                      <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    prevMonthData.presentDays
                  )}
                </td>
                <td className={`${cell} border border-slate-300 dark:border-slate-600 text-center bg-emerald-50 dark:bg-emerald-900/30 text-red-700 dark:text-red-400 font-semibold ${textSize} relative`}>
                  {loadingStats ? (
                    <div className="flex items-center justify-center">
                      <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    prevMonthData.absentDays
                  )}
                </td>
                <td className={`${cell} border border-slate-300 dark:border-slate-600 text-center bg-emerald-50 dark:bg-emerald-900/30 font-bold ${textSize} relative`}>
                  {loadingStats ? (
                    <div className="flex items-center justify-center">
                      <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    <span
                      className={`${
                        prevMonthPercentage >= 75
                          ? "text-green-700 dark:text-green-400"
                          : prevMonthPercentage >= 50
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {prevMonthPercentage}%
                    </span>
                  )}
                </td>
              </>
            )}

            {/* GROUP: Student Name — always sticky */}
            <td className={`${stickyCell} border border-slate-300 dark:border-slate-600 sticky left-0 bg-inherit z-10 font-medium text-slate-900 dark:text-slate-100 shadow-2xl`}>
              <div className="flex items-center gap-2">
                <div className={`flex flex-col flex-1 ${compactView ? "w-28 min-w-28" : "w-28 sm:w-48 min-w-28 sm:min-w-48"}`}>
                  <span className={`font-semibold text-xs text-wrap`}>{student.userName}</span>
                  {!compactView && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      ID: {student.studentId}
                    </span>
                  )}
                </div>
                {studentUpdating && !loadingAttendance && (
                  <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                )}
              </div>
            </td>

            {/* Edit Button — always sticky */}
            <td className={`${stickyCell} border border-slate-300 dark:border-slate-600 sticky left-28 sm:left-48 bg-inherit z-10 font-medium text-slate-900 dark:text-slate-100`}>
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

            {/* GROUP: Daily Attendance Cells */}
            {columnVisibility.daily &&
              monthDates.map((date) => {
                const fullDate = formatDate(
                  new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), date),
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
                            className="whitespace-nowrap text-sm text-wrap font-semibold text-rose-800 dark:text-rose-300"
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
                    className={`${cell} border border-slate-300 dark:border-slate-600 text-center relative ${
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
                        disabled={loadingAttendance || studentUpdating || cellUpdating}
                        className={`px-2 py-1 text-xs font-bold rounded shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[2rem] ${
                          status === "present"
                            ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
                            : status === "absent"
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-md"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        }`}
                      >
                        {status === "present" ? "P" : status === "absent" ? "A" : "-"}
                      </button>
                    ) : status ? (
                      status === "present" ? (
                        <span className="text-green-700 font-bold text-sm dark:text-green-400">P</span>
                      ) : (
                        <span className="text-red-700 font-bold text-sm dark:text-red-400">A</span>
                      )
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                );
              })}

            {/* GROUP: Monthly Summary */}
            {columnVisibility.summary && (
              <>
                <td className={`${cell} border border-slate-300 dark:border-slate-600 text-center bg-sky-50 dark:bg-sky-900/30 font-semibold ${textSize}`}>
                  {currentMonthWorkingDays}
                </td>
                <td className={`${cell} border border-slate-300 dark:border-slate-600 text-center bg-sky-50 dark:bg-sky-900/30 text-green-700 dark:text-green-400 font-semibold ${textSize}`}>
                  {currentMonthPresentDays}
                </td>
                <td className={`${cell} border border-slate-300 dark:border-slate-600 text-center bg-sky-50 dark:bg-sky-900/30 text-red-700 dark:text-red-400 font-semibold ${textSize}`}>
                  {currentMonthAbsentDays}
                </td>
                <td className={`${cell} border border-slate-300 dark:border-slate-600 text-center bg-sky-50 dark:bg-sky-900/30 font-bold ${textSize} sticky right-0 z-10 shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.15)]`}>
                  <span
                    className={`${
                      currentMonthPercentage >= 75
                        ? "text-green-700 dark:text-green-400"
                        : currentMonthPercentage >= 50
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {currentMonthPercentage}%
                  </span>
                </td>
              </>
            )}
          </tr>
        );
      })}
    </tbody>
  );
};

export default AttendanceTableBody;
