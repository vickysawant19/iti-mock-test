import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Copy, CalendarDays, Loader2, Save } from "lucide-react";
import batchStudentService from "@/services/batch/batchStudentService";

export default function EditEnrollmentTab({ batchId, studentId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    enrollmentDate: "",
    status: "active",
    rollNumber: "",
    registerId: "",
    remarks: "",
  });

  const fetchRecord = async () => {
    setIsLoading(true);
    try {
      const record = await batchStudentService.getStudentRecord(batchId, studentId);
      if (record) {
        setFormData({
          enrollmentDate: record.enrollmentDate ? record.enrollmentDate.substring(0, 10) : "",
          status: record.status || "active",
          rollNumber: record.rollNumber || "",
          registerId: record.registerId || "",
          remarks: record.remarks || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load enrollment record.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (batchId && studentId) {
      fetchRecord();
    }
  }, [batchId, studentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await batchStudentService.updateStudentRecord(batchId, studentId, {
        enrollmentDate: formData.enrollmentDate ? new Date(formData.enrollmentDate).toISOString() : null,
        status: formData.status,
        rollNumber: formData.rollNumber || null,
        registerId: formData.registerId || null,
        remarks: formData.remarks || null,
      });
      toast.success("Enrollment details updated successfully!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to update enrollment details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-4 rounded-2xl text-xs sm:text-sm text-amber-800 dark:text-amber-300 shadow-xs">
        <strong className="font-bold">Note:</strong> Changes made here reflect only on this student's specific enrollment within this active batch.
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl mr-3 border border-blue-100 dark:border-blue-900/60">
            <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Enrollment Identifiers
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Manage roll number, registration ID, and batch status
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Roll Number */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Roll Number</label>
            <input
              type="text"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="e.g. 01"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>

          {/* Registration ID */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Registration ID</label>
            <input
              type="text"
              name="registerId"
              value={formData.registerId}
              onChange={handleChange}
              placeholder="e.g. REG-2023-001"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>

          {/* Enrollment Date */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Enrollment Date</label>
            <input
              type="date"
              name="enrollmentDate"
              value={formData.enrollmentDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Enrollment Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Remarks / Notes</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Private notes regarding this student's enrollment status..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 p-4 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 mt-6 rounded-b-3xl">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer active:scale-95"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
