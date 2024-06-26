import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import quesdbservice from '../../appwrite/database';
import { useSelector } from 'react-redux';
import { Query } from 'appwrite';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);

  const user = useSelector(state => state.user)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await quesdbservice.listQuestions([Query.equal('userId',user.$id)]); 
        setQuestions(response.documents); 
        console.log(response);
      } catch (error) {
        console.error('Error fetching questions:', error);
        
      }
    };

    fetchQuestions();
  }, []);

  const handleDelete = async (slug) => {
    try {
      const deleted = await quesdbservice.deleteQuestion(slug); 
      if (deleted) {
        setQuestions((prevQuestions) =>
          prevQuestions.filter((question) => question.$id !== slug)
        );
        toast.success("deleted")
      } else {
        toast.error('Error deleting')
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Error deleting question')
    }
    }


  const getOptionIndex = (correctAnswer) => {
    return ['A', 'B', 'C', 'D'].indexOf(correctAnswer);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="py-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center">Manage Questions</h1>
          <Link
            to="/create-question"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 mt-4 inline-block"
          >
            Create New Question
          </Link>
        </header>

        <main className="mt-8 bg-white shadow-md rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border-gray-300 shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-bold">Question</th>
                  <th className="px-6 py-3 text-left font-bold">Options</th>
                  <th className="px-6 py-3 text-left font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {questions.map((question) => (
                  <tr key={question.$id}>
                    <td className="px-6 py-4 whitespace-nowrap">{question.question}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ul>
                        {question.options.map((option, index) => (
                          <li
                            key={index}
                            className={`px-1 rounded ${
                              getOptionIndex(question.correctAnswer) === index ? 'bg-green-200' : ''
                            }`}
                          >
                            {option}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <Link
                          to={`/edit/${question.$id}`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(question.$id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      <ToastContainer/>
    </div>
  );
};

export default ManageQuestions;
