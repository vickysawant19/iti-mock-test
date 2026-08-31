import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Query } from "appwrite";
import { Loader2, AlertCircle, FileText, Plus, Hash } from "lucide-react";
import { toast } from "react-toastify";

import mockTestService from "@/services/academic/mocktest.service";
import { selectUser } from "@/store/userSlice";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import MockTestCard from "./components/MockTestCard";
import MockTestFilterToolbar from "./components/MockTestFilterToolbar";
import MockTestEmptyState from "./components/MockTestEmptyState";
import Pagination from "./components/Pagination";

const ITEMS_PER_PAGE = 10;

const SORT_OPTIONS = [
  { value: "updatedAt_desc", label: "Last Updated",  query: () => Query.orderDesc("$updatedAt") },
  { value: "createdAt_desc", label: "Newest First",  query: () => Query.orderDesc("$createdAt") },
  { value: "createdAt_asc",  label: "Oldest First",  query: () => Query.orderAsc("$createdAt")  },
  { value: "score_desc",     label: "Highest Score", query: () => Query.orderDesc("score")      },
  { value: "score_asc",      label: "Lowest Score",  query: () => Query.orderAsc("score")       },
];

const AllMockTests = () => {
  const [mockTests, setMockTests] = useState([]);
  const cachedMockTests = useRef(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState({});
  const [sortBy, setSortBy] = useState("updatedAt_desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const user = useSelector(selectUser);

  const fetchMockTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const cacheKey = `${sortBy}_${statusFilter}_${typeFilter}_${currentPage}`;

      if (cachedMockTests.current.has(cacheKey)) {
        const cachedData = cachedMockTests.current.get(cacheKey);
        setMockTests(cachedData.documents);
        setTotalPages(cachedData.totalPages);
        setTotalCount(cachedData.total || 0);
        setLoading(false);
        return;
      }

      const sortQuery = SORT_OPTIONS.find((o) => o.value === sortBy)?.query() ?? Query.orderDesc("$updatedAt");

      const queryFilters = [
        Query.limit(ITEMS_PER_PAGE),
        Query.offset(startIndex),
        sortQuery,
      ];

      if (statusFilter === "submitted") {
        queryFilters.push(Query.equal("submitted", true));
      } else if (statusFilter === "pending") {
        queryFilters.push(Query.equal("submitted", false));
      }

      if (typeFilter === "original") {
        queryFilters.push(Query.equal("isOriginal", true));
      } else if (typeFilter === "attempt") {
        queryFilters.push(Query.equal("isOriginal", false));
      }

      queryFilters.push(
        Query.select([
          "endTime",
          "isOriginal",
          "isProtected",
          "paperId",
          "quesCount",
          "score",
          "startTime",
          "submitted",
          "totalMinutes",
          "tradeId",
          "tradeName",
          "userId",
          "userName",
          "year",
          "$createdAt",
          "$id",
          "title",
          "visibility",
          "negativeMarking",
          "difficultyLevel",
        ])
      );

      const response = await mockTestService.getQuestionPaperByUserId(
        user.$id,
        queryFilters
      );

      if (response) {
        const pages = Math.ceil(response.total / ITEMS_PER_PAGE);
        cachedMockTests.current.set(cacheKey, {
          documents: response.documents,
          totalPages: pages,
          total: response.total,
        });
        setTotalPages(pages);
        setTotalCount(response.total);
        setMockTests(response.documents);
      }
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      setError("Failed to fetch mock tests. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user.$id, currentPage, sortBy, statusFilter, typeFilter]);

  const handleSortChange = (value) => {
    cachedMockTests.current.clear();
    setCurrentPage(1);
    setSortBy(value);
  };

  const handleStatusFilterChange = (value) => {
    cachedMockTests.current.clear();
    setCurrentPage(1);
    setStatusFilter(value);
  };

  const handleTypeFilterChange = (value) => {
    cachedMockTests.current.clear();
    setCurrentPage(1);
    setTypeFilter(value);
  };

  const handleResetFilters = () => {
    cachedMockTests.current.clear();
    setCurrentPage(1);
    setSortBy("updatedAt_desc");
    setStatusFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
  };

  useEffect(() => {
    fetchMockTests();
  }, [fetchMockTests]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (paperId) => {
    const confirmation = window.confirm(
      "Are you sure you want to delete this paper?"
    );
    if (!confirmation) return;

    setIsDeleting((prev) => ({ ...prev, [paperId]: true }));
    try {
      await mockTestService.deleteQuestionPaper(paperId);
      setMockTests((prev) => prev.filter((test) => test.$id !== paperId));
      cachedMockTests.current.clear();
      toast.success("Deleted!");
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast.error("Failed to delete. Please try again.");
      setError("Failed to delete the paper. Please try again later.");
    } finally {
      setIsDeleting((prev) => ({ ...prev, [paperId]: false }));
    }
  };

  const displayedMockTests = useMemo(() => {
    if (!searchQuery.trim()) return mockTests;
    const q = searchQuery.toLowerCase().trim();
    return mockTests.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.tradeName?.toLowerCase().includes(q) ||
        t.paperId?.toLowerCase().includes(q)
    );
  }, [mockTests, searchQuery]);

  const isFiltered = statusFilter !== "all" || typeFilter !== "all" || searchQuery.trim() !== "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-0 m-0 flex flex-col">
      {/* ── Attendance Register Styled Edge-to-Edge Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-none p-3 sm:p-4 text-white shadow-xs border-b border-blue-400/30 dark:border-indigo-500/20 m-0">
        {/* Ambient background glow orbs */}
        <div className="absolute top-[-70px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[160px] h-[160px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-7xl mx-auto px-1 sm:px-2">
          {/* Header Title & Count */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base tracking-tight text-white">
                  My Mock Exams
                </h1>
                {!loading && (
                  <span className="text-[10px] sm:text-[11px] font-black bg-white/20 dark:bg-indigo-500/30 border border-white/25 dark:border-indigo-400/30 px-2 py-0.5 rounded-full">
                    {totalCount} {totalCount === 1 ? "Paper" : "Papers"}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100/90 dark:text-slate-400">
                View, attempt, and manage all your generated mock test papers and evaluations.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Link
              to="/mock-exam"
              className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xs transition-all shadow-xs border border-amber-300 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Test</span>
            </Link>
            <Link
              to="/attain-test"
              className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-xs transition-all border border-white/30 dark:border-slate-700 flex items-center justify-center gap-1"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Enter Paper ID</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4 flex-1">
        {/* ── Header & Filter Toolbar ── */}
        <MockTestFilterToolbar
          totalCount={totalCount}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          handleStatusFilterChange={handleStatusFilterChange}
          typeFilter={typeFilter}
          handleTypeFilterChange={handleTypeFilterChange}
          sortBy={sortBy}
          handleSortChange={handleSortChange}
          handleResetFilters={handleResetFilters}
          isFiltered={isFiltered}
          sortOptions={SORT_OPTIONS}
        />

        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading Spinner */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading mock tests…
              </p>
            </div>
          ) : displayedMockTests.length === 0 ? (
            /* Empty State */
            <MockTestEmptyState
              isFiltered={isFiltered}
              handleResetFilters={handleResetFilters}
            />
          ) : (
            <>
              {/* Top Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Page{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {totalPages}
                    </span>
                  </p>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 w-full">
                {displayedMockTests.map((test) => (
                  <MockTestCard
                    key={test.$id}
                    test={test}
                    user={user}
                    fetchMockTests={fetchMockTests}
                    handleDelete={handleDelete}
                    isDeleting={isDeleting}
                    setMockTests={setMockTests}
                  />
                ))}
              </div>

              {/* Bottom Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-2">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllMockTests;
