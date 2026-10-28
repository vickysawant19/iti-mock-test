import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Check,
  X,
  Clock,
  CheckCheck,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { newAttendanceService } from "@/services/attendance/newAttendanceService";
import { toast } from "react-toastify";

const getRequestedStatusInfo = (req) => {
  const s = String(req?.status || "").toLowerCase();
  const lt = String(req?.leaveType || "").toUpperCase();
  if (s === "absent" || req?.attendanceStatus === "ABSENT") {
    return { code: "A", label: "Absent", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" };
  }
  if (lt === "CASUAL" || ["cl", "casual"].includes(s)) {
    return { code: "CL", label: "Casual Leave", color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" };
  }
  if (lt === "SICK" || ["sl", "sick"].includes(s)) {
    return { code: "SL", label: "Sick Leave", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" };
  }
  if (lt === "SPECIAL" || ["spl", "special"].includes(s)) {
    return { code: "SPL", label: "Special Leave", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" };
  }
  return { code: "P", label: "Present", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" };
};

export const VerifyAttendanceModal = ({
  isOpen,
  onClose,
  batchId,
  teacherId,
  pendingRequests = [],
  students = [],
  onSuccess,
}) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingItem, setRejectingItem] = useState(null); // { id, reason }
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");

  const studentMap = useMemo(() => {
    const map = new Map();
    (students || []).forEach((s) => {
      if (s?.userId) map.set(s.userId, s);
    });
    return map;
  }, [students]);

  const filteredRequests = useMemo(() => {
    return (pendingRequests || []).filter((req) => {
      const student = studentMap.get(req.userId);
      const studentName = String(student?.userName || student?.name || "").toLowerCase();
      const rollNumber = String(student?.rollNo || student?.rollNumber || "").toLowerCase();
      const dateStr = String(req.date || "").toLowerCase();
      const remarks = String(req.remarks || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      if (!q) return true;
      return (
        studentName.includes(q) ||
        rollNumber.includes(q) ||
        dateStr.includes(q) ||
        remarks.includes(q)
      );
    });
  }, [pendingRequests, studentMap, searchQuery]);

  if (!isOpen) return null;

  const allVisibleSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((r) => selectedIds.has(r.$id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map((r) => r.$id)));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleVerify = async (actionList) => {
    if (!actionList || actionList.length === 0) return;
    setIsProcessing(true);
    try {
      await newAttendanceService.verifyAttendanceRequests({
        requests: actionList,
        teacherId,
        batchId,
      });

      toast.success(
        `Successfully processed ${actionList.length} attendance request(s)!`
      );
      if (typeof onSuccess === "function") {
        await onSuccess();
      }
      setSelectedIds(new Set());
      setRejectingItem(null);
      setBulkRejecting(false);
      setRejectionReasonText("");
      onClose();
    } catch (error) {
      console.error("Failed to verify attendance requests:", error);
      toast.error(error.message || "Failed to process attendance requests.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveSingle = (req) => {
    handleVerify([
      {
        documentId: req.$id,
        action: "APPROVE",
        status: req.status || "present",
        attendanceStatus: req.attendanceStatus || (req.status ? req.status.toUpperCase() : "PRESENT"),
        leaveType: req.leaveType || null,
      },
    ]);
  };

  const handleConfirmSingleReject = () => {
    if (!rejectingItem) return;
    handleVerify([
      {
        documentId: rejectingItem.$id,
        action: "REJECT",
        rejectionReason: rejectionReasonText.trim() || "Rejected by instructor",
      },
    ]);
  };

  const handleApproveSelected = () => {
    const list = (pendingRequests || [])
      .filter((r) => selectedIds.has(r.$id))
      .map((r) => ({
        documentId: r.$id,
        action: "APPROVE",
        status: r.status || "present",
        attendanceStatus: r.attendanceStatus || (r.status ? r.status.toUpperCase() : "PRESENT"),
        leaveType: r.leaveType || null,
      }));
    handleVerify(list);
  };

  const handleConfirmBulkReject = () => {
    const list = Array.from(selectedIds).map((id) => ({
      documentId: id,
      action: "REJECT",
      rejectionReason: rejectionReasonText.trim() || "Rejected by instructor",
    }));
    handleVerify(list);
  };

  const REJECTION_PRESETS = [
    "No prior intimation / unexcused absence",
    "Did not attend lecture or practical session",
    "Medical proof / documentation not provided",
    "Request submitted after acceptable window",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Pending Attendance Requests</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-700">
                  {pendingRequests.length} Pending
                </span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Review and approve or reject past attendance claims submitted by students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Bulk Action Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, date..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Bulk Action Controls */}
          {filteredRequests.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>Select All ({filteredRequests.length})</span>
              </label>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleApproveSelected}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Approve ({selectedIds.size})</span>
                  </button>

                  <button
                    onClick={() => {
                      setBulkRejecting(true);
                      setRejectingItem(null);
                      setRejectionReasonText("");
                    }}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject ({selectedIds.size})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                No Pending Attendance Requests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                All student past attendance requests have been reviewed and verified.
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const student = studentMap.get(req.userId);
              const studentName = student?.userName || student?.name || "Student";
              const rollNumber = student?.rollNo || student?.rollNumber || "-";
              const isSelected = selectedIds.has(req.$id);

              let dateDisplay = req.date;
              try {
                dateDisplay = format(new Date(req.date), "dd MMMM yyyy (EEE)");
              } catch (e) {}

              return (
                <div
                  key={req.$id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 shadow-xs"
                      : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(req.$id)}
                        className="mt-1 rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {studentName}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 font-mono">
                            #{rollNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[11px]">
                            {dateDisplay}
                          </span>
                          {(() => {
                            const info = getRequestedStatusInfo(req);
                            const isCorrection = req?.remarks?.includes("[CORRECTION_REQUEST]");
                            return (
                              <>
                                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${info.color}`}>
                                  Requested: {info.code} ({info.label})
                                </span>
                                {isCorrection && (
                                  <span className="px-2 py-0.5 rounded-md font-black text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                                    Correction on Absent
                                  </span>
                                )}
                              </>
                            );
                          })()}
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        </div>

                        {req.remarks && (
                          <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                                Student Reason / Note:
                              </span>
                              {req.remarks.replace("[CORRECTION_REQUEST]", "").trim()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Row Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApproveSingle(req)}
                        disabled={isProcessing}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-all font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Approve this past attendance request"
                      >
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingItem(req);
                          setBulkRejecting(false);
                          setRejectionReasonText("");
                        }}
                        disabled={isProcessing}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Reject this past attendance request"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inline Rejection Reason Modal Overlay */}
        {(rejectingItem || bulkRejecting) && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/90 border-t border-rose-200 dark:border-rose-800 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-200 dark:border-rose-800/80">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  {bulkRejecting
                    ? `Rejecting ${selectedIds.size} Selected Requests`
                    : `Reject Request for ${studentMap.get(rejectingItem?.userId)?.userName || "Student"}`}
                </span>
              </div>
              <button
                onClick={() => {
                  setRejectingItem(null);
                  setBulkRejecting(false);
                }}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReasonText(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 font-medium hover:bg-rose-100 transition-all cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                placeholder="Specify rejection reason to notify the student..."
                className="w-full text-xs p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setRejectingItem(null);
                    setBulkRejecting(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={bulkRejecting ? handleConfirmBulkReject : handleConfirmSingleReject}
                  disabled={isProcessing}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {pendingRequests.length} pending request(s) total
          </span>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyAttendanceModal;
