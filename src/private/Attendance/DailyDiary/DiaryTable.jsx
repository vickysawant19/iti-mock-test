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
} from "lucide-react";
import dailyDiaryService from "@/appwrite/dailyDiaryService";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { PracticalNumberInput } from "./PracticalNumberInput";
import {
  highlightAbsentRow,
  TEACHER_ABSENT_ROW_CLASS,
} from "./diaryAbsentHighlight";

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

  const isPresentLoading =
    actionLoadingDates?.[format(day, "yyyy-MM-dd")] === "present";
  const isAbsentLoading =
    actionLoadingDates?.[format(day, "yyyy-MM-dd")] === "absent";

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

  // Keep state sync if entry updates prop-wise
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

  const dateKey = format(day, "yyyy-MM-dd");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (entry && entry.$id) {
        // Update existing document
        const parsedPractical =
          typeof formData.practicalNumbers === "string"
            ? formData.practicalNumbers
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : Array.isArray(formData.practicalNumbers)
              ? formData.practicalNumbers
              : [];

        const updatedDoc = await dailyDiaryService.updateDocument(entry.$id, {
          theoryWork: formData.theoryWork,
          practicalWork: formData.practicalWork,
          parsedPractical,
          extraWork: formData.extraWork,
          hours: formData.hours ? Number(formData.hours) : null,
          remarks: formData.remarks,
        });
        toast.success("Entry updated successfully");
        setIsEditing(false);
        if (onUpdateEntry) onUpdateEntry(dateKey, updatedDoc);
      } else {
        // Validation for new empty rows
        if (
          !formData.theoryWork &&
          !formData.practicalWork &&
          !formData.extraWork
        ) {
          toast.error("Please enter some work details before saving.");
          setIsSaving(false);
          return;
        }

        // Create new document for missing entry
        const dateISO = new Date(dateKey).toISOString();
        const parsedPractical =
          typeof formData.practicalNumbers === "string"
            ? formData.practicalNumbers
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : Array.isArray(formData.practicalNumbers)
              ? formData.practicalNumbers
              : [];

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
      // Revert to original data
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

  const absentHighlight =
    isAbsent && !isHoliday ? TEACHER_ABSENT_ROW_CLASS : "";
  const rowClass = `group transition-colors border-gray-200 dark:border-gray-800 ${
    isHoliday
      ? "bg-red-50/50 dark:bg-red-950/20 lg:hover:bg-red-100/50 border-red-200 dark:border-red-900"
      : absentHighlight
        ? `${absentHighlight} lg:hover:bg-red-100/40 dark:lg:hover:bg-red-950/40`
        : isWeekend
          ? "bg-gray-50/50 dark:bg-gray-900/40 lg:hover:bg-gray-100/50"
          : "bg-white lg:hover:bg-gray-50 dark:bg-gray-950 dark:lg:hover:bg-gray-900"
  }`;

  // Helper badge for teacher attendance status
  const renderTeacherStatusBadge = () => {
    if (teacherStatus === "present") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />{" "}
          Present
        </span>
      );
    }
    if (teacherStatus === "absent") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[11px] font-bold inline-flex items-center gap-1">
          <UserX className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Absent
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[11px] font-semibold inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3 h-3 text-slate-400" /> Not Marked
      </span>
    );
  };

  if (!entry && isHoliday && teacherStatus !== "present") {
    return (
      <tr
        className={`${rowClass} w-full flex flex-col lg:table-row mb-4 lg:mb-0 border lg:border-b shadow-sm lg:shadow-none rounded-xl lg:rounded-none overflow-hidden`}
      >
        <td className="flex justify-between items-center p-4 lg:px-6 lg:py-4 lg:border-0 border-b bg-muted/10 lg:bg-transparent lg:table-cell">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {format(day, "MMM dd, yyyy")}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                <Palmtree className="w-3 h-3 text-amber-600 dark:text-amber-400" />{" "}
                Holiday
              </span>
              {renderTeacherStatusBadge()}
            </div>
          </div>
          <span className="lg:hidden text-muted-foreground text-sm">
            {format(day, "EEEE")}
          </span>
        </td>
        <td className="hidden lg:table-cell px-6 py-4 text-muted-foreground">
          {format(day, "EEEE")}
        </td>
        <td
          className="p-4 lg:px-6 lg:py-4 whitespace-pre-wrap text-center lg:text-left block lg:table-cell"
          colSpan={6}
        >
          <span className="text-red-600 dark:text-red-400 font-medium">
            {holidayText}
          </span>
        </td>
        <td className="p-4 lg:px-6 lg:py-4 whitespace-nowrap bg-muted/10 lg:bg-white dark:lg:bg-gray-950 lg:sticky right-0 z-10">
          <div className="flex flex-col gap-2 min-w-[150px]">
            {onOpenAttendanceModal && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenAttendanceModal(dateKey, "attendance")}
                className="w-full bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold px-2 py-1.5 h-8 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />{" "}
                Student Attendance
              </Button>
            )}
            {onOpenAttendanceModal && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenAttendanceModal(dateKey, "holiday")}
                className="w-full text-xs font-semibold px-2 py-1.5 h-8 flex items-center justify-center gap-1.5 bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                title="Holiday Details"
              >
                <Palmtree className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />{" "}
                Holiday Details
              </Button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  // Active or blank rows
  return (
    <tr
      className={`${rowClass} w-full flex flex-col lg:table-row mb-6 lg:mb-0 border lg:border-b shadow-sm lg:shadow-none rounded-xl lg:rounded-none overflow-hidden`}
    >
      <td className="flex justify-between lg:justify-start items-center p-4 lg:px-6 lg:py-4 lg:border-0 border-b bg-muted/10 lg:bg-transparent lg:table-cell">
        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {format(day, "MMM dd, yyyy")}
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {renderTeacherStatusBadge()}
            {isHoliday && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                <Palmtree className="w-3 h-3 text-amber-600 dark:text-amber-400" />{" "}
                Holiday Work
              </span>
            )}
          </div>
        </div>
        <span className="lg:hidden text-muted-foreground text-sm font-medium">
          {format(day, "EEEE")}
        </span>
      </td>
      <td className="hidden lg:table-cell px-6 py-4 text-muted-foreground">
        {format(day, "EEEE")}
      </td>

      {isEditing ? (
        <>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top lg:min-w-[250px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">
              Theory Work
            </label>
            <Textarea
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900"
              value={formData.theoryWork}
              rows={3}
              onChange={(e) =>
                setFormData({ ...formData, theoryWork: e.target.value })
              }
              placeholder="Add theory notes..."
            />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top lg:min-w-[250px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">
              Practical Work
            </label>
            <Textarea
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900"
              value={formData.practicalWork}
              rows={3}
              onChange={(e) =>
                setFormData({ ...formData, practicalWork: e.target.value })
              }
              placeholder="Add practical notes..."
            />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top lg:min-w-[150px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">
              Practical No.
            </label>
            <PracticalNumberInput
              className="w-full bg-white dark:bg-gray-900"
              value={formData.practicalNumbers}
              placeholder="e.g. 1, 3"
              onChange={(newValue) =>
                setFormData({ ...formData, practicalNumbers: newValue })
              }
            />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top lg:min-w-[200px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">
              Extra Work
            </label>
            <Textarea
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900"
              value={formData.extraWork}
              rows={3}
              placeholder="-"
              onChange={(e) =>
                setFormData({ ...formData, extraWork: e.target.value })
              }
            />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top w-full lg:max-w-[80px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">
              Hours
            </label>
            <Input
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900"
              value={formData.hours}
              type="number"
              placeholder="-"
              onChange={(e) =>
                setFormData({ ...formData, hours: e.target.value })
              }
            />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top lg:min-w-[150px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">
              Remarks
            </label>
            <Textarea
              className="w-full border p-2 rounded-md bg-white dark:bg-gray-900"
              value={formData.remarks}
              rows={2}
              placeholder="-"
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
            />
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-nowrap lg:align-top bg-muted/10 lg:bg-white dark:lg:bg-gray-950 lg:sticky right-0 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 dark:group-hover:bg-gray-900 transition-colors">
            <div className="flex flex-row lg:flex-col gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="min-w-fit px-3 py-1.5 w-full bg-green-600 hover:bg-green-700 text-white shadow-sm whitespace-nowrap"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}{" "}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="min-w-fit px-3 py-1.5 w-full text-gray-600 border-gray-300 bg-white dark:bg-gray-900 whitespace-nowrap"
              >
                Cancel
              </Button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-pre-wrap border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Theory Work
            </label>
            <span className="text-gray-800 dark:text-gray-200">
              {entry?.theoryWork || "-"}
            </span>
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-pre-wrap border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Practical Work
            </label>
            <span className="text-gray-800 dark:text-gray-200">
              {entry?.practicalWork || "-"}
            </span>
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-nowrap border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">
              Practical No.
            </label>
            {entry?.practicalNumbers && entry.practicalNumbers.length > 0 ? (
              <div className="flex flex-wrap gap-1 max-w-full lg:max-w-[150px]">
                {entry.practicalNumbers.map((num, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-md"
                  >
                    {num}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-pre-wrap text-muted-foreground border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Extra Work
            </label>
            {entry?.extraWork || "-"}
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-nowrap text-muted-foreground border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Hours
            </label>
            {entry?.hours || "-"}
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-pre-wrap text-muted-foreground lg:max-w-[200px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Remarks
            </label>
            {entry?.remarks === "Prac #: -" ? "-" : entry?.remarks || "-"}
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-nowrap bg-muted/10 lg:bg-white dark:lg:bg-gray-950 lg:sticky right-0 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 dark:group-hover:bg-gray-900 transition-colors">
            <div className="flex flex-col gap-2 min-w-[160px]">
              {/* Primary Edit Entry Button */}
              <Button
                size="sm"
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-3.5 h-3.5 mr-1" />{" "}
                {isMissing ? "Edit Entry" : "Edit Entry"}
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
                      disabled={isPresentLoading || isAbsentLoading}
                      onClick={() => onSetTeacherAttendance(dateKey, "present")}
                      className={`flex-1 px-2 py-1 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-95 ${
                        teacherStatus === "present"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                      } ${isPresentLoading ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                      title="Mark Teacher Present"
                    >
                      {isPresentLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      Present
                    </button>
                    <button
                      type="button"
                      disabled={isPresentLoading || isAbsentLoading}
                      onClick={() => onSetTeacherAttendance(dateKey, "absent")}
                      className={`flex-1 px-2 py-1 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-95 ${
                        teacherStatus === "absent"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                      } ${isAbsentLoading ? "opacity-80 animate-pulse cursor-wait" : ""}`}
                      title="Mark Teacher Absent"
                    >
                      {isAbsentLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                      Absent
                    </button>
                  </div>
                </div>
              )}

              {/* Student Attendance Modal Trigger */}
              {onOpenAttendanceModal && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenAttendanceModal(dateKey, "attendance")}
                  className="w-full bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold px-2 py-1.5 h-8 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />{" "}
                  Student Attendance
                </Button>
              )}

              {/* Set / View Holiday Modal Trigger */}
              {onOpenAttendanceModal && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenAttendanceModal(dateKey, "holiday")}
                  className={`w-full text-xs font-semibold px-2 py-1.5 h-8 flex items-center justify-center gap-1.5 transition-colors ${isHoliday ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" : "text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/40"}`}
                  title={
                    isHoliday ? "View/Manage Holiday" : "Set Day as Holiday"
                  }
                >
                  <Palmtree className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {isHoliday ? "Holiday Details" : "Set Holiday"}
                </Button>
              )}
            </div>
          </td>
        </>
      )}
    </tr>
  );
}

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
    <Card className="shadow-none lg:shadow-md border-0 lg:border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-6 bg-transparent lg:bg-white dark:bg-gray-950">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto relative">
          <table className="w-full lg:min-w-[900px] text-sm block lg:table table-auto">
            <thead className="hidden lg:table-header-group">
              <tr className="border-b bg-muted/60 text-muted-foreground">
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs">
                  Date
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs">
                  Day
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[200px]">
                  Theory
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[200px]">
                  Practical
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[150px]">
                  Practical No.
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[150px]">
                  Extra Work
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs">
                  Hours
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[150px]">
                  Remarks
                </th>
                <th className="px-6 py-4 text-center font-semibold uppercase tracking-wider text-xs w-44 lg:sticky right-0 bg-gray-100 dark:bg-gray-800 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="block lg:table-row-group lg:divide-y divide-gray-200 dark:divide-gray-800 space-y-4 lg:space-y-0 p-1 lg:p-0">
              {isLoadingData ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="bg-white dark:bg-gray-950">
                    <td className="p-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-12" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-10" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-12" />
                    </td>
                  </tr>
                ))
              ) : monthDays.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="p-8 text-center text-muted-foreground"
                  >
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
                  const holidayText = isHoliday
                    ? holidays.get(dateKey)?.holidayText
                    : "";

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
  );
}
