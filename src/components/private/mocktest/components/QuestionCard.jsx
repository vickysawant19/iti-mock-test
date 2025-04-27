import React from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const QuestionCard = ({ question, onDelete, isDeleting, getOptionIndex }) => {
  const optionLabels = ["A", "B", "C", "D"];
  const images = question.images.map((img) => JSON.parse(img));

  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
      {/* Header with module ID */}
      <CardHeader className="border-b py-2 px-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex flex-row items-center gap-2">
        <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Module {question.moduleId}
        </span>
      </CardHeader>

      {/* Question content */}
      <CardContent className="p-4">
        <h2 className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
          {question.question}
        </h2>

        {/* Images */}
        {images.length > 0 && (
          <div className="mt-4 grid gap-2">
            {images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt="Question visual"
                className="rounded-md max-w-full h-auto"
              />
            ))}
          </div>
        )}

        {/* Options list */}
        <div className="mt-4 space-y-2">
          {question.options.map((option, index) => {
            const isCorrect = getOptionIndex(question.correctAnswer) === index;
            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-md transition-colors ${
                  isCorrect
                    ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900"
                    : "bg-gray-50 border border-gray-200 dark:bg-gray-700/30 dark:border-gray-600"
                }`}
              >
                <span
                  className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium ${
                    isCorrect
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {optionLabels[index]}
                </span>
                <span
                  className={`text-sm ${
                    isCorrect
                      ? "text-green-900 dark:text-green-200"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Action buttons */}
      <CardFooter className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
        <Button
          asChild
          variant="ghost"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          <Link to={`/edit/${question.$id}`}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </Button>
        <Button
          variant="ghost"
          disabled={isDeleting.has(question.$id)}
          onClick={() => onDelete(question.$id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
        >
          {isDeleting.has(question.$id) ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuestionCard;
