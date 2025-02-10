import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import questionpaperservice from "../../../appwrite/mockTest";
import MockTestCard from "./components/MockTestCard";
import { Query } from "appwrite";
import Pagination from "./components/Pagination";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 10;

const AllMockTests = () => {
  const [mockTests, setMockTests] = useState([]);
  const cachedMockTests = useRef(new Map()); // Use useRef for caching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isDeleting, setIsDeleting] = useState({});
  const user = useSelector((state) => state.user);

  const fetchMockTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      // Check if data is already cached
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
        // Cache the fetched data
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
      // Remove the deleted item from state
      setMockTests((prevMockTests) =>
        prevMockTests.filter((test) => test.$id !== paperId)
      );
      // Update cache by removing the deleted item
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
    <div className="bg-gray-100 min-h-screen p-2">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          All Mock Tests
        </h1>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {error && (
          <div className="text-center w-full text-white p-4  rounded-md mb-6">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <ClipLoader size={50} color={"#123abc"} />
          </div>
        ) : mockTests.length === 0 ? (
          <div className="text-center w-full p-8 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No mock tests generated yet!</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
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
      </div>
    </div>
  );
};

export default AllMockTests;
