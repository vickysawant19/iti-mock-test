import React, { useState, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  User,
  Building,
  BookOpen,
  Users,
  Calendar,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import userProfileService from "@/appwrite/userProfileService";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";

/**
 * StudentApprovalCard
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders one student's approval card, adaptable to any approval-status tab.
 *
 * State machine:
 *   pending  → Approve (with batch select) | Reject
 *   approved → Revoke access | Re-assign batch
 *   rejected → Re-approve (with batch select)
 *
 * Props:
 *   student        – profile document
 *   teacherId      – current teacher's $id
 *   teacherBatches – full batch objects [{$id, BatchName, collegeId, tradeId}]
 *   onApproved     – callback(profileId) after approve
 *   onRejected     – callback(profileId) after reject
 *   onReApproved   – callback(profileId) after re-approving a rejected student
 */
export default function StudentApprovalCard({
  student,
  teacherId,
  teacherBatches = [],
  onApproved,
  onRejected,
  onReApproved,
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isReApproving, setIsReApproving] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  // Teacher selects/confirms which batch to assign on approve
  const [selectedBatchId, setSelectedBatchId] = useState(
    student?.batchId?.$id || student?.batchId || ""
  );

  // Separate state for batch reassignment (approved tab)
  const [reassignBatchId, setReassignBatchId] = useState(
    student?.batchId?.$id || student?.batchId || ""
  );

  const { data: collegesData } = useListCollegesQuery();
  const { data: tradesData } = useListTradesQuery();

  const collegeName =
    collegesData?.documents?.find(
      (c) => c.$id === (student?.collegeId?.$id || student?.collegeId)
    )?.collageName || "—";

  const tradeName =
    tradesData?.documents?.find(
      (t) => t.$id === (student?.tradeId?.$id || student?.tradeId)
    )?.tradeName || "—";

  // Resolve the currently assigned batch name (for approved students)
  const assignedBatchId = student?.batchId?.$id || student?.batchId;
  const assignedBatchName =
    teacherBatches.find((b) => b.$id === assignedBatchId)?.BatchName ||
    (assignedBatchId ? "Batch ID: " + assignedBatchId : "—");

  const requestDate = student?.$updatedAt
    ? new Date(student.$updatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  // Only show batches that match the student's college + trade
  const compatibleBatches = useMemo(() => {
    const studentCollegeId = student?.collegeId?.$id || student?.collegeId;
    const studentTradeId = student?.tradeId?.$id || student?.tradeId;
    return teacherBatches.filter(
      (b) => b.collegeId === studentCollegeId && b.tradeId === studentTradeId
    );
  }, [teacherBatches, student]);

  // ── Status badge ─────────────────────────────────────────────────────────────
  const statusBadge = {
    pending: (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 shrink-0">
        Pending
      </Badge>
    ),
    approved: (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 shrink-0">
        Approved
      </Badge>
    ),
    rejected: (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 shrink-0">
        Rejected
      </Badge>
    ),
  }[student?.approvalStatus] ?? null;

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await userProfileService.approveStudent(
        student.$id,
        teacherId,
        selectedBatchId || undefined
      );
      toast.success(`${student.userName || "Student"} approved!`);
      onApproved?.(student.$id);
    } catch {
      toast.error("Failed to approve student.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await userProfileService.rejectStudent(student.$id, teacherId);
      toast.info(`${student.userName || "Student"} request rejected.`);
      onRejected?.(student.$id);
    } catch {
      toast.error("Failed to reject student.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleReApprove = async () => {
    setIsReApproving(true);
    try {
      await userProfileService.approveStudent(
        student.$id,
        teacherId,
        selectedBatchId || undefined
      );
      toast.success(`${student.userName || "Student"} re-approved!`);
      onReApproved?.(student.$id);
    } catch {
      toast.error("Failed to re-approve student.");
    } finally {
      setIsReApproving(false);
    }
  };

  /** Reassign batch for an already-approved student without changing approval status */
  const handleReassign = async () => {
    if (!reassignBatchId) {
      toast.warning("Please select a batch to reassign.");
      return;
    }
    if (reassignBatchId === assignedBatchId) {
      toast.info("Student is already in this batch.");
      setShowReassign(false);
      return;
    }
    setIsReassigning(true);
    try {
      await userProfileService.reassignStudentBatch(
        student.$id,
        reassignBatchId,
        teacherId
      );
      toast.success(`${student.userName || "Student"} reassigned successfully!`);
      // Remove from list (parent will refresh or re-fetch)
      onApproved?.(student.$id);
    } catch {
      toast.error("Failed to reassign student.");
    } finally {
      setIsReassigning(false);
      setShowReassign(false);
    }
  };

  const isBusy = isApproving || isRejecting || isReApproving || isReassigning;

  return (
    <Card className="border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col">
      <CardContent className="pt-4 pb-4 flex flex-col gap-3 h-full">
        {/* Header: avatar + name + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 text-sm font-bold text-blue-700 dark:text-blue-300">
              {student.userName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-white truncate text-sm">
                {student.userName || "Unnamed Student"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {student.email || "—"}
              </p>
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{collegeName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{tradeName}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{requestDate}</span>
          </div>
        </div>

        {/* ── APPROVED: show assigned batch + optional re-assign ── */}
        {student.approvalStatus === "approved" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 rounded-md">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate">
                Batch: {assignedBatchName}
              </span>
            </div>

            {/* Re-assign section (toggled) */}
            {showReassign ? (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400">Reassign to batch:</p>
                <Select
                  value={reassignBatchId}
                  onValueChange={setReassignBatchId}
                  disabled={isBusy}
                >
                  <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select batch…" />
                  </SelectTrigger>
                  <SelectContent>
                    {compatibleBatches.length > 0 ? (
                      compatibleBatches.map((b) => (
                        <SelectItem key={b.$id} value={b.$id} className="text-xs">
                          {b.BatchName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled className="text-xs text-slate-400">
                        No compatible batches
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs h-7"
                    onClick={handleReassign}
                    disabled={isBusy || !reassignBatchId}
                  >
                    {isReassigning ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    {isReassigning ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-xs h-7 text-slate-400"
                    onClick={() => setShowReassign(false)}
                    disabled={isBusy}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowReassign(true)}
                disabled={isBusy}
                className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 underline-offset-2 hover:underline transition-colors disabled:opacity-50"
              >
                Reassign batch
              </button>
            )}
          </div>
        )}

        {/* ── PENDING / REJECTED: batch selector for approval ── */}
        {student.approvalStatus !== "approved" && compatibleBatches.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-slate-400">
              {student.approvalStatus === "pending"
                ? "Assign batch on approve:"
                : "Batch to assign:"}
            </p>
            <Select
              value={selectedBatchId}
              onValueChange={setSelectedBatchId}
              disabled={isBusy}
            >
              <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Select batch…" />
              </SelectTrigger>
              <SelectContent>
                {compatibleBatches.map((b) => (
                  <SelectItem key={b.$id} value={b.$id} className="text-xs">
                    {b.BatchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedBatchId && (
              <p className="text-xs text-amber-500">
                ⚠ No batch selected — student's own preference will be used.
              </p>
            )}
          </div>
        )}

        {/* No compatible batches warning (pending/rejected only) */}
        {student.approvalStatus !== "approved" && compatibleBatches.length === 0 && (
          <p className="text-xs text-slate-400 italic">
            No matching batches for this college + trade.
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto pt-1 flex gap-2">
          {/* PENDING → Approve + Reject */}
          {student.approvalStatus === "pending" && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
                onClick={handleApprove}
                disabled={isBusy}
              >
                {isApproving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                {isApproving ? "Approving…" : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 gap-1.5 text-xs"
                onClick={handleReject}
                disabled={isBusy}
              >
                {isRejecting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                {isRejecting ? "Rejecting…" : "Reject"}
              </Button>
            </>
          )}

          {/* APPROVED → Revoke access */}
          {student.approvalStatus === "approved" && !showReassign && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 gap-1.5 text-xs"
              onClick={handleReject}
              disabled={isBusy}
            >
              {isRejecting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {isRejecting ? "Revoking…" : "Revoke Access"}
            </Button>
          )}

          {/* REJECTED → Re-approve */}
          {student.approvalStatus === "rejected" && (
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs"
              onClick={handleReApprove}
              disabled={isBusy}
            >
              {isReApproving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {isReApproving ? "Approving…" : "Re-approve"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
