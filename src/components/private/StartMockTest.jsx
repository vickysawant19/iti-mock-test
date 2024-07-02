import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import questionpaperservice from '../../appwrite/mockTest';
import MockTestGreet from './MockTestGreet';

const StartMockTest = () => {
  const { paperId } = useParams();
  const [mockTest, setMockTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    const fetchMockTest = async () => {
      try {
        const response = await questionpaperservice.getQuestionPaper(paperId);
        if (response) {
          const parsedQuestions = response.questions.map((question) => JSON.parse(question));
          const parsedResponses = response.responses.map((response) => JSON.parse(response));
          setMockTest({ ...response, questions: parsedQuestions, responses: parsedResponses });
        }
      } catch (error) {
        console.error('Error fetching mock test:', error);
      }
    };

    fetchMockTest();
  }, [paperId]);

  const handleStartExam = () => {
    setSubmitted(true);
  };

  const onSubmit = async (data) => {
    try {
      await questionpaperservice.submitQuestionPaper(paperId, data);
      alert('Exam submitted successfully!');
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  if (!mockTest) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4  md:p-8 ">
      {!submitted ? (
        <div>
          <MockTestGreet />
          <button
            onClick={handleStartExam}
            className="block w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
          >
            Start Exam
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-10">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Question {currentQuestionIndex + 1} of 50
            </h2>
            <p className="text-gray-600 mb-4 font-semibold">
              {mockTest.questions[currentQuestionIndex].question}
            </p>
            <div className="space-y-2">
              {mockTest.questions[currentQuestionIndex].options.map((option, index) => (
                <label key={index} className="block text-gray-700">
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={option}
                    {...register(`question-${currentQuestionIndex}`)}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, mockTest.questions.length - 1))}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
            >
              Next
            </button>
          </div>
          <button
            type="submit"
            className="block w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md"
          >
            Submit Exam
          </button>
          <div className="flex flex-wrap mt-4">
            {mockTest.questions.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`m-1 p-2 border rounded-md ${currentQuestionIndex === index ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </form>
      )}
    </div>
  );
};

export default StartMockTest;
