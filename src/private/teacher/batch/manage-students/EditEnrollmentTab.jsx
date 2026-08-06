import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Copy, CalendarDays, Loader2, Save } from "lucide-react";
import batchStudentService from "@/appwrite/batchStudentService";

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
    <div className="space-y-6 max-w-2xl mx-auto p-2">
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-400">
        <strong className="font-bold">Note:</strong> Changes made here reflect only on this student's specific enrollment within this active batch.
      </div>

      <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-3 border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" /> Enrollment Identifiers
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Roll Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Roll Number</label>
            <input
              type="text"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="e.g. 01"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>

          {/* Registration ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Registration ID</label>
            <input
              type="text"
              name="registerId"
              value={formData.registerId}
              onChange={handleChange}
              placeholder="e.g. REG-2023-001"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>

          {/* Enrollment Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enrollment Date</label>
            <input
              type="date"
              name="enrollmentDate"
              value={formData.enrollmentDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enrollment Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Remarks / Notes</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Private notes regarding this student's enrollment status..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
