import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Loader2,
  GraduationCap,
  Calendar,
  Award,
  TrendingUp,
  ClipboardList,
  Clock,
  AlertCircle,
  BookOpen,
  Building,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Query } from "appwrite";
import { checkProfileCompletion } from "@/utils/profileCompletion";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import questionpaperservice from "@/appwrite/mockTest";

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/30 dark:border-slate-700/50">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);

const StudentDashboard = ({
  user,
  profile,
  batchContext,
  activeBatchId,
  activeBatchData,
  userBatches,
  isBatchLoading,
}) => {
  const navigate = useNavigate();
  const { isComplete, missingFields } = checkProfileCompletion(profile);
  const [overallStats, setOverallStats] = useState(null);
  const [testStats, setTestStats] = useState({ count: 0, avgScore: 0 });
  const [recentTests, setRecentTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch student-specific stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!activeBatchId || !user?.$id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [attStats, tests] = await Promise.all([
          newAttendanceService.getStudentAttendanceStats(user.$id, activeBatchId),
          questionpaperservice.listQuestions([
            Query.equal("userId", user.$id),
            Query.equal("submitted", true),
            Query.select(["score", "quesCount", "paperId", "tradeName", "$createdAt"]),
            Query.orderDesc("$createdAt"),
            Query.limit(10),
          ]),
        ]);

        setOverallStats(attStats);
        setRecentTests(tests || []);

        if (tests?.length > 0) {
          const avg = parseFloat(
            (tests.reduce((s, t) => s + (t.quesCount > 0 ? (t.score / t.quesCount) * 100 : 0), 0) / tests.length).toFixed(1)
          );
          setTestStats({ count: tests.length, avgScore: avg });
        }
      } catch (err) {
        console.error("[StudentDashboard] Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [activeBatchId, user?.$id]);

  // No batch state
  if (!activeBatchId && !isBatchLoading) {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <GradientBackground />
        <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 pb-20 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-8 text-center max-w-md">
            <div className="p-4 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl inline-block mb-4">
              <GraduationCap className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Join a Batch</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Send a request to join a batch and start tracking your progress.
            </p>
            <Button
              onClick={() => navigate("/browse-batches")}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-md shadow-pink-500/20 transition-all hover:-translate-y-0.5"
            >
              Browse Batches →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <GradientBackground />
      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 space-y-5 pb-20">
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

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl">
          <div className="h-24 bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
          </div>
          <div className="px-5 sm:px-6 pb-6 -mt-10">
            <div className="flex items-end gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-slate-900 rounded-2xl shadow-lg">
                <AvatarImage src={profile?.profileImage} />
                <AvatarFallback className="text-lg font-extrabold bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 rounded-2xl">
                  {profile?.userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 pb-1">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {profile?.userName || "Student"}
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex-wrap">
                  {batchContext.batchName && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> {batchContext.batchName}
                    </span>
                  )}
                  {batchContext.tradeName && (
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" /> {batchContext.tradeName}
                    </span>
                  )}
                  {batchContext.collegeName && (
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" /> {batchContext.collegeName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={TrendingUp}
                label="Attendance"
                value={`${overallStats?.percentage || 0}%`}
                sub={`${overallStats?.presentDays || 0} / ${overallStats?.total || 0} days`}
                color="bg-gradient-to-br from-emerald-500 to-green-600"
              />
              <StatCard
                icon={Calendar}
                label="Present"
                value={overallStats?.presentDays || 0}
                color="bg-gradient-to-br from-pink-500 to-rose-600"
              />
              <StatCard
                icon={ClipboardList}
                label="Tests"
                value={testStats.count}
                color="bg-gradient-to-br from-purple-500 to-indigo-600"
              />
              <StatCard
                icon={Award}
                label="Avg Score"
                value={`${testStats.avgScore}%`}
                color="bg-gradient-to-br from-amber-500 to-orange-600"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate("/student-attendance")}
                variant="outline"
                className="h-14 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/40 dark:border-slate-800 hover:bg-pink-50/60 dark:hover:bg-pink-900/10 transition-all font-bold text-sm"
              >
                <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                View Attendance
              </Button>
              <Button
                onClick={() => navigate("/all-mock-tests")}
                variant="outline"
                className="h-14 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/40 dark:border-slate-800 hover:bg-purple-50/60 dark:hover:bg-purple-900/10 transition-all font-bold text-sm"
              >
                <BookOpen className="w-4 h-4 mr-2 text-purple-500" />
                Mock Tests
              </Button>
            </div>

            {/* Recent Tests */}
            {recentTests.length > 0 && (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Recent Tests</h3>
                </div>
                <div className="divide-y divide-white/20 dark:divide-slate-800/50">
                  {recentTests.slice(0, 5).map((test, idx) => {
                    const pct = test.quesCount > 0 ? ((test.score / test.quesCount) * 100).toFixed(1) : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-pink-50/20 dark:hover:bg-pink-900/5 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{test.tradeName || test.paperId}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {test.$createdAt ? format(new Date(test.$createdAt), "dd MMM yyyy") : "—"}
                          </p>
                        </div>
                        <span className={`text-sm font-extrabold tabular-nums ${
                          pct >= 75 ? "text-emerald-600 dark:text-emerald-400"
                          : pct >= 50 ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                        }`}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const GradientBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse" />
    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse" />
  </div>
);

export default StudentDashboard;
