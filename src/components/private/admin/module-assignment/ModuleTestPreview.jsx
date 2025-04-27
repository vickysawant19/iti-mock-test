import React, { useState, useEffect } from "react";

const PaperPreview = ({ paperData, setPaperData }) => {
  // Local state to handle edit mode and a copy of the paper data for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(paperData);

  // Update editing data when paperData changes externally
  useEffect(() => {
    setEditingData(paperData);
  }, [paperData]);

  if (!paperData || !paperData.questions)
    return <p>No paper data available.</p>;

  // Mapping indices to option labels
  const keys = { 0: "A", 1: "B", 2: "C", 3: "D" };

  // Handlers for updating questions and options in the local edit state
  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...editingData.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      question: value,
    };
    setEditingData({ ...editingData, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex, optionKey, value) => {
    const updatedQuestions = [...editingData.questions];
    const updatedOptions = {
      ...updatedQuestions[qIndex].options,
      [optionKey]: value,
    };
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      options: updatedOptions,
    };
    setEditingData({ ...editingData, questions: updatedQuestions });
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    const updatedQuestions = [...editingData.questions];
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      correctAnswer: value,
    };
    setEditingData({ ...editingData, questions: updatedQuestions });
  };

  // Save changes by updating the parent's paperData and exit edit mode
  const handleSave = () => {
    setPaperData(editingData);
    setIsEditing(false);
  };

  // Cancel changes by resetting local editingData to the current paperData
  const handleCancel = () => {
    setEditingData(paperData);
    setIsEditing(false);
  };

  return (
    <div className="bg-white max-w-2xl mx-auto dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {paperData.tradeName} - {paperData.year}
        </h1>
        {isEditing ? (
          <div>
            <button
              onClick={handleSave}
              className="mr-2 px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-sm hover:bg-green-600 transition-colors dark:bg-green-600 dark:hover:bg-green-700"
          >
            Edit
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">
        Created by: {paperData.userName}
      </p>

      {editingData.questions.map((q, index) => (
        <div key={index} className="mb-6 border-b pb-4 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Question {index + 1}:
          </h2>
          {isEditing ? (
            <input
              type="text"
              value={q.question}
              onChange={(e) => handleQuestionChange(index, e.target.value)}
              className="mb-4 p-2 border rounded-sm w-full bg-gray-50 focus:bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
            />
          ) : (
            <p className="mb-4 text-gray-800 dark:text-gray-300">
              {q.question}
            </p>
          )}

          <ul className="list-none space-y-2">
            {Object.entries(q.options).map(([key, option]) => (
              <li
                key={key}
                className={`p-2 rounded-md ${
                  q.correctAnswer === keys[key]
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <strong className="text-gray-800 dark:text-gray-300">
                  {keys[key]}:
                </strong>
                {isEditing ? (
                  <input
                    type="text"
                    value={option}
                    onChange={(e) =>
                      handleOptionChange(index, key, e.target.value)
                    }
                    className="ml-2 p-1 border rounded-sm w-full bg-gray-50 focus:bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
                  />
                ) : (
                  <span className="text-gray-700 dark:text-gray-400">
                    {" "}
                    {option}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {isEditing && (
            <div className="mt-2">
              <label className="mr-2 text-gray-700 dark:text-gray-400">
                Correct Answer:
              </label>
              <select
                value={q.correctAnswer}
                onChange={(e) =>
                  handleCorrectAnswerChange(index, e.target.value)
                }
                className="p-1 border rounded-sm bg-gray-50 focus:bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:bg-gray-700"
              >
                {Object.values(keys).map((optionKey) => (
                  <option key={optionKey} value={optionKey}>
                    {optionKey}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PaperPreview;
