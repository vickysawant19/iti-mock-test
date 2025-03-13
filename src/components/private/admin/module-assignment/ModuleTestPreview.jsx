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
    <div className=" bg-white   max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {paperData.tradeName} - {paperData.year}
        </h1>
        {isEditing ? (
          <div>
            <button
              onClick={handleSave}
              className="mr-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Edit
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Created by: {paperData.userName}
      </p>

      {editingData.questions.map((q, index) => (
        <div key={index} className="mb-6 border-b pb-4">
          <h2 className="text-lg font-medium">Question {index + 1}:</h2>
          {isEditing ? (
            <input
              type="text"
              value={q.question}
              onChange={(e) => handleQuestionChange(index, e.target.value)}
              className="mb-4 p-2 border rounded w-full"
            />
          ) : (
            <p className="mb-4">{q.question}</p>
          )}

          <ul className="list-none space-y-2">
            {Object.entries(q.options).map(([key, option]) => (
              <li
                key={key}
                className={`p-2 rounded-md ${
                  q.correctAnswer === keys[key] ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <strong>{keys[key]}:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    value={option}
                    onChange={(e) =>
                      handleOptionChange(index, key, e.target.value)
                    }
                    className="ml-2 p-1 border rounded w-full"
                  />
                ) : (
                  ` ${option}`
                )}
              </li>
            ))}
          </ul>
          {isEditing && (
            <div className="mt-2">
              <label className="mr-2">Correct Answer:</label>
              <select
                value={q.correctAnswer}
                onChange={(e) =>
                  handleCorrectAnswerChange(index, e.target.value)
                }
                className="p-1 border rounded"
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
