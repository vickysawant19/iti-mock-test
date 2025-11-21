import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import questionpaperservice from "@/appwrite/mockTest";
import MockTestCard from "./components/MockTestCard";
import { Query } from "appwrite";
import Pagination from "./components/Pagination";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

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
        setLoading(false);
        return;
      }

      const response = await questionpaperservice.getQuestionPaperByUserId(
        user.$id,
        [
          Query.limit(ITEMS_PER_PAGE),
          Query.offset(startIndex),
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
          ]),
        ]
      );

      if (response) {
        const totalPages = Math.ceil(response.total / ITEMS_PER_PAGE);
        cachedMockTests.current.set(currentPage, {
          documents: response.documents,
          totalPages,
        });
        setTotalPages(totalPages);
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
    const confirmation = window.confirm(
      "Are you sure you want to delete this paper?"
    );
    if (!confirmation) return;

    setIsDeleting((prev) => ({ ...prev, [paperId]: true }));

    try {
      await questionpaperservice.deleteQuestionPaper(paperId);
      setMockTests((prevMockTests) =>
        prevMockTests.filter((test) => test.$id !== paperId)
      );
      if (cachedMockTests.current.has(currentPage)) {
        const cachedData = cachedMockTests.current.get(currentPage);
        const updatedDocuments = cachedData.documents.filter(
          (test) => test.$id !== paperId
        );
        cachedMockTests.current.set(currentPage, {
          ...cachedData,
          documents: updatedDocuments,
        });
      }
      toast.success("Deleted!");
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast.error("Failed to Delete. Please try again.");
      setError("Failed to delete the paper. Please try again later.");
    } finally {
      setIsDeleting((prev) => ({ ...prev, [paperId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-black dark:text-white p-4">
      <Card className="w-full max-w-6xl mx-auto shadow-md dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center dark:text-white">
            All Mock Tests
          </CardTitle>
          <CardDescription className="text-center text-gray-500 dark:text-gray-400">
            View and manage all your mock tests here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />

          {error && (
            <Alert variant="destructive" className="my-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <ClipLoader size={50} color={"#123abc"} loading={loading} />
            </div>
          ) : mockTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500 dark:text-gray-400">
              <p>No mock tests generated yet!</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllMockTests;
