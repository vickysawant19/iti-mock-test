import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { selectActiveBatchId } from "@/store/activeBatchSlice";
import dailyDiaryService from "@/appwrite/dailyDiaryService";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";
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
  BookOpen,
  Wrench,
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

export const DiaryMobileCard = React.memo(({
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
  const dateKey = format(day, "yyyy-MM-dd");

  const isPresentLoading = actionLoadingDates?.[dateKey] === "present";
  const isAbsentLoading = actionLoadingDates?.[dateKey] === "absent";

  const [localIsEditing, setLocalIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = isTeacher && (entry?.isEditing || localIsEditing);

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

  const handleToggleEdit = () => {
    if (toggleEditing) {
      toggleEditing(dateKey);
    } else {
      setLocalIsEditing((prev) => !prev);
    }
  };

  const handleSave = async () => {
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
        const updatedDoc = await dailyDiaryService.updateDocument(entry.$id, {
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
        const newDoc = await dailyDiaryService.createDocument({
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

  const renderTeacherStatusBadge = () => {
    if (teacherStatus === "present") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Present
        </span>
      );
    }
    if (teacherStatus === "absent") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs font-bold inline-flex items-center gap-1 border border-rose-200 dark:border-rose-800">
          <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Absent
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3.5 h-3.5 text-slate-400" /> Not Marked
      </span>
    );
  };

  return (
    <Card
      className={`relative overflow-hidden rounded-[20px] border transition-all duration-200 shadow-xs hover:shadow-md ${
        isHoliday
          ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
          : isAbsent && !isHoliday
          ? `${TEACHER_ABSENT_ROW_CLASS} rounded-2xl border border-red-200 dark:border-red-900`
          : isWeekend
          ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
      }`}
    >
      {isHoliday && <div className="h-1.5 w-full bg-amber-500" />}
      {isAbsent && !isHoliday && <div className="h-1.5 w-full bg-rose-500" />}

      <CardContent className="p-4 space-y-4">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {format(day, "EEEE")}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {format(day, "MMM dd, yyyy")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {isTeacher && renderTeacherStatusBadge()}
            {isHoliday && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 text-[11px] font-bold inline-flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                <Palmtree className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Holiday
              </span>
            )}
            {isWeekend && !isHoliday && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                Weekend
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        {isEditing ? (
          <div className="space-y-3 pt-1">
            {updateDiaryField ? (
              <>
                <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="theoryWork" label="Theory Work" value={entry?.theoryWork || entry?.theory} updateDiaryField={updateDiaryField} type="textarea" />
                <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="practicalWork" label="Practical Work" value={entry?.practicalWork || entry?.practical} updateDiaryField={updateDiaryField} type="textarea" />
                <div className="grid grid-cols-2 gap-3">
                  <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="practicalNumbers" label="Practical No." value={entry?.practicalNumbers} updateDiaryField={updateDiaryField} type="numberArray" />
                  <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="hours" label="Hours" value={entry?.hours} updateDiaryField={updateDiaryField} type="number" />
                </div>
                <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="extraWork" label="Extra Work" value={entry?.extraWork} updateDiaryField={updateDiaryField} type="textarea" />
                <FieldRenderer isTeacher={isTeacher} isEditing={true} dateKey={dateKey} field="remarks" label="Remarks" value={entry?.remarks} updateDiaryField={updateDiaryField} type="textarea" />
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Theory Work</label>
                  <Textarea value={formData.theoryWork} rows={2} onChange={(e) => setFormData({ ...formData, theoryWork: e.target.value })} placeholder="Add theory notes..." className="w-full text-sm bg-slate-50 dark:bg-slate-950" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Practical Work</label>
                  <Textarea value={formData.practicalWork} rows={2} onChange={(e) => setFormData({ ...formData, practicalWork: e.target.value })} placeholder="Add practical notes..." className="w-full text-sm bg-slate-50 dark:bg-slate-950" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Practical No.</label>
                    <PracticalNumberInput value={formData.practicalNumbers} placeholder="e.g. 1, 3" onChange={(val) => setFormData({ ...formData, practicalNumbers: val })} className="bg-slate-50 dark:bg-slate-950" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Hours</label>
                    <Input type="number" value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} placeholder="e.g. 2" className="bg-slate-50 dark:bg-slate-950" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Extra Work</label>
                  <Textarea value={formData.extraWork} rows={2} onChange={(e) => setFormData({ ...formData, extraWork: e.target.value })} placeholder="Extra work..." className="w-full text-sm bg-slate-50 dark:bg-slate-950" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Remarks</label>
                  <Textarea value={formData.remarks} rows={2} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Remarks..." className="w-full text-sm bg-slate-50 dark:bg-slate-950" />
                </div>
              </>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" onClick={handleSave} disabled={isSaving || isSubmitting} className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs">
                {isSaving || isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Entry
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving || isSubmitting} className="min-h-[44px] px-4 font-semibold text-slate-600 dark:text-slate-300">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {isHoliday && !isTeacher ? (
              <div className="p-3 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-center font-medium text-sm">
                <Palmtree className="w-5 h-5 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
                {holidayText || "Holiday"}
              </div>
            ) : isAbsent && !isTeacher ? (
              <p className="text-center py-4 text-xs font-medium text-slate-500">No entries for absent day</p>
            ) : (
              <div
                onClick={() => isTeacher && handleToggleEdit()}
                title={isTeacher ? "Click to edit entry" : ""}
                className={`grid grid-cols-2 gap-3 text-sm p-2 -m-2 rounded-xl transition-colors ${
                  isTeacher ? "cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/30" : ""
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                    <BookOpen className="w-3 h-3 text-blue-500" /> Theory
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-xs whitespace-pre-wrap">
                    {entry?.theoryWork || entry?.theory || (isTeacher ? "+ Add Theory Work" : "—")}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                    <Wrench className="w-3 h-3 text-purple-500" /> Practical
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-xs whitespace-pre-wrap">
                    {entry?.practicalWork || entry?.practical || (isTeacher ? "+ Add Practical Work" : "—")}
                  </p>
                </div>

                {entry?.practicalNumbers && entry.practicalNumbers.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      Practical No.
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(entry.practicalNumbers) ? entry.practicalNumbers : [entry.practicalNumbers]).map((num, i) => (
                        <span key={i} className="px-1.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                          #{num}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entry?.hours && (
                  <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      Hours
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {entry.hours} hrs
                    </span>
                  </div>
                )}

                {(entry?.extraWork || entry?.remarks) && (
                  <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 col-span-2 space-y-1">
                    {entry?.extraWork && entry.extraWork !== "-" && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Extra Work:
                        </span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 ml-1">
                          {entry.extraWork}
                        </span>
                      </div>
                    )}
                    {entry?.remarks && entry.remarks !== "-" && entry.remarks !== "Prac #: -" && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Remarks:
                        </span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 ml-1">
                          {entry.remarks}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Actions Footer */}
            {isTeacher && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                {onSetTeacherAttendance && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Teacher Attendance:
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      {/* Present button — always shown on holidays */}
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
                        {isPresentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        Present
                      </button>

                      {/* On holiday: no Absent. Show Undo if any attendance is marked (present or absent). */}
                      {isHoliday ? (
                        teacherStatus && onDeleteTeacherAttendance ? (
                          <button
                            type="button"
                            disabled={actionLoadingDates?.[dateKey] === "deleting"}
                            onClick={() => onDeleteTeacherAttendance(dateKey)}
                            className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                          >
                            {actionLoadingDates?.[dateKey] === "deleting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Undo
                          </button>
                        ) : null
                      ) : (
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
                          {isAbsentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                          Absent
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleToggleEdit}
                    disabled={isSubmitting}
                    className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs rounded-xl"
                  >
                    <Edit className="w-4 h-4 mr-1.5" />
                    <span>Edit Entry</span>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default DiaryMobileCard;
