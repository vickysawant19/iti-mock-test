import React, { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { selectActiveBatchId } from "@/store/activeBatchSlice";
import dailyDiaryService from "@/appwrite/dailyDiaryService";
import { toast } from "react-toastify";
import AttendanceStatusBadge from "@/components/components/AttendanceStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Users,
  UserCheck,
  UserX,
  Palmtree,
  Clock,
  Edit,
  Save,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PracticalNumberInput } from "../PracticalNumberInput";
import { TEACHER_ABSENT_ROW_CLASS } from "../diaryAbsentHighlight";
import FieldRenderer from "./FieldRenderer";
import TeacherAttendanceControl from "@/private/Attendance/components/TeacherAttendanceControl";

export const DiaryTableRow = React.memo(({
  day,
  entry,
  isHoliday,
  isAbsent,
  teacherStatus,
  actionLoadingDates,
  isWeekend,
  holidayText,
  isTeacher = true,
  isSubmitting = false,
  onUpdateEntry,
  onOpenAttendanceModal,
  onSetTeacherAttendance,
  onDeleteTeacherAttendance,
  updateDiaryField,
  toggleEditing,
}) => {
  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector(selectActiveBatchId);
  const isMissing = !entry;
  const dateKey = format(day, "yyyy-MM-dd");

  const isPresentLoading = actionLoadingDates?.[dateKey] === "present";
  const isAbsentLoading = actionLoadingDates?.[dateKey] === "absent";

  const [localIsEditing, setLocalIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingDiary, setIsDeletingDiary] = useState(false);

  const handleDeleteDiaryEntry = async () => {
    if (!entry?.$id) return;
    if (!window.confirm(`Are you sure you want to delete the daily diary entry for ${format(day, "MMM dd, yyyy")}?`)) {
      return;
    }
    setIsDeletingDiary(true);
    try {
      await dailyDiaryService.deleteEntry(entry.$id);
      toast.success("Daily diary record deleted successfully");
      if (onUpdateEntry) {
        onUpdateEntry(dateKey, {
          theoryWork: "",
          practicalWork: "",
          practicalNumbers: [],
          extraWork: "",
          hours: "",
          remarks: "",
          isEditing: false,
        });
      }
    } catch (error) {
      console.error("Error deleting diary document:", error);
      toast.error("Failed to delete diary record");
    } finally {
      setIsDeletingDiary(false);
    }
  };

  const isEditing = isTeacher && (entry?.isEditing || localIsEditing);
  const studentAbsentBlock = !isTeacher && isAbsent && !isHoliday;

  const [formData, setFormData] = useState({
    theoryWork: entry?.theoryWork || "",
    practicalWork: entry?.practicalWork || "",
    practicalNumbers: Array.isArray(entry?.practicalNumbers)
      ? entry.practicalNumbers.join(", ")
      : entry?.practicalNumbers || "",
    extraWork: entry?.extraWork || "",
    hours: entry?.hours || "",
    remarks: entry?.remarks || "",
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        theoryWork: entry.theoryWork || "",
        practicalWork: entry.practicalWork || "",
        practicalNumbers: Array.isArray(entry.practicalNumbers)
          ? entry.practicalNumbers.join(", ")
          : entry.practicalNumbers || "",
        extraWork: entry.extraWork || "",
        hours: entry.hours || "",
        remarks: entry.remarks || "",
      });
      setLocalIsEditing(false);
    }
  }, [entry]);

  const initialRef = useRef(null);

  useEffect(() => {
    if (isEditing && !initialRef.current) {
      initialRef.current = {
        theoryWork: (entry?.theoryWork || entry?.theory || "").trim(),
        practicalWork: (entry?.practicalWork || entry?.practical || "").trim(),
        practicalNumbers: (Array.isArray(entry?.practicalNumbers)
          ? entry.practicalNumbers.join(", ")
          : entry?.practicalNumbers || "").trim(),
        extraWork: (entry?.extraWork || "").trim(),
        hours: entry?.hours !== null && entry?.hours !== undefined ? String(entry.hours).trim() : "",
        remarks: (entry?.remarks || "").trim(),
      };
    } else if (!isEditing) {
      initialRef.current = null;
    }
  }, [isEditing, entry]);

  const currentTheory = (updateDiaryField ? (entry?.theoryWork || entry?.theory) : formData.theoryWork) || "";
  const currentPractical = (updateDiaryField ? (entry?.practicalWork || entry?.practical) : formData.practicalWork) || "";
  const currentPracticalNumbers = updateDiaryField
    ? (Array.isArray(entry?.practicalNumbers) ? entry.practicalNumbers.join(", ") : entry?.practicalNumbers || "")
    : (typeof formData.practicalNumbers === "string" ? formData.practicalNumbers : (Array.isArray(formData.practicalNumbers) ? formData.practicalNumbers.join(", ") : ""));
  const currentExtra = (updateDiaryField ? entry?.extraWork : formData.extraWork) || "";
  const currentHours = updateDiaryField
    ? (entry?.hours !== null && entry?.hours !== undefined ? String(entry.hours) : "")
    : (formData.hours !== null && formData.hours !== undefined ? String(formData.hours) : "");
  const currentRemarks = (updateDiaryField ? entry?.remarks : formData.remarks) || "";

  const isDirty = useMemo(() => {
    const th = currentTheory.trim();
    const pr = currentPractical.trim();
    const pn = currentPracticalNumbers.trim();
    const ex = currentExtra.trim();
    const hr = currentHours.trim();
    const rm = currentRemarks.trim();

    if (!entry?.$id) {
      return Boolean(th || pr || pn || ex || hr || (rm && rm !== "-"));
    }
    if (!initialRef.current) return false;

    return (
      th !== initialRef.current.theoryWork ||
      pr !== initialRef.current.practicalWork ||
      pn !== initialRef.current.practicalNumbers ||
      ex !== initialRef.current.extraWork ||
      hr !== initialRef.current.hours ||
      rm !== initialRef.current.remarks
    );
  }, [entry?.$id, currentTheory, currentPractical, currentPracticalNumbers, currentExtra, currentHours, currentRemarks]);

  const handleToggleEdit = () => {
    if (!isTeacher) return;
    if (toggleEditing) {
      toggleEditing(dateKey);
    } else {
      setLocalIsEditing((prev) => !prev);
    }
  };

  const handleSave = async () => {
    if (!isTeacher) return;

    if (!isDirty) {
      if (entry && entry.$id) {
        toast.info("No changes detected to save.");
        handleCancel();
        return;
      } else {
        toast.error("Please enter some work details before saving.");
        return;
      }
    }

    if (toggleEditing && entry?.isEditing) {
      toggleEditing(dateKey);
      return;
    }

    setIsSaving(true);
    try {
      const parsedPractical =
        typeof formData.practicalNumbers === "string"
          ? formData.practicalNumbers
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : Array.isArray(formData.practicalNumbers)
          ? formData.practicalNumbers
          : [];

      if (entry && entry.$id) {
        const updatedDoc = await dailyDiaryService.updateEntry(entry.$id, {
          theoryWork: formData.theoryWork,
          practicalWork: formData.practicalWork,
          practicalNumbers: parsedPractical,
          extraWork: formData.extraWork,
          hours: formData.hours ? Number(formData.hours) : null,
          remarks: formData.remarks,
        });
        toast.success("Entry updated successfully");
        setLocalIsEditing(false);
        if (onUpdateEntry) onUpdateEntry(dateKey, updatedDoc);
      } else {
        if (!formData.theoryWork && !formData.practicalWork && !formData.extraWork) {
          toast.error("Please enter some work details before saving.");
          setIsSaving(false);
          return;
        }

        const dateISO = new Date(dateKey).toISOString();
        const newDoc = await dailyDiaryService.createEntry({
          date: dateISO,
          theoryWork: formData.theoryWork,
          practicalWork: formData.practicalWork,
          practicalNumbers: parsedPractical,
          extraWork: formData.extraWork,
          hours: formData.hours ? Number(formData.hours) : null,
          remarks: formData.remarks || "-",
          instructorId: profile?.userId,
          batchId: activeBatchId,
        });
        toast.success("Entry added successfully");
        setLocalIsEditing(false);
        if (onUpdateEntry) onUpdateEntry(dateKey, newDoc);
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (toggleEditing && entry?.isEditing) {
      toggleEditing(dateKey);
    } else {
      setLocalIsEditing(false);
    }
  };

  const absentHighlight = isAbsent && !isHoliday ? TEACHER_ABSENT_ROW_CLASS : "";
  const rowClass = `group transition-colors border-gray-200 dark:border-gray-800 ${
    isHoliday
      ? "bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 border-amber-200 dark:border-amber-900"
      : absentHighlight && isTeacher
      ? `${absentHighlight} hover:bg-red-100/40 dark:hover:bg-red-950/40`
      : !isTeacher && isAbsent
      ? "bg-pink-50 dark:bg-pink-950/40"
      : isWeekend
      ? "bg-gray-50/50 dark:bg-gray-900/40 hover:bg-gray-100/50"
      : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
  }`;

  const renderStatusBadge = () => {
    return <AttendanceStatusBadge status={teacherStatus} showLabel={true} size="md" />;
  };

  const cellClickProps = {
    onClick: () => isTeacher && handleToggleEdit(),
    title: isTeacher ? "Click to edit entry" : "",
  };

  if (!entry && isHoliday && !isTeacher) {
    return (
      <tr className={`${rowClass} border-b`}>
        <td className="p-3.5 align-middle">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
              {format(day, "MMM dd, yyyy")}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
              <Palmtree className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Holiday
            </span>
          </div>
        </td>
        <td className="p-3.5 text-muted-foreground align-middle text-xs font-medium">
          {format(day, "EEEE")}
        </td>
        <td className="p-3.5 align-middle whitespace-nowrap">
          {renderStatusBadge()}
        </td>
        <td className="p-3.5 whitespace-pre-wrap text-left align-middle" colSpan={4}>
          <span className="text-amber-700 dark:text-amber-400 font-medium text-xs">
            {holidayText || "Holiday"}
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`${rowClass} border-b`}>
      <td className="p-3.5 align-middle">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
            {format(day, "MMM dd, yyyy")}
          </span>
          {isHoliday && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
              <Palmtree className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Holiday Work
            </span>
          )}
        </div>
      </td>
      <td className="p-3.5 text-muted-foreground align-middle text-xs font-medium">
        {format(day, "EEEE")}
      </td>

      {/* Attendance Cell */}
      <td className="p-3.5 align-middle whitespace-nowrap">
        <TeacherAttendanceControl
          dateKey={dateKey}
          teacherStatus={teacherStatus}
          isHoliday={isHoliday}
          actionLoadingDates={actionLoadingDates}
          onSetTeacherAttendance={onSetTeacherAttendance}
          onDeleteTeacherAttendance={onDeleteTeacherAttendance}
          readOnly={!isTeacher}
        />
      </td>

      {isEditing ? (
        <>
          {updateDiaryField ? (
            <>
              <td className="p-2 align-top min-w-[180px]">
                <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="theoryWork" value={entry?.theoryWork || entry?.theory} updateDiaryField={updateDiaryField} type="textarea" />
              </td>
              <td className="p-2 align-top min-w-[180px]">
                <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="practicalWork" value={entry?.practicalWork || entry?.practical} updateDiaryField={updateDiaryField} type="textarea" />
              </td>
              <td className="p-2 align-top min-w-[120px]">
                <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="practicalNumbers" value={entry?.practicalNumbers} updateDiaryField={updateDiaryField} type="numberArray" />
              </td>
              {isTeacher && (
                <td className="p-2 align-top min-w-[130px]">
                  <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="extraWork" value={entry?.extraWork} updateDiaryField={updateDiaryField} type="textarea" />
                </td>
              )}
              {isTeacher && (
                <td className="p-2 align-top w-20 text-right">
                  <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="hours" value={entry?.hours} updateDiaryField={updateDiaryField} type="number" />
                </td>
              )}
              <td className="p-2 align-top min-w-[130px]">
                <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="remarks" value={entry?.remarks} updateDiaryField={updateDiaryField} type="textarea" />
              </td>
            </>
          ) : (
            <>
              <td className="p-2 align-top min-w-[180px]">
                <Textarea className="w-full border p-2 rounded-md bg-slate-50 dark:bg-slate-950 text-xs" value={formData.theoryWork} rows={2} onChange={(e) => setFormData({ ...formData, theoryWork: e.target.value })} placeholder="Add theory notes..." />
              </td>
              <td className="p-2 align-top min-w-[180px]">
                <Textarea className="w-full border p-2 rounded-md bg-slate-50 dark:bg-slate-950 text-xs" value={formData.practicalWork} rows={2} onChange={(e) => setFormData({ ...formData, practicalWork: e.target.value })} placeholder="Add practical notes..." />
              </td>
              <td className="p-2 align-top min-w-[120px]">
                <PracticalNumberInput className="w-full bg-slate-50 dark:bg-slate-950" value={formData.practicalNumbers} placeholder="e.g. 1, 3" onChange={(newValue) => setFormData({ ...formData, practicalNumbers: newValue })} />
              </td>
              {isTeacher && (
                <td className="p-2 align-top min-w-[130px]">
                  <Textarea className="w-full border p-2 rounded-md bg-slate-50 dark:bg-slate-950 text-xs" value={formData.extraWork} rows={2} placeholder="-" onChange={(e) => setFormData({ ...formData, extraWork: e.target.value })} />
                </td>
              )}
              {isTeacher && (
                <td className="p-2 align-top w-20">
                  <Input className="w-full border p-2 rounded-md bg-slate-50 dark:bg-slate-950 text-xs text-right" value={formData.hours} type="number" placeholder="-" onChange={(e) => setFormData({ ...formData, hours: e.target.value })} />
                </td>
              )}
              <td className="p-2 align-top min-w-[130px]">
                <Textarea className="w-full border p-2 rounded-md bg-slate-50 dark:bg-slate-950 text-xs" value={formData.remarks} rows={2} placeholder="-" onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
              </td>
            </>
          )}
          {isTeacher && (
            <td className="p-3.5 align-middle whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5">
                <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving || isSubmitting} className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs text-xs font-bold">
                  {isSaving || isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving || isSubmitting} className="h-8 px-2.5 text-xs text-gray-600 border-gray-300">
                  Cancel
                </Button>
              </div>
            </td>
          )}
        </>
      ) : (
        <>
          {/* Theory Cell */}
          <td {...cellClickProps} className={`p-3.5 align-middle whitespace-pre-wrap max-w-[200px] text-xs transition-colors ${isTeacher ? "cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40" : ""}`}>
            {studentAbsentBlock ? (
              <span className="text-slate-400 italic text-xs font-normal">Absent</span>
            ) : isHoliday && !isTeacher ? (
              <span className="text-amber-700 dark:text-amber-400 font-medium text-xs">{holidayText || "Holiday"}</span>
            ) : entry?.theoryWork || entry?.theory ? (
              <span className="text-gray-800 dark:text-gray-200 font-medium group-hover/cell:text-blue-600 dark:group-hover/cell:text-blue-400">{entry.theoryWork || entry.theory}</span>
            ) : (
              <span className="text-gray-400 italic font-normal">{isTeacher ? "+ Add Theory" : "—"}</span>
            )}
          </td>

          {/* Practical Cell */}
          <td {...cellClickProps} className={`p-3.5 align-middle whitespace-pre-wrap max-w-[200px] text-xs transition-colors ${isTeacher ? "cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40" : ""}`}>
            {studentAbsentBlock ? (
              <span className="text-slate-400 italic text-xs font-normal">—</span>
            ) : !(isHoliday && !isTeacher) && (entry?.practicalWork || entry?.practical) ? (
              <span className="text-gray-800 dark:text-gray-200 font-medium group-hover/cell:text-blue-600 dark:group-hover/cell:text-blue-400">{entry.practicalWork || entry.practical}</span>
            ) : (
              <span className="text-gray-400 italic font-normal">{isTeacher ? "+ Add Practical" : "—"}</span>
            )}
          </td>

          {/* Practical No. Cell */}
          <td {...cellClickProps} className={`p-3.5 align-middle whitespace-nowrap transition-colors ${isTeacher ? "cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40" : ""}`}>
            {studentAbsentBlock ? (
              <span className="text-slate-400 italic text-xs font-normal">—</span>
            ) : !(isHoliday && !isTeacher) && entry?.practicalNumbers && entry.practicalNumbers.length > 0 ? (
              <div className="flex flex-wrap gap-1 max-w-[130px]">
                {(Array.isArray(entry.practicalNumbers) ? entry.practicalNumbers : [entry.practicalNumbers]).map((num, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                    #{num}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs font-normal">{isTeacher ? "+ Add No." : "—"}</span>
            )}
          </td>

          {/* Extra Work Cell */}
          {isTeacher && (
            <td {...cellClickProps} className="p-3.5 align-middle whitespace-pre-wrap max-w-[150px] text-xs cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
              {entry?.extraWork && entry.extraWork !== "-" ? (
                <span className="text-gray-700 dark:text-gray-300 group-hover/cell:text-blue-600 dark:group-hover/cell:text-blue-400">{entry.extraWork}</span>
              ) : (
                <span className="text-gray-400 italic font-normal">—</span>
              )}
            </td>
          )}

          {/* Hours Cell */}
          {isTeacher && (
            <td {...cellClickProps} className="p-3.5 align-middle whitespace-nowrap text-right text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
              {entry?.hours ? `${entry.hours} hrs` : <span className="text-gray-400 font-normal italic hover:text-blue-500">—</span>}
            </td>
          )}

          {/* Remarks Cell */}
          <td {...cellClickProps} className={`p-3.5 align-middle whitespace-pre-wrap max-w-[160px] text-xs transition-colors ${isTeacher ? "cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40" : ""}`}>
            {studentAbsentBlock ? (
              <span className="text-slate-400 italic text-xs font-normal">—</span>
            ) : entry?.remarks && entry.remarks !== "-" && entry.remarks !== "Prac #: -" ? (
              <span className="text-gray-700 dark:text-gray-300 group-hover/cell:text-blue-600 dark:group-hover/cell:text-blue-400">{entry.remarks}</span>
            ) : (
              <span className="text-gray-400 italic font-normal">—</span>
            )}
          </td>

          {/* Actions Cell */}
          {isTeacher && (
            <td className="p-3.5 align-middle whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5 min-w-[120px]">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold px-2.5 py-1.5 h-8 flex items-center gap-1"
                  onClick={handleToggleEdit}
                  disabled={isSubmitting}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>

                {entry?.$id && (teacherStatus === "absent" || teacherStatus === "a" || isAbsent) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeleteDiaryEntry}
                    disabled={isDeletingDiary}
                    className="h-8 px-2 text-xs font-bold text-rose-600 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/60 flex items-center gap-1"
                    title="Delete diary document for this absent day"
                  >
                    {isDeletingDiary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Delete Diary</span>
                  </Button>
                )}

                {(onOpenAttendanceModal || (entry?.$id && (teacherStatus === "absent" || teacherStatus === "a" || isAbsent))) && (
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
                    <DropdownMenuContent align="end" className="w-52">
                      {onOpenAttendanceModal && (
                        <>
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
                        </>
                      )}

                      {entry?.$id && (teacherStatus === "absent" || teacherStatus === "a" || isAbsent) && (
                        <DropdownMenuItem
                          onClick={handleDeleteDiaryEntry}
                          disabled={isDeletingDiary}
                          className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                        >
                          {isDeletingDiary ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          )}
                          Delete Diary Document
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </td>
          )}
        </>
      )}
    </tr>
  );
});

export default DiaryTableRow;
