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
import questionFunctionService from "@/services/questionFunction.service";
import migrationService from "@/services/migration/migrationService";
import moduleServices from "@/appwrite/moduleServices";
import { selectUser } from "@/store/userSlice";
import { selectQuestions } from "@/store/questionSlice";

// ─── Read-only info badge ────────────────────────────────────────────────────
const InfoBadge = ({ icon: Icon, label, value, color = "blue" }) => {
  const colors = {
    blue:   "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    violet: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    amber:  "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    green:  "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  };
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border ${colors[color]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide leading-none mb-1">{label}</p>
        <p className="text-xs font-black leading-snug break-words">{value || "—"}</p>
      </div>
    </div>
  );
};

// ─── Option row ──────────────────────────────────────────────────────────────
const OptionRow = ({ label, register, watchedAnswer, index }) => {
  const isCorrect = watchedAnswer === label;
  return (
    <div className={`rounded-xl border transition-all duration-150 ${
      isCorrect
        ? "border-emerald-500/80 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600"
    }`}>
      <label
        htmlFor={`option-${label}`}
        className="flex items-start gap-2.5 p-3 cursor-pointer"
      >
        <div className="flex items-center gap-2 shrink-0 pt-2">
          <input
            type="radio"
            id={`option-${label}`}
            value={label}
            {...register("correctAnswer")}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isCorrect
              ? "border-emerald-500 bg-emerald-500"
              : "border-slate-300 dark:border-slate-600"
          }`}>
            {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white" />}
          </div>
          <span className={`text-xs font-black ${isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-400"}`}>
            {label}
          </span>
        </div>
        <textarea
          {...register(`options.${index}`)}
          rows={2}
          onClick={(e) => e.stopPropagation()}
          className={`flex-1 resize-none rounded-lg px-3 py-1.5 text-xs border focus:outline-none focus:ring-2 transition-colors font-semibold ${
            isCorrect
              ? "border-emerald-300 dark:border-emerald-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-emerald-400 placeholder:text-slate-400"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-indigo-400 placeholder:text-slate-400"
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

  const [isLoading,    setIsLoading]    = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moduleInfo,   setModuleInfo]   = useState(null);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      question:      "",
      options:       ["", "", "", ""],
      correctAnswer: "",
      tags:          [],
    },
  });

  const watchedAnswer = watch("correctAnswer");
  const watchedTags   = watch("tags") || [];

  const { data: tradesResponse } = useListTradesQuery();
  const trades = tradesResponse?.documents || [];

  // ── Load Question Data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!quesId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const doc = await questionService.getQuestion(quesId);
        if (!doc) {
          toast.error("Question not found");
          navigate("/manage-questions");
          return;
        }

        let tagsArr = [];
        if (Array.isArray(doc.tags)) {
          tagsArr = doc.tags;
        } else if (typeof doc.tags === "string" && doc.tags.trim()) {
          tagsArr = doc.tags.split(",").map((t) => t.trim()).filter(Boolean);
        }

        reset({
          question:      doc.question || "",
          options:       doc.options?.length === 4 ? doc.options : ["", "", "", ""],
          correctAnswer: doc.correctAnswer || "",
          tags:          tagsArr,
        });

        const trade = trades.find((t) => t.$id === doc.tradeId);
        setModuleInfo({
          tradeName:   trade?.tradeName || doc.tradeId || "—",
          subjectName: doc.subjectId || "—",
          year:        doc.year || "—",
          moduleId:    doc.moduleId || "—",
          moduleName:  doc.moduleName || doc.moduleId || "—",
        });

        if (doc.subjectId) {
          try {
            const sub = await subjectService.getSubject(doc.subjectId);
            if (sub?.subjectName) {
              setModuleInfo((prev) => ({ ...prev, subjectName: sub.subjectName }));
            }
          } catch {
          }
        }
      } catch (err) {
        console.error("Failed to load question:", err);
        toast.error("Failed to load question details");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [quesId, trades, reset, navigate]);

  // ── Save / Update ──────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!data.correctAnswer) {
      toast.error("Please select a correct answer");
      return;
    }
    setIsSubmitting(true);
    try {
      const payloadData = {
        question:      data.question,
        options:       data.options,
        correctAnswer: data.correctAnswer,
        tags:          (data.tags || []).join(", "),
      };

      const v2Payload = migrationService.prepareMigratedDocument(payloadData);
      const updateData = { ...payloadData, ...v2Payload };

      await questionFunctionService.updateQuestion(quesId, updateData);
      toast.success("Question updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentIndex = questionsStore?.findIndex((q) => q.$id === quesId) ?? -1;
  const nextQuestion = questionsStore?.[currentIndex + 1];
  const prevQuestion = questionsStore?.[currentIndex - 1];

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading question details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-0 m-0 flex flex-col">
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-none p-3 sm:p-4 text-white shadow-xs border-b border-blue-400/30 dark:border-indigo-500/20 m-0">
        <div className="absolute top-[-70px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[160px] h-[160px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-5xl mx-auto px-1 sm:px-2">
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
                  Edit Question
                </h1>
                <span className="text-[10px] sm:text-[11px] font-black bg-white/20 dark:bg-indigo-500/30 border border-white/25 dark:border-indigo-400/30 px-2 py-0.5 rounded-full">
                  ID: {quesId?.slice(-6)}
                </span>
              </div>
              {moduleInfo && (
                <p className="text-[11px] sm:text-xs text-blue-100/90 dark:text-slate-400 truncate max-w-md">
                  {moduleInfo.moduleId} — {moduleInfo.moduleName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
            {prevQuestion && (
              <Link
                to={`/edit/${prevQuestion.$id}`}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/20"
                title="Previous question"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            {currentIndex >= 0 && (
              <span className="text-xs font-bold text-white/90 bg-white/10 px-2 py-1 rounded-md border border-white/20">
                {currentIndex + 1} / {questionsStore.length}
              </span>
            )}
            {nextQuestion && (
              <Link
                to={`/edit/${nextQuestion.$id}`}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/20"
                title="Next question"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 py-6 space-y-5 flex-1">
        {moduleInfo && (
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
              <Info className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Module Context (Read-Only)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoBadge icon={GraduationCap} label="Trade"   value={moduleInfo.tradeName}   color="blue"   />
              <InfoBadge icon={BookOpen}      label="Subject" value={moduleInfo.subjectName}  color="violet" />
              <InfoBadge icon={CalendarDays}  label="Year"    value={moduleInfo.year}          color="amber"  />
              <InfoBadge icon={Layers}        label="Module"  value={`${moduleInfo.moduleId} — ${moduleInfo.moduleName}`} color="green" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Question Statement <span className="text-rose-500">*</span>
              </label>
            </div>
            <div>
              <textarea
                {...register("question", { required: true })}
                rows={4}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y bg-slate-50 dark:bg-slate-800/80 placeholder-slate-400 font-semibold"
                placeholder="Enter the question text in English | मराठी format"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Multiple Choice Options <span className="text-rose-500">*</span>
              </span>
              {watchedAnswer ? (
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  ✓ Correct: Option {watchedAnswer}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Select correct answer radio
                </span>
              )}
            </div>
            <div className="space-y-2.5">
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

          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Tag className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tags & Keywords</span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">(press enter or comma to add)</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 min-h-[42px] p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all">
                {watchedTags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="ml-0.5 text-indigo-500 dark:text-indigo-400 hover:text-rose-500 cursor-pointer font-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 min-w-[120px] bg-transparent text-xs font-semibold text-slate-900 dark:text-white outline-none placeholder-slate-400 px-1"
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
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving changes…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Question Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditQuestion;
