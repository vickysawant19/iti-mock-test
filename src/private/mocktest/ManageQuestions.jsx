import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Query } from "appwrite";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import { ArrowLeft, PlusCircle } from "lucide-react";

import quesdbservice from "@/appwrite/database";
import Pagination from "./components/Pagination";
import { addQuestions, selectQuestions }from "@/store/questionSlice"
import { selectUser } from "@/store/userSlice";
import QuestionCard from "./components/QuestionCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 20;

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isDeleting, setIsDeleting] = useState(new Set());
  const cachedQues = useRef(new Map());

  const user = useSelector(selectUser);
  const questionsStore = useSelector(selectQuestions);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      setIsLoading(true);
      try {
        if (cachedQues.current.has(currentPage)) {
          const resp = cachedQues.current.get(currentPage);
          setQuestions(resp.documents);
          setTotalPages(Math.ceil(resp.total / ITEMS_PER_PAGE));
          setIsLoading(false);
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
        dispatch(addQuestions(response.documents));
        setQuestions(response.documents);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to fetch questions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [user.$id, currentPage]);

  const handleDelete = async (slug) => {
    const confirmation = confirm(
      "Are you sure you want to delete this question?"
    );
    if (!confirmation) return;

    setIsDeleting((prev) => new Set(prev).add(slug));
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
    } finally {
      setIsDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(slug);
        return newSet;
      });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getOptionIndex = (correctAnswer) => {
    return ["A", "B", "C", "D"].indexOf(correctAnswer);
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-black dark:text-white">
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full shadow-md dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-col lg:flex-row w-full justify-between items-center">
              <div className="flex gap-4 items-center mb-4 lg:mb-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-primary dark:text-blue-400"
                >
                  <ArrowLeft size={20} />
                </Button>
                <CardTitle className="text-xl font-bold dark:text-white">
                  Manage Questions
                </CardTitle>
              </div>
              <Link to="/create-question">
                <Button className="gap-2">
                  <PlusCircle size={16} />
                  Create New Question
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            {isLoading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
              </div>
            ) : questions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No questions found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageQuestions;
