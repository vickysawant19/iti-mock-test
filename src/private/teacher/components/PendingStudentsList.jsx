import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Loader2, Users, Filter, RefreshCw } from "lucide-react";
import { selectUser } from "@/store/userSlice";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Query } from "appwrite";
import batchService from "@/appwrite/batchService";
import userProfileService from "@/appwrite/userProfileService";
import StudentApprovalCard from "./StudentApprovalCard";

/**
 * PendingStudentsList
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows students filtered by approvalStatus, scoped to the teacher's
 * colleges and trades (derived from the teacher's own batches).
 *
 * Key architecture decision:
 *   Pending students have NOT been assigned a confirmed batchId yet.
 *   Filtering by batchId would always return 0 results for the "pending" tab.
 *   Instead we filter by collegeId + tradeId (stable at onboarding time).
 *
 *   For "pending" tab — the batch dropdown shows the student's *requested*
 *   batch preference from onboarding (stored as batchId at that point),
 *   NOT a confirmed assignment.
 *
 * Props:
 *   status – "pending" | "approved" | "rejected" (default "pending")
 */
export default function PendingStudentsList({ status = "pending", selectedBatch }) {
  const user = useSelector(selectUser);
  const teacherId = user?.$id;

  const [teacherBatches, setTeacherBatches] = useState([]); // full batch objects
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // ── Step A: fetch teacher's batches (need collegeId, tradeId, $id, BatchName) ──
  useEffect(() => {
    if (!teacherId) return;
    const fetchBatches = async () => {
      try {
        const res = await batchService.listBatches([
          Query.equal("teacherId", teacherId),
          Query.select(["$id", "BatchName", "collegeId", "tradeId"]),
          Query.limit(100),
        ]);
        setTeacherBatches(res.documents || []);
      } catch (err) {
        console.error("PendingStudentsList: error fetching batches:", err);
      }
    };
    fetchBatches();
  }, [teacherId]);

  // ── Step B: derive unique collegeIds + tradeIds from those batches ──────────
  const { collegeIds, tradeIds } = useMemo(() => {
    const colSet = new Set();
    const tradeSet = new Set();
    teacherBatches.forEach((b) => {
      if (b.collegeId) colSet.add(b.collegeId);
      if (b.tradeId) tradeSet.add(b.tradeId);
    });
    return {
      collegeIds: [...colSet],
      tradeIds: [...tradeSet],
    };
  }, [teacherBatches]);

  // ── Step C: fetch students by status + college scope ─────────────────────────
  const fetchStudents = async () => {
    if (!collegeIds.length || !tradeIds.length) {
      setStudents([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await userProfileService.getStudentsByApprovalStatus(
        status,
        collegeIds,
        tradeIds
      );
      setStudents(result);
    } catch (err) {
      console.error("PendingStudentsList: error fetching students:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (collegeIds.length > 0 && tradeIds.length > 0) {
      fetchStudents();
    } else if (teacherBatches.length > 0) {
      // batches loaded but no college/trade info — unlikely, stop loading
      setIsLoading(false);
    }
  }, [collegeIds.join(","), tradeIds.join(","), status]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    setIsRefreshing(false);
  };

  // ── Filtering / search ───────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = students;

    if (selectedBatch) {
      list = list.filter((s) => {
        // For "approved" students — filter by their confirmed assigned batchId.
        // For "pending" students — filter by their *requested* batchId from onboarding.
        // Both cases use the same batchId field; pending just hasn't been confirmed yet.
        const studentBatchId = s.batchId?.$id || s.batchId;
        return studentBatchId === selectedBatch;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.userName?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, selectedBatch, search]);

  // ── Remove student from local state after an action ──────────────────────────
  const handleActioned = (studentId) => {
    setStudents((prev) => prev.filter((s) => s.$id !== studentId));
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white capitalize">
            {status} Requests
          </h2>
          {students.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold rounded-full bg-amber-500 text-white">
              {students.length}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search name / email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 px-3 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
          />

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-slate-500 text-sm">Loading…</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-medium text-slate-500 dark:text-slate-400">
            No {status} requests
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {status === "pending"
              ? "Students who complete onboarding will appear here."
              : `No students with status "${status}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((student) => (
            <StudentApprovalCard
              key={student.$id}
              student={student}
              teacherId={teacherId}
              teacherBatches={teacherBatches}
              onApproved={handleActioned}
              onRejected={handleActioned}
              onReApproved={handleActioned}
            />
          ))}
        </div>
      )}
    </div>
  );
}
