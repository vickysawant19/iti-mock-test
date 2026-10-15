import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import mockTestService from "@/services/academic/mocktest.service";
import { Query } from "appwrite";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  Clock,
  User,
  Calendar,
  Download,
  Info,
  Edit,
  ZoomIn,
  X,
  FileText,
  Check,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { resolveQuestion } from "@/utils/questionV2Helper";

const OPTIONS = ["A", "B", "C", "D"];

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const SkeletonBox = ({ className }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />
);

// ─── Stat Pill ────────────────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, subtext, colorCls }) => (
  <div className={`p-4 rounded-2xl border transition-all duration-200 ${colorCls} flex flex-col justify-between shadow-xs`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</span>
      <Icon className="w-4 h-4 opacity-80" />
    </div>
    <div>
      <div className="text-xl sm:text-2xl font-black tracking-tight">{value}</div>
      {subtext && <div className="text-[11px] opacity-75 font-medium mt-0.5">{subtext}</div>}
    </div>
  </div>
);

// ─── ShowMockTest Component ──────────────────────────────────────────────────
const ShowMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProtected, setIsProtected] = useState(false);
  const [filter, setFilter] = useState("all"); // "all", "correct", "incorrect", "skipped"
  const [zoomedImage, setZoomedImage] = useState(null);
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isTeacher = user?.labels?.includes("Teacher");
  const contentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `MockTest_Result_${paperId}`,
    content: () => contentRef.current,
  });

  useEffect(() => {
    if (!paperId) return;
    const init = async () => {
      setIsLoading(true);
      try {
        const userPaperResponse = await mockTestService.listQuestions([
          Query.equal("$id", paperId),
        ]);
        if (!userPaperResponse.length) throw new Error("Paper not found");

        const userPaper = { ...userPaperResponse[0] };
        userPaper.questions = (userPaper.questions || [])
          .map((s) => {
            if (typeof s === "string") {
              try { return JSON.parse(s); } catch { return null; }
            }
            return s;
          })
          .filter(Boolean);

        if (userPaper.isOriginal !== null && !userPaper.isOriginal) {
          const originalPaperResponse = await mockTestService.listQuestions([
            Query.equal("paperId", userPaper.paperId),
            Query.equal("isOriginal", true),
          ]);
          if (!originalPaperResponse?.length) {
            toast.error("Original mock test template could not be loaded.");
            navigate("/all-mock-tests");
            return;
          }
          const originalPaper = { ...originalPaperResponse[0] };
          if (originalPaper.isProtected) {
            setIsProtected(true);
            setIsLoading(false);
            return;
          }

          const qIds = (userPaper.questions || [])
            .map((q) => q?.$id || q?.id)
            .filter((id) => typeof id === "string" && id.trim().length > 0 && id !== "null");
          const { questionService } = await import("@/services/academic/question.service");
          const fetchedQuestions = qIds.length > 0 ? await questionService.getQuestionsByIds(qIds) : [];
          const questionsLookup = new Map((fetchedQuestions || []).map((q) => [q.$id || q.id, q]));

          (originalPaper.questions || []).forEach((qStr) => {
            try {
              const oq = typeof qStr === "string" ? JSON.parse(qStr) : qStr;
              const oqId = oq?.$id || oq?.id;
              if (oq && oq.question && oqId && !questionsLookup.has(oqId)) {
                questionsLookup.set(oqId, oq);
              }
            } catch {}
          });

          userPaper.questions = (userPaper.questions || []).map((q) => {
            const qId = q?.$id || q?.id;
            const hydrated = qId ? questionsLookup.get(qId) : null;
            return {
              ...q,
              ...(hydrated || {}),
              response: q?.response ?? null,
            };
          });
        } else {
          const needsHydration = (userPaper.questions || []).some((q) => q.question === undefined);
          if (needsHydration) {
            const qIds = (userPaper.questions || [])
              .map((q) => q?.$id || q?.id)
              .filter((id) => typeof id === "string" && id.trim().length > 0 && id !== "null");
            const { questionService } = await import("@/services/academic/question.service");
            const fetchedQuestions = qIds.length > 0 ? await questionService.getQuestionsByIds(qIds) : [];
            const questionsLookup = new Map((fetchedQuestions || []).map((q) => [q.$id || q.id, q]));

            userPaper.questions = (userPaper.questions || []).map((q) => {
              const qId = q?.$id || q?.id;
              const hydrated = qId ? questionsLookup.get(qId) : null;
              return {
                ...q,
                ...(hydrated || {}),
                response: q?.response ?? null,
              };
            });
          }
        }
        setMockTest(userPaper);
      } catch (error) {
        console.error("Error fetching mock test:", error);
        toast.error("Failed to load the mock test.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [paperId, navigate]);

  const getIndex = (res) => OPTIONS.indexOf(res);

  // Derived stats
  const totalQuestions = mockTest?.questions?.length || mockTest?.quesCount || 0;

  const correct = useMemo(() => {
    if (!mockTest?.questions) return 0;
    return mockTest.questions.filter((q) => q.response && q.response === q.correctAnswer).length;
  }, [mockTest]);

  const incorrect = useMemo(() => {
    if (!mockTest?.questions) return 0;
    return mockTest.questions.filter((q) => q.response && q.response !== q.correctAnswer).length;
  }, [mockTest]);

  const unanswered = useMemo(() => {
    if (!mockTest?.questions) return 0;
    return mockTest.questions.filter((q) => !q.response).length;
  }, [mockTest]);

  const scorePercentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

  const filteredQuestions = useMemo(() => {
    if (!mockTest?.questions) return [];
    return mockTest.questions.filter((q) => {
      const isCorrect = q.response && q.response === q.correctAnswer;
      const isAnswered = q.response !== undefined && q.response !== null && q.response !== "";
      if (filter === "correct") return isCorrect;
      if (filter === "incorrect") return isAnswered && !isCorrect;
      if (filter === "skipped") return !isAnswered;
      return true;
    });
  }, [mockTest, filter]);

  const scrollToQuestion = (idx) => {
    const el = document.getElementById(`question-card-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <SkeletonBox className="w-10 h-10 rounded-xl" />
              <div className="space-y-1.5">
                <SkeletonBox className="h-5 w-48" />
                <SkeletonBox className="h-3.5 w-32" />
              </div>
            </div>
            <SkeletonBox className="h-9 w-32 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBox key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonBox key={i} className="h-52 w-full rounded-2xl" />
              ))}
            </div>
            <div className="lg:col-span-4 space-y-4">
              <SkeletonBox className="h-64 w-full rounded-2xl" />
              <SkeletonBox className="h-44 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Protected Paper Screen ──
  if (isProtected) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-5 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Protected Examination Paper</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              The instructor has restricted public review for this paper. Result review is currently unavailable.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Missing Paper Screen ──
  if (!mockTest) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/50 p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Paper Not Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We couldn't retrieve the assessment details for this paper. Please verify the URL or return to tests.
          </p>
          <button
            onClick={() => navigate("/all-mock-tests")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Return to All Mock Tests
          </button>
        </div>
      </div>
    );
  }

  const paperTitle = mockTest.paperTitle || mockTest.title || mockTest.name || "Mock Test Examination";
  const tradeDisplay = mockTest.tradeName || mockTest.trade || "ITI Technical Trade";
  const studentName = mockTest.userName || user?.name || "ITI Student";

  const isPassed = scorePercentage >= 40;
  const perfColor =
    scorePercentage >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : scorePercentage >= 50
      ? "text-blue-600 dark:text-blue-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      
      {/* ── Fixed Sticky Navigation Header Below Navbar ── */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
          
          {/* Left: Back button & Breadcrumbs & Title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 active:scale-95"
              title="Return to Previous Page"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0" />

            <div className="min-w-0">
              {/* Breadcrumb Navigation */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-0.5 leading-none">
                <Link to="/all-mock-tests" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Mock Tests
                </Link>
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[180px]">{tradeDisplay}</span>
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Results Review</span>
              </nav>

              {/* Main Title Row */}
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {paperTitle}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                </span>
              </div>
            </div>
          </div>

          {/* Right: Candidate Chip & Quick Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Student Chip */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium">
              <div className="w-6 h-6 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{studentName}</span>
            </div>

            {/* Score Chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <span className="text-slate-400 dark:text-slate-400 font-medium">Score:</span>
              <span className={`font-black ${perfColor}`}>
                {correct} / {totalQuestions} <span className="font-semibold text-[11px] opacity-80">({scorePercentage.toFixed(1)}%)</span>
              </span>
            </div>

            {/* Download PDF Button */}
            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
              title="Download PDF Report"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            {/* All Tests Link */}
            <Link
              to="/all-mock-tests"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              All Tests
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6" ref={contentRef}>
        
        {/* ── Executive Performance Hero Card ── */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
          
          {/* Header Row: Title & Metadata */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  CBT Result Summary
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {tradeDisplay}
                </span>
                {mockTest.year && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Year {mockTest.year}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {studentName}'s Examination Result
              </h2>
            </div>

            {/* Overall Status Badge */}
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-2xl border text-center font-bold ${
                isPassed
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
              }`}>
                <div className="text-[10px] uppercase tracking-wider font-extrabold opacity-75">Status</div>
                <div className="text-sm sm:text-base font-black">{isPassed ? "PASSED" : "FAILED / NEEDS REVIEW"}</div>
              </div>
            </div>
          </div>

          {/* 4 Performance Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Score */}
            <StatPill
              icon={Award}
              label="Overall Score"
              value={`${correct} / ${totalQuestions}`}
              subtext={`${scorePercentage.toFixed(1)}% Marks Scored`}
              colorCls="bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border-blue-200/60 dark:border-blue-900/40"
            />

            {/* Correct */}
            <StatPill
              icon={CheckCircle2}
              label="Correct Answers"
              value={correct}
              subtext={`${((correct / Math.max(totalQuestions, 1)) * 100).toFixed(0)}% Accuracy`}
              colorCls="bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200/60 dark:border-emerald-900/40"
            />

            {/* Incorrect */}
            <StatPill
              icon={XCircle}
              label="Incorrect Answers"
              value={incorrect}
              subtext={`${((incorrect / Math.max(totalQuestions, 1)) * 100).toFixed(0)}% Error Rate`}
              colorCls="bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-rose-200/60 dark:border-rose-900/40"
            />

            {/* Unanswered */}
            <StatPill
              icon={AlertCircle}
              label="Skipped / Unanswered"
              value={unanswered}
              subtext={`${((unanswered / Math.max(totalQuestions, 1)) * 100).toFixed(0)}% Left Blank`}
              colorCls="bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200/60 dark:border-amber-900/40"
            />
          </div>

          {/* Progress Bar Track */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Overall Score Progress</span>
              <span className={`font-bold ${perfColor}`}>{scorePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/40 dark:border-slate-700/50">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  scorePercentage >= 80
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : scorePercentage >= 50
                    ? "bg-gradient-to-r from-blue-600 to-indigo-500"
                    : "bg-gradient-to-r from-rose-500 to-amber-500"
                }`}
                style={{ width: `${Math.min(scorePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Metadata Footer Strip */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6 pt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Student: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{studentName}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Submitted: <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                {mockTest.endTime ? new Date(mockTest.endTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
              </strong></span>
            </div>
            {mockTest.startTime && mockTest.endTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time Taken: <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                  {Math.max(1, Math.ceil((new Date(mockTest.endTime) - new Date(mockTest.startTime)) / 60000))} min
                </strong></span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Paper ID: <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">{mockTest.paperId}</code></span>
            </div>
          </div>
        </section>

        {/* ── Feedback Banner ── */}
        {scorePercentage >= 80 ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Outstanding performance! You scored above 80%. You have demonstrated strong subject mastery.</span>
          </div>
        ) : scorePercentage < 50 ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Score is below 50%. Review the questions you missed below and practice these topics in the CBT question bank.</span>
          </div>
        ) : null}

        {/* ── 2-Column Responsive Workspace ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT COLUMN (Questions & Filters) ── */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Filter Tabs Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: "all", label: "All Questions", count: totalQuestions, badgeCls: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
                  { id: "correct", label: "Correct", count: correct, badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
                  { id: "incorrect", label: "Incorrect", count: incorrect, badgeCls: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" },
                  { id: "skipped", label: "Skipped", count: unanswered, badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
                ].map((tab) => {
                  const isActive = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? "bg-white/20 text-white" : tab.badgeCls}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-400 font-medium px-2">
                Showing {filteredQuestions.length} of {totalQuestions}
              </div>
            </div>

            {/* Questions Review Cards */}
            <div className="space-y-4">
              {filteredQuestions.map((question, index) => {
                const isCorrect = question.response && question.response === question.correctAnswer;
                const isAnswered = question.response !== undefined && question.response !== null && question.response !== "";

                // Find absolute index in paper
                const originalIndex = mockTest.questions.findIndex((q) => (q.$id || q.id) === (question.$id || question.id));
                const qNum = originalIndex !== -1 ? originalIndex + 1 : index + 1;

                const accentBorder = isCorrect
                  ? "border-l-4 border-l-emerald-500 border-slate-200 dark:border-slate-800"
                  : isAnswered
                  ? "border-l-4 border-l-rose-500 border-slate-200 dark:border-slate-800"
                  : "border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800";

                const resolved = resolveQuestion(question);

                return (
                  <article
                    key={question.$id || question.id || index}
                    id={`question-card-${qNum}`}
                    className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${accentBorder}`}
                  >
                    {/* Card Header */}
                    <div className="p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCorrect
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : isAnswered
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        }`}>
                          {qNum}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Question {qNum}
                          </span>
                          {resolved.schemaVersion === 2 && (
                            <span className="ml-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                              V2
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Chip */}
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+1)
                          </span>
                        ) : isAnswered ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect (0)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <AlertCircle className="w-3.5 h-3.5" /> Skipped (0)
                          </span>
                        )}

                        {/* Teacher Edit Question Button */}
                        {isTeacher && question.$id && (
                          <Link
                            to={`/edit/${question.$id}`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit this question in Question Bank"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Question Body */}
                    <div className="p-4 sm:p-5 space-y-4">
                      {resolved.isMissing ? (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                          ⚠️ <strong>Question Content Not Available:</strong> {resolved.missingReason || `Document ID ${resolved.questionId} could not be retrieved.`}
                        </div>
                      ) : (
                        <>
                          {/* English Question Text */}
                          <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed select-text">
                            {resolved.questionEnglish || resolved.questionRaw}
                          </div>

                          {/* Marathi Question Callout (if bilingual) */}
                          {resolved.questionMarathi && (
                            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
                              <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                                मराठी भाषांतर
                              </span>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 font-serif leading-relaxed select-text">
                                {resolved.questionMarathi}
                              </p>
                            </div>
                          )}

                          {/* Question Diagrams / Images */}
                          {resolved.images.length > 0 && (
                            <div className="flex flex-wrap gap-2.5 pt-1">
                              {resolved.images.map((img, i) => (
                                <div
                                  key={img.id || i}
                                  onClick={() => setZoomedImage(img.url)}
                                  className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 shadow-xs"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.name || "Question diagram"}
                                    className="max-h-52 w-auto object-contain rounded-lg"
                                  />
                                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                    <ZoomIn className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Options List with High-Clarity Status Badges */}
                          <div className="space-y-2.5 pt-2">
                            {resolved.options.map((option, idx) => {
                              const letter = option.letter || OPTIONS[idx];
                              const isCorrectOpt = letter === question.correctAnswer;
                              const isSelectedOpt = letter === question.response;

                              // Container style
                              let containerCls = "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300";
                              if (isSelectedOpt && isCorrectOpt) {
                                containerCls = "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 shadow-xs";
                              } else if (isSelectedOpt && !isCorrectOpt) {
                                containerCls = "border-rose-500 bg-rose-500/10 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 shadow-xs";
                              } else if (isCorrectOpt) {
                                containerCls = "border-emerald-400/80 bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 border-dashed";
                              }

                              return (
                                <div
                                  key={idx}
                                  className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border-2 transition-all ${containerCls}`}
                                >
                                  {/* Letter + Text */}
                                  <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                      isSelectedOpt && isCorrectOpt
                                        ? "bg-emerald-600 text-white"
                                        : isSelectedOpt && !isCorrectOpt
                                        ? "bg-rose-600 text-white"
                                        : isCorrectOpt
                                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400"
                                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    }`}>
                                      {letter}
                                    </span>

                                    <div className="space-y-1 min-w-0">
                                      <p className="text-xs sm:text-sm font-medium leading-relaxed select-text">
                                        {option.english || option.raw}
                                      </p>
                                      {option.marathi && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-serif leading-relaxed select-text">
                                          {option.marathi}
                                        </p>
                                      )}
                                      {option.imageUrl && (
                                        <img
                                          src={option.imageUrl}
                                          alt={`Option ${letter}`}
                                          onClick={() => setZoomedImage(option.imageUrl)}
                                          className="max-h-28 rounded-lg border border-slate-200 dark:border-slate-700 mt-1 cursor-zoom-in"
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Option Indicator Badge */}
                                  <div className="shrink-0 mt-0.5">
                                    {isSelectedOpt && isCorrectOpt && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                                        <Check className="w-3 h-3 stroke-[3]" /> Your Answer (Correct)
                                      </span>
                                    )}
                                    {isSelectedOpt && !isCorrectOpt && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                                        <X className="w-3 h-3 stroke-[3]" /> Your Answer (Incorrect)
                                      </span>
                                    )}
                                    {!isSelectedOpt && isCorrectOpt && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                        <Check className="w-3 h-3 stroke-[3]" /> Correct Answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation Box (V2 Feature) */}
                          {(resolved.explanationEnglish || resolved.explanationMarathi) && (
                            <div className="mt-4 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-1.5 text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
                                <Info className="w-4 h-4 text-blue-600" />
                                <span>Explanation & Solution</span>
                              </div>
                              {resolved.explanationEnglish && (
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {resolved.explanationEnglish}
                                </p>
                              )}
                              {resolved.explanationMarathi && (
                                <p className="text-slate-600 dark:text-slate-400 font-serif leading-relaxed pt-1 border-t border-blue-100 dark:border-blue-900/40">
                                  {resolved.explanationMarathi}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Skipped Notice */}
                          {!isAnswered && (
                            <div className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5 pt-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>You did not answer this question during the exam.</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}

              {filteredQuestions.length === 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No Questions Found
                  </h3>
                  <p className="text-xs text-slate-500">
                    No questions in this mock test match the selected filter. Try selecting "All Questions".
                  </p>
                  <button
                    onClick={() => setFilter("all")}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN (Sticky Sidebar: Navigator & Meta) ── */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            
            {/* Quick Question Jump Palette */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Question Navigator
                </h3>
                <span className="text-[11px] font-medium text-slate-400">
                  {totalQuestions} Questions
                </span>
              </div>

              {/* 5-Column Question Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
                {mockTest.questions.map((q, idx) => {
                  const isQCorrect = q.response && q.response === q.correctAnswer;
                  const isQAnswered = q.response !== undefined && q.response !== null && q.response !== "";

                  let btnCls = "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
                  if (isQCorrect) {
                    btnCls = "bg-emerald-500 text-white border-emerald-600 shadow-xs";
                  } else if (isQAnswered) {
                    btnCls = "bg-rose-500 text-white border-rose-600 shadow-xs";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => scrollToQuestion(idx + 1)}
                      className={`h-9 rounded-xl font-bold text-xs border flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${btnCls}`}
                      title={`Jump to Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Navigator Legend */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Correct
                </div>
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Incorrect
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Skipped
                </div>
              </div>
            </div>

            {/* Test Specifications Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Assessment Details
              </h3>
              
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400 font-medium">Candidate Name</dt>
                  <dd className="font-bold text-slate-900 dark:text-slate-100 text-right">{studentName}</dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400 font-medium">Trade Discipline</dt>
                  <dd className="font-bold text-slate-900 dark:text-slate-100 text-right truncate max-w-[160px]">{tradeDisplay}</dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400 font-medium">Training Year</dt>
                  <dd className="font-bold text-slate-900 dark:text-slate-100 text-right">{mockTest.year || "Year 1"}</dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400 font-medium">Exam Date</dt>
                  <dd className="font-bold text-slate-900 dark:text-slate-100 text-right">
                    {mockTest.endTime ? new Date(mockTest.endTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400 font-medium">Paper Reference</dt>
                  <dd className="font-mono text-[11px] text-slate-700 dark:text-slate-300 text-right select-all">{mockTest.paperId}</dd>
                </div>
              </dl>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => handlePrint()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" /> Download PDF Report
              </button>

              <button
                onClick={() => navigate("/all-mock-tests")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to All Mock Tests
              </button>
            </div>

          </aside>
        </div>
      </main>

      {/* ── Lightbox Zoom Modal for Diagrams ── */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-700 shadow-2xl"
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={zoomedImage}
              alt="Enlarged Diagram"
              className="max-h-[82vh] w-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowMockTest;