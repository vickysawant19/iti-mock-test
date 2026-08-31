import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Filter,
  Search,
  BookOpen,
  Layers,
  ChevronDown,
  Check,
  Loader2,
  X,
  FileQuestion,
  Plus,
  RefreshCcw,
  BarChart3,
  Calendar,
  LayoutGrid
} from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";

import questionService from "@/services/academic/question.service";
import questionFunctionService from "@/services/academic/questionFunction.service";
import subjectService from "@/services/academic/subjectService";
import moduleServices from "@/services/academic/moduleServices";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";
import Pagination from "./components/Pagination";
import QuestionCard from "./components/QuestionCard";

const ITEMS_PER_PAGE = 20;

// ─── Reusable Radix Select ───────────────────────────────────────────────────
const AppSelect = ({ value, onValueChange, placeholder, disabled, children, icon: Icon }) => (
  <SelectPrimitive.Root value={value || ""} onValueChange={onValueChange} disabled={disabled}>
    <div className="relative group">
      <SelectPrimitive.Trigger className="w-full inline-flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs">
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
          <SelectPrimitive.Value placeholder={placeholder} />
        </div>
        <SelectPrimitive.Icon>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] animate-in fade-in zoom-in-95 duration-100">
          <SelectPrimitive.Viewport className="p-1">
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </div>
  </SelectPrimitive.Root>
);

const AppSelectItem = ({ value, children }) => (
  <SelectPrimitive.Item
    value={value}
    className="relative flex items-center px-8 py-2 text-xs font-semibold rounded-lg cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50 focus:bg-indigo-50 dark:focus:bg-indigo-950/50 outline-none text-slate-700 dark:text-slate-300 transition-colors"
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute left-2 text-indigo-600 dark:text-indigo-400">
      <Check className="w-3.5 h-3.5" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
);

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
    <div>
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{value}</h3>
    </div>
    <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
      <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const ManageQuestions = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);

  // ── Read initial values from URL ─────────────────────────────────────────
  const urlTradeId   = searchParams.get("tradeId")   || "";
  const urlSubjectId = searchParams.get("subjectId") || "";
  const urlYear      = searchParams.get("year")      || "";
  const urlModuleId  = searchParams.get("moduleId")  || "";
  const urlPage      = parseInt(searchParams.get("page") || "1", 10);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [subjects,        setSubjects]        = useState([]);
  const [selectedTrade,   setSelectedTrade]   = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedYear,    setSelectedYear]    = useState(urlYear);
  const [modules,         setModules]         = useState([]);
  const [selectedModule,  setSelectedModule]  = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingModules,  setLoadingModules]  = useState(false);
  
  // Local UI state
  const [searchTerm, setSearchTerm] = useState("");

  // ── Questions state ───────────────────────────────────────────────────────
  const [questions,      setQuestions]      = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage,    setCurrentPage]    = useState(urlPage);
  const [isLoading,      setIsLoading]      = useState(false);
  const [isDeleting,     setIsDeleting]     = useState(new Set());
  const [hasSearched,    setHasSearched]    = useState(false);

  // ── Trades via RTK Query ──────────────────────────────────────────────────
  const { data: tradesResponse, isLoading: tradesLoading } = useListTradesQuery();
  const trades = tradesResponse?.documents || [];

  // Track whether initial URL param restore has occurred
  const restoredRef = useRef(false);

  // ── Sync URL with local state ────────────────────────────────────────────
  const updateUrlParams = useCallback((tradeId, subjectId, year, moduleId, page) => {
    const params = new URLSearchParams();
    if (tradeId)   params.set("tradeId",   tradeId);
    if (subjectId) params.set("subjectId", subjectId);
    if (year)      params.set("year",      year);
    if (moduleId)  params.set("moduleId",  moduleId);
    if (page > 1)  params.set("page",      page.toString());
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // ── Fetch subjects when trade is selected ────────────────────────────────
  useEffect(() => {
    if (!selectedTrade) {
      setSubjects([]);
      setSelectedSubject(null);
      return;
    }
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await subjectService.listSubjects();
        const allSubjects = res?.rows || res?.documents || [];
        setSubjects(allSubjects);

        if (urlSubjectId && !selectedSubject) {
          const match = allSubjects.find((s) => s.$id === urlSubjectId);
          if (match) setSelectedSubject(match);
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
        toast.error("Failed to load subjects.");
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [selectedTrade]);

  // ── Fetch modules when trade, subject, and year are set ──────────────────
  useEffect(() => {
    if (!selectedTrade?.$id || !selectedSubject?.$id || !selectedYear) {
      setModules([]);
      setSelectedModule(null);
      return;
    }
    const fetchModules = async () => {
      setLoadingModules(true);
      try {
        const data = await moduleServices.getNewModulesData(
          selectedTrade.$id,
          selectedSubject.$id,
          selectedYear
        );
        const sorted = (data || []).sort((a, b) => {
          const aNum = parseInt(a.moduleId?.match(/\d+/)?.[0] || "0", 10);
          const bNum = parseInt(b.moduleId?.match(/\d+/)?.[0] || "0", 10);
          return aNum - bNum;
        });
        setModules(sorted);

        if (urlModuleId && !selectedModule) {
          const match = sorted.find((m) => m.$id === urlModuleId || m.moduleId === urlModuleId);
          if (match) setSelectedModule(match);
        }
      } catch (err) {
        console.error("Failed to load modules:", err);
      } finally {
        setLoadingModules(false);
      }
    };
    fetchModules();
  }, [selectedTrade, selectedSubject, selectedYear]);

  // ── Match initial URL trade to loaded trades ─────────────────────────────
  useEffect(() => {
    if (trades.length > 0 && urlTradeId && !selectedTrade) {
      const match = trades.find((t) => t.$id === urlTradeId);
      if (match) setSelectedTrade(match);
    }
  }, [trades, urlTradeId]);

  // ── Fetch Questions ───────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async (page = 1) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const queries = [
        Query.limit(ITEMS_PER_PAGE),
        Query.offset((page - 1) * ITEMS_PER_PAGE),
        Query.orderDesc("$createdAt"),
      ];

      if (selectedTrade?.$id)       queries.push(Query.equal("tradeId", selectedTrade.$id));
      if (selectedSubject?.$id)     queries.push(Query.equal("subjectId", selectedSubject.$id));
      if (selectedYear)             queries.push(Query.equal("year", selectedYear));
      if (selectedModule?.moduleId) queries.push(Query.equal("moduleId", selectedModule.moduleId));

      const res = await questionService.listQuestions(queries);

      if (res?.documents) {
        setQuestions(res.documents);
        setTotalQuestions(res.total || 0);
      } else {
        setQuestions([]);
        setTotalQuestions(0);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      toast.error("Failed to load questions.");
      setQuestions([]);
      setTotalQuestions(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTrade, selectedSubject, selectedYear, selectedModule]);

  // Trigger query on filter change
  useEffect(() => {
    setCurrentPage(1);
    fetchQuestions(1);
    updateUrlParams(
      selectedTrade?.$id,
      selectedSubject?.$id,
      selectedYear,
      selectedModule?.moduleId || selectedModule?.$id,
      1
    );
  }, [selectedTrade, selectedSubject, selectedYear, selectedModule]);

  // ── Pagination handler ────────────────────────────────────────────────────
  const totalPages = Math.ceil(totalQuestions / ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchQuestions(page);
    updateUrlParams(
      selectedTrade?.$id,
      selectedSubject?.$id,
      selectedYear,
      selectedModule?.moduleId || selectedModule?.$id,
      page
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Filter change handlers ────────────────────────────────────────────────
  const handleTradeChange = (tradeId) => {
    const trade = trades.find((t) => t.$id === tradeId) || null;
    setSelectedTrade(trade);
    setSelectedSubject(null);
    setSelectedModule(null);
  };

  const handleSubjectChange = (subjectId) => {
    const subject = subjects.find((s) => s.$id === subjectId) || null;
    setSelectedSubject(subject);
    setSelectedModule(null);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedModule(null);
  };

  const handleModuleChange = (moduleId) => {
    const mod = modules.find((m) => m.$id === moduleId || m.moduleId === moduleId) || null;
    setSelectedModule(mod);
  };

  const clearFilters = () => {
    setSelectedTrade(null);
    setSelectedSubject(null);
    setSelectedYear("");
    setSelectedModule(null);
    setSearchTerm("");
    setSearchParams({}, { replace: true });
  };

  // ── Delete Question ───────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    setIsDeleting((prev) => new Set(prev).add(id));
    try {
      await questionFunctionService.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.$id !== id));
      setTotalQuestions((prev) => prev - 1);
      toast.success("Question deleted.");
    } catch {
      toast.error("Failed to delete question.");
    } finally {
      setIsDeleting((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  const getOptionIndex = (correctAnswer) =>
    ["A", "B", "C", "D"].indexOf(correctAnswer);

  const filtersActive = selectedTrade || selectedSubject || selectedYear || selectedModule;

  // Local filtering for current page results
  const filteredQuestions = useMemo(() => {
    if (!searchTerm) return questions;
    return questions.filter(q => 
      q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.moduleId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-0 m-0 flex flex-col">
      {/* ── Attendance Register Styled Edge-to-Edge Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-none p-3 sm:p-4 text-white shadow-xs border-b border-blue-400/30 dark:border-indigo-500/20 m-0">
        {/* Ambient background glow orbs */}
        <div className="absolute top-[-70px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[160px] h-[160px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-screen-2xl mx-auto px-1 sm:px-2">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 shrink-0">
              <FileQuestion className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base tracking-tight text-white">
                  Question Repository
                </h1>
                <span className="text-[10px] sm:text-[11px] font-black bg-white/20 dark:bg-indigo-500/30 border border-white/25 dark:border-indigo-400/30 px-2 py-0.5 rounded-full">
                  {totalQuestions} {totalQuestions === 1 ? "Question" : "Questions"}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100/90 dark:text-slate-400">
                Browse, search, filter, and manage verified question banks for mock exams.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => navigate("/create-question")}
              className="flex-1 sm:flex-none text-center px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xs transition-all shadow-xs border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Question</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4 flex-1">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
           <StatCard 
              label="Total in View" 
              value={totalQuestions} 
              icon={BarChart3} 
              colorClass="bg-indigo-500" 
           />
           <StatCard 
              label="Filtered Results" 
              value={filteredQuestions.length} 
              icon={Search} 
              colorClass="bg-blue-500" 
           />
           <div className="hidden lg:flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Author</p>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[180px]">{user?.name || "Educator"}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-black uppercase">
                {(user?.name || 'U').charAt(0)}
              </div>
           </div>
        </div>

        {/* ── Filter Panel ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search within filtered results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filtersActive && (
              <button 
                onClick={clearFilters} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 rounded-lg border border-rose-200 dark:border-rose-900 transition-all cursor-pointer shrink-0"
              >
                <RefreshCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Trade</label>
              <AppSelect
                value={selectedTrade?.$id || ""}
                onValueChange={handleTradeChange}
                placeholder={tradesLoading ? "Loading..." : "Select Trade"}
                disabled={tradesLoading}
                icon={Layers}
              >
                {trades.map((t) => (
                  <AppSelectItem key={t.$id} value={t.$id}>{t.tradeName || t.name}</AppSelectItem>
                ))}
              </AppSelect>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Subject</label>
              <AppSelect
                value={selectedSubject?.$id || ""}
                onValueChange={handleSubjectChange}
                placeholder={loadingSubjects ? "Loading..." : "Select Subject"}
                disabled={loadingSubjects || subjects.length === 0}
                icon={BookOpen}
              >
                {subjects.map((s) => (
                  <AppSelectItem key={s.$id} value={s.$id}>{s.subjectName || s.name}</AppSelectItem>
                ))}
              </AppSelect>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
              <AppSelect
                value={selectedYear}
                onValueChange={handleYearChange}
                placeholder="Select Year"
                icon={Calendar}
              >
                <AppSelectItem value="FIRST">First Year</AppSelectItem>
                <AppSelectItem value="SECOND">Second Year</AppSelectItem>
              </AppSelect>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Module</label>
              <AppSelect
                value={selectedModule?.$id || ""}
                onValueChange={handleModuleChange}
                placeholder={loadingModules ? "Loading..." : "Select Module"}
                disabled={loadingModules || modules.length === 0 || !selectedTrade || !selectedSubject || !selectedYear}
                icon={LayoutGrid}
              >
                {modules.map((m) => (
                  <AppSelectItem key={m.$id} value={m.$id}>{m.moduleId} — {m.moduleName}</AppSelectItem>
                ))}
              </AppSelect>
              {loadingModules && <div className="flex items-center gap-1.5 ml-1 mt-1 text-[10px] text-indigo-500 font-bold uppercase"><Loader2 className="w-3 h-3 animate-spin" /> Fetching modules...</div>}
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="space-y-4">
           {isLoading ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 py-24 flex flex-col items-center justify-center gap-3 text-center px-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Loading question bank...</p>
              </div>
           ) : filteredQuestions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 py-20 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                  <FileQuestion className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No questions found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Try adjusting your filter selection or clearing search keywords.
                </p>
                {filtersActive && (
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer active:scale-95">
                    Reset all filters
                  </button>
                )}
              </div>
           ) : (
              <>
                <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
                  <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Displaying {filteredQuestions.length} Questions
                  </h2>
                  {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 pb-6">
                  {filteredQuestions.map((question) => (
                    <QuestionCard
                      key={question.$id}
                      question={question}
                      onDelete={handleDelete}
                      isDeleting={isDeleting}
                      getOptionIndex={getOptionIndex}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                   <div className="flex items-center justify-between gap-4 pt-6 flex-wrap border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-400 font-medium tracking-tight">Page {currentPage} of {totalPages}</p>
                      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                   </div>
                )}
              </>
           )}
        </div>
      </div>
    </div>
  );
};

export default ManageQuestions;
