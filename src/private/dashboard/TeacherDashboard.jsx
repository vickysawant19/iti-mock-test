import React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, Building, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkProfileCompletion } from "@/utils/profileCompletion";
import BatchOverviewCard from "./components/BatchOverviewCard";
import StudentTable from "./components/StudentTable";
import AttendanceTrendChart from "./components/AttendanceTrendChart";

const TeacherDashboard = ({
  profile,
  batchContext,
  batchOverview,
  studentRows,
  attendanceTrend,
  selectedMonth,
  setSelectedMonth,
  userBatches,
  isLoading,
  error,
  refetch,
}) => {
  const navigate = useNavigate();
  const { isComplete, missingFields } = checkProfileCompletion(profile);

  // No batch state
  if (!batchContext?.batchId && !isLoading) {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <GradientBackground />
        <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 pb-20 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-8 text-center max-w-md">
            <div className="p-4 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl inline-block mb-4">
              <Building className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Create Your First Batch</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Set up a batch to start managing students and track their progress.
            </p>
            <Button
              onClick={() => navigate("/manage-batch/create")}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-md shadow-pink-500/20 transition-all hover:-translate-y-0.5"
            >
              Create Batch →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <GradientBackground />
      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 space-y-5 pb-20">
        {/* Profile Incomplete Banner */}
        {!isComplete && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Complete your profile</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">Missing: {missingFields.join(", ")}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile/edit")}
              className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl shrink-0"
            >
              Update
            </Button>
          </div>
        )}

        {/* Batch Overview Hero */}
        <BatchOverviewCard batchContext={batchContext} batchOverview={batchOverview} />

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 font-medium"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="text-xs font-semibold text-slate-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50/60 dark:bg-red-900/20 backdrop-blur-xl border border-red-200/50 dark:border-red-800 rounded-3xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Student Table */}
            <StudentTable studentRows={studentRows} selectedMonth={selectedMonth} />

            {/* Visual Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AttendanceTrendChart data={attendanceTrend} />

              {/* Top / Low Performers Quick List */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
                    Needs Attention
                  </h3>
                </div>
                <div className="p-4 space-y-2 max-h-56 overflow-y-auto">
                  {studentRows
                    .filter((s) => s.totalAttendancePercent < 75)
                    .sort((a, b) => a.totalAttendancePercent - b.totalAttendancePercent)
                    .slice(0, 8)
                    .map((s) => (
                      <div
                        key={s.studentId}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-red-50/40 dark:bg-red-900/10 border border-red-100/30 dark:border-red-900/20"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                          {s.userName}
                        </span>
                        <span className="text-xs font-extrabold text-red-600 dark:text-red-400 tabular-nums shrink-0">
                          {s.totalAttendancePercent}%
                        </span>
                      </div>
                    ))}
                  {studentRows.filter((s) => s.totalAttendancePercent < 75).length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                      All students have ≥75% attendance 🎉
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Ambient Background Component
const GradientBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse" />
    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse" />
  </div>
);

export default TeacherDashboard;
