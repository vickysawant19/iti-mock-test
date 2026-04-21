import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";

import questionService from "@/services/question.service";
import subjectService from "@/appwrite/subjectService";
import moduleServices from "@/appwrite/moduleServices";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { selectProfile } from "@/store/profileSlice";
import Pagination from "./components/Pagination";
import QuestionCard from "./components/QuestionCard";

const ITEMS_PER_PAGE = 20;

// ─── Reusable Radix Select ───────────────────────────────────────────────────
const AppSelect = ({ value, onValueChange, placeholder, disabled, children }) => (
  <SelectPrimitive.Root value={value || ""} onValueChange={onValueChange} disabled={disabled}>
    <SelectPrimitive.Trigger className="w-full inline-flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
      <SelectPrimitive.Value placeholder={placeholder} />
      <SelectPrimitive.Icon>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-64">
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
);

const AppSelectItem = ({ value, children }) => (
  <SelectPrimitive.Item
    value={value}
    className="relative flex items-center px-8 py-2 text-sm rounded-lg cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none text-gray-700"
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute left-2 text-blue-600">
      <Check className="w-3.5 h-3.5" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const ManageQuestions = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const profile = useSelector(selectProfile);

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

  // ── Load modules when trade + subject + year are ready ───────────────────
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
    if (selectedModule) {
      // Specific module selected
      fetchQuestions([Query.equal("moduleId", selectedModule.$id)], currentPage);
    } else if (selectedTrade || selectedSubject || selectedYear) {
      // Filters applied, but no specific module yet
      if (modules.length > 0) {
        const ids = modules.map((m) => m.$id);
        fetchQuestions([Query.equal("moduleId", ids)], currentPage);
      } else if (!loadingModules) {
        // Done loading but no modules found
        setQuestions([]);
        setTotalQuestions(0);
      }
    } else {
      // No filters at all -> Fetch ALL questions
      fetchQuestions([], currentPage);
    }
  }, [selectedModule, selectedTrade, selectedSubject, selectedYear, modules, loadingModules, currentPage, fetchQuestions]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Manage Questions</h1>
              {selectedModule && (
                <p className="text-xs text-blue-600 font-medium truncate max-w-xs">
                  {selectedModule.moduleId} — {selectedModule.moduleName}
                </p>
              )}
            </div>
          </div>
          {totalQuestions > 0 && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Filter Panel ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">Filter Questions</span>
            </div>
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Trade */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Trade <span className="text-red-400">*</span>
                </label>
                <AppSelect
                  value={selectedTrade?.$id || ""}
                  onValueChange={handleTradeChange}
                  placeholder={tradesLoading ? "Loading…" : trades.length === 0 ? "No trades" : "Select trade"}
                  disabled={tradesLoading || trades.length === 0}
                >
                  {trades.map((t) => (
                    <AppSelectItem key={t.$id} value={t.$id}>
                      {t.tradeName || t.name}
                    </AppSelectItem>
                  ))}
                </AppSelect>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Subject <span className="text-red-400">*</span>
                </label>
                <AppSelect
                  value={selectedSubject?.$id || ""}
                  onValueChange={handleSubjectChange}
                  placeholder={loadingSubjects ? "Loading…" : subjects.length === 0 ? "No subjects" : "Select subject"}
                  disabled={loadingSubjects || subjects.length === 0}
                >
                  {subjects.map((s) => (
                    <AppSelectItem key={s.$id} value={s.$id}>
                      {s.subjectName || s.name}
                    </AppSelectItem>
                  ))}
                </AppSelect>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Year <span className="text-red-400">*</span>
                </label>
                <AppSelect
                  value={selectedYear}
                  onValueChange={handleYearChange}
                  placeholder="Select year"
                >
                  <AppSelectItem value="FIRST">First Year</AppSelectItem>
                  <AppSelectItem value="SECOND">Second Year</AppSelectItem>
                </AppSelect>
              </div>

              {/* Module */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Module <span className="text-red-400">*</span>
                </label>
                <AppSelect
                  value={selectedModule?.$id || ""}
                  onValueChange={handleModuleChange}
                  placeholder={
                    loadingModules
                      ? "Loading…"
                      : !selectedTrade || !selectedSubject || !selectedYear
                      ? "Select above first"
                      : modules.length === 0
                      ? "No modules found"
                      : "Select module"
                  }
                  disabled={loadingModules || modules.length === 0 || !selectedTrade || !selectedSubject || !selectedYear}
                >
                  {modules.map((m) => (
                    <AppSelectItem key={m.$id} value={m.$id}>
                      {m.moduleId} — {m.moduleName}
                    </AppSelectItem>
                  ))}
                </AppSelect>
                {loadingModules && (
                  <p className="mt-1 text-xs text-blue-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading modules…
                  </p>
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {filtersActive && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedTrade && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Layers className="w-3 h-3" />
                    {selectedTrade.tradeName || selectedTrade.name}
                  </span>
                )}
                {selectedSubject && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                    <BookOpen className="w-3 h-3" />
                    {selectedSubject.subjectName || selectedSubject.name}
                  </span>
                )}
                {selectedYear && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    {selectedYear === "FIRST" ? "First Year" : "Second Year"}
                  </span>
                )}
                {selectedModule && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    {selectedModule.moduleId} — {selectedModule.moduleName}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Questions Area ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">Loading questions…</p>
          </div>
        ) : !hasSearched && filtersActive ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-700">Loading your questions...</p>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
              <FileQuestion className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-700">No questions found</p>
              <p className="text-sm text-gray-400 mt-1">No questions exist for this module yet.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-800">{questions.length}</span> of{" "}
                <span className="font-semibold text-gray-800">{totalQuestions}</span> questions
                {currentPage > 1 && <span className="text-gray-400"> · Page {currentPage}</span>}
              </p>
              {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {questions.map((question) => (
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
              <div className="flex justify-center mt-4">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageQuestions;
