import React from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Loader2, BookOpen } from "lucide-react";

const QuestionCard = ({ question, onDelete, isDeleting, getOptionIndex }) => {
  const optionLabels = ["A", "B", "C", "D"];
  const images = question.images.map(img => JSON.parse(img))


  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
      {/* Header with module ID */}
      <div>
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">
            Module {question.moduleId}
          </span>
        </div>

        {/* Question content */}
        <div className="p-4">
          <h2 className="text-gray-800 font-medium leading-relaxed">
            {question.question}
          </h2>
         
          <div>{images.map(img => <img key={img.id} src={img.url}/>)}</div>

          {/* Options list */}
          <div className="mt-4 space-y-2">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-md transition-colors ${
                  getOptionIndex(question.correctAnswer) === index
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium ${
                    getOptionIndex(question.correctAnswer) === index
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {optionLabels[index]}
                </span>
                <span
                  className={`text-sm ${
                    getOptionIndex(question.correctAnswer) === index
                      ? "text-green-900"
                      : "text-gray-700"
                  }`}
                >
                  {option}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
        <Link
          to={`/edit/${question.$id}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
        >
          <Pencil className="w-4 h-4" />
          <span>Edit</span>
        </Link>
        <button
          disabled={isDeleting.has(question.$id)}
          onClick={() => onDelete(question.$id)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting.has(question.$id) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
