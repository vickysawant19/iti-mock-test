import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import questionpaperservice from "@/appwrite/mockTest";
import MockTestCard from "./components/MockTestCard";
import { Query } from "appwrite";
import Pagination from "./components/Pagination";
import { toast } from "react-toastify";
import { Loader2, FileText, AlertCircle, ClipboardList } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { selectUser } from "@/store/userSlice";

const ITEMS_PER_PAGE = 10;

const AllMockTests = () => {
  const [mockTests, setMockTests] = useState([]);
  const cachedMockTests = useRef(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState({});
  const user = useSelector(selectUser);

  const fetchMockTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

      if (cachedMockTests.current.has(currentPage)) {
        const cachedData = cachedMockTests.current.get(currentPage);
        setMockTests(cachedData.documents);
        setTotalPages(cachedData.totalPages);
        setTotalCount(cachedData.total || 0);
        setLoading(false);
        return;
      }

      const response = await questionpaperservice.getQuestionPaperByUserId(
        user.$id,
        [
          Query.limit(ITEMS_PER_PAGE),
          Query.offset(startIndex),
          Query.select([
            "endTime", "isOriginal", "isProtected", "paperId", "quesCount",
            "score", "startTime", "submitted", "totalMinutes", "tradeId",
            "tradeName", "userId", "userName", "year", "$createdAt", "$id",
          ]),
        ]
      );

      if (response) {
        const pages = Math.ceil(response.total / ITEMS_PER_PAGE);
        cachedMockTests.current.set(currentPage, {
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
  }, [user.$id, currentPage]);

  useEffect(() => {
    fetchMockTests();
  }, [fetchMockTests]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (paperId) => {
    const confirmation = window.confirm("Are you sure you want to delete this paper?");
    if (!confirmation) return;

    setIsDeleting((prev) => ({ ...prev, [paperId]: true }));
    try {
      await questionpaperservice.deleteQuestionPaper(paperId);
      setMockTests((prev) => prev.filter((test) => test.$id !== paperId));
      if (cachedMockTests.current.has(currentPage)) {
        const cachedData = cachedMockTests.current.get(currentPage);
        cachedMockTests.current.set(currentPage, {
          ...cachedData,
          documents: cachedData.documents.filter((test) => test.$id !== paperId),
        });
      }
      toast.success("Deleted!");
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast.error("Failed to delete. Please try again.");
      setError("Failed to delete the paper. Please try again later.");
    } finally {
      setIsDeleting((prev) => ({ ...prev, [paperId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Page Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                All Mock Tests
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View and manage your generated test papers
              </p>
            </div>
          </div>
          {!loading && totalCount > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
              {totalCount} test{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading mock tests…</p>
          </div>
        ) : mockTests.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                No mock tests yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Generate a mock test to see it appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Top pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page <span className="font-semibold text-gray-700 dark:text-gray-200">{currentPage}</span> of{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{totalPages}</span>
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            {/* Cards grid */}
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {mockTests.map((test) => (
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

            {/* Bottom pagination */}
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
  );
};

export default AllMockTests;
