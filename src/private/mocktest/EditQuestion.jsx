import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Layout,
  HelpCircle,
} from "lucide-react";

import { useListTradesQuery } from "@/store/api/tradeApi";
import subjectService from "@/appwrite/subjectService";
import quesdbservice from "@/appwrite/database";
import moduleServices from "@/appwrite/moduleServices";
import { Query } from "appwrite";
import { selectUser } from "@/store/userSlice";
import { selectQuestions } from "@/store/questionSlice";
import ImageUploader from "./components/ImageUpload";

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full mb-4"></div>
    {/* Uncomment if needed */}
    {/* <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4"></div> */}
  </div>
);

const EditQuestion = () => {
  const { quesId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [modules, setModules] = useState(null);
  const [images, setImages] = useState([]);

  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const questionsStore = useSelector(selectQuestions);
  const isTeacher = user.labels.includes("Teacher");

  // Fetch trades via RTK Query
  const { data: tradesResponse } = useListTradesQuery();
  const trades = tradesResponse?.documents || [];

  const { register, handleSubmit, setValue, watch, reset, getValues, control } =
    useForm();

  const tradeId = useWatch({ control, name: "tradeId" });
  const subjectId = useWatch({ control, name: "subjectId" });
  const year = useWatch({ control, name: "year" });

  const fetchModules = async () => {
    if (!tradeId || !subjectId || !year) return;
    setIsLoading(true);
    try {
      const syllabusData = await moduleServices.getNewModulesData(
        tradeId,
        subjectId,
        year
      );

      const sortedSyllabusData = syllabusData.sort(
        (a, b) => a.moduleId.match(/\d+/)[0] - b.moduleId.match(/\d+/)[0]
      );

      const currentModuleId = getValues("moduleId");
      if (currentModuleId) {
        setValue("moduleId", currentModuleId);
      }
      setModules(sortedSyllabusData);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch Modules");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTradesAndQuestion = async () => {
    setIsLoading(true);
    try {
      const subjects = await subjectService.listSubjects();
      setSubjects(subjects.documents);

      const question = await quesdbservice.getQuestion(quesId);
      const trade = trades.find((tr) => tr.$id === question.tradeId);
      const images = question.images.map((img) => JSON.parse(img));
      setSelectedTrade(trade);
      setImages(images);

      reset({
        question: question.question,
        tradeId: question.tradeId,
        year: question.year,
        subjectId: question.subjectId,
        moduleId: String(question.moduleId),
        options: question.options,
        correctAnswer: question.correctAnswer,
        images: images,
        tags: question.tags?.split(",") || [],
      });
    } catch (error) {
      console.log(error.message);
      toast.error("Error fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isTeacher) {
      toast.error("You are not Authorized");
    }
    if (trades.length > 0) {
      fetchTradesAndQuestion();
    }
  }, [quesId, isTeacher, trades]);

  useEffect(() => {
    if (tradeId && subjectId && year) {
      fetchModules();
    }
  }, [tradeId, subjectId, year]);

  const onTradeChange = (e) => {
    const selectedTradeId = e.target.value;
    const trade = trades.find((tr) => tr.$id === selectedTradeId);
    setSelectedTrade(trade);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    if (!data.correctAnswer) {
      toast.error("Correct answer is required");
      setIsSubmitting(false);
      return;
    }

    data.images = images.map((img) => JSON.stringify(img));
    data.userId = user.$id;
    data.tags = (data.tags || []).join(",");
    try {
      await quesdbservice.updateQuestion(quesId, data);
      toast.success("Question updated");
      // navigate("/manage-questions");
    } catch (error) {
      toast.error("Error updating question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentIndex = questionsStore?.findIndex((item) => item.$id === quesId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Back</span>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Edit Question
            </h1>
          </div>

          {questionsStore && questionsStore[currentIndex + 1] && (
            <Link
              to={`/edit/${questionsStore[currentIndex + 1].$id}`}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <span className="hidden md:inline">Next</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </header>

        {/* Main Form Card */}
        <div className="bg-white rounded-lg shadow-xs p-6 mb-6 dark:bg-gray-900 dark:border dark:border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Trade Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <GraduationCap className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Trade
                </label>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <select
                    {...register("tradeId")}
                    onChange={onTradeChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">Select Trade</option>
                    {trades.map((trade) => (
                      <option key={trade.$id} value={trade.$id}>
                        {trade.tradeName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedTrade && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <CalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Year
                  </label>
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <select
                      {...register("year")}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">Select Year</option>
                      {new Array(selectedTrade.duration)
                        .fill(null)
                        .map((_, index) => (
                          <option
                            key={index}
                            value={index === 0 ? "FIRST" : "SECOND"}
                          >
                            {index === 0 ? "FIRST" : "SECOND"} YEAR
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {selectedTrade && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Subject
                  </label>
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <select
                      {...register("subjectId")}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sub) => (
                        <option key={sub.$id} value={sub.$id}>
                          {sub.subjectName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <Layout className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Module
                  </label>
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <Controller
                      name="moduleId"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="">Select Module</option>
                          {modules?.map((m) => (
                            <option key={m.moduleId} value={String(m.moduleId)}>
                              {m.moduleId} {m.moduleName}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="mb-6 lg:col-span-2">
              <label
                htmlFor="tags"
                className="block text-gray-800 dark:text-gray-100 font-semibold mb-2"
              >
                Tags (Press Enter or Space to add)
              </label>

              <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                {watch("tags")?.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-md flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const currentTags = watch("tags");
                        setValue(
                          "tags",
                          currentTags.filter((_, i) => i !== index)
                        );
                      }}
                      className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="outline-none flex-1 bg-transparent dark:text-gray-100"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const tag = e.target.value.trim();
                      if (tag) {
                        const currentTags = watch("tags") || [];
                        if (!currentTags.includes(tag)) {
                          setValue("tags", [...currentTags, tag]);
                          e.target.value = "";
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Question Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Question
              </label>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
                </div>
              ) : (
                <textarea
                  {...register("question")}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-100"
                  rows="3"
                />
              )}
            </div>

            {/* Images */}
            <div className="col-span-full">
              <ImageUploader images={images} setImages={setImages} />
            </div>

            {/* Options */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Options
              </label>
              {["A", "B", "C", "D"].map((value, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`option-${value}`}
                      value={value}
                      {...register("correctAnswer")}
                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    />
                    <label
                      htmlFor={`option-${value}`}
                      className="text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Option {value}
                    </label>
                  </div>
                  {isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
                    </div>
                  ) : (
                    <textarea
                      {...register(`options.${index}`)}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-100"
                      rows="2"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Update Question</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditQuestion;
