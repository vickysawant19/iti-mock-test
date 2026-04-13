import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Layers,
  Tag,
  HelpCircle,
  CheckCircle2,
  X,
  Info,
} from "lucide-react";

import { useListTradesQuery } from "@/store/api/tradeApi";
import subjectService from "@/appwrite/subjectService";
import questionService from "@/services/question.service";
import moduleServices from "@/appwrite/moduleServices";
import { selectUser } from "@/store/userSlice";
import { selectQuestions } from "@/store/questionSlice";

// ─── Read-only info badge ────────────────────────────────────────────────────
const InfoBadge = ({ icon: Icon, label, value, color = "blue" }) => {
  const colors = {
    blue:   "bg-blue-50   text-blue-700   border-blue-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    amber:  "bg-amber-50  text-amber-700  border-amber-100",
    green:  "bg-green-50  text-green-700  border-green-100",
  };
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border ${colors[color]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
      <div className="min-w-0">
        <p className="text-xs font-medium opacity-60 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold leading-snug break-words">{value || "—"}</p>
      </div>
    </div>
  );
};

// ─── Option row ──────────────────────────────────────────────────────────────
const OptionRow = ({ label, register, watchedAnswer, index }) => {
  const isCorrect = watchedAnswer === label;
  return (
    <div className={`rounded-xl border-2 transition-all duration-150 ${
      isCorrect
        ? "border-green-400 bg-green-50"
        : "border-gray-200 bg-white hover:border-gray-300"
    }`}>
      <label
        htmlFor={`option-${label}`}
        className="flex items-start gap-3 p-3 cursor-pointer"
      >
        <div className="flex items-center gap-2 shrink-0 pt-2">
          <input
            type="radio"
            id={`option-${label}`}
            value={label}
            {...register("correctAnswer")}
            className="sr-only"
          />
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isCorrect
              ? "border-green-500 bg-green-500"
              : "border-gray-300"
          }`}>
            {isCorrect && <CheckCircle2 className="w-4 h-4 text-white fill-white" />}
          </div>
          <span className={`text-sm font-bold ${isCorrect ? "text-green-700" : "text-gray-500"}`}>
            {label}
          </span>
        </div>
        <textarea
          {...register(`options.${index}`)}
          rows={2}
          onClick={(e) => e.stopPropagation()}
          className={`flex-1 resize-none rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors ${
            isCorrect
              ? "border-green-300 bg-green-50 text-green-900 focus:ring-green-300 placeholder:text-green-400"
              : "border-gray-200 bg-gray-50 text-gray-800 focus:ring-blue-300 placeholder:text-gray-400"
          }`}
          placeholder={`Option ${label} text (English | मराठी)`}
        />
      </label>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const EditQuestion = () => {
  const { quesId } = useParams();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const questionsStore = useSelector(selectQuestions);
  const isTeacher = user.labels.includes("Teacher");

  const { data: tradesResponse } = useListTradesQuery();
  const trades = tradesResponse?.documents || [];

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moduleInfo, setModuleInfo] = useState(null);  // read-only context

  const { register, handleSubmit, setValue, watch, reset, control } = useForm();
  const watchedAnswer = watch("correctAnswer");
  const watchedTags   = watch("tags") || [];

  // ── Load question + resolve module info ──────────────────────────────────
  useEffect(() => {
    if (!isTeacher) {
      toast.error("You are not authorized");
      return;
    }
    if (!trades.length) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [question, subjectsRes] = await Promise.all([
          questionService.getQuestion(quesId),
          subjectService.listSubjects(),
        ]);

        const module = await moduleServices.getModule(question.moduleId);
        const trade   = trades.find((t) => t.$id === module?.tradeId);
        const subject = subjectsRes.documents?.find((s) => s.$id === module?.subjectId);

        setModuleInfo({
          tradeName:   trade?.tradeName   || trade?.name   || module?.tradeId,
          subjectName: subject?.subjectName || subject?.name || module?.subjectId,
          year:        module?.year,
          moduleId:    module?.moduleId,
          moduleName:  module?.moduleName,
        });

        reset({
          question:      question.question,
          options:       question.options || ["", "", "", ""],
          correctAnswer: question.correctAnswer,
          tags:          question.tags ? question.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        });
      } catch (err) {
        console.error(err);
        toast.error("Error loading question");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [quesId, trades]);

  // ── Submit (only editable fields) ─────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!data.correctAnswer) {
      toast.error("Please select a correct answer");
      return;
    }
    setIsSubmitting(true);
    try {
      await questionService.updateQuestion(quesId, {
        question:      data.question,
        options:       data.options,
        correctAnswer: data.correctAnswer,
        moduleId:      quesId ? undefined : undefined, // unchanged
        tags:          (data.tags || []).join(", "),
      });
      toast.success("Question updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update question");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Navigation index ───────────────────────────────────────────────────────
  const currentIndex = questionsStore?.findIndex((q) => q.$id === quesId) ?? -1;
  const nextQuestion = questionsStore?.[currentIndex + 1];
  const prevQuestion = questionsStore?.[currentIndex - 1];

  // ── Tag helpers ────────────────────────────────────────────────────────────
  const addTag = (raw) => {
    const tag = raw.trim();
    if (!tag) return false;
    const current = watch("tags") || [];
    if (!current.includes(tag)) {
      setValue("tags", [...current, tag]);
    }
    return true;
  };

  const removeTag = (index) => {
    const current = watch("tags") || [];
    setValue("tags", current.filter((_, i) => i !== index));
  };

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading question…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky Top Bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Edit Question</h1>
              {moduleInfo && (
                <p className="text-xs text-blue-600 font-medium truncate max-w-[260px]">
                  {moduleInfo.moduleId} — {moduleInfo.moduleName}
                </p>
              )}
            </div>
          </div>

          {/* Prev / Next navigation */}
          <div className="flex items-center gap-1">
            {prevQuestion && (
              <Link
                to={`/edit/${prevQuestion.$id}`}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Previous question"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            {currentIndex >= 0 && (
              <span className="text-xs text-gray-400 px-1">
                {currentIndex + 1}/{questionsStore.length}
              </span>
            )}
            {nextQuestion && (
              <Link
                to={`/edit/${nextQuestion.$id}`}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Next question"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Read-only Module Context ── */}
        {moduleInfo && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Module Context (read-only)
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoBadge icon={GraduationCap} label="Trade"   value={moduleInfo.tradeName}   color="blue"   />
              <InfoBadge icon={BookOpen}      label="Subject" value={moduleInfo.subjectName}  color="violet" />
              <InfoBadge icon={CalendarDays}  label="Year"    value={moduleInfo.year}          color="amber"  />
              <InfoBadge icon={Layers}        label="Module"  value={`${moduleInfo.moduleId} — ${moduleInfo.moduleName}`} color="green" />
            </div>
          </div>
        )}

        {/* ── Edit Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Question textarea */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <label className="text-sm font-semibold text-gray-700">
                Question <span className="text-red-400">*</span>
              </label>
            </div>
            <div className="p-4">
              <textarea
                {...register("question", { required: true })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y bg-gray-50 placeholder:text-gray-400"
                placeholder="Enter the question text in English | मराठी format"
              />
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">
                Options <span className="text-red-400">*</span>
              </span>
              {watchedAnswer ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  ✓ Correct: Option {watchedAnswer}
                </span>
              ) : (
                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Click a radio to mark correct answer
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              {["A", "B", "C", "D"].map((label, index) => (
                <OptionRow
                  key={label}
                  label={label}
                  index={index}
                  register={register}
                  watchedAnswer={watchedAnswer}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
              <Tag className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-semibold text-gray-700">Tags</span>
              <span className="text-xs text-gray-400 font-normal ml-1">(Press Enter or comma to add)</span>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2 min-h-[44px] p-3 border border-gray-200 rounded-xl bg-gray-50 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent transition-all">
                {watchedTags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                  placeholder={watchedTags.length === 0 ? "Add tags e.g. nimi, electrician…" : ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      if (addTag(e.target.value)) e.target.value = "";
                    }
                  }}
                  onBlur={(e) => {
                    if (addTag(e.target.value)) e.target.value = "";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving changes…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditQuestion;
