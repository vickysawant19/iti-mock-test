import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import quesdbservice from "../../appwrite/database";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setisLoading] = useState(false);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const fetchQuestions = async () => {
      setisLoading(true);
      try {
        const response = await quesdbservice.listQuestions([
          Query.equal("userId", user.$id),
        ]);
        setQuestions(response.documents);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setisLoading(false);
      }
    };

    fetchQuestions();
  }, [user.$id]);

  const handleDelete = async (slug) => {
    try {
      const deleted = await quesdbservice.deleteQuestion(slug);
      if (deleted) {
        setQuestions((prevQuestions) =>
          prevQuestions.filter((question) => question.$id !== slug)
        );
        toast.success("Deleted successfully");
      } else {
        toast.error("Error deleting question");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Error deleting question");
    }
  };

  const getOptionIndex = (correctAnswer) => {
    return ["A", "B", "C", "D"].indexOf(correctAnswer);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col items-center py-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">
            Manage Questions
          </h1>
          <Link
            to="/create-question"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4"
          >
            Create New Question
          </Link>
        </header>

        {isLoading ? (
          <div className="flex justify-center mt-20 ">
            {" "}
            <ClipLoader size={50} color="#123ab" />
          </div>
        ) : (
          <main className="mt-8 ">
            {questions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
                    <div className="flex items-center space-x-4">
                      <Link
                        to={`/edit/${question.$id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(question.$id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
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
      <ToastContainer />
    </div>
  );
};

export default ManageQuestions;
