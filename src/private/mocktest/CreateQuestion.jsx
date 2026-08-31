import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  ArrowLeft, 
  FileQuestion, 
  PlusCircle, 
  Layers, 
  BookOpen, 
  Calendar, 
  Check, 
  Tag, 
  HelpCircle, 
  CheckCircle2, 
  List,
  Sparkles,
  Loader2
} from "lucide-react";

import questionService from "@/services/academic/question.service";
import questionFunctionService from "@/services/academic/questionFunction.service";
import migrationService from "@/services/migration/migrationService";
import { useListTradesQuery } from "@/store/api/tradeApi";
import subjectService from "@/services/academic/subjectService";
import moduleServices from "@/services/academic/moduleServices";

import { useListCollegesQuery } from "@/store/api/collegeApi";
import { Query } from "appwrite";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";

const CreateQuestion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const [similarQuestions, setSimilarQuestions] = useState([]);

  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  // Fetch colleges and trades via RTK Query
  const { data: collegesResponse } = useListCollegesQuery();
  const collegeListData = collegesResponse?.documents || [];

  const isAdmin = profile?.role?.includes("admin") || false;

  const { data: tradesResponse } = useListTradesQuery(
    undefined,
    { skip: !profile }
  );
  const trades = tradesResponse?.documents || [];

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

  useEffect(() => {
    console.log("here");
    return;
    const debounceTimer = setTimeout(async () => {
      if (watch("question").trim()) {
        setIsLoading(true);
        try {
          const response = await questionService.getSimilarQuestions({
            question: watch("question"),
            tradeId,
          });

          console.log("Similar questions:", response);
          setSimilarQuestions(response);
        } catch (error) {
          console.error("Error fetching similar questions:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSimilarQuestions([]);
      }
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [watch("question")]);

  const fetchData = async () => {
    try {
      const subjects = await subjectService.listSubjects();
      setSubjects(subjects.rows || []); // listSubjects uses listRows → .rows
    } catch (error) {
      console.error("Error listing subjects:", error);
    }
  };

  useEffect(() => {
    if (subjects.length === 0) {
      fetchData();
    }
  }, [subjects]);

  const fetchModules = async () => {
    if (!tradeId || !subjectId || !year) return;
    try {
      const syllabusData = await moduleServices.getNewModulesData(
        tradeId,
        subjectId,
        year
      );
      const sortedSyllabusData = syllabusData.sort(
        (a, b) => a.moduleId.match(/\d+/)[0] - b.moduleId.match(/\d+/)[0]
      );

      setModules(sortedSyllabusData);
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast.error("Failed to fetch Modules");
    }
  };

  useEffect(() => {
    if (!profile) return;
    if (trades.length < 1) return;
    // Removed auto-selection of tradeId based on profile
  }, [profile, trades, setValue]);

  useEffect(() => {
    if (tradeId && subjectId && year) {
      fetchModules();
    }
  }, [tradeId, subjectId, year]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      data.userId = user.$id;
      data.userName = user.name;
      data.tags = (data.tags || []).join(",");
      
      // Auto-compute schema v2 multilingual & hash attributes
      const v2Payload = migrationService.prepareMigratedDocument(data);
      const fullData = { ...data, ...v2Payload };

      await questionFunctionService.createQuestion(fullData);
      reset({
        question: "",
        options: ["", "", "", ""], // Clears all 4 options
      });
      toast.success("Question created with Schema v2 support");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-0 m-0 flex flex-col">
      {/* ── Attendance Register Styled Edge-to-Edge Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-none p-3 sm:p-4 text-white shadow-xs border-b border-blue-400/30 dark:border-indigo-500/20 m-0">
        {/* Ambient background glow orbs */}
        <div className="absolute top-[-70px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[160px] h-[160px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-5xl mx-auto px-1 sm:px-2">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/15 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer shrink-0"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base tracking-tight text-white">
                  Create New Question
                </h1>
                <span className="text-[10px] sm:text-[11px] font-black bg-white/20 dark:bg-indigo-500/30 border border-white/25 dark:border-indigo-400/30 px-2 py-0.5 rounded-full">
                  Verified Bank
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100/90 dark:text-slate-400">
                Author and publish new multiple choice questions with trade & syllabus tagging.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Link
              to="/manage-questions"
              className="flex-1 sm:flex-none text-center px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-white font-black text-xs transition-all border border-white/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Question Bank</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Form Container */}
      <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6 flex-1">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Categorization & Scope Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100 dark:border-slate-800/80 mb-5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                  1. Syllabus & Scope Parameters
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Tag the question to trade, academic year, subject, and module
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* Trade */}
              <div className="space-y-1.5 lg:col-span-2">
                <label
                  htmlFor="tradeId"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block"
                >
                  Trade
                </label>
                <select
                  id="tradeId"
                  {...register("tradeId", { required: "Trade is required" })}
                  onChange={handleTradeChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white font-semibold transition-all"
                >
                  <option value="">Select Trade</option>
                  {trades.map((trade) => (
                    <option key={trade.$id} value={trade.$id}>
                      {trade.tradeName}
                    </option>
                  ))}
                </select>
                {errors.tradeId && (
                  <p className="text-rose-500 text-xs font-bold mt-1">
                    {errors.tradeId.message}
                  </p>
                )}
              </div>

              {/* Trade Year */}
              {selectedTrade && (
                <div className="space-y-1.5 lg:col-span-1">
                  <label
                    htmlFor="year"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block"
                  >
                    Trade Year
                  </label>
                  <select
                    id="year"
                    {...register("year", { required: "Year is required" })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white font-semibold transition-all"
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
                    <p className="text-rose-500 text-xs font-bold mt-1">
                      {errors.year.message}
                    </p>
                  )}
                </div>
              )}

              {/* Subject */}
              {selectedTrade && (
                <div className="space-y-1.5 lg:col-span-1">
                  <label
                    htmlFor="subjectId"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block"
                  >
                    Subject
                  </label>
                  <select
                    id="subjectId"
                    {...register("subjectId", {
                      required: "Subject is required",
                    })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white font-semibold transition-all"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.$id} value={sub.$id}>
                        {sub.subjectName}
                      </option>
                    ))}
                  </select>
                  {errors.subjectId && (
                    <p className="text-rose-500 text-xs font-bold mt-1">
                      {errors.subjectId.message}
                    </p>
                  )}
                </div>
              )}

              {/* Module */}
              {modules && (
                <div className="space-y-1.5 lg:col-span-2">
                  <label
                    htmlFor="moduleId"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block"
                  >
                    Module <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <select
                    id="moduleId"
                    {...register("moduleId")}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white font-semibold transition-all"
                  >
                    <option value="">Select Module</option>
                    {modules.map((m) => (
                      <option key={m.$id} value={m.moduleId}>
                        {m.moduleId} — {m.moduleName}
                      </option>
                    ))}
                  </select>
                  {errors.moduleId && (
                    <p className="text-rose-500 text-xs font-bold mt-1">
                      {errors.moduleId.message}
                    </p>
                  )}
                </div>
              )}

              {/* Difficulty */}
              <div className="space-y-1.5 lg:col-span-1">
                <label
                  htmlFor="difficulty"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block"
                >
                  Difficulty Level
                </label>
                <select
                  id="difficulty"
                  {...register("difficulty")}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white font-semibold transition-all"
                >
                  <option value="medium">Medium (Standard)</option>
                  <option value="easy">Easy</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Tags */}
              <div className="space-y-1.5 lg:col-span-2">
                <label
                  htmlFor="tags"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block"
                >
                  Keywords & Tags <span className="text-slate-400 font-normal lowercase">(press enter or space)</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 min-h-[42px]">
                  {watch("tags")?.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"
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
                        className="text-indigo-600 dark:text-indigo-400 hover:text-rose-500 cursor-pointer font-black"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={watch("tags")?.length ? "" : "Add topic tags..."}
                    className="outline-none flex-1 bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 min-w-[120px] px-1"
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
            </div>
          </div>

          {/* 2. Question Statement Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                    2. Question Statement
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Type your question or paste whole text with options to auto-fill
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Auto-Paste</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <textarea
                spellCheck={true}
                id="question"
                {...register("question", { required: "Question is required" })}
                className="w-full px-3.5 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white placeholder-slate-400 font-semibold transition-all"
                rows="4"
                placeholder="Enter question statement here..."
                onPaste={handleQuestionPaste}
              ></textarea>
              {errors.question && (
                <p className="text-rose-500 text-xs font-bold">
                  {errors.question.message}
                </p>
              )}
            </div>
          </div>

          {/* 3. Options & Correct Answer Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                  3. Multiple Choice Options
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Select the correct radio button and provide answer texts for A, B, C, and D
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {["A", "B", "C", "D"].map((value, index) => {
                const isCorrect = watch("correctAnswer") === value;
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                      isCorrect
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/80 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80"
                    }`}
                  >
                    <label
                      htmlFor={`option-${value}`}
                      className="flex items-center gap-2 cursor-pointer pt-2 shrink-0 select-none"
                    >
                      <input
                        type="radio"
                        id={`option-${value}`}
                        value={value}
                        {...register("correctAnswer", {
                          required: "Please select the correct answer",
                        })}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                        isCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                        {value}
                      </span>
                    </label>

                    <textarea
                      id={`option-text-${value}`}
                      placeholder={`Enter text for Option ${value}...`}
                      {...register(`options.${index}`, {
                        required: `Option ${value} is required`,
                      })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900 dark:text-white font-semibold resize-none transition-all"
                      rows="2"
                    ></textarea>
                  </div>
                );
              })}
            </div>

            {errors.correctAnswer && (
              <p className="text-rose-500 text-xs font-bold text-center pt-1">
                {errors.correctAnswer.message}
              </p>
            )}

            {/* Submit Action Button */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Question...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish Question to Bank</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestion;
