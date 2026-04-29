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
    <div className="group bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Module {question.moduleId}
          </span>
        </div>
        <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 text-[10px] uppercase font-bold tracking-tight py-0.5 px-2">
          {question.year === "FIRST" ? "Year 1" : "Year 2"}
        </Badge>
      </div>

      {/* Question content */}
      <div className="px-6 pb-6 flex-1 flex flex-col">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-snug mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {question.question}
        </h2>

        {/* Images */}
        {images.length > 0 && (
          <div className="mb-6 space-y-3">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <img
                  src={img.url}
                  alt="Question visual"
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        )}

        {/* Options list */}
        <div className="space-y-2.5">
          {options.map((option, index) => {
            const isCorrect = getOptionIndex(question.correctAnswer) === index;
            return (
              <div
                key={index}
                className={`relative flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-200 border ${
                  isCorrect
                    ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900 shadow-sm"
                    : "bg-gray-50/50 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isCorrect
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-500 shadow-sm"
                  }`}
                >
                  {optionLabels[index]}
                </div>
                <span
                  className={`text-sm font-medium leading-tight ${
                    isCorrect
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {option}
                </span>
                {isCorrect && (
                   <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
           <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-xl font-bold text-xs"
          >
            <Link to={`/edit/${question.$id}`}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting.has(question.$id)}
            onClick={() => onDelete(question.$id)}
            className="h-9 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl font-bold text-xs disabled:opacity-50"
          >
            {isDeleting.has(question.$id) ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </>
            )}
          </Button>
        </div>
        
        <Link 
          to={`/question-details/${question.$id}`}
          className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>
    </div>
  );
};

export default QuestionCard;
