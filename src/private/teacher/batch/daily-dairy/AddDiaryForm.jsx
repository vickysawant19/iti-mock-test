import React, { useState } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { Loader2, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import dailyDiaryService from "@/appwrite/dailyDiaryService";
import { selectProfile } from "@/store/profileSlice";

export default function AddDiaryForm({ onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profile = useSelector(selectProfile);

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    theoryWork: "",
    practicalWork: "",
    extraWork: "",
    hours: "",
    remarks: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date) {
      toast.error("Please select a date");
      return;
    }

    if (!formData.theoryWork.trim() && !formData.practicalWork.trim()) {
      toast.error("Please enter either Theory or Practical work");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create date at midnight UTC for consistency
      const dateISO = new Date(formData.date).toISOString();
      
      // Before creating, check if an entry already exists for this date.
      const existingEntries = await dailyDiaryService.getBatchInstructorDiary(
          profile.batchId,
          null,
          formData.date,
          formData.date
      );

      // If an entry exists for the exact same date string representation, abort to prevent duplicates
      if (existingEntries && existingEntries.length > 0) {
          const hasExactMatch = existingEntries.some(doc => doc.date.startsWith(formData.date));
          if (hasExactMatch) {
              toast.error("An entry already exists for this date. Please edit it directly from the table.");
              setIsSubmitting(false);
              return;
          }
      }

      await dailyDiaryService.createDocument({
        date: dateISO,
        theoryWork: formData.theoryWork,
        practicalWork: formData.practicalWork,
        extraWork: formData.extraWork,
        hours: formData.hours ? Number(formData.hours) : null,
        remarks: formData.remarks,
        instructorId: profile.userId,
        batchId: profile.batchId,
      });

      toast.success("Diary entry created successfully");
      setIsOpen(false);
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        theoryWork: "",
        practicalWork: "",
        extraWork: "",
        hours: "",
        remarks: "",
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Failed to add entry:", error);
      toast.error("Failed to create entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm w-full sm:w-auto mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Diary Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Theory Work</label>
            <Textarea
              placeholder="Topic covered..."
              value={formData.theoryWork}
              onChange={(e) => setFormData({ ...formData, theoryWork: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Practical Work</label>
            <Textarea
              placeholder="Practical exercises..."
              value={formData.practicalWork}
              onChange={(e) => setFormData({ ...formData, practicalWork: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hours Spent</label>
              <Input
                type="number"
                placeholder="#"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Extra Work</label>
              <Textarea
                placeholder="-"
                value={formData.extraWork}
                rows={1}
                onChange={(e) => setFormData({ ...formData, extraWork: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks</label>
            <Textarea
              placeholder="-"
              value={formData.remarks}
              rows={2}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
             <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
               Cancel
             </Button>
             <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
               {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
               Save Entry
             </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
