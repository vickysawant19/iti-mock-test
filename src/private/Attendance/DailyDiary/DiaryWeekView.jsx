import React from "react";
import { format } from "date-fns";
import { Edit, Save, Loader2, Users, UserCheck, UserX, Palmtree, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PracticalNumberInput } from "./PracticalNumberInput";
import { highlightAbsentRow, TEACHER_ABSENT_ROW_CLASS } from "./diaryAbsentHighlight";

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
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Teacher: Present
        </span>
      );
    }
    if (teacherStatus === "absent") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[11px] font-bold inline-flex items-center gap-1">
          <UserX className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Teacher: Absent
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[11px] font-semibold inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3 h-3 text-slate-400" /> Teacher: Not Marked
      </span>
    );
  };

  // Mobile View
  const renderMobileView = () => (
    <div className="block lg:hidden space-y-4">
      {isLoading
        ? Array.from({ length: 7 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
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

            return (
              <Card
                key={dateKey}
                className={`${isHoliday ? "border-red-500 bg-red-50 dark:bg-red-950" : ""} ${
                  teacherAbsentHighlight ? `${TEACHER_ABSENT_ROW_CLASS} rounded-xl border border-red-200 dark:border-red-900` : ""
                } ${!isTeacher && isAbsent ? "border-pink-500 bg-pink-50 dark:bg-pink-950" : ""} ${
                  isWeekend && !isHoliday && !isAbsent ? "bg-gray-100 dark:bg-gray-900" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{format(day, "EEEE")}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{format(day, "MMM dd, yyyy")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isTeacher && renderTeacherBadge(teacherStatus)}
                      {isAbsent && !isTeacher && <Badge variant="destructive">Absent</Badge>}
                      {isHoliday && (
                        <div className="flex gap-1">
                          <Badge variant="destructive">Holiday</Badge>
                          {isTeacher && teacherStatus === "present" && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Working</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isHoliday && !isTeacher ? (
                    <p className="text-center py-4 text-muted-foreground">{holidays.get(dateKey)?.holidayText || "Holiday"}</p>
                  ) : isAbsent && !isTeacher ? (
                    <p className="text-center py-4 text-muted-foreground">No entries for absent day</p>
                  ) : (
                    <>
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="theoryWork" label="Theory" value={entry.theoryWork || entry.theory} updateDiaryField={updateDiaryField} type="textarea" />
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalWork" label="Practical" value={entry.practicalWork || entry.practical} updateDiaryField={updateDiaryField} type="textarea" />
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalNumbers" label="Practical No." value={entry.practicalNumbers} updateDiaryField={updateDiaryField} type="numberArray" />
                      {isTeacher && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="extraWork" label="Extra Work" value={entry.extraWork} updateDiaryField={updateDiaryField} type="textarea" />}
                      {isTeacher && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="hours" label="Hours" value={entry.hours} updateDiaryField={updateDiaryField} type="number" />}
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="remarks" label="Remarks" value={entry.remarks} updateDiaryField={updateDiaryField} type="textarea" />
                      
                      {isTeacher && (
                        <div className="flex flex-col gap-2 pt-2 border-t dark:border-gray-800">
                          <Button onClick={() => toggleEditing(dateKey)} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : entry.isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                            {entry.isEditing ? "Save" : "Edit Entry"}
                          </Button>
                          
                          {onSetTeacherAttendance && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Teacher Attendance:
                              </span>
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                                <button
                                  type="button"
                                  disabled={actionLoadingDates?.[dateKey] === "present" || actionLoadingDates?.[dateKey] === "absent"}
                                  onClick={() => onSetTeacherAttendance(dateKey, "present")}
                                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-95 ${
                                    teacherStatus === "present"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                  } ${actionLoadingDates?.[dateKey] === "present" ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                                >
                                  {actionLoadingDates?.[dateKey] === "present" ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  )}
                                  Present
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoadingDates?.[dateKey] === "present" || actionLoadingDates?.[dateKey] === "absent"}
                                  onClick={() => onSetTeacherAttendance(dateKey, "absent")}
                                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-95 ${
                                    teacherStatus === "absent"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                  } ${actionLoadingDates?.[dateKey] === "absent" ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                                >
                                  {actionLoadingDates?.[dateKey] === "absent" ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <UserX className="w-3.5 h-3.5" />
                                  )}
                                  Absent
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            {onOpenAttendanceModal && (
                              <Button size="sm" variant="outline" onClick={() => onOpenAttendanceModal(dateKey, "attendance")} className="w-full bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold px-2 py-1.5 h-8 flex items-center justify-center gap-1">
                                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Attendance
                              </Button>
                            )}
                            {onOpenAttendanceModal && (
                              <Button size="sm" variant="outline" onClick={() => onOpenAttendanceModal(dateKey, "holiday")} className={`w-full text-xs font-semibold px-2 py-1.5 h-8 flex items-center justify-center gap-1 ${isHoliday ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300" : "text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800"}`}>
                                <Palmtree className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                {isHoliday ? "Holiday" : "Set Holiday"}
                              </Button>
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

  // Desktop View
  const renderDesktopView = () => (
    <Card className="hidden lg:block rounded-xl shadow-md border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-medium">Date</th>
                <th className="p-4 text-left font-medium">Day</th>
                <th className="p-4 text-left font-medium">Theory</th>
                <th className="p-4 text-left font-medium">Practical</th>
                <th className="p-4 text-left font-medium w-32">Practical No.</th>
                {isTeacher && <th className="p-4 text-left font-medium w-48">Extra Work</th>}
                {isTeacher && <th className="p-4 text-left font-medium w-24">Hours</th>}
                <th className="p-4 text-left font-medium w-48">Remarks</th>
                {isTeacher && <th className="p-4 text-center font-medium w-44">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 7 }).map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-20 w-full" /></td>
                      <td className="p-4"><Skeleton className="h-20 w-full" /></td>
                      <td className="p-4"><Skeleton className="h-20 w-full" /></td>
                      {isTeacher && <td className="p-4"><Skeleton className="h-20 w-full" /></td>}
                      {isTeacher && <td className="p-4"><Skeleton className="h-10 w-full" /></td>}
                      <td className="p-4"><Skeleton className="h-20 w-full" /></td>
                      {isTeacher && <td className="p-4"><Skeleton className="h-10 w-20" /></td>}
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
                    const rowAccent = isHoliday
                      ? "bg-red-50 dark:bg-red-950"
                      : teacherAbsentHighlight
                        ? TEACHER_ABSENT_ROW_CLASS
                        : !isTeacher && isAbsent
                          ? "bg-pink-50 dark:bg-pink-950"
                          : isWeekend && !isHoliday && !isAbsent
                            ? "bg-gray-100 dark:bg-gray-900"
                            : "";

                    return (
                      <tr key={dateKey} className={`border-b border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 ${rowAccent}`}>
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <span>{format(day, "MMM dd, yyyy")}</span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {isTeacher && renderTeacherBadge(teacherStatus)}
                              {isHoliday && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                                  <Palmtree className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Holiday
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">{format(day, "EEEE")}</td>
                        <td className="p-4 align-top">
                          {isHoliday && !isTeacher ? (
                            <p className="text-center py-4 text-muted-foreground">{holidays.get(dateKey)?.holidayText || "Holiday"}</p>
                          ) : studentAbsentBlock ? (
                            <p className="text-center py-4 text-muted-foreground">No entries</p>
                          ) : (
                            <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="theoryWork" value={entry.theoryWork || entry.theory} updateDiaryField={updateDiaryField} type="textarea" />
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                            <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalWork" value={entry.practicalWork || entry.practical} updateDiaryField={updateDiaryField} type="textarea" />
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                            <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalNumbers" value={entry.practicalNumbers} updateDiaryField={updateDiaryField} type="numberArray" />
                          )}
                        </td>
                        {isTeacher && (
                          <td className="p-4 align-top">
                            {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                              <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="extraWork" value={entry.extraWork} updateDiaryField={updateDiaryField} type="textarea" />
                            )}
                          </td>
                        )}
                        {isTeacher && (
                          <td className="p-4 align-top">
                            {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                              <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="hours" value={entry.hours} updateDiaryField={updateDiaryField} type="number" />
                            )}
                          </td>
                        )}
                        <td className="p-4 align-top">
                          {!(isHoliday && !isTeacher || studentAbsentBlock) && (
                            <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="remarks" value={entry.remarks} updateDiaryField={updateDiaryField} type="textarea" />
                          )}
                        </td>
                        {isTeacher && (
                          <td className="p-4 align-top">
                            <div className="flex flex-col gap-2 min-w-[160px]">
                              {/* Edit Entry Primary Button */}
                              <Button size="sm" onClick={() => toggleEditing(dateKey)} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : entry.isEditing ? <Save className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
                                {entry.isEditing ? "Save" : "Edit Entry"}
                              </Button>

                              {/* Segmented Teacher Attendance Selector (Present / Absent) */}
                              {onSetTeacherAttendance && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Teacher Attendance:
                                  </span>
                                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <button
                                      type="button"
                                      disabled={actionLoadingDates?.[dateKey] === "present" || actionLoadingDates?.[dateKey] === "absent"}
                                      onClick={() => onSetTeacherAttendance(dateKey, "present")}
                                      className={`flex-1 px-2 py-1 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-95 ${
                                        teacherStatus === "present"
                                          ? "bg-emerald-600 text-white shadow-xs"
                                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                      } ${actionLoadingDates?.[dateKey] === "present" ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                                      title="Mark Teacher Present"
                                    >
                                      {actionLoadingDates?.[dateKey] === "present" ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <UserCheck className="w-3.5 h-3.5" />
                                      )}
                                      Present
                                    </button>
                                    <button
                                      type="button"
                                      disabled={actionLoadingDates?.[dateKey] === "present" || actionLoadingDates?.[dateKey] === "absent"}
                                      onClick={() => onSetTeacherAttendance(dateKey, "absent")}
                                      className={`flex-1 px-2 py-1 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-95 ${
                                        teacherStatus === "absent"
                                          ? "bg-rose-600 text-white shadow-xs"
                                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                      } ${actionLoadingDates?.[dateKey] === "absent" ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                                      title="Mark Teacher Absent"
                                    >
                                      {actionLoadingDates?.[dateKey] === "absent" ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <UserX className="w-3.5 h-3.5" />
                                      )}
                                      Absent
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Student Attendance Modal Button */}
                              {onOpenAttendanceModal && (
                                <Button size="sm" variant="outline" onClick={() => onOpenAttendanceModal(dateKey, "attendance")} className="w-full bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold px-2 py-1.5 h-8 flex items-center justify-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Attendance
                                </Button>
                              )}

                              {/* Set / View Holiday Modal Button */}
                              {onOpenAttendanceModal && (
                                <Button size="sm" variant="outline" onClick={() => onOpenAttendanceModal(dateKey, "holiday")} className={`w-full text-xs font-semibold px-2 py-1.5 h-8 flex items-center justify-center gap-1 ${isHoliday ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300" : "text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800"}`} title={isHoliday ? "View/Manage Holiday" : "Set Day as Holiday"}>
                                  <Palmtree className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  {isHoliday ? "Holiday Details" : "Set Holiday"}
                                </Button>
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

const FieldRenderer = ({ isTeacher, isEditing, dateKey, field, label, value, updateDiaryField, type }) => {
  const commonProps = {
    value: value || "",
    onChange: (e) => updateDiaryField(dateKey, field, e.target.value),
  };

  const readOnlyView = type === "numberArray" ? (
      value && Array.isArray(value) && value.length > 0 ? (
        <div className="flex flex-wrap gap-1 p-3 bg-muted rounded-md min-h-[60px]">
          {value.map((num, i) => (
            <span key={i} className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-md">
              {num}
            </span>
          ))}
        </div>
      ) : <div className="p-3 bg-muted text-muted-foreground rounded-md min-h-[60px]">-</div>
  ) : (
    <div className="p-3 bg-muted rounded-md min-h-[60px] whitespace-pre-wrap">
      {value || "-"}
    </div>
  );

  const editView =
    type === "textarea" ? (
      <Textarea
        {...commonProps}
        placeholder={`Add ${
          label ? label.toLowerCase() : field
        } notes...`}
        className="min-h-20"
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
      <Input {...commonProps} type="number" placeholder="#" />
    );

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      {isTeacher && isEditing ? editView : readOnlyView}
    </div>
  );
};

export default DiaryWeekView;
