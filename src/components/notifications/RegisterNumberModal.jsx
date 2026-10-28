import React, { useState } from "react";
import { IdCard, ShieldCheck, AlertCircle, Sparkles, X, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import batchStudentService from "@/services/batch/batchStudentService";
import notificationService from "@/services/notification/notification.service";
import { Button } from "@/components/ui/button";

export default function RegisterNumberModal({
  isOpen,
  notification,
  user,
  activeBatch,
  onClose,
  onSaved,
}) {
  const [regNumber, setRegNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const batchName =
    activeBatch?.BatchName || activeBatch?.batchName || "Your Batch";
  const targetBatchId =
    notification?.batchId ||
    activeBatch?.$id ||
    activeBatch?.batchId ||
    activeBatch?.id;

  const handleChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/\s+/g, "");

    // If student typed/pasted numbers directly, auto-prefix 'R'
    if (val && !val.startsWith("R") && /^[0-9]/.test(val)) {
      val = "R" + val;
    }

    setRegNumber(val);

    // Live validation feedback
    if (val && !val.startsWith("R")) {
      setError("Registration ID must start with the capital letter 'R'");
    } else if (val && val.length > 1 && !/^R[A-Z0-9]*$/.test(val)) {
      setError("Only letters and numbers are allowed after 'R'");
    } else {
      setError("");
    }
  };

  const handlePresetR = () => {
    if (!regNumber.startsWith("R")) {
      setRegNumber("R");
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = regNumber.trim().toUpperCase();

    if (!clean) {
      setError("Please enter your ITI Registration Number");
      return;
    }

    if (!clean.startsWith("R")) {
      setError("Registration ID must start with the letter 'R' (e.g. R2408...)");
      return;
    }

    if (clean.length < 6) {
      setError("Registration ID must be at least 6 characters (e.g. R220827...)");
      return;
    }

    if (!/^R[A-Z0-9]+$/.test(clean)) {
      setError("Only letters and numbers are permitted (e.g. R2408012345)");
      return;
    }

    if (!targetBatchId || !user?.$id) {
      toast.error("Could not identify student batch information.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 1. Update the student record in batchStudents table
      await batchStudentService.updateStudentRecord(targetBatchId, user.$id, {
        registerId: clean,
      });

      // 2. Cache in localStorage so on-load checks immediately see it
      localStorage.setItem(`student_reg_id_${user.$id}_${targetBatchId}`, clean);

      // 3. Mark notification as read
      if (notification?.id) {
        await notificationService
          .markAsRead(notification.id, user.$id)
          .catch(() => {});
      }

      toast.success(`Registration Number "${clean}" registered successfully! 🎉`);

      if (onSaved) {
        onSaved(clean);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save student registerId:", err);
      setError("Failed to save registration number. Please try again.");
      toast.error("Could not save Registration ID. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidFormat = regNumber.startsWith("R") && regNumber.length >= 6 && /^R[A-Z0-9]+$/.test(regNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 rounded-3xl shadow-2xl transition-all">
        {/* Top Gradient Bar */}
        <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header Icon & Title */}
          <div className="flex items-start gap-4 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
              <IdCard className="w-6 h-6" />
            </div>
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3 h-3" />
                <span>Instructor Request</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                Registration Number Required
              </h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {batchName}
              </span>
            </div>
          </div>

          {/* Teacher Message Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 mb-5">
            <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 leading-relaxed">
              {notification?.message ||
                "Your instructor has requested your official ITI Registration ID (NCVT MIS Number). Please enter your number starting with 'R'."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  Must start with <span className="text-indigo-600 dark:text-indigo-400 font-black">R</span>
                </span>
              </div>

              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none flex items-center">
                  <IdCard className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                </div>
                <input
                  type="text"
                  value={regNumber}
                  onChange={handleChange}
                  onFocus={handlePresetR}
                  placeholder="R240827..."
                  maxLength={30}
                  autoFocus
                  className={`w-full pl-10 pr-10 py-3 rounded-2xl font-mono text-sm font-extrabold tracking-wider bg-slate-50 dark:bg-slate-800/80 border ${
                    error
                      ? "border-red-400 dark:border-red-600 focus:ring-red-500/30"
                      : isValidFormat
                      ? "border-emerald-400 dark:border-emerald-600 focus:ring-emerald-500/30"
                      : "border-slate-200 dark:border-slate-700 focus:ring-indigo-500/30"
                  } text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
                />
                {isValidFormat && (
                  <CheckCircle2 className="absolute right-3.5 h-5 w-5 text-emerald-500" />
                )}
              </div>

              {/* Error Message */}
              {error ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : (
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
                  Format: Capital letter <strong>R</strong> followed by your registration digits (e.g. <span className="font-mono">R240827012345</span>).
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Button
                type="submit"
                disabled={isSubmitting || !regNumber.trim() || !!error}
                className="flex-1 py-3 h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 gap-1.5 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Registration ID</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="py-3 h-11 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                Remind Me Later
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
