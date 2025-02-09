import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowLeft } from "react-icons/fa";

import tradeservice from "../../../appwrite/tradedetails";
import subjectService from "../../../appwrite/subjectService";
import quesdbservice from "../../../appwrite/database";
import moduleServices from "../../../appwrite/moduleServices";
import { Query } from "appwrite";

const EditQuestion = () => {
  const { quesId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trades, setTrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [modules, setModules] = useState(null);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
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
      const response = await tradeservice.listTrades();
      setTrades(response.documents);
      const subjectRes = await subjectService.listSubjects();
      setSubjects(subjectRes.documents);
      const question = await quesdbservice.getQuestion(quesId);

      const trade = response.documents.find(
        (tr) => tr.$id === question.tradeId
      );
      setSelectedTrade(trade);
      reset({
        question: question.question,
        tradeId: question.tradeId,
        year: question.year,
        subjectId: question.subjectId,
        moduleId: String(question.moduleId),
        options: question.options,
        correctAnswer: question.correctAnswer,
      });
    } catch (error) {
      console.log(error.message);
      toast.error("Error fetching data gg");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTradesAndQuestion();
  }, [quesId]);

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

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="py-3  flex gap-10 pl-4">
          <button onClick={() => navigate(-1)} className="text-2xl">
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Edit Question
          </h1>
        </header>

        <main className="mt-8 bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-6">
              <label
                htmlFor="tradeId"
                className="block text-gray-800 font-semibold mb-2"
              >
                Trade
              </label>
              <select
                id="tradeId"
                {...register("tradeId", {
                  required: "Trade is required",
                  disabled: isLoading,
                })}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                onChange={onTradeChange}
              >
                <option value="">Select Trade</option>
                {trades.map((trade) => (
                  <option key={trade.$id} value={trade.$id}>
                    {trade.tradeName}
                  </option>
                ))}
              </select>
            </div>
            {selectedTrade && (
              <div className="mb-6">
                <label
                  htmlFor="year"
                  className="block text-gray-800 font-semibold mb-2"
                >
                  Year
                </label>
                <select
                  id="year"
                  {...register("year", {
                    required: "Year is required",
                    disabled: isLoading,
                  })}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Year</option>
                  {new Array(selectedTrade.duration)
                    .fill(null)
                    .map((_, index) => {
                      return (
                        <option
                          key={index}
                          value={index === 0 ? "FIRST" : "SECOND"}
                        >
                          {index === 0 ? "FIRST" : "SECOND"}
                        </option>
                      );
                    })}

                  {trades
                    .filter((trade) => trade.tradeName === selectedTrade)
                    .map((trade) => (
                      <option key={trade.$id} value={trade.year}>
                        {trade.year} YEAR
                      </option>
                    ))}
                </select>
              </div>
            )}
            {selectedTrade && (
              <div className="mb-6">
                <label
                  htmlFor="year"
                  className="block text-gray-800 font-semibold mb-2"
                >
                  Subject
                </label>
                <select
                  id="subjectId"
                  {...register("subjectId", {
                    required: "Subject is required",
                    disabled: isLoading,
                  })}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.$id} value={sub.$id}>
                      {sub.subjectName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedTrade && (
              <div className="mb-6">
                <label
                  htmlFor="moduleId"
                  className="block text-gray-800 font-semibold mb-2"
                >
                  Module
                </label>

                <Controller
                  name="moduleId"
                  control={control}
                  defaultValue=""
                  rules={{ required: "Module is required" }}
                  render={({ field }) => (
                    <select
                      id="moduleId"
                      {...field}
                      disabled={isLoading}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Module</option>
                      {modules &&
                        modules.syllabus.map((m) => (
                          <option key={m.moduleId} value={String(m.moduleId)}>
                            {m.moduleId} {m.moduleName}
                          </option>
                        ))}
                    </select>
                  )}
                />
              </div>
            )}
            <div className="mb-6">
              <label
                htmlFor="question"
                className="block text-gray-800 font-semibold mb-2"
              >
                Question
              </label>
              <textarea
                spellCheck={true}
                id="question"
                {...register("question", {
                  required: "Question is required",
                  disabled: isLoading,
                })}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                rows="3"
              ></textarea>
            </div>
            <div className="mb-6">
              <label className="block text-gray-800 font-semibold mb-2">
                Options
              </label>
              {["A", "B", "C", "D"].map((value, index) => (
                <div
                  key={index}
                  className="flex items-center mb-2 p-2 rounded-md"
                >
                  <input
                    type="radio"
                    id={`option-${value}`}
                    value={value}
                    {...register("correctAnswer", {
                      required: "Correct answer is required",
                    })}
                    className="mr-2"
                  />
                  <label
                    htmlFor={`option-${value}`}
                    className="block text-gray-800 text-nowrap m-2"
                  >
                    Option {value}
                  </label>
                  <textarea
                    id={`option-text-${value}`}
                    {...register(`options.${index}`, {
                      required: "Option is required",
                      disabled: isLoading,
                    })}
                    className="ml-2 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                    rows="2"
                  ></textarea>
                </div>
              ))}
            </div>
            <button
              type="submit"
              className={`hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full ${
                isSubmitting ? "bg-gray-500" : "bg-blue-500"
              }`}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? "Updating..." : "Update Question"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default EditQuestion;
