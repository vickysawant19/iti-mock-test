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

import tradeservice from "../../../appwrite/tradedetails";
import subjectService from "../../../appwrite/subjectService";
import quesdbservice from "../../../appwrite/database";
import moduleServices from "../../../appwrite/moduleServices";
import { Query } from "appwrite";
import { selectUser } from "../../../store/userSlice";
import { selectQuestions } from "../../../store/questionSlice";
import ImageUploader from "./components/ImageUpload";

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 rounded-lg w-full mb-4"></div>
    {/* <div className="h-10 bg-gray-200 rounded-lg w-3/4"></div> */}
  </div>
);

const EditQuestion = () => {
  const { quesId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trades, setTrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [modules, setModules] = useState(null);
  const [images, setImages] = useState([])

  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const questionsStore = useSelector(selectQuestions);
  const isTeacher = user.labels.includes("Teacher")

  const { register, handleSubmit, setValue, watch, reset, getValues, control } =
    useForm();

  const tradeId = useWatch({ control, name: "tradeId" });
  const subjectId = useWatch({ control, name: "subjectId" });
  const year = useWatch({ control, name: "year" });

  const fetchModules = async () => {
    if (!tradeId || !subjectId || !year) return;
    setIsLoading(true);
    try {
      const response = await moduleServices.listModules([
        Query.equal("tradeId", tradeId),
        Query.equal("subjectId", subjectId),
        Query.equal("year", year),
      ]);
      const currentModuleId = getValues("moduleId");
      if (currentModuleId) {
        setValue("moduleId", currentModuleId);
      }
      setModules(response);
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

      const [trades, subjects] = await Promise.all([
        tradeservice.listTrades(),
        subjectService.listSubjects()
      ])

      setTrades(trades.documents);
      setSubjects(subjects.documents);

      const question = await quesdbservice.getQuestion(quesId);

      const trade = trades.documents.find(
        (tr) => tr.$id === question.tradeId
      );
      const images = question.images.map(img => JSON.parse(img))
      setSelectedTrade(trade);
      setImages(images)
  
      reset({
        question: question.question,
        tradeId: question.tradeId,
        year: question.year,
        subjectId: question.subjectId,
        moduleId: String(question.moduleId),
        options: question.options,
        correctAnswer: question.correctAnswer,  
        images: images
      });
    } catch (error) {
      console.log(error.message);
      toast.error("Error fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(!isTeacher) {
      toast.error("You are not Authorized")
    }
    fetchTradesAndQuestion();
  }, [quesId, isTeacher]);

  useEffect(() => {
    if (tradeId && subjectId && year) {
      console.log("fetching module");
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
    
    data.images = images.map(img => JSON.stringify(img))
    data.userId = user.$id;
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Back</span>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Edit Question
            </h1>
          </div>

          {questionsStore &&  questionsStore[currentIndex + 1] && (
            <Link
              to={`/edit/${questionsStore[currentIndex + 1].$id}`}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span className="hidden md:inline">Next</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </header>

        {/* Main Form Card */}
        <div className="bg-white rounded-lg shadow-xs p-6 mb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Trade Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <GraduationCap className="w-4 h-4" />
                  Trade
                </label>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <select
                    {...register("tradeId")}
                    onChange={onTradeChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CalendarDays className="w-4 h-4" />
                    Year
                  </label>
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <select
                      {...register("year")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <BookOpen className="w-4 h-4" />
                    Subject
                  </label>
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <select
                      {...register("subjectId")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Layout className="w-4 h-4" />
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
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select Module</option>
                          {modules?.syllabus.map((m) => (
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

            {/* Question Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <HelpCircle className="w-4 h-4" />
                Question
              </label>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg w-full"></div>
                </div>
              ) : (
                <textarea
                  {...register("question")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="text-sm font-medium text-gray-700">
                Options
              </label>
              {["A", "B", "C", "D"].map((value, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`option-${value}`}
                      value={value}
                      {...register("correctAnswer")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label
                      htmlFor={`option-${value}`}
                      className="text-sm font-medium"
                    >
                      Option {value}
                    </label>
                  </div>
                  {isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg w-full"></div>
                    </div>
                  ) : (
                    <textarea
                      {...register(`options.${index}`)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
