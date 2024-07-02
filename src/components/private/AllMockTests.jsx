import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import questionpaperservice from '../../appwrite/mockTest';

const AllMockTests = () => {
  const [mockTests, setMockTests] = useState([]);
  const user = useSelector(state => state.user);

  useEffect(() => {
    const fetchMockTests = async () => {
      try {
        const response = await questionpaperservice.getQuestionPaperByUserId(user.$id);
        if (response) {
          setMockTests(response);
        }
      } catch (error) {
        console.error('Error fetching mock tests:', error);
      }
    };

    fetchMockTests();
  }, [user.$id]);

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">All Mock Tests</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b-2 border-gray-300">Test ID</th>
                <th className="py-2 px-4 border-b-2 border-gray-300">User ID</th>
                <th className="py-2 px-4 border-b-2 border-gray-300">Trade ID</th>
                <th className="py-2 px-4 border-b-2 border-gray-300">Year</th>
                <th className="py-2 px-4 border-b-2 border-gray-300">Score</th>
                <th className="py-2 px-4 border-b-2 border-gray-300">Submitted</th>
                <th className="py-2 px-4 border-b-2 border-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockTests.map((test) => (
                <tr key={test.$id}>
                  <td className="py-2 px-4 border-b border-gray-300">{test.$id}</td>
                  <td className="py-2 px-4 border-b border-gray-300">{test.userId}</td>
                  <td className="py-2 px-4 border-b border-gray-300">{test.tradeId}</td>
                  <td className="py-2 px-4 border-b border-gray-300">{test.year}</td>
                  <td className="py-2 px-4 border-b border-gray-300">{test.score !== null ? test.score : 'N/A'}</td>
                  <td className="py-2 px-4 border-b border-gray-300">{test.submitted ? 'Yes' : 'No'}</td>
                  <td className="py-2 px-4 border-b border-gray-300">
                    <Link to={`/start-mock-test/${test.$id}`} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-md">
                      Start Test
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllMockTests;
