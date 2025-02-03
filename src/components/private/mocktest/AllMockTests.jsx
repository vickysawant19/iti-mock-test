import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";

import questionpaperservice from "../../../appwrite/mockTest";
import MockTestCard from "./components/MockTestCard";

const AllMockTests = () => {
  const [mockTests, setMockTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber , setPageNumber ] = useState(1)
  const user = useSelector((state) => state.user);

  const fetchMockTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await questionpaperservice.getQuestionPaperByUserId(
        user.$id
      );
      if (response) {
        setMockTests(response);
      }
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      setError("Failed to fetch mock tests. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user.$id]);

  useEffect(() => {
    fetchMockTests();
  }, [fetchMockTests]);

  const handleShare = (paperId) => {
    const shareText = `Check out this mock test paper with ID: ${paperId}`;
    if (navigator.share) {
      navigator
        .share({
          title: "Mock Test Paper",
          text: shareText,
        })
        .then(() => console.log("Share successful"))
        .catch((error) => console.error("Share failed:", error));
    } else {
      console.log("Web Share API not supported");
    }
  };

  const handleDelete = async (paperId) => {
    const confirmation = confirm("Are you sure you want to delete this paper?");
    if (!confirmation) return;
    try {
      await questionpaperservice.deleteQuestionPaper(paperId);
      fetchMockTests();
    } catch (error) {
      console.log("Error deleting paper:", error);
      setError("Failed to delete the paper. Please try again later.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          All Mock Tests
        </h1>
        {error && (
          <div className="text-center w-full text-white p-2 bg-red-300">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <ClipLoader size={50} color={"#123abc"} loading={loading} />
          </div>
        ) : mockTests.length === 0 ? (
          <div className="text-center w-full text-white p-2 bg-red-300">
            No mock test generated!
          </div>
        ) : (
          <div>
            <div>
              <h1>he</h1>
            </div>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 ">
            {mockTests.map((test) => (
              <MockTestCard
                key={test.$id}
                test={test}
                user={user}
                handleShare={handleShare}
                handleDelete={handleDelete}
              />
            ))}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMockTests;
