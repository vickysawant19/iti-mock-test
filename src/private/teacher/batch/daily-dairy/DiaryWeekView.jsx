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
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="theory" label="Theory" value={entry.theory} updateDiaryField={updateDiaryField} type="textarea" />
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practical" label="Practical" value={entry.practical} updateDiaryField={updateDiaryField} type="textarea" />
                      <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalNumber" label="Practical #" value={entry.practicalNumber} updateDiaryField={updateDiaryField} type="number" />
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
    <Card className="hidden lg:block">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-medium">Date</th>
                <th className="p-4 text-left font-medium">Day</th>
                <th className="p-4 text-left font-medium">Theory</th>
                <th className="p-4 text-left font-medium">Practical</th>
                <th className="p-4 text-left font-medium w-32">Practical #</th>
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
                      <td className="p-4"><Skeleton className="h-10 w-20" /></td>
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
                      <tr key={dateKey} className={`border-b ${isHoliday ? "bg-red-50 dark:bg-red-950" : isAbsent ? "bg-pink-50 dark:bg-pink-950" : isWeekend && !isHoliday && !isAbsent ? "bg-gray-100 dark:bg-gray-900" : ""}`}>
                        <td className="p-4 align-top">
                          {format(day, "MMM dd, yyyy")}
                          {isAbsent && <Badge variant="destructive" className="ml-2">Absent</Badge>}
                          {isHoliday && <Badge variant="destructive" className="ml-2">Holiday</Badge>}
                        </td>
                        <td className="p-4 align-top">{format(day, "EEEE")}</td>
                        <td className="p-4 align-top">
                          {isHoliday ? <p className="text-center py-4 text-muted-foreground">{holidays.get(dateKey)?.holidayText || "Holiday"}</p> : isAbsent ? <p className="text-center py-4 text-muted-foreground">No entries</p> : <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="theory" value={entry.theory} updateDiaryField={updateDiaryField} type="textarea" />}
                        </td>
                        <td className="p-4 align-top">
                          {!(isHoliday || isAbsent) && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practical" value={entry.practical} updateDiaryField={updateDiaryField} type="textarea" />}
                        </td>
                        <td className="p-4 align-top">
                          {!(isHoliday || isAbsent) && <FieldRenderer isTeacher={isTeacher} isEditing={entry.isEditing} dateKey={dateKey} field="practicalNumber" value={entry.practicalNumber} updateDiaryField={updateDiaryField} type="number" />}
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

  const readOnlyView = (
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
