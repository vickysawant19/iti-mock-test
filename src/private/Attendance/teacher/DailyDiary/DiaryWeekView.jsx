import React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DiaryMobileCard from "../../DailyDiary/components/DiaryMobileCard";
import DiaryTableRow from "../../DailyDiary/components/DiaryTableRow";

const DiaryWeekView = ({
  weekDays,
  diaryData,
  attendance,
  holidays,
  isLoading,
  actionLoadingDates,
  isTeacher = true,
  isSubmitting = false,
  updateDiaryField,
  toggleEditing,
  onOpenAttendanceModal,
  onSetTeacherAttendance,
  onRemoveHoliday,
}) => {
  // ------------------- MOBILE CARDS VIEW (< md BREAKPOINT) -------------------
  const renderMobileView = () => (
    <div className="block md:hidden space-y-4">
      {isLoading
        ? Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="rounded-[20px] p-4 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))
        : weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const entry = diaryData[dateKey] || { isEditing: false };
            const teacherStatus = attendance?.get?.(dateKey) || attendance?.[dateKey];
            const isAbsent = teacherStatus === "absent";
            const isHoliday = holidays?.has?.(dateKey) || Boolean(holidays?.[dateKey]);
            const isWeekend = ["Sat", "Sun"].includes(format(day, "E"));
            const holidayText = isHoliday ? holidays?.get?.(dateKey)?.holidayText : "";

            return (
              <DiaryMobileCard
                key={dateKey}
                day={day}
                entry={entry}
                isHoliday={isHoliday}
                isAbsent={isAbsent}
                teacherStatus={teacherStatus}
                actionLoadingDates={actionLoadingDates}
                isWeekend={isWeekend}
                holidayText={holidayText}
                isTeacher={isTeacher}
                isSubmitting={isSubmitting}
                updateDiaryField={updateDiaryField}
                toggleEditing={toggleEditing}
                onOpenAttendanceModal={onOpenAttendanceModal}
                onSetTeacherAttendance={onSetTeacherAttendance}
              />
            );
          })}
    </div>
  );

  // ------------------- DESKTOP TABLE VIEW (>= md BREAKPOINT) -------------------
  const renderDesktopView = () => (
    <Card className="hidden md:block rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto relative">
          <table className="w-full min-w-[1050px] text-sm table-auto border-collapse">
            <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-700 dark:text-slate-300 z-10">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] w-36">Date</th>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] w-24">Day</th>
                {isTeacher && <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] w-44">Teacher Attendance</th>}
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
              {isLoading
                ? Array.from({ length: 7 }).map((_, index) => (
                    <tr key={index} className="bg-white dark:bg-slate-950">
                      <td className="p-3.5"><Skeleton className="h-5 w-28" /></td>
                      <td className="p-3.5"><Skeleton className="h-5 w-16" /></td>
                      {isTeacher && <td className="p-3.5"><Skeleton className="h-5 w-32" /></td>}
                      <td className="p-3.5"><Skeleton className="h-5 w-full" /></td>
                      <td className="p-3.5"><Skeleton className="h-5 w-full" /></td>
                      <td className="p-3.5"><Skeleton className="h-5 w-12" /></td>
                      {isTeacher && <td className="p-3.5"><Skeleton className="h-5 w-full" /></td>}
                      {isTeacher && <td className="p-3.5"><Skeleton className="h-5 w-10 ml-auto" /></td>}
                      <td className="p-3.5"><Skeleton className="h-5 w-16" /></td>
                      {isTeacher && <td className="p-3.5"><Skeleton className="h-5 w-20 ml-auto" /></td>}
                    </tr>
                  ))
                : weekDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const entry = diaryData[dateKey] || { isEditing: false };
                    const teacherStatus = attendance?.get?.(dateKey) || attendance?.[dateKey];
                    const isAbsent = teacherStatus === "absent";
                    const isHoliday = holidays?.has?.(dateKey) || Boolean(holidays?.[dateKey]);
                    const isWeekend = ["Sat", "Sun"].includes(format(day, "E"));
                    const holidayText = isHoliday ? holidays?.get?.(dateKey)?.holidayText : "";

                    return (
                      <DiaryTableRow
                        key={dateKey}
                        day={day}
                        entry={entry}
                        isHoliday={isHoliday}
                        isAbsent={isAbsent}
                        teacherStatus={teacherStatus}
                        actionLoadingDates={actionLoadingDates}
                        isWeekend={isWeekend}
                        holidayText={holidayText}
                        isTeacher={isTeacher}
                        isSubmitting={isSubmitting}
                        updateDiaryField={updateDiaryField}
                        toggleEditing={toggleEditing}
                        onOpenAttendanceModal={onOpenAttendanceModal}
                        onSetTeacherAttendance={onSetTeacherAttendance}
                      />
                    );
                  })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {renderMobileView()}
      {renderDesktopView()}
    </>
  );
};

export default DiaryWeekView;
