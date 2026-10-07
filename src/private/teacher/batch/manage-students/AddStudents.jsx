import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Users, UserPlus, FileText, ClipboardList } from "lucide-react";
import { selectUser } from "@/store/userSlice";
import { selectActiveBatchId } from "@/store/activeBatchSlice";
import batchService from "@/services/batch/batchService";
import { Query } from "appwrite";

import ManageStudentsList from "./ManageStudentsList";
import AddStudentForm from "./AddStudentForm";
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";

const AddStudents = () => {
  const { batchId: routeBatchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const teacherId = user?.$id;
  // Read the globally active batch from Redux so we pre-select it on mount
  const activeBatchId = useSelector(selectActiveBatchId);

  const [activeTab, setActiveTab] = useState("manage"); // 'manage' or 'add'
  const [teacherBatches, setTeacherBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreationNextSteps, setShowCreationNextSteps] = useState(false);

  const selectedBatchData = teacherBatches.find((b) => b.$id === selectedBatch) || null;

  useEffect(() => {
    try {
      localStorage.setItem("teacher_managed_enrollment", "true");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!location.state?.batchCreated) return;
    setShowCreationNextSteps(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // Load teacher batches
  useEffect(() => {
    if (!teacherId) return;
    const fetchBatches = async () => {
      try {
        const res = await batchService.listBatches([
          Query.equal("teacherId", teacherId),
        ]);
        const batches = res.documents || [];
        setTeacherBatches(batches);
        if (batches.length > 0 && (!selectedBatch || routeBatchId)) {
          // Prefer an explicitly routed batch, then the active batch, then the first batch.
          const preferred =
            routeBatchId && batches.some((b) => b.$id === routeBatchId)
              ? routeBatchId
              : activeBatchId && batches.some((b) => b.$id === activeBatchId)
              ? activeBatchId
              : batches[0].$id;
          setSelectedBatch(preferred);
        }
      } catch (err) {
        console.error("AddStudents: error fetching batches:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatches();
  }, [teacherId, activeBatchId, routeBatchId]);

  const handleBatchChange = (batchId) => {
    setSelectedBatch(batchId);
    if (routeBatchId && batchId) {
      navigate(`/batches/${batchId}/students`, { replace: true });
    }
  };

  if (!isLoading && teacherBatches.length === 0) {
    return (
      <div className="p-4 md:p-6 pb-24">
        <NoBatchTeacherView isTeacher={true} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 text-slate-900 min-h-screen dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header and Batch Selector */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white sm:text-xl">
                Manage batch enrollment
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage your batch enrollments and approve student requests
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end sm:border-0 sm:pt-0">
            <label htmlFor="enrollment-batch-select" className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
              Selected batch
              <span className="relative">
              <select
                id="enrollment-batch-select"
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="h-10 w-48 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {teacherBatches.map((b) => (
                  <option key={b.$id} value={b.$id}>
                    {b.BatchName || b.$id}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              </span>
            </label>
            <button
              type="button"
              onClick={() => selectedBatch && navigate(`/batches/${selectedBatch}/records`)}
              disabled={!selectedBatch}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ClipboardList className="h-4 w-4" />
              View records
            </button>
          </div>
        </div>

        {showCreationNextSteps && (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/30 sm:flex sm:items-center sm:justify-between sm:gap-5" aria-live="polite">
            <div>
              <h2 className="font-semibold text-emerald-950 dark:text-emerald-100">Your batch is ready</h2>
              <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80">
                Next, add students or review join requests. You can open this batch’s records or update its settings at any time.
              </p>
            </div>
            <div className="mt-3 flex shrink-0 flex-wrap gap-2 sm:mt-0">
              <button
                type="button"
                disabled={!selectedBatch}
                onClick={() => setActiveTab("add")}
                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add students
              </button>
              <button
                type="button"
                disabled={!selectedBatch}
                onClick={() => navigate(`/batches/${selectedBatch}/records`)}
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-100 dark:hover:bg-emerald-950"
              >
                View records
              </button>
              <button
                type="button"
                onClick={() => setShowCreationNextSteps(false)}
                className="inline-flex min-h-9 items-center justify-center rounded-lg px-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        {/* Navigation Tabs */}
        <div className="flex w-full gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900 sm:w-fit">
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-xs font-semibold transition-colors sm:w-auto ${
              activeTab === "manage"
                ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            Manage Students
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-xs font-semibold transition-colors sm:w-auto ${
              activeTab === "add"
                ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Add New Student
          </button>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
          {activeTab === "manage" ? (
            <ManageStudentsList selectedBatch={selectedBatch} batchData={selectedBatchData} />
          ) : (
             <AddStudentForm defaultBatchId={selectedBatch} teacherBatches={teacherBatches} />
          )}
        </div>

      </div>
    </div>
  );
};

export default AddStudents;
