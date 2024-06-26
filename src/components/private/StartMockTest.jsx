import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import mockTestService from '../../appwrite/mockTest';



const StartMockTest = () => {
  const { register, handleSubmit, reset } = useForm();
  const navigate = useNavigate();
  const user = useSelector(state => state.user);
  const [isLoading, setIsLoading] = useState(false);

  const trades = ['Trade 1', 'Trade 2', 'Trade 3']; // Add your trade options here

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      data.userId = user.$id;
      data.userName = user.name;
      const newMockTest = await mockTestService.createMockTest(data.userId, data.userName, data.trade, data.examDateTime, data.subject);
      toast.success('Mock test created successfully!');
      reset();
      navigate(`/mock-test/${newMockTest.$id}`);
    } catch (error) {
      toast.error(`Error creating mock test: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Start Mock Test</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="trade" className="block text-gray-700 font-bold mb-2">Trade</label>
            <select
              id="trade"
              {...register('trade', { required: 'Trade is required' })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Trade</option>
              {trades.map((trade, index) => (
                <option key={index} value={trade}>{trade}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="examDateTime" className="block text-gray-700 font-bold mb-2">Exam Date and Time</label>
            <input
              type="datetime-local"
              id="examDateTime"
              {...register('examDateTime', { required: 'Exam date and time is required' })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="subject" className="block text-gray-700 font-bold mb-2">Subject</label>
            <input
              type="text"
              id="subject"
              {...register('subject', { required: 'Subject is required' })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 text-white font-bold rounded-md ${isLoading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Start Mock Test'}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default StartMockTest;
