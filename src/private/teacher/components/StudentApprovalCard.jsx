import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Building,
  BookOpen,
  Users,
  Calendar,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import userProfileService from "@/appwrite/userProfileService";
import batchRequestService from "@/appwrite/batchRequestService";
import batchStudentService from "@/appwrite/batchStudentService";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";

export default function StudentApprovalCard({
  student,
  teacherId,
  teacherBatches = [],
  onApproved,
  onRejected,
  onReApproved,
  selectedBatchContext
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isReApproving, setIsReApproving] = useState(false);

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

  const assignedBatchName =
    teacherBatches.find((b) => b.$id === selectedBatchContext)?.BatchName || "Requested Batch";

  const requestDate = student?.requestedAt
    ? new Date(student.requestedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

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
  }[student?.requestStatus] ?? null;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await batchRequestService.updateRequestStatus(student.requestId, "approved");
      await batchStudentService.addStudent(selectedBatchContext, student.userId);
      
      // Backward compatibility update removed as per new architecture

      toast.success(`${student.userName || "Student"} approved!`);
      onApproved?.(student.requestId);
    } catch {
      toast.error("Failed to approve student.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await batchRequestService.updateRequestStatus(student.requestId, "rejected");
      
      // Backward compatibility update removed as per new architecture

      toast.info(`${student.userName || "Student"} request rejected.`);
      onRejected?.(student.requestId);
    } catch {
      toast.error("Failed to reject student.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleReApprove = async () => {
    setIsReApproving(true);
    try {
       await batchRequestService.updateRequestStatus(student.requestId, "approved");
       await batchStudentService.addStudent(selectedBatchContext, student.userId);
       // Backward compatibility update removed

      toast.success(`${student.userName || "Student"} re-approved!`);
      onReApproved?.(student.requestId);
    } catch {
      toast.error("Failed to re-approve student.");
    } finally {
      setIsReApproving(false);
    }
  };

  const isBusy = isApproving || isRejecting || isReApproving;

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
            <span>Requested: {requestDate}</span>
          </div>
        </div>

        {/* Action context details */}
        <div className="space-y-2 mt-2">
           <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-md">
             <Users className="w-3.5 h-3.5 shrink-0" />
             <span className="font-medium truncate">
               Target Batch: {assignedBatchName}
             </span>
           </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-2 flex gap-2">
          {student.requestStatus === "pending" && (
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

          {student.requestStatus === "approved" && (
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
              {isRejecting ? "Revoking…" : "Revoke"}
            </Button>
          )}

          {student.requestStatus === "rejected" && (
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
