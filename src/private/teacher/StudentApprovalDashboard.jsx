import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  ClipboardList,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { selectUser } from "@/store/userSlice";
import batchService from "@/appwrite/batchService";
import PendingStudentsList from "./components/PendingStudentsList";
import TargetedStudentsList from "./components/TargetedStudentsList";
import batchRequestService from "@/appwrite/batchRequestService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * StudentApprovalDashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Dedicated page for teacher to manage all student approvals.
 * Route: /manage-batch/approvals
 *
 * Sections:
 *   1. Pending Requests  — students awaiting approval
 *   2. Approved Students — approved with batch info + re-assign option
 *   3. Rejected Students — rejected with option to re-approve
 *
 * Architecture note:
 *   Students are scoped by the teacher's college + trade (NOT batch).
 *   Pending students have no confirmed batchId yet — filtering by batch
 *   would return 0 results. See PendingStudentsList for details.
 */

const TABS = [
  {
    id: "pending",
    label: "Pending",
    icon: Clock,
    color: "amber",
    description: "Students waiting for your review",
  },
  {
    id: "targeted",
    label: "Unrequested",
    icon: Users,
    color: "blue",
    description: "Students marked for this batch without a request",
  },
  {
    id: "approved",
    label: "Approved",
    icon: CheckCircle,
    color: "green",
    description: "Accepted students with batch access",
  },
  {
    id: "rejected",
    label: "Rejected",
    icon: XCircle,
    color: "red",
    description: "Declined requests",
  },
];

const COLOR_MAP = {
  amber: {
    tab: "bg-amber-500 text-white shadow-amber-200 dark:shadow-amber-900/40",
    inactive:
      "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
    badge: "bg-amber-500",
    header:
      "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/40",
    icon: "text-amber-500",
  },
  blue: {
    tab: "bg-blue-500 text-white shadow-blue-200 dark:shadow-blue-900/40",
    inactive:
      "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    badge: "bg-blue-500",
    header:
      "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800/40",
    icon: "text-blue-500",
  },
  green: {
    tab: "bg-green-500 text-white shadow-green-200 dark:shadow-green-900/40",
    inactive:
      "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
    badge: "bg-green-500",
    header:
      "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800/40",
    icon: "text-green-500",
  },
  red: {
    tab: "bg-red-500 text-white shadow-red-200 dark:shadow-red-900/40",
    inactive:
      "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
    badge: "bg-red-500",
    header:
      "from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 border-red-200 dark:border-red-800/40",
    icon: "text-red-500",
  },
};

export default function StudentApprovalDashboard() {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const teacherId = user?.$id;

  const [activeTab, setActiveTab] = useState("pending");
  const [rawStudents, setRawStudents] = useState({ pending: [], approved: [], rejected: [] });
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Fetch teacher's batches to derive college + trade scope
  const [teacherBatches, setTeacherBatches] = useState([]);
  const { collegeIds, tradeIds } = useMemo(() => {
    const colSet = new Set();
    const tradeSet = new Set();
    teacherBatches.forEach((b) => {
      if (b.collegeId) colSet.add(b.collegeId);
      if (b.tradeId) tradeSet.add(b.tradeId);
    });
    return { collegeIds: [...colSet], tradeIds: [...tradeSet] };
  }, [teacherBatches]);

  // Load teacher batches
  useEffect(() => {
    if (!teacherId) return;
    batchService
      .listBatches([
        Query.equal("teacherId", teacherId),
        Query.select(["$id", "BatchName", "collegeId", "tradeId"]),
        Query.limit(100),
      ])
      .then((res) => setTeacherBatches(res.documents || []))
      .catch((err) =>
        console.error("StudentApprovalDashboard: error fetching batches:", err)
      );
  }, [teacherId]);

  // Auto-select first batch if none selected
  useEffect(() => {
    if (teacherBatches.length > 0 && !selectedBatch) {
      setSelectedBatch(teacherBatches[0].$id);
    }
  }, [teacherBatches, selectedBatch]);

  // Load raw students for all tabs to compute accurate counts
  const loadCounts = async () => {
    if (!selectedBatch) return;
    setIsLoadingCounts(true);
    try {
      const allRequests = await batchRequestService.getRequests(selectedBatch);
      
      const pending = allRequests.filter(r => r.status === "pending");
      const approved = allRequests.filter(r => r.status === "approved");
      const rejected = allRequests.filter(r => r.status === "rejected");
      
      setRawStudents({ pending, approved, rejected });
    } catch (err) {
      console.error("StudentApprovalDashboard: error loading counts:", err);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // Derive counts based on the currently selected batch
  const counts = useMemo(() => {
    return {
      pending: rawStudents.pending.length,
      approved: rawStudents.approved.length,
      rejected: rawStudents.rejected.length,
    };
  }, [rawStudents]);

  useEffect(() => {
    if (selectedBatch) {
      loadCounts();
    }
  }, [selectedBatch]);

  const activeTabCfg = TABS.find((t) => t.id === activeTab);
  const colors = COLOR_MAP[activeTabCfg?.color];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                    Student Approvals
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage student access requests for your batches
                </p>
              </div>
            </div>

            <button
              onClick={loadCounts}
              disabled={isLoadingCounts}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingCounts ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Batch Selector ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 justify-between rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Batch:</span>
            {teacherBatches.length > 0 ? (
              <Select value={selectedBatch || ""} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-64 h-9">
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {teacherBatches.map((b) => (
                    <SelectItem key={b.$id} value={b.$id}>
                      {b.BatchName || b.$id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-slate-400">Loading batches...</span>
            )}
          </div>
        </div>

        {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 flex gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const tabColors = COLOR_MAP[tab.color];
            const Icon = tab.icon;
            const count = counts[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? `${tabColors.tab} shadow-sm`
                    : `${tabColors.inactive} bg-transparent`
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold rounded-full ${
                      isActive
                        ? "bg-white/30 text-white"
                        : `${tabColors.badge} text-white`
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Active Tab Header Card ──────────────────────────────────────────── */}
        <div
          className={`rounded-2xl border bg-gradient-to-r ${colors.header} p-4 flex items-center gap-3`}
        >
          {activeTabCfg && (
            <>
              <div
                className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-900/50 flex items-center justify-center shadow-sm`}
              >
                <activeTabCfg.icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-white text-sm">
                  {activeTabCfg.label} Students
                  {counts[activeTab] > 0 && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      ({counts[activeTab]} total)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeTabCfg.description}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Student List ────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
          {selectedBatch ? (
            activeTab === "targeted" ? (
              <TargetedStudentsList
                key={activeTab + selectedBatch}
                selectedBatch={selectedBatch}
              />
            ) : (
              <PendingStudentsList
                key={activeTab + selectedBatch}
                status={activeTab}
                selectedBatch={selectedBatch}
              />
            )
          ) : (
            <div className="py-12 text-center text-slate-500">Please select a batch to view students.</div>
          )}
        </div>

        {/* ── Help callout ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 p-4">
          <div className="flex items-start gap-3">
            <Users className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-semibold">How student approval works</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
                <li>Students appear here after completing registration</li>
                <li>
                  Approving assigns the student to a batch and grants full access
                </li>
                <li>Rejected students are locked out until re-approved</li>
                <li>Approved students can be reassigned to a different batch</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
