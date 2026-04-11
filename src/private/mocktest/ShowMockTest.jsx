import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import questionpaperservice from "@/appwrite/mockTest";
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
  FileText,
  Clock,
  User,
  Calendar,
  TrendingUp,
  Edit,
  ChevronRight,
} from "lucide-react";

const OPTIONS = ["A", "B", "C", "D"];

// ─── Small skeleton box ───────────────────────────────────────────────────────
const Sk = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`} />
);

// ─── Stat pill ────────────────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, cls }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${cls}`}>
    <Icon className="w-4 h-4 shrink-0" />
    <div>
      <p className="text-[10px] font-medium opacity-70 leading-none">{label}</p>
      <p className="text-sm font-bold leading-tight">{value}</p>
    </div>
  </div>
);

// ─── Info chip ────────────────────────────────────────────────────────────────
const Chip = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs">
    <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
    <span className="text-gray-500 dark:text-gray-400">{label}:</span>
    <span className="font-semibold text-gray-700 dark:text-gray-200">{value}</span>
  </div>
);

// ─── ShowMockTest ─────────────────────────────────────────────────────────────
const ShowMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProtected, setIsProtected] = useState(false);
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isTeacher = user.labels.includes("Teacher");

  useEffect(() => {
    if (!paperId) return;
    const init = async () => {
      localStorage.removeItem(paperId);
      setIsLoading(true);
      try {
        const userPaperResponse = await questionpaperservice.listQuestions([
          Query.equal("$id", paperId),
        ]);
        if (!userPaperResponse.length) throw new Error("Paper not found");

        const userPaper = { ...userPaperResponse[0] };
        userPaper.questions = userPaper.questions
          .map((s) => { try { return JSON.parse(s); } catch { return null; } })
          .filter(Boolean);

        if (userPaper.isOriginal !== null && !userPaper.isOriginal) {
          const originalPaperResponse = await questionpaperservice.listQuestions([
            Query.equal("paperId", userPaper.paperId),
            Query.equal("isOriginal", true),
          ]);
          if (!originalPaperResponse?.length) {
            toast.error("Something went Wrong!\n");
            navigate("/all-mock-tests");
            return;
          }
          const originalPaper = { ...originalPaperResponse[0] };
          if (originalPaper.isProtected) {
            setIsProtected(true);
            setIsLoading(false);
            return;
          }
          const questionMap = originalPaper.questions.reduce((map, qStr) => {
            try { const q = JSON.parse(qStr); map.set(q.$id, q); } catch {}
            return map;
          }, new Map());
          userPaper.questions = userPaper.questions.map((q) => ({
            ...questionMap.get(q.$id),
            response: q.response,
          }));
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

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <Sk className="w-9 h-9 rounded-full" />
            <Sk className="h-6 w-48" />
          </div>
          <Sk className="h-24 w-full" />
          <Sk className="h-12 w-full" />
          {[1, 2, 3].map((i) => <Sk key={i} className="h-52 w-full" />)}
        </div>
      </div>
    );
  }

  // ── Protected ───────────────────────────────────────────────────────────────
  if (isProtected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Protected Paper</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              The teacher has protected this paper. Results are not available to view.
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (!mockTest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/50 p-8 max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load the mock test. Please try again.</p>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Derived stats ───────────────────────────────────────────────────────────
  const correct   = mockTest.questions.filter((q) => q.response === q.correctAnswer).length;
  const incorrect = mockTest.questions.filter((q) => q.response && q.response !== q.correctAnswer).length;
  const unanswered = mockTest.questions.filter((q) => !q.response).length;
  const scorePercentage = mockTest.quesCount > 0 ? (mockTest.score / mockTest.quesCount) * 100 : 0;
  const accuracy = mockTest.quesCount > 0 ? ((correct / mockTest.quesCount) * 100).toFixed(1) : 0;

  const perfColor =
    scorePercentage >= 80 ? "text-green-600 dark:text-green-400"
    : scorePercentage >= 50 ? "text-blue-600 dark:text-blue-400"
    : "text-red-500 dark:text-red-400";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              Mock Test Results
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {mockTest.userName || "Unknown"} · {mockTest.tradeName || ""}
            </p>
          </div>
          {/* Score pill */}
          <div className={`text-right shrink-0`}>
            <p className={`text-2xl font-extrabold leading-none ${perfColor}`}>
              {mockTest.score}<span className="text-sm font-semibold text-gray-400">/{mockTest.quesCount}</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{scorePercentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">

        {/* ── Score progress bar ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {/* Progress bar */}
          <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                scorePercentage >= 80 ? "bg-green-500"
                : scorePercentage >= 50 ? "bg-blue-500"
                : "bg-red-500"
              }`}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
          {/* 4 stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat icon={Award}        label="Score"      value={`${mockTest.score}/${mockTest.quesCount}`} cls="bg-blue-50  dark:bg-blue-900/20 text-blue-700  dark:text-blue-300" />
            <Stat icon={CheckCircle2} label="Correct"    value={correct}   cls="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" />
            <Stat icon={XCircle}      label="Incorrect"  value={incorrect} cls="bg-red-50   dark:bg-red-900/20   text-red-700   dark:text-red-300" />
            <Stat icon={AlertCircle}  label="Skipped"    value={unanswered}cls="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" />
          </div>
        </div>

        {/* ── Info chips ── */}
        <div className="flex flex-wrap gap-2">
          <Chip icon={User}      label="Student"   value={mockTest.userName || "N/A"} />
          <Chip icon={TrendingUp}label="Trade"     value={mockTest.tradeName || "N/A"} />
          <Chip icon={Calendar}  label="Year"      value={mockTest.year || "N/A"} />
          <Chip icon={Clock}     label="Submitted" value={new Date(mockTest.$createdAt).toLocaleString()} />
          <Chip icon={FileText}  label="Paper ID"  value={mockTest.paperId} />
        </div>

        {/* ── Performance banner ── */}
        {scorePercentage >= 80 ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Excellent! You scored above 80%. Keep up the great work!
          </div>
        ) : scorePercentage < 50 ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Score below 50%. Review the topics and practice more questions.
          </div>
        ) : null}

        {/* ── Question review ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
            Question Review · {mockTest.questions.length} questions
          </h2>

          {mockTest.questions.map((question, index) => {
            const isCorrect  = question.response === question.correctAnswer;
            const isAnswered = question.response !== undefined && question.response !== null;

            const accentCls = isCorrect
              ? "border-l-green-500 bg-green-500/5"
              : isAnswered
              ? "border-l-red-500 bg-red-500/5"
              : "border-l-amber-500 bg-amber-500/5";

            const statusIcon = isCorrect
              ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              : isAnswered
              ? <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;

            const qNumCls = isCorrect
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : isAnswered
              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";

            return (
              <div
                key={index}
                className={`rounded-xl border-l-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden ${accentCls}`}
              >
                {/* Question header */}
                <div className="flex items-start gap-3 p-4">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 ${qNumCls}`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug whitespace-pre-wrap">
                      {question.question}
                    </p>
                    {isTeacher && (
                      <Link
                        to={`/edit/${question.$id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 mt-1"
                      >
                        <Edit className="w-3 h-3" /> Edit Question
                      </Link>
                    )}
                  </div>
                  {statusIcon}
                </div>

                {/* Options */}
                <div className="px-4 pb-4 space-y-1.5">
                  {(question.options ?? []).map((option, idx) => {
                    const isCorrectOpt  = idx === getIndex(question.correctAnswer);
                    const isSelectedOpt = idx === getIndex(question.response);

                    const optCls = isCorrectOpt
                      ? "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600"
                      : isSelectedOpt
                      ? "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600"
                      : "bg-gray-50 dark:bg-gray-900 border-transparent";

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-colors ${optCls}`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-gray-500 dark:text-gray-400 shrink-0 w-5">
                            {OPTIONS[idx]}.
                          </span>
                          <span className="text-gray-800 dark:text-gray-100 leading-snug">{option}</span>
                        </span>
                        <span className="shrink-0">
                          {isCorrectOpt && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white">
                              <CheckCircle2 className="w-3 h-3" /> Correct
                            </span>
                          )}
                          {isSelectedOpt && !isCorrectOpt && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                              <XCircle className="w-3 h-3" /> Your Ans
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}

                  {!isAnswered && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> You did not answer this question
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Test completed · {mockTest.questions.length} questions reviewed
          </p>
          <button
            onClick={() => navigate("/all-mock-tests")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowMockTest;