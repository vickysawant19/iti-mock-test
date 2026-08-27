import React from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Loader2, BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const QuestionCard = ({ question, onDelete, isDeleting, getOptionIndex }) => {
  const optionLabels = ["A", "B", "C", "D"];
  const images = (question.images ?? []).map((img) => JSON.parse(img));
  const options = question.options ?? [];

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Module {question.moduleId}
          </span>
        </div>
        <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-bold tracking-tight py-0.5 px-2 rounded-md">
          {question.year === "FIRST" ? "Year 1" : "Year 2"}
        </span>
      </div>

      {/* Question content */}
      <div className="p-4 flex-1 flex flex-col">
        {question.languageType && question.languageType !== "unknown" && (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/60">
              {question.languageType}
            </span>
            {question.schemaVersion === 2 && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/60">
                v2 Migrated
              </span>
            )}
          </div>
        )}

        <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {question.questionEnglish || question.question}
        </h2>

        {question.questionMarathi && question.questionMarathi !== question.questionEnglish && (
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-3 italic">
            {question.questionMarathi}
          </p>
        )}

        {/* Question Image or CDN URL */}
        {(question.questionImageUrl || images.length > 0) && (
          <div className="mb-4 space-y-2">
            {question.questionImageUrl ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                <img
                  src={question.questionImageUrl}
                  alt="Question visual"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              images.map((img) => (
                <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                  <img
                    src={img.url}
                    alt="Question visual"
                    className="w-full h-full object-contain"
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Options list */}
        <div className="space-y-2 mt-auto pt-2">
          {options.map((option, index) => {
            const isCorrect = getOptionIndex(question.correctAnswer) === index;
            const engOpt = question.optionsEnglish?.[index] || option;
            const marOpt = question.optionsMarathi?.[index];

            return (
              <div
                key={index}
                className={`relative flex items-center gap-2.5 p-2 rounded-xl transition-all border ${
                  isCorrect
                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/60"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60"
                }`}
              >
                <div
                  className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[11px] font-black transition-all ${
                    isCorrect
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {optionLabels[index]}
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <span
                    className={`text-xs font-semibold leading-tight truncate ${
                      isCorrect
                        ? "text-emerald-950 dark:text-emerald-200"
                        : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {engOpt}
                  </span>
                  {marOpt && marOpt !== engOpt && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 italic truncate">
                      {marOpt}
                    </span>
                  )}
                </div>
                {isCorrect && (
                   <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
           <Link
            to={`/edit/${question.$id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>
          <button
            disabled={isDeleting.has(question.$id)}
            onClick={() => onDelete(question.$id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting.has(question.$id) ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
        
        <Link 
          to={`/question-details/${question.$id}`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="View Details"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default QuestionCard;
