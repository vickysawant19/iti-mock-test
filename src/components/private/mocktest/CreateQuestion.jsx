import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowLeft } from "react-icons/fa";

import quesdbservice from "../../../appwrite/database";
import tradeservice from "../../../appwrite/tradedetails";
import subjectService from "../../../appwrite/subjectService";
import moduleServices from "../../../appwrite/moduleServices";
import { Query } from "appwrite";
import ImageUploader from "./components/ImageUpload";

const CreateQuestion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trades, setTrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [images, setImages] = useState([]);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const profile = useSelector((state) => state.profile);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm();

  const tradeId = useWatch({ control, name: "tradeId" });
  const subjectId = useWatch({ control, name: "subjectId" });
  const year = useWatch({ control, name: "year" });

  const fetchData = async () => {
    try {
      const [trades, subjects] = await Promise.all([
        tradeservice.listTrades(),
        subjectService.listSubjects(),
      ]);
      setTrades(trades.documents);
      setSubjects(subjects.documents);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (trades.length === 0 && subjects.length === 0) {
      fetchData();
    }
  }, [trades, subjects]);

  const fetchModules = async () => {
    if (!tradeId || !subjectId || !year) return;
    try {
      const response = await moduleServices.listModules([
        Query.equal("tradeId", tradeId),
        Query.equal("subjectId", subjectId),
        Query.equal("year", year),
      ]);

      setModules(response);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch Modules");
    }
  };

  useEffect(() => {
    if (!profile) return;
    if (trades.length < 0) return;
    const trade = trades.find((t) => t.$id === profile.tradeId);
    if (trade) {
      setValue("tradeId", trade.$id);
      setSelectedTrade(trade);
    }
  }, [profile, trades]);

  useEffect(() => {
    if (tradeId && subjectId && year) {
      console.log("Fetching modules based on updated form values...");
      fetchModules();
    }
  }, [tradeId, subjectId, year]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      data.userId = user.$id;
      data.userName = user.name;
      data.images = images.map((item) => JSON.stringify(item)) || [];
      await quesdbservice.createQuestion(data);
      reset({
        question: "",
        options: ["", "", "", ""], // Clears all 4 options
        images: [],
      });
      setImages([]);
      toast.success("Question created");
      // navigate("/manage-questions");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
    setIsLoading(false);
  };

  const handleTradeChange = (event) => {
    const selectedTradeId = event.target.value;
    const trade = trades.find((t) => t.$id === selectedTradeId);
    setSelectedTrade(trade);
    setValue("tradeId", selectedTradeId);
  };

  const handleQuestionPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const existingQuestion = watch("question") || "";
    // Split and clean text into non-empty trimmed lines
    const cleanedLines = pastedText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== "");

    let questionText = existingQuestion;
    const newOptions = Array(4).fill("");

    // Helper to check option prefixes
    const isOptionLine = (line, prefix) =>
      new RegExp(`^${prefix}[.:)\\-\\s]`, "i").test(line);

    // Try to find A-B-C-D sequence
    let optionStartIndex = -1;
    for (let i = 0; i <= cleanedLines.length - 4; i++) {
      if (
        ["A", "B", "C", "D"].every((prefix, idx) =>
          isOptionLine(cleanedLines[i + idx], prefix)
        )
      ) {
        optionStartIndex = i;
        break;
      }
    }

    if (optionStartIndex !== -1) {
      // Case 1: Found complete A-B-C-D sequence
      const questionLines = cleanedLines.slice(0, optionStartIndex);
      questionText = questionLines.join(" ").trim();

      cleanedLines
        .slice(optionStartIndex, optionStartIndex + 4)
        .forEach((line, i) => {
          newOptions[i] = line.replace(/^[A-Da-d][:.)\-\s]+/, "").trim();
        });
    } else if (cleanedLines.length >= 4) {
      // Case 2: Fallback to question/options detection
      const questionLines = [];
      let optionsFound = 0;

      // Find first potential option line
      const firstOptionIndex = cleanedLines.findIndex((line) =>
        /^[A-Da-d][:.)\-\s]+/.test(line)
      );

      if (
        firstOptionIndex !== -1 &&
        firstOptionIndex <= cleanedLines.length - 4
      ) {
        // Use prefix-based detection
        questionText = cleanedLines.slice(0, firstOptionIndex).join(" ").trim();
        cleanedLines
          .slice(firstOptionIndex, firstOptionIndex + 4)
          .forEach((line, i) => {
            newOptions[i] = line.replace(/^[A-Da-d][:.)\-\s]+/, "").trim();
          });
      } else {
        // Assume last 4 lines are options
        questionText =
          cleanedLines.slice(0, -4).join(" ").trim() || existingQuestion;
        cleanedLines.slice(-4).forEach((line, i) => {
          newOptions[i] = line.replace(/^[A-Da-d][:.)\-\s]+/, "").trim();
        });
      }
    } else {
      // Case 3: Append to existing question
      questionText = [existingQuestion, pastedText]
        .filter(Boolean)
        .join(" ")
        .trim();
    }

    // Update form values
    setValue("question", questionText);
    newOptions.forEach((option, index) => {
      setValue(`options.${index}`, option);
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="py-6 flex gap-6 ml-3 ">
          <button onClick={() => navigate(-1)} className="text-2xl">
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Create New Question
          </h1>
        </header>

        <main className="mt-8 bg-white shadow-md rounded-lg p-6  ">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="lg:grid lg:grid-cols-3 gap-3"
          >
            <div className="mb-6  lg:col-span-2 ">
              <label
                htmlFor="tradeName"
                className="block text-gray-800 font-semibold mb-2"
              >
                Trade
              </label>
              <select
                id="tradeId"
                {...register("tradeId", { required: "Trade is required" })}
                onChange={handleTradeChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Trade</option>
                {trades.map((trade) => (
                  <option key={trade.$id} value={trade.$id}>
                    {trade.tradeName}
                  </option>
                ))}
              </select>
              {errors.tradeId && (
                <p className="text-red-500">{errors.tradeId.message}</p>
              )}
            </div>
            {selectedTrade && (
              <div className="mb-6  lg:col-span-1 ">
                <label
                  htmlFor="year"
                  className="block text-gray-800 font-semibold mb-2"
                >
                  Trade Year
                </label>

                <select
                  id="year"
                  {...register("year", { required: "Year is required" })}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Year</option>
                  {new Array(selectedTrade.duration)
                    .fill(null)
                    .map((_, index) => (
                      <option
                        key={`${selectedTrade.$id}-${index}`}
                        value={index === 0 ? "FIRST" : "SECOND"}
                      >
                        {index === 0 ? "FIRST" : "SECOND"}
                      </option>
                    ))}
                </select>
                {errors.year && (
                  <p className="text-red-500">{errors.year.message}</p>
                )}
              </div>
            )}

            {selectedTrade && (
              <div className="mb-6   lg:col-span-1">
                <label
                  htmlFor="subjectId"
                  className="block text-gray-800 font-semibold mb-2"
                >
                  Subject
                </label>

                <select
                  id="subjectId"
                  {...register("subjectId", {
                    required: "Subject is required",
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
                {errors.subjectId && (
                  <p className="text-red-500">{errors.subjectId.message}</p>
                )}
              </div>
            )}
            {modules && (
              <div className="mb-6  lg:col-span-2">
                <label
                  htmlFor="moduleId"
                  className="block text-gray-800 font-semibold mb-2"
                >
                  Module
                </label>

                <select
                  id="moduleId"
                  {...register("moduleId", {
                    required: "Module is required",
                  })}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Module</option>
                  {modules.syllabus.map((m) => (
                    <option key={m.moduleId} value={m.moduleId}>
                      {m.moduleId} {m.moduleName}
                    </option>
                  ))}
                </select>
                {errors.moduleId && (
                  <p className="text-red-500">{errors.moduleId.message}</p>
                )}
              </div>
            )}

            <div className="mb-6  lg:col-span-full">
              <label
                htmlFor="question"
                className="block text-gray-800 font-semibold mb-2"
              >
                Question{" "}
                <span className="text-xs italic text-gray-500 font-thin">
                  (Copy-paste whole question+options supported)
                </span>
              </label>
              <textarea
                spellCheck={true}
                id="question"
                {...register("question", { required: "Question is required" })}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                rows="3"
                onPaste={handleQuestionPaste}
              ></textarea>
              {errors.question && (
                <p className="text-red-500">{errors.question.message}</p>
              )}
            </div>
            <div className="col-span-full">
              <ImageUploader
                folderName={`questions/${
                  selectedTrade?.tradeName.split(" ").join("").slice(10) ||
                  "img"
                }`}
                images={images}
                setImages={setImages}
              />
            </div>

            <div className="mb-6 col-span-full lg:grid lg:grid-cols-2">
              <label
                className="block text-gray-800 font-semibold mb-2 col-span-full
              "
              >
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
                    })}
                    className="ml-2 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                    rows="2"
                  ></textarea>
                </div>
              ))}
              {errors.correctAnswer && (
                <p className="text-red-500 w-full text-center">
                  {errors.correctAnswer.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold rounded-md py-2 px-4 w-full bg-blue-500 col-start-3`}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Question"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateQuestion;
