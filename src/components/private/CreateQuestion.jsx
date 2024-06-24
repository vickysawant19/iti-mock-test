import React from 'react';
import { useForm } from 'react-hook-form';

const CreateQuestion = () => {
  const { register, handleSubmit, setValue, getValues } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    // Handle submission logic, e.g., API call to save the question
  };

  const handleCorrectAnswer = (optionIndex) => {
    // Set the correct answer index in form state
    setValue('correctAnswer', optionIndex);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="py-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Create New Question
          </h1>
        </header>

        <main className="mt-8 bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-6">
              <label htmlFor="question" className="block text-gray-800 font-semibold mb-2">
                Question
              </label>
              <textarea
                id="question"
                {...register('question', { required: 'Question is required' })}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                rows="3"
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-gray-800 font-semibold mb-2">Options</label>
              {["A", "B", "C", "D"].map((value,index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={`option-${value}`}
                    name="correctAnswer"
                    value={index}
                    onChange={() => handleCorrectAnswer(index - 1)}
                    className="mr-2"
                    {...register('correctAnswer')}
                  />
                  <label htmlFor={`option-${value}`} className="block text-gray-800">
                    Option {value}
                  </label>
                  <textarea
                    id={`option-text-${value}`}
                    {...register(`options[${index}]`, { required: 'Option is required' })}
                    className="ml-2 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                    rows="2"
                  ></textarea>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
            >
              Create Question
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateQuestion;
