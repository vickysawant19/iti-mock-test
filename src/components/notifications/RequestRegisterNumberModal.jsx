import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  IdCard,
  Send,
  Loader2,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import { selectUser } from "@/store/userSlice";
import { selectUserBatches, selectActiveBatch } from "@/store/activeBatchSlice";
import notificationService from "@/services/notification/notification.service";
import batchStudentService from "@/services/batch/batchStudentService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function RequestRegisterNumberModal({
  trigger,
  userBatches: propBatches,
  selectedBatchId: initialBatchId,
  onSuccess,
}) {
  const user = useSelector(selectUser);
  const storeBatches = useSelector(selectUserBatches) || [];
  const activeBatch = useSelector(selectActiveBatch);
  const batches = propBatches && propBatches.length > 0 ? propBatches : storeBatches;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(
    initialBatchId && initialBatchId !== "all"
      ? initialBatchId
      : activeBatch?.$id || batches[0]?.$id || ""
  );

  const [message, setMessage] = useState(
    "Please submit your official ITI Registration Number (starting with R) for official portal and exam records."
  );
  const [isSending, setIsSending] = useState(false);

  // Roster inspection stats for selected batch
  const [rosterStats, setRosterStats] = useState({
    total: 0,
    hasRegId: 0,
    missingRegId: 0,
    isLoading: false,
  });

  // Keep selectedBatchId synchronized if initialBatchId changes
  useEffect(() => {
    if (initialBatchId && initialBatchId !== "all") {
      setSelectedBatchId(initialBatchId);
    } else if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(activeBatch?.$id || batches[0]?.$id || "");
    }
  }, [initialBatchId, batches, activeBatch?.$id]);

  // Fetch roster of selected batch to show missing counts
  const fetchRosterAudit = useCallback(async (batchId) => {
    if (!batchId) return;
    setRosterStats((prev) => ({ ...prev, isLoading: true }));
    try {
      const students = await batchStudentService.getBatchStudents(batchId);
      const total = students.length;
      const hasRegId = students.filter(
        (s) => s.registerId && s.registerId.trim() !== ""
      ).length;
      const missingRegId = total - hasRegId;

      setRosterStats({
        total,
        hasRegId,
        missingRegId,
        isLoading: false,
      });
    } catch (err) {
      console.warn("Could not audit batch students registerId:", err);
      setRosterStats((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (isOpen && selectedBatchId) {
      fetchRosterAudit(selectedBatchId);
    }
  }, [isOpen, selectedBatchId, fetchRosterAudit]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!selectedBatchId) {
      toast.error("Please select a target batch");
      return;
    }

    if (!message.trim()) {
      toast.error("Please provide an instructional message");
      return;
    }

    setIsSending(true);

    try {
      const targetBatch = batches.find((b) => b.$id === selectedBatchId);

      await notificationService.createNotification({
        message: message.trim(),
        type: "request_register_number",
        batchId: selectedBatchId,
        teacherId: user?.$id || "teacher",
        teamId: targetBatch?.teamId || null,
        paperId: "N/A",
      });

      toast.success(
        `📢 Registration Number request broadcasted to students in ${
          targetBatch?.BatchName || "the batch"
        }!`
      );

      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to send register number request:", err);
      toast.error("Could not broadcast request. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer rounded-xl"
          >
            <IdCard className="h-3.5 w-3.5" />
            <span>Request Reg. No.</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-0 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <IdCard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Request Registration Numbers
              </DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trigger an on-load popup for students missing their "R..." Registration ID
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} className="p-5 space-y-4">
          {/* Batch Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Target Batch <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.$id} value={b.$id}>
                  {b.BatchName || "Batch"}
                </option>
              ))}
            </select>
          </div>

          {/* Roster Live Audit Banner */}
          <div className="p-3.5 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800">
            {rosterStats.isLoading ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Checking batch registration status...</span>
              </div>
            ) : rosterStats.total === 0 ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-slate-400" />
                <span>No students currently enrolled in this batch.</span>
              </div>
            ) : rosterStats.missingRegId > 0 ? (
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    <strong className="font-black text-amber-700 dark:text-amber-300 text-sm">
                      {rosterStats.missingRegId} of {rosterStats.total}
                    </strong>{" "}
                    students are missing their Registration Number.
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                    This request will display an automatic popup on their screens on next load.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  All {rosterStats.total} students in this batch already have a Registration ID!
                </span>
              </div>
            )}
          </div>

          {/* Custom Message */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Instructions for Students
            </label>
            <Textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message explaining what students should submit..."
              className="w-full text-xs font-medium rounded-xl border-slate-200 dark:border-slate-700 focus:ring-indigo-500/30"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              The popup will enforce that the student's input starts with the letter <strong>'R'</strong> (e.g. R2408...).
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSending || !selectedBatchId || !message.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black gap-1.5 shadow-sm cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request to Students</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
