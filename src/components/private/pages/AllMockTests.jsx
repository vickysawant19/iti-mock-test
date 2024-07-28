import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import questionpaperservice from "../../../appwrite/mockTest";
import { format } from "date-fns";
import { FaApper, FaPaperPlane, FaShareAlt, FaTrashAlt } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { MdFormatListNumbered } from "react-icons/md";

const MockTestCard = ({ test, user, handleShare, handleDelete }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <p className="text-sm text-gray-500">
      {format(new Date(test.$createdAt), "yyyy/MM/dd hh:mm a")}
    </p>
    <h2 className="text-xl font-semibold text-gray-800 mt-2">
      {test.tradeName || "No Trade Name"}
    </h2>
    <p className="text-gray-600 mt-2">
      <strong>Paper ID:</strong> {test.paperId}
    </p>
    <p className="text-gray-600">
      <strong>Year:</strong> {test.year || "-"}
    </p>
    <p className="text-gray-600">
      <strong>Score:</strong> {test.score !== null ? test.score : "-"}
    </p>
    <p className="text-gray-600">
      <strong>Total Questions:</strong>{" "}
      {test.quesCount !== null ? test.quesCount : "50"}
    </p>
    <p className="text-gray-600">
      <strong>Submitted:</strong> {test.submitted ? "Yes" : "No"}
    </p>
    <div className="mt-4 grid grid-cols-2 gap-4  ">
      {test.submitted ? (
        <div className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2">
          <FaPaperPlane />
          <Link to={`/show-mock-test/${test.$id}`} className="">
            Show Test
          </Link>
        </div>
      ) : (
        <div className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex  items-center justify-center w-full gap-2">
          <FaPaperPlane />
          <Link to={`/start-mock-test/${test.$id}`} className="">
            Start Test
          </Link>
        </div>
      )}

      <div className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md flex gap-2 items-center justify-center w-full">
        <MdFormatListNumbered />
        <Link to={`/mock-test-result/${test.paperId}`} className="">
          Test Scores
        </Link>
      </div>
      <button
        onClick={() => handleShare(test.paperId)}
        className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex gap-2 items-center justify-center w-full"
      >
        <FaShareAlt />
        <span>Share</span>
      </button>
      {user.labels.includes("admin") && (
        <button
          onClick={() => handleDelete(test.$id)}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md flex gap-2 items-center justify-center w-full"
        >
          <FaTrashAlt />
          <span>Delete</span>
        </button>
      )}
    </div>
  </div>
);

const AllMockTests = () => {
  const [mockTests, setMockTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        )}
      </div>
    </div>
  );
};

export default AllMockTests;
