import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="py-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Welcome to Mock Test Center
          </h1>
          <p className="text-lg text-gray-600 text-center mt-2">
            Prepare yourself with our mock tests and practice questions
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Create a New Question
            </h2>
            <p className="text-gray-600 mb-4">
              Add new questions to our database for students to practice.
            </p>
            <Link
              to="/create-question"
              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
            >
              Create Question
            </Link>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Take a Mock Exam
            </h2>
            <p className="text-gray-600 mb-4">
              Simulate exam conditions with our mock tests.
            </p>
            <Link
              to="/mock-exam"
              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
            >
              Start Mock Exam
            </Link>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Manage Questions
            </h2>
            <p className="text-gray-600 mb-4">
              View, edit, or delete existing questions from our database.
            </p>
            <Link
              to="/manage-questions"
              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
            >
              Manage Questions
            </Link>
          </div>
        </main>
      </div>

   
    </div>
  );
};

export default Home;
