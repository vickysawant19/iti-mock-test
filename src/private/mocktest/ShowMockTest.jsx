import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import mockTestService from "@/services/mocktest.service";
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
  TrendingUp,
  Edit,
  Download,
} from "lucide-react";

const OPTIONS = ["A", "B", "C", "D"];

// ─── Small skeleton box ───────────────────────────────────────────────────────
const Sk = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />
);

// ─── Stat pill ────────────────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, cls }) => (
  <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${cls} transition-transform hover:scale-102`}>
    <Icon className="w-4 h-4 shrink-0" />
    <div>
      <p className="text-[9px] font-black uppercase tracking-wider opacity-75 leading-none">{label}</p>
      <p className="text-xs font-black leading-none mt-1">{value}</p>
    </div>
  </div>
);

// ─── ShowMockTest ─────────────────────────────────────────────────────────────
const ShowMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProtected, setIsProtected] = useState(false);
  const [filter, setFilter] = useState("all"); // "all", "correct", "incorrect", "skipped"
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
        userPaper.questions = userPaper.questions
          .map((s) => { try { return JSON.parse(s); } catch { return null; } })
          .filter(Boolean);

        if (userPaper.isOriginal !== null && !userPaper.isOriginal) {
          const originalPaperResponse = await mockTestService.listQuestions([
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

          const qIds = userPaper.questions.map(q => q.$id);
          const { questionService } = await import("@/services/question.service");
          const fetchedQuestions = await questionService.getQuestionsByIds(qIds);
          const questionsLookup = new Map(fetchedQuestions.map(q => [q.$id, q]));

          originalPaper.questions.forEach(qStr => {
             try { 
               const oq = JSON.parse(qStr); 
               if (oq.question && !questionsLookup.has(oq.$id)) {
                 questionsLookup.set(oq.$id, oq); 
               }
             } catch {}
          });

          userPaper.questions = userPaper.questions.map((q) => ({
            ...questionsLookup.get(q.$id),
            response: q.response,
          }));
        } else {
          const needsHydration = userPaper.questions.some(q => q.question === undefined);
          if (needsHydration) {
             const qIds = userPaper.questions.map(q => q.$id);
             const { questionService } = await import("@/services/question.service");
             const fetchedQuestions = await questionService.getQuestionsByIds(qIds);
             const questionsLookup = new Map(fetchedQuestions.map(q => [q.$id, q]));
             
             userPaper.questions = userPaper.questions.map(q => ({
                ...questionsLookup.get(q.$id),
                response: q.response ?? null
             }));
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
  const correct = useMemo(() => {
    if (!mockTest) return 0;
    return mockTest.questions.filter((q) => q.response === q.correctAnswer).length;
  }, [mockTest]);

  const incorrect = useMemo(() => {
    if (!mockTest) return 0;
    return mockTest.questions.filter((q) => q.response && q.response !== q.correctAnswer).length;
  }, [mockTest]);

  const unanswered = useMemo(() => {
    if (!mockTest) return 0;
    return mockTest.questions.filter((q) => !q.response).length;
  }, [mockTest]);

  const filteredQuestions = useMemo(() => {
    if (!mockTest) return [];
    return mockTest.questions.filter((q) => {
      const isCorrect = q.response === q.correctAnswer;
      const isAnswered = q.response !== undefined && q.response !== null;
      if (filter === "correct") return isCorrect;
      if (filter === "incorrect") return isAnswered && !isCorrect;
      if (filter === "skipped") return !isAnswered;
      return true;
    });
  }, [mockTest, filter]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8">
        <div className="w-full space-y-5">
          <div className="flex items-center gap-3">
            <Sk className="w-9 h-9 rounded-full" />
            <Sk className="h-6 w-48" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              {[1, 2, 3].map((i) => <Sk key={i} className="h-44 w-full rounded-2xl" />)}
            </div>
            <div className="lg:col-span-1 space-y-4">
              <Sk className="h-48 w-full rounded-2xl" />
              <Sk className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Protected
  if (isProtected) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Protected Paper</h2>
            <p className="text-sm text-slate-505 dark:text-gray-400 mt-2">
              The teacher has protected this paper. Results are not available to view.
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-770 dark:text-slate-200 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // Error
  if (!mockTest) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/50 p-8 max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-sm text-slate-505 dark:text-slate-400">Failed to load the mock test. Please try again.</p>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-650 text-sm font-medium text-slate-750 dark:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const scorePercentage = mockTest.quesCount > 0 ? (mockTest.score / mockTest.quesCount) * 100 : 0;

  const perfColor =
    scorePercentage >= 80 ? "text-emerald-600 dark:text-emerald-400"
    : scorePercentage >= 50 ? "text-blue-650 dark:text-blue-400"
    : "text-red-500 dark:text-red-400";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-12">
      
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/60 shadow-sm transition-all duration-300">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-3.5 flex items-center justify-between gap-4">
          
          {/* Left Side: Back Button & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center justify-center p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-500 hover:text-slate-800 dark:hover:text-white shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer shrink-0"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </button>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0 hidden sm:block">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-850 dark:text-white leading-tight tracking-tight">
                  Mock Test Results
                </h1>
                <span className="hidden xs:inline-flex items-center text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/10 dark:border-emerald-900/20">
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Quick Action (PDF) & Floating Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2 border-r border-slate-200/60 dark:border-slate-800/80 pr-4 mr-1 text-right">
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Student</p>
                <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-0.5">{mockTest.userName || "N/A"}</p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 border-r border-slate-200/60 dark:border-slate-800/80 pr-4 mr-1 text-right">
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Score</p>
                <p className={`text-xs font-black mt-0.5 leading-none ${perfColor}`}>
                  {mockTest.score} / {mockTest.quesCount} ({scorePercentage.toFixed(1)}%)
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePrint()}
              className="group flex items-center justify-center p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-655 hover:text-slate-800 dark:text-slate-350 dark:hover:text-white shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer shrink-0"
              title="Download PDF Results"
            >
              <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Grid Area */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-5 space-y-5" ref={contentRef}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main workspace (Left 3 columns on desktop) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Header info for mobile (Score summary) */}
            <div className="sm:hidden text-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400">Your Score</p>
              <p className={`text-3xl font-black mt-1 ${perfColor}`}>
                {mockTest.score} <span className="text-sm font-semibold text-slate-400">/ {mockTest.quesCount}</span>
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">{scorePercentage.toFixed(1)}%</p>
            </div>

            {/* Performance banner */}
            {scorePercentage >= 80 ? (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-bold backdrop-blur-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Excellent! You scored above 80%. Keep up the great work!
              </div>
            ) : scorePercentage < 50 ? (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 dark:border-red-800/40 text-red-700 dark:text-red-400 text-xs sm:text-sm font-bold backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                Score below 50%. Review the topics and practice more questions.
              </div>
            ) : null}

            {/* Filter Bar */}
            <div className="flex gap-2 flex-wrap pb-1">
              {[
                { id: "all", label: "All Questions", count: mockTest.questions.length, cls: "text-slate-500 bg-slate-500/10 hover:bg-slate-500/15 border-slate-500/10" },
                { id: "correct", label: "Correct", count: correct, cls: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/10" },
                { id: "incorrect", label: "Incorrect", count: incorrect, cls: "text-red-500 bg-red-500/10 hover:bg-red-500/15 border-red-500/10" },
                { id: "skipped", label: "Skipped", count: unanswered, cls: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/10" },
              ].map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-sm shadow-blue-500/20 border-transparent scale-102"
                        : `${tab.cls} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Question Review Cards */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest px-1">
                Question Review · {filteredQuestions.length} questions
              </h2>

              {filteredQuestions.map((question, index) => {
                const isCorrect  = question.response === question.correctAnswer;
                const isAnswered = question.response !== undefined && question.response !== null;

                const accentCls = isCorrect
                  ? "border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/2"
                  : isAnswered
                  ? "border-l-red-500 bg-red-500/5 dark:bg-red-500/2"
                  : "border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/2";

                const statusIcon = isCorrect
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  : isAnswered
                  ? <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;

                const qNumCls = isCorrect
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : isAnswered
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400";

                // Keep absolute numbering of the paper
                const originalIndex = mockTest.questions.findIndex((q) => q.$id === question.$id);

                return (
                  <div
                    key={index}
                    className={`rounded-2xl border-l-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${accentCls}`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3 p-4 sm:p-5">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-black shrink-0 ${qNumCls}`}>
                        {originalIndex + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug whitespace-pre-wrap">
                          {question.question}
                        </p>
                        {isTeacher && (
                          <Link
                            to={`/edit/${question.$id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-black text-blue-500 hover:text-blue-655 dark:text-blue-400 mt-2 hover:underline"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit Question
                          </Link>
                        )}
                      </div>
                      {statusIcon}
                    </div>

                    {/* Options list */}
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2">
                      {(question.options ?? []).map((option, idx) => {
                        const isCorrectOpt  = idx === getIndex(question.correctAnswer);
                        const isSelectedOpt = idx === getIndex(question.response);

                        const optCls = isCorrectOpt
                          ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                          : isSelectedOpt
                          ? "bg-red-500/5 dark:bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300"
                          : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/80 text-slate-700 dark:text-slate-350";

                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border text-xs sm:text-sm transition-all ${optCls}`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0 w-5">
                                {OPTIONS[idx]}.
                              </span>
                              <span className="font-medium leading-snug">{option}</span>
                            </span>
                            <span className="shrink-0">
                              {isCorrectOpt && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white uppercase tracking-wider">
                                  <CheckCircle2 className="w-3 h-3" /> Correct
                                </span>
                              )}
                              {isSelectedOpt && !isCorrectOpt && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white uppercase tracking-wider">
                                  <XCircle className="w-3 h-3" /> Your Ans
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}

                      {!isAnswered && (
                        <p className="text-xs text-amber-600 dark:text-amber-455 mt-2 flex items-center gap-1.5 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> You did not answer this question
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredQuestions.length === 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                  No questions match the selected filter.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Panel (Right 1 column on desktop) */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-20">
            {/* Score progress bar card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40 pb-2">
                Performance Score
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                  <span className={`text-base font-black ${perfColor}`}>{scorePercentage.toFixed(1)}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/40 dark:border-slate-700/40">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      scorePercentage >= 80 ? "bg-gradient-to-r from-emerald-500 to-green-400"
                      : scorePercentage >= 50 ? "bg-gradient-to-r from-blue-500 to-indigo-400"
                      : "bg-gradient-to-r from-red-500 to-rose-400"
                    }`}
                    style={{ width: `${scorePercentage}%` }}
                  />
                </div>
              </div>

              {/* 4 stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <Stat icon={Award}        label="Score"      value={`${mockTest.score}/${mockTest.quesCount}`} cls="bg-blue-500/5 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200/30 dark:border-blue-800/30" />
                <Stat icon={CheckCircle2} label="Correct"    value={correct}   cls="bg-emerald-500/5 dark:bg-green-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-800/30" />
                <Stat icon={XCircle}      label="Incorrect"  value={incorrect} cls="bg-red-500/5 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200/30 dark:border-red-800/30" />
                <Stat icon={AlertCircle}  label="Skipped"    value={unanswered}cls="bg-amber-500/5 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200/30 dark:border-amber-800/30" />
              </div>
            </div>

            {/* Exam Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40 pb-2">
                Exam Details
              </h3>
              <div className="divide-y divide-slate-150/40 dark:divide-slate-800/60 text-xs">
                <div className="py-2.5 flex justify-between gap-2">
                  <span className="text-slate-450 dark:text-slate-550 font-bold uppercase tracking-wider text-[9px]">Student</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{mockTest.userName || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between gap-2">
                  <span className="text-slate-450 dark:text-slate-550 font-bold uppercase tracking-wider text-[9px]">Trade</span>
                  <span className="font-black text-slate-800 dark:text-slate-200 truncate max-w-[150px] text-right">{mockTest.tradeName || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between gap-2">
                  <span className="text-slate-450 dark:text-slate-555 font-bold uppercase tracking-wider text-[9px]">Year</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{mockTest.year || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between gap-2">
                  <span className="text-slate-450 dark:text-slate-555 font-bold uppercase tracking-wider text-[9px]">Submitted</span>
                  <span className="font-black text-slate-800 dark:text-slate-200 text-right">{mockTest.endTime ? new Date(mockTest.endTime).toLocaleString() : "Not Submitted"}</span>
                </div>
                {mockTest.startTime && mockTest.endTime && (
                  <div className="py-2.5 flex justify-between gap-2">
                    <span className="text-slate-450 dark:text-slate-555 font-bold uppercase tracking-wider text-[9px]">Time Taken</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">{Math.ceil((new Date(mockTest.endTime) - new Date(mockTest.startTime)) / 60000)} min</span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-450 dark:text-slate-555 font-bold uppercase tracking-wider text-[9px]">Paper ID</span>
                  <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200 select-all">{mockTest.paperId}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
              <button
                onClick={() => handlePrint()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer uppercase tracking-wider shadow-md shadow-blue-500/20"
              >
                <Download className="w-4 h-4" /> Download PDF Results
              </button>
              <button
                onClick={() => navigate("/all-mock-tests")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 text-xs font-black transition-all cursor-pointer uppercase tracking-wider border border-slate-200/40 dark:border-slate-700/40"
              >
                <ArrowLeft className="w-4 h-4" /> Back to All Tests
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ShowMockTest;