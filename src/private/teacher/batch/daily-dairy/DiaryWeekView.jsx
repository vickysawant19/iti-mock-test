import React from "react";
import { format } from "date-fns";
import { Edit, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const DiaryWeekView = ({
  weekDays,
  diaryData,
  attendance,
  holidays,
  isLoading,
  isTeacher,
  isSubmitting,
  updateDiaryField,
  toggleEditing,
}) => {
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
            const entry = diaryData[dateKey] || { isEditing: isTeacher };
            const isAbsent = attendance.get(dateKey) === "absent";
            const isHoliday = holidays.has(dateKey);
            const isWeekend = ["Sat", "Sun"].includes(format(day, "E"));

            return (
              <Card
                key={dateKey}
                className={`${isHoliday ? "border-red-500 bg-red-50 dark:bg-red-950" : ""} ${
                  isAbsent ? "border-pink-500 bg-pink-50 dark:bg-pink-950" : ""
                } ${isWeekend && !isHoliday && !isAbsent ? "bg-gray-100 dark:bg-gray-900" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{format(day, "EEEE")}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{format(day, "MMM dd, yyyy")}</p>
                    </div>
                    {isAbsent && <Badge variant="destructive">Absent</Badge>}
                    {isHoliday && <Badge variant="destructive">Holiday</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isHoliday ? (
                    <p className="text-center py-4 text-muted-foreground">{holidays.get(dateKey)?.holidayText || "Holiday"}</p>
                  ) : isAbsent ? (
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
                        <Button onClick={() => toggleEditing(dateKey)} disabled={isSubmitting} className="w-full">
                          {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : entry.isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                          {entry.isEditing ? "Save" : "Edit"}
                        </Button>
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
                {isTeacher && <th className="p-4 text-center font-medium w-32">Actions</th>}
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
                    const entry = diaryData[dateKey] || { isEditing: isTeacher };
                    const isAbsent = attendance.get(dateKey) === "absent";
                    const isHoliday = holidays.has(dateKey);
                    const isWeekend = ["Sat", "Sun"].includes(format(day, "E"));

                    return (
                      <tr key={dateKey} className={`border-b border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 ${isHoliday ? "bg-red-50 dark:bg-red-950" : isAbsent ? "bg-pink-50 dark:bg-pink-950" : isWeekend && !isHoliday && !isAbsent ? "bg-gray-100 dark:bg-gray-900" : ""}`}>
                        <td className="p-4 align-top">
                          {format(day, "MMM dd, yyyy")}
                          {isAbsent && <Badge variant="destructive" className="ml-2">Absent</Badge>}
                          {isHoliday && <Badge variant="destructive" className="ml-2">Holiday</Badge>}
                        </td>
                        <td className="p-4 align-top">{format(day, "EEEE")}</td>
                        <td className="p-4 align-top">
                          {isHoliday ? <p className="text-center py-4 text-muted-foreground">{holidays.get(dateKey)?.holidayText || "Holiday"}</p> : isAbsent ? <p className="text-center py-4 text-muted-foreground">No entries</p> : <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="theoryWork" value={entry.theoryWork || entry.theory} updateDiaryField={updateDiaryField} type="textarea" />}
                        </td>
                        <td className="p-4 align-top">
                          {!(isHoliday || isAbsent) && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalWork" value={entry.practicalWork || entry.practical} updateDiaryField={updateDiaryField} type="textarea" />}
                        </td>
                        <td className="p-4 align-top">
                          {!(isHoliday || isAbsent) && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalNumbers" value={entry.practicalNumbers} updateDiaryField={updateDiaryField} type="numberArray" />}
                        </td>
                        {isTeacher && (
                          <td className="p-4 align-top">
                            {!(isHoliday || isAbsent) && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="extraWork" value={entry.extraWork} updateDiaryField={updateDiaryField} type="textarea" />}
                          </td>
                        )}
                        {isTeacher && (
                          <td className="p-4 align-top">
                            {!(isHoliday || isAbsent) && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="hours" value={entry.hours} updateDiaryField={updateDiaryField} type="number" />}
                          </td>
                        )}
                        <td className="p-4 align-top">
                          {!(isHoliday || isAbsent) && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="remarks" value={entry.remarks} updateDiaryField={updateDiaryField} type="textarea" />}
                        </td>
                        {isTeacher && (
                          <td className="p-4 align-top text-center">
                            {!(isHoliday || isAbsent) && (
                              <Button size="sm" onClick={() => toggleEditing(dateKey)} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : entry.isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                              </Button>
                            )}
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
      <Input
        value={Array.isArray(value) ? value.join(", ") : value || ""}
        placeholder="e.g. 1, 3"
        onChange={(e) => {
           const parsed = e.target.value.split(",").map(v => v.trim()).filter(Boolean);
           updateDiaryField(dateKey, field, parsed);
        }}
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
