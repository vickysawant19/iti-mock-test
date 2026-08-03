import React from "react";
import { format } from "date-fns";
import {
  Edit,
  Save,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Palmtree,
  Clock,
  MoreVertical,
  BookOpen,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PracticalNumberInput } from "./PracticalNumberInput";
import { TEACHER_ABSENT_ROW_CLASS } from "./diaryAbsentHighlight";

const DiaryWeekView = ({
  weekDays,
  diaryData,
  attendance,
  holidays,
  isLoading,
  actionLoadingDates,
  isTeacher,
  isSubmitting,
  updateDiaryField,
  toggleEditing,
  onOpenAttendanceModal,
  onSetTeacherAttendance,
  onRemoveHoliday,
}) => {
  const renderTeacherBadge = (teacherStatus) => {
    if (teacherStatus === "present") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Teacher: Present
        </span>
      );
    }
    if (teacherStatus === "absent") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs font-bold inline-flex items-center gap-1 border border-rose-200 dark:border-rose-800">
          <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Teacher: Absent
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3.5 h-3.5 text-slate-400" /> Teacher: Not Marked
      </span>
    );
  };

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
            const teacherStatus = attendance.get(dateKey);
            const isAbsent = teacherStatus === "absent";
            const isHoliday = holidays.has(dateKey);
            const isWeekend = ["Sat", "Sun"].includes(format(day, "E"));
            const teacherAbsentHighlight = isTeacher && isAbsent && !isHoliday;

            const isPresentLoading = actionLoadingDates?.[dateKey] === "present";
            const isAbsentLoading = actionLoadingDates?.[dateKey] === "absent";

            return (
              <Card
                key={dateKey}
                className={`relative overflow-hidden rounded-[20px] border transition-all duration-200 shadow-xs hover:shadow-md ${
                  isHoliday
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                    : teacherAbsentHighlight
                    ? `${TEACHER_ABSENT_ROW_CLASS} rounded-2xl border border-red-200 dark:border-red-900`
                    : !isTeacher && isAbsent
                    ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                    : isWeekend
                    ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                }`}
              >
                {isHoliday && <div className="h-1.5 w-full bg-amber-500" />}
                {teacherAbsentHighlight && <div className="h-1.5 w-full bg-rose-500" />}

                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {format(day, "EEEE")}
                      </CardTitle>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {format(day, "MMM dd, yyyy")}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isTeacher && renderTeacherBadge(teacherStatus)}
                      {isAbsent && !isTeacher && <Badge variant="destructive">Absent</Badge>}
                      {isHoliday && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 text-[11px] font-bold inline-flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                          <Palmtree className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Holiday
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 space-y-4">
                  {isHoliday && !isTeacher ? (
                    <div className="p-3 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-center font-medium text-sm">
                      <Palmtree className="w-5 h-5 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
                      {holidays.get(dateKey)?.holidayText || "Holiday"}
                    </div>
                  ) : isAbsent && !isTeacher ? (
                    <p className="text-center py-4 text-xs font-medium text-slate-500">No entries for absent day</p>
                  ) : (
                    <>
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="theoryWork" label="Theory Work" value={entry.theoryWork || entry.theory} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="textarea" />
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalWork" label="Practical Work" value={entry.practicalWork || entry.practical} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="textarea" />
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalNumbers" label="Practical No." value={entry.practicalNumbers} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="numberArray" />
                      {isTeacher && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="extraWork" label="Extra Work" value={entry.extraWork} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="textarea" />}
                      {isTeacher && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="hours" label="Hours" value={entry.hours} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="number" />}
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="remarks" label="Remarks" value={entry.remarks} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="textarea" />

                      {isTeacher && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                          {onSetTeacherAttendance && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Teacher Attendance:
                              </span>
                              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                <button
                                  type="button"
                                  disabled={isPresentLoading || isAbsentLoading}
                                  onClick={() => onSetTeacherAttendance(dateKey, "present")}
                                  className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                                    teacherStatus === "present"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                  } ${isPresentLoading ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                                >
                                  {isPresentLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                  Present
                                </button>
                                <button
                                  type="button"
                                  disabled={isPresentLoading || isAbsentLoading}
                                  onClick={() => onSetTeacherAttendance(dateKey, "absent")}
                                  className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                                    teacherStatus === "absent"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                  } ${isAbsentLoading ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                                >
                                  {isAbsentLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <UserX className="w-4 h-4" />
                                  )}
                                  Absent
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => toggleEditing(dateKey)}
                              disabled={isSubmitting}
                              className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs rounded-xl"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : entry.isEditing ? (
                                <Save className="h-4 w-4 mr-2" />
                              ) : (
                                <Edit className="h-4 w-4 mr-2" />
                              )}
                              {entry.isEditing ? "Save Entry" : "Edit Entry"}
                            </Button>

                            {onOpenAttendanceModal && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="min-h-[44px] px-3 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => onOpenAttendanceModal(dateKey, "attendance")}
                                    className="cursor-pointer flex items-center gap-2 text-xs font-medium"
                                  >
                                    <Users className="w-4 h-4 text-indigo-600" />
                                    Student Attendance
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onOpenAttendanceModal(dateKey, "holiday")}
                                    className="cursor-pointer flex items-center gap-2 text-xs font-medium text-amber-700"
                                  >
                                    <Palmtree className="w-4 h-4 text-amber-600" />
                                    {isHoliday ? "Holiday Details" : "Set Holiday"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
    </div>
  );

  // ------------------- DESKTOP TABLE VIEW (>= md BREAKPOINT) -------------------
  const renderDesktopView = () => (
    <Card className="hidden md:block rounded-xl shadow-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
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
                    const teacherStatus = attendance.get(dateKey);
                    const isAbsent = teacherStatus === "absent";
                    const isHoliday = holidays.has(dateKey);
                    const isWeekend = ["Sat", "Sun"].includes(format(day, "E"));
                    const teacherAbsentHighlight = isTeacher && isAbsent && !isHoliday;
                    const studentAbsentBlock = !isTeacher && isAbsent && !isHoliday;

                    const isPresentLoading = actionLoadingDates?.[dateKey] === "present";
                    const isAbsentLoading = actionLoadingDates?.[dateKey] === "absent";

                    const rowAccent = isHoliday
                      ? "bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 border-amber-200 dark:border-amber-900"
                      : teacherAbsentHighlight
                      ? `${TEACHER_ABSENT_ROW_CLASS} hover:bg-red-100/40 dark:hover:bg-red-950/40`
                      : !isTeacher && isAbsent
                      ? "bg-pink-50 dark:bg-pink-950"
                      : isWeekend && !isHoliday && !isAbsent
                      ? "bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50"
                      : "bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900";

                    return (
                      <tr key={dateKey} className={`border-b border-slate-200 dark:border-slate-800 transition-colors ${rowAccent}`}>
                        <td className="p-3.5 align-middle">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                              {format(day, "MMM dd, yyyy")}
                            </span>
                            {isHoliday && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                                <Palmtree className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Holiday
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-muted-foreground align-middle text-xs font-medium">
                          {format(day, "EEEE")}
                        </td>

                        {/* Dedicated Teacher Attendance Cell */}
                        {isTeacher && (
                          <td className="p-3.5 align-middle whitespace-nowrap">
                            {onSetTeacherAttendance ? (
                              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
                                <button
                                  type="button"
                                  disabled={isPresentLoading || isAbsentLoading}
                                  onClick={() => onSetTeacherAttendance(dateKey, "present")}
                                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                                    teacherStatus === "present"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                  } ${isPresentLoading ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                                  title="Mark Teacher Present"
                                >
                                  {isPresentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                                  Present
                                </button>
                                <button
                                  type="button"
                                  disabled={isPresentLoading || isAbsentLoading}
                                  onClick={() => onSetTeacherAttendance(dateKey, "absent")}
                                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                                    teacherStatus === "absent"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                  } ${isAbsentLoading ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                                  title="Mark Teacher Absent"
                                >
                                  {isAbsentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                                  Absent
                                </button>
                              </div>
                            ) : (
                              renderTeacherBadge(teacherStatus)
                            )}
                          </td>
                        )}

                        <td className="p-3.5 align-middle">
                          {isHoliday && !isTeacher ? (
                            <span className="text-amber-700 dark:text-amber-400 font-medium text-xs">
                              {holidays.get(dateKey)?.holidayText || "Holiday"}
                            </span>
                          ) : studentAbsentBlock ? (
                            <span className="text-slate-400 italic text-xs">No entries</span>
                          ) : (
                            <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="theoryWork" value={entry.theoryWork || entry.theory} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="textarea" />
                          )}
                        </td>
                        <td className="p-3.5 align-middle">
                          {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                            <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalWork" value={entry.practicalWork || entry.practical} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="textarea" />
                          )}
                        </td>
                        <td className="p-3.5 align-middle">
                          {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                            <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalNumbers" value={entry.practicalNumbers} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="numberArray" />
                          )}
                        </td>
                        {isTeacher && (
                          <td className="p-3.5 align-middle">
                            {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                              <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="extraWork" value={entry.extraWork} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="textarea" />
                            )}
                          </td>
                        )}
                        {isTeacher && (
                          <td className="p-3.5 align-middle text-right font-bold text-xs">
                            {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                              <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="hours" value={entry.hours} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="number" />
                            )}
                          </td>
                        )}
                        <td className="p-3.5 align-middle">
                          {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                            <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="remarks" value={entry.remarks} updateDiaryField={updateDiaryField} toggleEditing={toggleEditing} type="textarea" />
                          )}
                        </td>
                        {isTeacher && (
                          <td className="p-3.5 align-middle whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 min-w-[120px]">
                              {/* Edit Entry Primary Button */}
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => toggleEditing(dateKey)}
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold px-2.5 py-1.5 h-8 flex items-center gap-1"
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : entry.isEditing ? (
                                  <Save className="h-3.5 w-3.5" />
                                ) : (
                                  <Edit className="h-3.5 w-3.5" />
                                )}
                                <span>{entry.isEditing ? "Save" : "Edit"}</span>
                              </Button>

                              {/* More Actions Dropdown */}
                              {onOpenAttendanceModal && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                      title="More Actions"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                      onClick={() => onOpenAttendanceModal(dateKey, "attendance")}
                                      className="cursor-pointer flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200"
                                    >
                                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                      Student Attendance
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => onOpenAttendanceModal(dateKey, "holiday")}
                                      className="cursor-pointer flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400"
                                    >
                                      <Palmtree className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                      {isHoliday ? "Holiday Details" : "Set Holiday"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
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

const FieldRenderer = ({ isTeacher, isEditing, dateKey, field, label, value, updateDiaryField, toggleEditing, type }) => {
  const commonProps = {
    value: value || "",
    onChange: (e) => updateDiaryField(dateKey, field, e.target.value),
  };

  const readOnlyView =
    type === "numberArray" ? (
      value && Array.isArray(value) && value.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {value.map((num, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md"
            >
              #{num}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-gray-400 italic text-xs font-normal">—</span>
      )
    ) : (
      <span className="text-slate-800 dark:text-slate-200 font-medium text-xs">
        {value || <span className="text-gray-400 italic font-normal">—</span>}
      </span>
    );

  const editView =
    type === "textarea" ? (
      <Textarea
        {...commonProps}
        placeholder={`Add ${label ? label.toLowerCase() : field}...`}
        className="min-h-16 text-xs"
      />
    ) : type === "numberArray" ? (
      <PracticalNumberInput
        value={value}
        onChange={(newValue) => {
          updateDiaryField(dateKey, field, newValue);
        }}
        placeholder="e.g. 1, 3"
      />
    ) : (
      <Input {...commonProps} type="number" placeholder="-" className="text-xs text-right" />
    );

  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{label}</label>}
      {isTeacher && isEditing ? (
        editView
      ) : (
        <div
          onClick={() => isTeacher && toggleEditing && toggleEditing(dateKey)}
          title={isTeacher ? "Click to edit entry" : ""}
          className={isTeacher ? "cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 p-1 -m-1 rounded-md transition-colors" : ""}
        >
          {readOnlyView}
        </div>
      )}
    </div>
  );
};

export default DiaryWeekView;
