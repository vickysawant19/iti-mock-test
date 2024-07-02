import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MockTestGreet = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col justify-center items-center p-6">
            <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Welcome to the Mock Test</h1>
                <p className="text-lg font-semibold text-gray-700 mb-2 text-center"><strong>Exam Rules:</strong></p>
                <ul className="list-disc list-inside text-gray-600 mb-4">
                    <li>Duration: 1 hour</li>
                    <li>Number of Questions: 50</li>
                    <li>Each question carries equal marks</li>
                    <li>No negative marking</li>
                    <li>Ensure you are in a quiet environment</li>
                </ul>
                <p className="text-gray-600 mb-6 text-center">Make sure you have read the instructions carefully before starting the exam.</p>
          
            </div>
        </div>
    );
};

export default MockTestGreet;
