import React, { useMemo } from "react";
import { format, getDay, endOfWeek, min, parseISO, startOfWeek, differenceInCalendarWeeks } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CalendarDays, Calendar } from "lucide-react";
import DiaryMetricsSummary from "../../DailyDiary/components/DiaryMetricsSummary";
import DiaryMobileCard from "../../DailyDiary/components/DiaryMobileCard";
import DiaryTableRow from "../../DailyDiary/components/DiaryTableRow";

export default function DiaryTable({
  monthDays,
  diaryData,
  holidays,
  attendance,
  isLoadingData,
  actionLoadingDates,
  isTeacher = true,
  batchStartDate,
  onUpdateEntry,
  onOpenAttendanceModal,
  onSetTeacherAttendance,
  onDeleteTeacherAttendance,
  onRemoveHoliday,
}) {
  const stats = useMemo(() => {
    let presentDays = 0;
    let absentDays = 0;
    let holidayDays = 0;
    let totalHours = 0;
    let theoryCount = 0;
    let practicalCount = 0;

    monthDays.forEach((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      const status = attendance?.get?.(dateKey) || attendance?.[dateKey];
      const entry = diaryData?.[dateKey];
      const isHoliday = holidays?.has?.(dateKey) || Boolean(holidays?.[dateKey]);

      if (isHoliday) {
        holidayDays++;
      }

      if (status === "present") {
        presentDays++;
      } else if (status === "absent") {
        absentDays++;
      }

      if (entry) {
        if (entry.hours) {
          totalHours += Number(entry.hours) || 0;
        }
        if (entry.theoryWork && entry.theoryWork.trim() !== "" && entry.theoryWork !== "-") {
          theoryCount++;
        }
        if (entry.practicalWork && entry.practicalWork.trim() !== "" && entry.practicalWork !== "-") {
          practicalCount++;
        }
      }
    });

    return {
      totalDays: monthDays.length,
      presentDays,
      absentDays,
      holidayDays,
      totalHours,
      theoryCount,
      practicalCount,
    };
  }, [monthDays, diaryData, attendance, holidays]);

  const getBatchWeekNumber = (day) => {
    if (!batchStartDate) return null;
    try {
      const batchStart = startOfWeek(parseISO(batchStartDate), { weekStartsOn: 0 });
      const currentWeekStart = startOfWeek(day, { weekStartsOn: 0 });
      const weekDiff = differenceInCalendarWeeks(currentWeekStart, batchStart, { weekStartsOn: 0 });
      return Math.max(1, weekDiff + 1);
    } catch (e) {
      return null;
    }
  };

  let mobileWeekCounter = 0;
  let desktopWeekCounter = 0;

  return (
    <div className="w-full">
      {/* ------------------- SUMMARY METRICS STATS BAR ------------------- */}
      <DiaryMetricsSummary stats={stats} />

      {/* ------------------- MOBILE CARDS (< md BREAKPOINT) ------------------- */}
      <div className="block md:hidden space-y-4">
        {isLoadingData ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="rounded-[20px] p-4 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))
        ) : monthDays.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-slate-500 font-medium text-sm">No entries found for selected month.</p>
          </div>
        ) : (
          monthDays.map((day, index) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const entry = diaryData[dateKey];
            const isHoliday = holidays?.has?.(dateKey) || Boolean(holidays?.[dateKey]);
            const teacherStatus = attendance?.get?.(dateKey) || attendance?.[dateKey];
            const isAbsent = teacherStatus === "absent";
            const dayOfWeek = format(day, "E");
            const isWeekend = dayOfWeek === "Sat" || dayOfWeek === "Sun";
            const holidayText = isHoliday ? holidays?.get?.(dateKey)?.holidayText : "";

            const isNewWeek = index === 0 || getDay(day) === 0;
            if (isNewWeek) mobileWeekCounter++;

            const batchWeekNum = getBatchWeekNumber(day);
            const displayWeekLabel = batchWeekNum ? `Week ${batchWeekNum}` : `Week ${mobileWeekCounter}`;

            const monthEnd = monthDays[monthDays.length - 1];
            const weekEnd = min([endOfWeek(day, { weekStartsOn: 0 }), monthEnd]);

            return (
              <React.Fragment key={dateKey}>
                {isNewWeek && (
                  <div className="pt-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between mt-3 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-extrabold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 border border-blue-200 dark:border-blue-800">
                        <Calendar className="w-3.5 h-3.5" />
                        {displayWeekLabel}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {format(day, "MMM dd")} - {format(weekEnd, "MMM dd")}
                    </span>
                  </div>
                )}
                <DiaryMobileCard
                  day={day}
                  entry={entry}
                  isHoliday={isHoliday}
                  isAbsent={isAbsent}
                  teacherStatus={teacherStatus}
                  actionLoadingDates={actionLoadingDates}
                  isWeekend={isWeekend}
                  holidayText={holidayText}
                  isTeacher={isTeacher}
                  onUpdateEntry={onUpdateEntry}
                  onOpenAttendanceModal={onOpenAttendanceModal}
                  onSetTeacherAttendance={onSetTeacherAttendance}
                  onDeleteTeacherAttendance={onDeleteTeacherAttendance}
                />
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* ------------------- DESKTOP TABLE (>= md BREAKPOINT) ------------------- */}
      <div className="hidden md:block">
        <Card className="shadow-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
          {/* Table Header Control Bar */}
          <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Monthly Diary Log
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold">
                {stats.presentDays} Present
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[11px] font-bold">
                {stats.absentDays} Absent
              </span>
              {stats.holidayDays > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-bold">
                  {stats.holidayDays} Holidays
                </span>
              )}
            </div>
          </div>

          <CardContent className="p-0">
            <div className="w-full overflow-x-auto relative">
              <table className="w-full min-w-[1050px] text-sm table-auto border-collapse">
                <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-700 dark:text-slate-300 z-10">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] w-36">Date</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] w-24">Day</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] w-44">
                      {isTeacher ? "Teacher Attendance" : "My Attendance"}
                    </th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[180px]">Theory Work</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[180px]">Practical Work</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[120px]">Practical No.</th>
                    {isTeacher && <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[130px]">Extra Work</th>}
                    {isTeacher && <th className="p-3.5 text-right font-bold uppercase tracking-wider text-[11px] w-20">Hours</th>}
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[130px]">Remarks</th>
                    {isTeacher && <th className="p-3.5 text-right font-bold uppercase tracking-wider text-[11px] w-32">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {isLoadingData ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="bg-white dark:bg-slate-950">
                        <td className="p-3.5"><Skeleton className="h-5 w-24" /></td>
                        <td className="p-3.5"><Skeleton className="h-5 w-16" /></td>
                        <td className="p-3.5"><Skeleton className="h-5 w-32" /></td>
                        <td className="p-3.5"><Skeleton className="h-5 w-full" /></td>
                        <td className="p-3.5"><Skeleton className="h-5 w-full" /></td>
                        <td className="p-3.5"><Skeleton className="h-5 w-12" /></td>
                        {isTeacher && <td className="p-3.5"><Skeleton className="h-5 w-full" /></td>}
                        {isTeacher && <td className="p-3.5"><Skeleton className="h-5 w-10 ml-auto" /></td>}
                        <td className="p-3.5"><Skeleton className="h-5 w-16" /></td>
                        {isTeacher && <td className="p-3.5"><Skeleton className="h-5 w-20 ml-auto" /></td>}
                      </tr>
                    ))
                  ) : monthDays.length === 0 ? (
                    <tr>
                      <td colSpan={isTeacher ? "10" : "7"} className="p-8 text-center text-muted-foreground">
                        No entries found for selected month.
                      </td>
                    </tr>
                  ) : (
                    monthDays.map((day, index) => {
                      const dateKey = format(day, "yyyy-MM-dd");
                      const entry = diaryData[dateKey];
                      const isHoliday = holidays?.has?.(dateKey) || Boolean(holidays?.[dateKey]);
                      const teacherStatus = attendance?.get?.(dateKey) || attendance?.[dateKey];
                      const isAbsent = teacherStatus === "absent";
                      const dayOfWeek = format(day, "E");
                      const isWeekend = dayOfWeek === "Sat" || dayOfWeek === "Sun";
                      const holidayText = isHoliday ? holidays?.get?.(dateKey)?.holidayText : "";

                      const isNewWeek = index === 0 || getDay(day) === 0;
                      if (isNewWeek) desktopWeekCounter++;

                      const batchWeekNum = getBatchWeekNumber(day);
                      const displayWeekLabel = batchWeekNum ? `Week ${batchWeekNum}` : `Week ${desktopWeekCounter}`;

                      const monthEnd = monthDays[monthDays.length - 1];
                      const weekEnd = min([endOfWeek(day, { weekStartsOn: 0 }), monthEnd]);

                      return (
                        <React.Fragment key={dateKey}>
                          {isNewWeek && (
                            <tr className="bg-slate-100/90 dark:bg-slate-900/90 border-t-2 border-b border-slate-300/80 dark:border-slate-800">
                              <td colSpan={isTeacher ? "10" : "7"} className="py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5 border border-blue-200 dark:border-blue-800">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {displayWeekLabel}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                    ({format(day, "MMM dd, yyyy")} – {format(weekEnd, "MMM dd, yyyy")})
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                          <DiaryTableRow
                            day={day}
                            entry={entry}
                            isHoliday={isHoliday}
                            isAbsent={isAbsent}
                            teacherStatus={teacherStatus}
                            actionLoadingDates={actionLoadingDates}
                            isWeekend={isWeekend}
                            holidayText={holidayText}
                            isTeacher={isTeacher}
                            onUpdateEntry={onUpdateEntry}
                            onOpenAttendanceModal={onOpenAttendanceModal}
                            onSetTeacherAttendance={onSetTeacherAttendance}
                            onDeleteTeacherAttendance={onDeleteTeacherAttendance}
                          />
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
