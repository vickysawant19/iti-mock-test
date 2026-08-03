import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dailyDiaryService from "@/appwrite/dailyDiaryService";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { PracticalNumberInput } from "./PracticalNumberInput";
import { TEACHER_ABSENT_ROW_CLASS } from "./diaryAbsentHighlight";

/* -------------------------------------------------------------------------- */
/*                            MOBILE CARD COMPONENT                           */
/* -------------------------------------------------------------------------- */
function DiaryMobileCard({
  day,
  entry,
  isHoliday,
  isAbsent,
  teacherStatus,
  actionLoadingDates,
  isWeekend,
  holidayText,
  onUpdateEntry,
  onOpenAttendanceModal,
  onSetTeacherAttendance,
  onRemoveHoliday,
}) {
  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector((state) => state.activeBatch.activeBatchId);
  const isMissing = !entry;
  const dateKey = format(day, "yyyy-MM-dd");

  const isPresentLoading = actionLoadingDates?.[dateKey] === "present";
  const isAbsentLoading = actionLoadingDates?.[dateKey] === "absent";

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      setIsEditing(false);
    } else {
      setFormData({
        theoryWork: "",
        practicalWork: "",
        practicalNumbers: [],
        extraWork: "",
        hours: "",
        remarks: "",
      });
      setIsEditing(false);
    }
  }, [entry]);

  const handleSave = async () => {
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
        setIsEditing(false);
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
          instructorId: profile.userId,
          batchId: activeBatchId,
        });
        toast.success("Entry added successfully");
        setIsEditing(false);
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
    if (isMissing) {
      setFormData({
        theoryWork: "",
        practicalWork: "",
        practicalNumbers: [],
        extraWork: "",
        hours: "",
        remarks: "",
      });
      setIsEditing(false);
    } else {
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
      setIsEditing(false);
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
          ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
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
            {renderTeacherStatusBadge()}
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
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Theory Work
              </label>
              <Textarea
                value={formData.theoryWork}
                rows={2}
                onChange={(e) => setFormData({ ...formData, theoryWork: e.target.value })}
                placeholder="Add theory notes..."
                className="w-full text-sm bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Practical Work
              </label>
              <Textarea
                value={formData.practicalWork}
                rows={2}
                onChange={(e) => setFormData({ ...formData, practicalWork: e.target.value })}
                placeholder="Add practical notes..."
                className="w-full text-sm bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Practical No.
                </label>
                <PracticalNumberInput
                  value={formData.practicalNumbers}
                  placeholder="e.g. 1, 3"
                  onChange={(val) => setFormData({ ...formData, practicalNumbers: val })}
                  className="bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Hours
                </label>
                <Input
                  type="number"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="e.g. 2"
                  className="bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Extra Work
              </label>
              <Textarea
                value={formData.extraWork}
                rows={2}
                onChange={(e) => setFormData({ ...formData, extraWork: e.target.value })}
                placeholder="Extra work..."
                className="w-full text-sm bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Remarks
              </label>
              <Textarea
                value={formData.remarks}
                rows={2}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Remarks..."
                className="w-full text-sm bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Entry
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="min-h-[44px] px-4 font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {isHoliday && teacherStatus !== "present" ? (
              <div className="p-3 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-center font-medium text-sm">
                <Palmtree className="w-5 h-5 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
                {holidayText || "Holiday"}
              </div>
            ) : (
              /* Click anywhere in body to trigger edit mode */
              <div
                onClick={() => setIsEditing(true)}
                title="Click to edit entry"
                className="grid grid-cols-2 gap-3 text-sm cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/30 p-2 -m-2 rounded-xl transition-colors group/cardbody"
              >
                {entry?.theoryWork ? (
                  <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                      <BookOpen className="w-3 h-3 text-blue-500" /> Theory
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium text-xs whitespace-pre-wrap">
                      {entry.theoryWork}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50/40 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1 text-slate-400 text-xs italic">
                    + Add Theory Work
                  </div>
                )}

                {entry?.practicalWork ? (
                  <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                      <Wrench className="w-3 h-3 text-purple-500" /> Practical
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium text-xs whitespace-pre-wrap">
                      {entry.practicalWork}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50/40 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1 text-slate-400 text-xs italic">
                    + Add Practical Work
                  </div>
                )}

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
                  size="sm"
                  variant="default"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs rounded-xl"
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  {isMissing ? "Edit Entry" : "Edit Entry"}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                            DESKTOP TABLE ROW                               */
/* -------------------------------------------------------------------------- */
function DiaryTableRow({
  day,
  entry,
  isHoliday,
  isAbsent,
  teacherStatus,
  actionLoadingDates,
  isWeekend,
  holidayText,
  onUpdateEntry,
  onOpenAttendanceModal,
  onSetTeacherAttendance,
  onRemoveHoliday,
}) {
  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector((state) => state.activeBatch.activeBatchId);
  const isMissing = !entry;
  const dateKey = format(day, "yyyy-MM-dd");

  const isPresentLoading = actionLoadingDates?.[dateKey] === "present";
  const isAbsentLoading = actionLoadingDates?.[dateKey] === "absent";

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      setIsEditing(false);
    } else {
      setFormData({
        theoryWork: "",
        practicalWork: "",
        practicalNumbers: [],
        extraWork: "",
        hours: "",
        remarks: "",
      });
      setIsEditing(false);
    }
  }, [entry]);

  const handleSave = async () => {
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
        setIsEditing(false);
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
          instructorId: profile.userId,
          batchId: activeBatchId,
        });
        toast.success("Entry added successfully");
        setIsEditing(false);
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
    if (isMissing) {
      setFormData({
        theoryWork: "",
        practicalWork: "",
        practicalNumbers: [],
        extraWork: "",
        hours: "",
        remarks: "",
      });
      setIsEditing(false);
    } else {
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
      setIsEditing(false);
    }
  };

  const absentHighlight = isAbsent && !isHoliday ? TEACHER_ABSENT_ROW_CLASS : "";
  const rowClass = `group transition-colors border-gray-200 dark:border-gray-800 ${
    isHoliday
      ? "bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 border-amber-200 dark:border-amber-900"
      : absentHighlight
      ? `${absentHighlight} hover:bg-red-100/40 dark:hover:bg-red-950/40`
      : isWeekend
      ? "bg-gray-50/50 dark:bg-gray-900/40 hover:bg-gray-100/50"
      : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
  }`;

  const renderTeacherStatusBadge = () => {
    if (teacherStatus === "present") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Present
        </span>
      );
    }
    if (teacherStatus === "absent") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[11px] font-bold inline-flex items-center gap-1">
          <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Absent
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[11px] font-semibold inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3.5 h-3.5 text-slate-400" /> Not Marked
      </span>
    );
  };

  const cellClickProps = {
    onClick: () => setIsEditing(true),
    title: "Click to edit entry",
    className: "p-3.5 align-middle cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors group/cell",
  };

  if (!entry && isHoliday && teacherStatus !== "present") {
    return (
      <tr className={`${rowClass} border-b`}>
        <td className="p-3.5 align-middle">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
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
            renderTeacherStatusBadge()
          )}
        </td>
        <td className="p-3.5 whitespace-pre-wrap text-left align-middle" colSpan={6}>
          <span className="text-amber-700 dark:text-amber-400 font-medium text-xs">
            {holidayText}
          </span>
        </td>
        <td className="p-3.5 whitespace-nowrap align-middle">
          <div className="flex items-center justify-end gap-1.5 min-w-[120px]">
            {onOpenAttendanceModal && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs font-semibold bg-white dark:bg-slate-900"
                  >
                    Actions <MoreVertical className="w-3.5 h-3.5 ml-1" />
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
                    Holiday Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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

      {/* Dedicated Teacher Attendance Cell */}
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
          renderTeacherStatusBadge()
        )}
      </td>

      {isEditing ? (
        <>
          <td className="p-2 align-top min-w-[180px]">
            <Textarea
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900 text-xs"
              value={formData.theoryWork}
              rows={2}
              onChange={(e) => setFormData({ ...formData, theoryWork: e.target.value })}
              placeholder="Add theory notes..."
            />
          </td>
          <td className="p-2 align-top min-w-[180px]">
            <Textarea
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900 text-xs"
              value={formData.practicalWork}
              rows={2}
              onChange={(e) => setFormData({ ...formData, practicalWork: e.target.value })}
              placeholder="Add practical notes..."
            />
          </td>
          <td className="p-2 align-top min-w-[120px]">
            <PracticalNumberInput
              className="w-full bg-white dark:bg-gray-900"
              value={formData.practicalNumbers}
              placeholder="e.g. 1, 3"
              onChange={(newValue) => setFormData({ ...formData, practicalNumbers: newValue })}
            />
          </td>
          <td className="p-2 align-top min-w-[130px]">
            <Textarea
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900 text-xs"
              value={formData.extraWork}
              rows={2}
              placeholder="-"
              onChange={(e) => setFormData({ ...formData, extraWork: e.target.value })}
            />
          </td>
          <td className="p-2 align-top w-20">
            <Input
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900 text-xs text-right"
              value={formData.hours}
              type="number"
              placeholder="-"
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            />
          </td>
          <td className="p-2 align-top min-w-[130px]">
            <Textarea
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900 text-xs"
              value={formData.remarks}
              rows={2}
              placeholder="-"
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </td>
          <td className="p-3.5 align-middle whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white shadow-xs text-xs font-bold"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 px-2.5 text-xs text-gray-600 border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </td>
        </>
      ) : (
        <>
          {/* Theory Cell */}
          <td {...cellClickProps} className="p-3.5 align-middle whitespace-pre-wrap max-w-[200px] text-xs cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
            {entry?.theoryWork ? (
              <span className="text-gray-800 dark:text-gray-200 font-medium group-hover/cell:text-blue-600 dark:group-hover/cell:text-blue-400">{entry.theoryWork}</span>
            ) : (
              <span className="text-gray-400 hover:text-blue-500 italic font-normal">+ Add Theory</span>
            )}
          </td>

          {/* Practical Cell */}
          <td {...cellClickProps} className="p-3.5 align-middle whitespace-pre-wrap max-w-[200px] text-xs cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
            {entry?.practicalWork ? (
              <span className="text-gray-800 dark:text-gray-200 font-medium group-hover/cell:text-blue-600 dark:group-hover/cell:text-blue-400">{entry.practicalWork}</span>
            ) : (
              <span className="text-gray-400 hover:text-blue-500 italic font-normal">+ Add Practical</span>
            )}
          </td>

          {/* Practical No. Cell */}
          <td {...cellClickProps} className="p-3.5 align-middle whitespace-nowrap cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
            {entry?.practicalNumbers && entry.practicalNumbers.length > 0 ? (
              <div className="flex flex-wrap gap-1 max-w-[130px]">
                {entry.practicalNumbers.map((num, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md"
                  >
                    #{num}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 hover:text-blue-500 italic text-xs font-normal">+ Add No.</span>
            )}
          </td>

          {/* Extra Work Cell */}
          <td {...cellClickProps} className="p-3.5 align-middle whitespace-pre-wrap max-w-[150px] text-xs cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
            {entry?.extraWork && entry.extraWork !== "-" ? (
              <span className="text-gray-700 dark:text-gray-300 group-hover/cell:text-blue-600 dark:group-hover/cell:text-blue-400">{entry.extraWork}</span>
            ) : (
              <span className="text-gray-400 hover:text-blue-500 italic font-normal">—</span>
            )}
          </td>

          {/* Hours Cell */}
          <td {...cellClickProps} className="p-3.5 align-middle whitespace-nowrap text-right text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
            {entry?.hours ? `${entry.hours} hrs` : <span className="text-gray-400 font-normal italic hover:text-blue-500">—</span>}
          </td>

          {/* Remarks Cell */}
          <td {...cellClickProps} className="p-3.5 align-middle whitespace-pre-wrap max-w-[160px] text-xs cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
            {entry?.remarks && entry.remarks !== "-" && entry.remarks !== "Prac #: -" ? (
              <span className="text-gray-700 dark:text-gray-300 group-hover/cell:text-blue-600 dark:group-hover/cell:text-blue-400">{entry.remarks}</span>
            ) : (
              <span className="text-gray-400 hover:text-blue-500 italic font-normal">—</span>
            )}
          </td>

          {/* Actions Cell */}
          <td className="p-3.5 align-middle whitespace-nowrap">
            <div className="flex items-center justify-end gap-1.5 min-w-[120px]">
              {/* Primary Edit Button */}
              <Button
                size="sm"
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold px-2.5 py-1.5 h-8 flex items-center gap-1"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{isMissing ? "Edit" : "Edit"}</span>
              </Button>

              {/* More Actions Dropdown Menu */}
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
        </>
      )}
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/*                            MAIN DIARY TABLE COMPONENT                      */
/* -------------------------------------------------------------------------- */
export default function DiaryTable({
  monthDays,
  diaryData,
  holidays,
  attendance,
  isLoadingData,
  actionLoadingDates,
  onUpdateEntry,
  onOpenAttendanceModal,
  onSetTeacherAttendance,
  onRemoveHoliday,
}) {
  return (
    <div className="w-full mt-6">
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
          monthDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const entry = diaryData[dateKey];
            const isHoliday = holidays.has(dateKey);
            const teacherStatus = attendance.get(dateKey);
            const isAbsent = teacherStatus === "absent";
            const dayOfWeek = format(day, "E");
            const isWeekend = dayOfWeek === "Sat" || dayOfWeek === "Sun";
            const holidayText = isHoliday ? holidays.get(dateKey)?.holidayText : "";

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
                onUpdateEntry={onUpdateEntry}
                onOpenAttendanceModal={onOpenAttendanceModal}
                onSetTeacherAttendance={onSetTeacherAttendance}
                onRemoveHoliday={onRemoveHoliday}
              />
            );
          })
        )}
      </div>

      {/* ------------------- DESKTOP TABLE (>= md BREAKPOINT) ------------------- */}
      <div className="hidden md:block">
        <Card className="shadow-md border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto relative">
              <table className="w-full min-w-[1050px] text-sm table-auto border-collapse">
                <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-700 dark:text-slate-300 z-10">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] w-36">Date</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] w-24">Day</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] w-44">Teacher Attendance</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[180px]">Theory Work</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[180px]">Practical Work</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[120px]">Practical No.</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[130px]">Extra Work</th>
                    <th className="p-3.5 text-right font-bold uppercase tracking-wider text-[11px] w-20">Hours</th>
                    <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[11px] min-w-[130px]">Remarks</th>
                    <th className="p-3.5 text-right font-bold uppercase tracking-wider text-[11px] w-32">Actions</th>
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
                        <td className="p-3.5"><Skeleton className="h-5 w-full" /></td>
                        <td className="p-3.5"><Skeleton className="h-5 w-10 ml-auto" /></td>
                        <td className="p-3.5"><Skeleton className="h-5 w-16" /></td>
                        <td className="p-3.5"><Skeleton className="h-5 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : monthDays.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-8 text-center text-muted-foreground">
                        No entries found for selected month.
                      </td>
                    </tr>
                  ) : (
                    monthDays.map((day) => {
                      const dateKey = format(day, "yyyy-MM-dd");
                      const entry = diaryData[dateKey];
                      const isHoliday = holidays.has(dateKey);
                      const teacherStatus = attendance.get(dateKey);
                      const isAbsent = teacherStatus === "absent";
                      const dayOfWeek = format(day, "E");
                      const isWeekend = dayOfWeek === "Sat" || dayOfWeek === "Sun";
                      const holidayText = isHoliday ? holidays.get(dateKey)?.holidayText : "";

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
                          onUpdateEntry={onUpdateEntry}
                          onOpenAttendanceModal={onOpenAttendanceModal}
                          onSetTeacherAttendance={onSetTeacherAttendance}
                          onRemoveHoliday={onRemoveHoliday}
                        />
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
