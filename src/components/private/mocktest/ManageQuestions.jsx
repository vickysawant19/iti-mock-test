import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";

import quesdbservice from "../../../appwrite/database";
import Pagination from "./components/Pagination";
import { FaArrowLeft } from "react-icons/fa";

const ITEMS_PER_PAGE = 20;

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setisLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isDeleting, setIsDeleting] = useState(new Set());
  const cachedQues = useRef(new Map());

  const user = useSelector((state) => state.user);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      setisLoading(true);
      try {
        if (cachedQues.current.has(currentPage)) {
          const resp = cachedQues.current.get(currentPage);
          setQuestions(resp.documents);
          setTotalPages(Math.ceil(resp.total / ITEMS_PER_PAGE));
          setisLoading(false);
          return;
        }
        const response = await quesdbservice.listQuestions([
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(ITEMS_PER_PAGE),
          Query.offset(startIndex),
        ]);
        cachedQues.current.set(currentPage, response);
        setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
        setQuestions(response.documents);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setisLoading(false);
      }
    };
    fetchQuestions();
  }, [user.$id, currentPage]);

  const handleDelete = async (slug) => {
    const confirmation = confirm("Are you want to delete this question?");
    if (!confirmation) {
      return;
    }
    setIsDeleting(() => new Set().add(slug));
    try {
      const deleted = await quesdbservice.deleteQuestion(slug);
      if (deleted) {
        setQuestions((prevQuestions) =>
          prevQuestions.filter((question) => question.$id !== slug)
        );
        // Update cache by removing the deleted item
        if (cachedQues.current.has(currentPage)) {
          const cachedData = cachedQues.current.get(currentPage);
          const updatedDocuments = cachedData.documents.filter(
            (test) => test.$id !== slug
          );
          cachedQues.current.set(currentPage, {
            ...cachedData,
            documents: updatedDocuments,
          });
        }
        toast.success("Deleted successfully");
      } else {
        toast.error("Error deleting question");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Error deleting question");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getOptionIndex = (correctAnswer) => {
    return ["A", "B", "C", "D"].indexOf(correctAnswer);
  };

  return (
    <div className="bg-gray-100 min-h-screen w-full">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col lg:flex-row w-full justify-between items-center py-6">
          <div className="flex gap-6 items-center justify-center mb-4 lg:mb-0">
            <button
              onClick={() => navigate(-1)}
              className="text-2xl hidden lg:block"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-3xl font-bold text-gray-800 ">
              Manage Questions
            </h1>
          </div>
          <Link
            to="/create-question"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4"
          >
            Create New Question
          </Link>
        </header>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {isLoading ? (
          <div className="flex justify-center mt-20 ">
            {" "}
            <ClipLoader size={50} color="#123ab" />
          </div>
        ) : (
          <main className="mt-8 ">
            {questions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {questions.map((question) => (
                  <div
                    key={question.$id}
                    className="bg-gray-50 p-4 rounded-lg shadow"
                  >
                    <h2 className="font-semibold text-lg text-gray-800">
                      {question.question}
                    </h2>
                    <ul className="mt-2 mb-4">
                      {question.options.map((option, index) => (
                        <li
                          key={index}
                          className={`px-2 py-1 mt-1 rounded ${
                            getOptionIndex(question.correctAnswer) === index
                              ? "bg-green-200"
                              : "bg-gray-200"
                          }`}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center space-x-4 ">
                      <Link
                        to={`/edit/${question.$id}`}
                        className="text-blue-500 border py-2 px-1 hover:bg-blue-500 rounded w-16 text-center hover:text-blue-100 transition-colors duration-300"
                      >
                        Edit
                      </Link>
                      <button
                        disabled={isDeleting.has(question.$id)}
                        onClick={() => handleDelete(question.$id)}
                        className="text-red-500 border py-2 px-1 hover:bg-red-500 rounded min-w-16 text-center hover:text-red-100 transition-colors duration-300"
                      >
                        {isDeleting.has(question.$id)
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 text-center">No questions found.</p>
            )}
          </main>
        )}
      </div>
    </div>
  );
};

export default ManageQuestions;
