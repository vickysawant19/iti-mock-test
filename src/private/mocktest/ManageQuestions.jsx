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

import questionService from "@/services/question.service";
import subjectService from "@/appwrite/subjectService";
import moduleServices from "@/appwrite/moduleServices";
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
      <SelectPrimitive.Trigger className="w-full inline-flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
        <div className="flex items-center gap-2.5 truncate">
          {Icon && <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />}
          <SelectPrimitive.Value placeholder={placeholder} />
        </div>
        <SelectPrimitive.Icon>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] animate-in fade-in zoom-in-95 duration-100">
          <SelectPrimitive.Viewport className="p-1.5">
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
    className="relative flex items-center px-9 py-2.5 text-sm rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-50 dark:focus:bg-blue-900/30 outline-none text-gray-700 dark:text-gray-300 transition-colors"
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute left-3 text-blue-600">
      <Check className="w-4 h-4" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
);

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
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

  // Track whether we've done initial URL-restore pass
  const restoredRef = useRef(false);

  // ── Trades via RTK Query ──────────────────────────────────────────────────
  const { data: tradesResponse, isLoading: tradesLoading } = useListTradesQuery(
    undefined,
    { skip: !profile }
  );
  const trades = tradesResponse?.documents || [];
  const totalPages = Math.ceil(totalQuestions / ITEMS_PER_PAGE);

  // ── Persist filter changes to URL ─────────────────────────────────────────
  const updateParams = useCallback((patch) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // ── Load subjects once ────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      setLoadingSubjects(true);
      try {
        const data = await subjectService.listSubjects();
        setSubjects(data.documents || []);
      } catch {
        toast.error("Failed to load subjects.");
      } finally {
        setLoadingSubjects(false);
      }
    };
    load();
  }, [profile]);

  // ── Restore selections from URL once trades + subjects are ready ──────────
  useEffect(() => {
    if (restoredRef.current) return;
    if (!trades.length || !subjects.length) return;
    if (!urlTradeId && !urlSubjectId && !urlYear && !urlModuleId) {
      restoredRef.current = true;
      return;
    }

    const trade   = trades.find((t) => t.$id === urlTradeId)   || null;
    const subject = subjects.find((s) => s.$id === urlSubjectId) || null;

    setSelectedTrade(trade);
    setSelectedSubject(subject);
    setSelectedYear(urlYear);

    restoredRef.current = true;
    // modules + question load will follow via the effects below
  }, [trades, subjects, urlTradeId, urlSubjectId, urlYear, urlModuleId]);

  // ── Load modules when trade + subject + year are ready ─────────────────────────────
  useEffect(() => {
    if (!selectedTrade || !selectedSubject || !selectedYear) {
      setModules([]);
      setSelectedModule(null);
      return;
    }
    const load = async () => {
      setLoadingModules(true);
      try {
        const data = await moduleServices.getNewModulesData(
          selectedTrade.$id,
          selectedSubject.$id,
          selectedYear
        );
        const sorted = (data || []).sort(
          (a, b) => a.moduleId.match(/\d+/)?.[0] - b.moduleId.match(/\d+/)?.[0]
        );
        setModules(sorted);

        // Restore selected module from URL if present
        if (urlModuleId && !selectedModule) {
          const mod = sorted.find((m) => m.$id === urlModuleId);
          if (mod) setSelectedModule(mod);
        }
      } catch {
        toast.error("Failed to load modules.");
      } finally {
        setLoadingModules(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrade, selectedSubject, selectedYear]);

  // ── Fetch questions ────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async (additionalQueries, page) => {
    setIsLoading(true);
    setHasSearched(true);
    const offset = (page - 1) * ITEMS_PER_PAGE;
    try {
      const response = await questionService.listQuestions([
        ...additionalQueries,
        Query.orderDesc("$createdAt"),
        Query.limit(ITEMS_PER_PAGE),
        Query.offset(offset),
      ]);
      setQuestions(response.documents || []);
      setTotalQuestions(response.total || 0);
    } catch {
      toast.error("Failed to fetch questions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const baseQueries = [];
    if (user?.$id) {
      baseQueries.push(Query.equal("userId", user.$id));
    }

    if (selectedModule) {
      // Specific module selected (using its logical moduleId string)
      fetchQuestions([
        ...baseQueries,
        Query.equal("tradeId", selectedTrade?.$id),
        Query.equal("subjectId", selectedSubject?.$id),
        Query.equal("year", selectedYear),
        Query.equal("moduleId", selectedModule.moduleId)
      ], currentPage);
    } else if (selectedTrade || selectedSubject || selectedYear) {
      // Filters applied, but no specific module yet
      const filterQueries = [...baseQueries];
      if (selectedTrade) filterQueries.push(Query.equal("tradeId", selectedTrade.$id));
      if (selectedSubject) filterQueries.push(Query.equal("subjectId", selectedSubject.$id));
      if (selectedYear) filterQueries.push(Query.equal("year", selectedYear));
      
      fetchQuestions(filterQueries, currentPage);
    } else {
      // No filters at all -> Fetch user's questions
      fetchQuestions(baseQueries, currentPage);
    }
  }, [selectedModule, selectedTrade, selectedSubject, selectedYear, modules, loadingModules, currentPage, fetchQuestions, user?.$id]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleTradeChange = (tradeId) => {
    const trade = trades.find((t) => t.$id === tradeId) || null;
    setSelectedTrade(trade);
    setSelectedModule(null);
    setModules([]);
    setQuestions([]);
    setHasSearched(false);
    setCurrentPage(1);
    updateParams({ tradeId, subjectId: "", year: "", moduleId: "", page: "" });
  };

  const handleSubjectChange = (subjectId) => {
    const subject = subjects.find((s) => s.$id === subjectId) || null;
    setSelectedSubject(subject);
    setSelectedModule(null);
    setModules([]);
    setQuestions([]);
    setHasSearched(false);
    setCurrentPage(1);
    updateParams({ subjectId, moduleId: "", page: "" });
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedModule(null);
    setModules([]);
    setQuestions([]);
    setHasSearched(false);
    setCurrentPage(1);
    updateParams({ year, moduleId: "", page: "" });
  };

  const handleModuleChange = (moduleId) => {
    const mod = modules.find((m) => m.$id === moduleId) || null;
    setSelectedModule(mod);
    setCurrentPage(1);
    setQuestions([]);
    setHasSearched(false);
    updateParams({ moduleId, page: "1" });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSelectedTrade(null);
    setSelectedSubject(null);
    setSelectedYear("");
    setModules([]);
    setSelectedModule(null);
    setQuestions([]);
    setHasSearched(false);
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    setIsDeleting((prev) => new Set(prev).add(id));
    try {
      await questionService.deleteQuestion(id);
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
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.moduleId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Top Bar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Question Repository</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Live Management</p>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md relative group hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search current results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 border focus:border-blue-500 rounded-2xl text-sm transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
             <button
              onClick={() => navigate("/create-question")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4.5 h-4.5" />
              <span className="hidden sm:inline text-xs">New Question</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           <StatCard 
              label="Total in View" 
              value={totalQuestions} 
              icon={BarChart3} 
              colorClass="bg-blue-500" 
           />
           <StatCard 
              label="Filtered Results" 
              value={filteredQuestions.length} 
              icon={Search} 
              colorClass="bg-indigo-500" 
           />
           <div className="hidden lg:block bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-lg shadow-blue-600/20">
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Active User</p>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold truncate pr-2">{user?.name || "Educator"}</h3>
                <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-sm font-bold uppercase">
                  {(user?.name || 'U').charAt(0)}
                </div>
              </div>
           </div>
        </div>

        {/* ── Filter Panel (Full Width) ── */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" />
              Filter Questions
            </h2>
            {filtersActive && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1">
                <RefreshCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Trade</label>
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Subject</label>
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Academic Year</label>
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Module</label>
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
              {loadingModules && <div className="flex items-center gap-2 ml-1 mt-2 text-[10px] text-blue-500 font-bold uppercase"><Loader2 className="w-3 h-3 animate-spin" /> Fetching modules...</div>}
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="space-y-4">
           {isLoading ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 py-32 flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="relative mb-4">
                  <div className="w-16 h-16 border-4 border-blue-100 dark:border-gray-800 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Compiling your question bank...</p>
              </div>
           ) : filteredQuestions.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 py-32 flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center mb-6">
                  <FileQuestion className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No results found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  We couldn't find any questions matching your current filters or search term.
                </p>
                <button onClick={clearFilters} className="mt-8 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-bold rounded-xl transition-all shadow-sm">
                  Reset all filters
                </button>
              </div>
           ) : (
              <>
                <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Displaying {filteredQuestions.length} Results
                  </h2>
                  {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-12">
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
