import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowLeft } from "react-icons/fa";

import quesdbservice from "../../../appwrite/database";
import tradeservice from "../../../appwrite/tradedetails";
import subjectService from "../../../appwrite/subjectService";

const CreateQuestion = () => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [trades, setTrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const profile = useSelector((state) => state.profile);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await tradeservice.listTrades();
        setTrades(response.documents);
      } catch (error) {
        toast.error("Failed to fetch trades");
      }
    };
    const fetchSubjects = async () => {
      try {
        const response = await subjectService.listSubjects();
        setSubjects(response.documents);
      } catch (error) {
        toast.error("Failed to fetch trades");
      }
    };
    fetchSubjects();
    fetchTrades();
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (trades.length < 0) return;
    setValue("tradeId", profile.tradeId);
    const trade = trades.find((t) => t.$id === profile.tradeId);
    setSelectedTrade(trade);
  }, [profile, trades]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    console.log(data);

    try {
      data.userId = user.$id;
      data.userName = user.name;
      await quesdbservice.createQuestion(data);
      toast.success("Question created");
      reset({
        question: "",
        options: ["", "", "", ""], // Clears all 4 options
      });

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

        <main className="mt-8 bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-6">
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
              <div className="mb-6">
                <label
                  htmlFor="tradeName"
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
              <div className="mb-6">
                <label
                  htmlFor="tradeName"
                  className="block text-gray-800 font-semibold mb-2"
                >
                  Subject
                </label>

                <select
                  id="year"
                  {...register("subjectId", { required: "Year is required" })}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.$id} value={sub.$id}>
                      {sub.subjectName}
                    </option>
                  ))}
                </select>
                {errors.year && (
                  <p className="text-red-500">{errors.year.message}</p>
                )}
              </div>
            )}

            <div className="mb-6">
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

            {/* TODO : Add image upload */}
            {/* <div className="mb-6">
              <label
                htmlFor="imageUrl"
                className="block text-gray-800 font-semibold mb-2"
              >
                Image Url{" "}
                <span className="text-xs italic text-gray-500 font-thin">
                  (Optional)
                </span>
              </label>
              <input
                spellCheck={true}
                id="imageUrl"
                {...register("imageUrl", {})}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              ></input>
              {errors.imageUrl && (
                <p className="text-red-500">{errors.imageUrl.message}</p>
              )}
            </div> */}

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
              className={`hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold rounded-md py-2 px-4 w-full bg-blue-500`}
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
