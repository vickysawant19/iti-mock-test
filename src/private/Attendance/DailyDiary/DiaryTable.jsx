import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import dailyDiaryService from "@/appwrite/dailyDiaryService";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { PracticalNumberInput } from "./PracticalNumberInput";

function DiaryTableRow({ day, entry, isHoliday, isAbsent, isWeekend, holidayText, onUpdateEntry }) {
  const profile = useSelector(selectProfile);
  // Default to editing mode if no entry exists and it's not a holiday/absent/weekend
  // We can also let the user add an entry on weekends just in case, but let's default to editing if !entry and !holiday and !absent.
  const isMissing = !entry;
  const shouldDefaultToEdit = isMissing && !isHoliday && !isAbsent;

  const [isEditing, setIsEditing] = useState(shouldDefaultToEdit);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    theoryWork: entry?.theoryWork || "",
    practicalWork: entry?.practicalWork || "",
    practicalNumbers: Array.isArray(entry?.practicalNumbers) ? entry.practicalNumbers.join(", ") : entry?.practicalNumbers || "",
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
            practicalNumbers: Array.isArray(entry.practicalNumbers) ? entry.practicalNumbers.join(", ") : entry.practicalNumbers || "",
            extraWork: entry.extraWork || "",
            hours: entry.hours || "",
            remarks: entry.remarks || "",
        });
        setIsEditing(false);
    } else {
        setFormData({ theoryWork: "", practicalWork: "", practicalNumbers: [], extraWork: "", hours: "", remarks: "" });
        setIsEditing(shouldDefaultToEdit);
    }
  }, [entry, shouldDefaultToEdit]);

  const dateKey = format(day, "yyyy-MM-dd");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (entry && entry.$id) {
        // Update existing document
        const parsedPractical = typeof formData.practicalNumbers === "string" 
           ? formData.practicalNumbers.split(",").map(v => v.trim()).filter(Boolean)
           : Array.isArray(formData.practicalNumbers) ? formData.practicalNumbers : [];

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
        // Validation for new empty rows
        if (!formData.theoryWork && !formData.practicalWork && !formData.extraWork) {
            toast.error("Please enter some work details before saving.");
            setIsSaving(false);
            return;
        }
        
        // Create new document for missing entry
        const dateISO = new Date(dateKey).toISOString();
        const parsedPractical = typeof formData.practicalNumbers === "string" 
           ? formData.practicalNumbers.split(",").map(v => v.trim()).filter(Boolean)
           : Array.isArray(formData.practicalNumbers) ? formData.practicalNumbers : [];

        const newDoc = await dailyDiaryService.createDocument({
            date: dateISO,
            theoryWork: formData.theoryWork,
            practicalWork: formData.practicalWork,
            practicalNumbers: parsedPractical,
            extraWork: formData.extraWork,
            hours: formData.hours ? Number(formData.hours) : null,
            remarks: formData.remarks || "-",
            instructorId: profile.userId,
            batchId: profile.batchId,
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
      // Clear inputs if they cancel a missing row
      setFormData({ theoryWork: "", practicalWork: "", practicalNumbers: [], extraWork: "", hours: "", remarks: "" });
      // If it's a weekend default where inputs were manually invoked, collapse the inputs.
      if (!shouldDefaultToEdit) {
          setIsEditing(false);
      }
    } else {
      // Revert to original data
      setFormData({
        theoryWork: entry.theoryWork || "",
        practicalWork: entry.practicalWork || "",
        practicalNumbers: Array.isArray(entry.practicalNumbers) ? entry.practicalNumbers.join(", ") : entry.practicalNumbers || "",
        extraWork: entry.extraWork || "",
        hours: entry.hours || "",
        remarks: entry.remarks || "",
      });
      setIsEditing(false);
    }
  };

  const rowClass = `group transition-colors border-gray-200 dark:border-gray-800 ${
    isHoliday ? "bg-red-50/50 dark:bg-red-950/20 lg:hover:bg-red-100/50 border-red-200 dark:border-red-900" :
    isAbsent ? "bg-pink-50/50 dark:bg-pink-950/20 lg:hover:bg-pink-100/50 border-pink-200 dark:border-pink-900" :
    isWeekend ? "bg-gray-50/50 dark:bg-gray-900/40 lg:hover:bg-gray-100/50" :
    "bg-white lg:hover:bg-gray-50 dark:bg-gray-950 dark:lg:hover:bg-gray-900"
  }`;

  // If it's literally a holiday or absent day where we have no entry
  if (!entry && (isHoliday || isAbsent)) {
    return (
      <tr className={`${rowClass} flex flex-col lg:table-row mb-4 lg:mb-0 border lg:border-b shadow-sm lg:shadow-none rounded-xl lg:rounded-none overflow-hidden`}>
        <td className="flex justify-between items-center p-4 lg:px-6 lg:py-4 lg:border-0 border-b bg-muted/10 lg:bg-transparent lg:table-cell">
          <span className="font-medium text-gray-900 dark:text-gray-100">{format(day, "MMM dd, yyyy")}</span>
          <span className="lg:hidden text-muted-foreground text-sm">{format(day, "EEEE")}</span>
        </td>
        <td className="hidden lg:table-cell px-6 py-4 text-muted-foreground">{format(day, "EEEE")}</td>
        <td className="p-4 lg:px-6 lg:py-4 whitespace-pre-wrap text-center lg:text-left block lg:table-cell" colSpan={7}>
          {isHoliday ? (
            <span className="text-red-600 dark:text-red-400 font-medium">{holidayText}</span>
          ) : (
            <span className="text-pink-600 dark:text-pink-400 font-medium">Absent</span>
          )}
        </td>
      </tr>
    );
  }

  // Active or blank rows
  return (
    <tr className={`${rowClass} flex flex-col lg:table-row mb-6 lg:mb-0 border lg:border-b shadow-sm lg:shadow-none rounded-xl lg:rounded-none overflow-hidden`}>
      <td className="flex justify-between lg:justify-start items-center p-4 lg:px-6 lg:py-4 lg:border-0 border-b bg-muted/10 lg:bg-transparent lg:table-cell">
        <span className="font-medium text-gray-900 dark:text-gray-100">{format(day, "MMM dd, yyyy")}</span>
        <span className="lg:hidden text-muted-foreground text-sm font-medium">{format(day, "EEEE")}</span>
      </td>
      <td className="hidden lg:table-cell px-6 py-4 text-muted-foreground">{format(day, "EEEE")}</td>
      
      {isEditing ? (
        <>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top min-w-[250px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">Theory Work</label>
            <Textarea className="w-full border p-2 rounded-md bg-white dark:bg-gray-900" value={formData.theoryWork} rows={3} onChange={(e) => setFormData({ ...formData, theoryWork: e.target.value })} placeholder="Add theory notes..." />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top min-w-[250px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">Practical Work</label>
            <Textarea className="w-full border p-2 rounded-md bg-white dark:bg-gray-900" value={formData.practicalWork} rows={3} onChange={(e) => setFormData({ ...formData, practicalWork: e.target.value })} placeholder="Add practical notes..." />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top min-w-[150px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">Practical No.</label>
            <PracticalNumberInput 
               className="w-full bg-white dark:bg-gray-900" 
               value={formData.practicalNumbers} 
               placeholder="e.g. 1, 3" 
               onChange={(newValue) => setFormData({ ...formData, practicalNumbers: newValue })} 
            />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top min-w-[200px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">Extra Work</label>
            <Textarea className="w-full border p-2 rounded-md bg-white dark:bg-gray-900" value={formData.extraWork} rows={3} placeholder="-" onChange={(e) => setFormData({ ...formData, extraWork: e.target.value })} />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top max-w-full lg:max-w-[80px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">Hours</label>
            <Input className="w-full border p-2 rounded-md bg-white dark:bg-gray-900" value={formData.hours} type="number" placeholder="-" onChange={(e) => setFormData({ ...formData, hours: e.target.value })} />
          </td>
          <td className="block lg:table-cell p-4 lg:px-4 lg:py-3 lg:align-top min-w-[150px] border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">Remarks</label>
            <Textarea className="w-full border p-2 rounded-md bg-white dark:bg-gray-900" value={formData.remarks} rows={2} placeholder="-" onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-nowrap lg:align-top bg-muted/10 lg:bg-white dark:lg:bg-gray-950 lg:sticky right-0 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 dark:group-hover:bg-gray-900 transition-colors">
            <div className="flex flex-row lg:flex-col gap-3">
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="min-w-fit px-3 py-1.5 w-full bg-green-600 hover:bg-green-700 text-white shadow-sm whitespace-nowrap">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving} className="min-w-fit px-3 py-1.5 w-full text-gray-600 border-gray-300 bg-white dark:bg-gray-900 whitespace-nowrap">
                Cancel
              </Button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-pre-wrap border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">Theory Work</label>
            <span className="text-gray-800 dark:text-gray-200">{entry.theoryWork || "-"}</span>
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-pre-wrap border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">Practical Work</label>
            <span className="text-gray-800 dark:text-gray-200">{entry.practicalWork || "-"}</span>
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-nowrap border-b lg:border-0 border-dashed">
            <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-2 block">Practical No.</label>
            {entry.practicalNumbers && entry.practicalNumbers.length > 0 ? (
               <div className="flex flex-wrap gap-1 max-w-full lg:max-w-[150px]">
                 {entry.practicalNumbers.map((num, i) => (
                   <span key={i} className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-md">
                     {num}
                   </span>
                 ))}
               </div>
            ) : <span className="text-muted-foreground">-</span>}
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-pre-wrap text-muted-foreground border-b lg:border-0 border-dashed">
             <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">Extra Work</label>
             {entry.extraWork || "-"}
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-nowrap text-muted-foreground border-b lg:border-0 border-dashed">
             <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">Hours</label>
             {entry.hours || "-"}
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-pre-wrap text-muted-foreground lg:max-w-[200px] border-b lg:border-0 border-dashed">
             <label className="lg:hidden text-xs font-semibold text-muted-foreground uppercase mb-1 block">Remarks</label>
             {entry.remarks === "Prac #: -" ? "-" : entry.remarks || "-"}
          </td>
          <td className="block lg:table-cell p-4 lg:px-6 lg:py-4 whitespace-nowrap bg-muted/10 lg:bg-white dark:lg:bg-gray-950 lg:sticky right-0 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 dark:group-hover:bg-gray-900 transition-colors">
            <Button size="lg" variant="default" className="min-w-fit px-4 py-2 w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm whitespace-nowrap" onClick={() => setIsEditing(true)}>Edit Entry</Button>
          </td>
        </>
      )}
    </tr>
  );
}

export default function DiaryTable({ monthDays, diaryData, holidays, attendance, isLoadingData, onUpdateEntry }) {
  return (
    <Card className="shadow-none lg:shadow-md border-0 lg:border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-6 bg-transparent lg:bg-white dark:bg-gray-950">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto relative">
          <table className="min-w-[900px] w-full text-sm block lg:table table-auto">
            <thead className="hidden lg:table-header-group">
              <tr className="border-b bg-muted/60 text-muted-foreground">
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs">Day</th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[200px]">Theory</th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[200px]">Practical</th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[150px]">Practical No.</th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[150px]">Extra Work</th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs">Hours</th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[150px]">Remarks</th>
                <th className="px-6 py-4 text-center font-semibold uppercase tracking-wider text-xs w-32 lg:sticky right-0 bg-gray-100 dark:bg-gray-800 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">Actions</th>
              </tr>
            </thead>
            <tbody className="block lg:table-row-group lg:divide-y divide-gray-200 dark:divide-gray-800 space-y-4 lg:space-y-0 p-1 lg:p-0">
              {isLoadingData ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="bg-white dark:bg-gray-950">
                    <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-full" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-full" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-full" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-10" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-12" /></td>
                  </tr>
                ))
              ) : monthDays.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-muted-foreground">
                    No entries found for selected month.
                  </td>
                </tr>
              ) : (
                monthDays.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const entry = diaryData[dateKey];
                  const isHoliday = holidays.has(dateKey);
                  const isAbsent = attendance.get(dateKey) === "absent";
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
                        isWeekend={isWeekend}
                        holidayText={holidayText}
                        onUpdateEntry={onUpdateEntry}
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
