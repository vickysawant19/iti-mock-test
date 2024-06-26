import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

import tradeservice from "../../appwrite/tradedetails";
import QuestionPaperService from "../../appwrite/mockTest";
import questionpaperservice from "../../appwrite/mockTest";

const CreateMockTest = () => {
  const { register, handleSubmit, reset, setValue } = useForm();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);

  const [trades, setTrades] = useState();
  const subjects = ["TRADE THEORY"];

  const fetchTrades = async () => {
    const resp = await tradeservice.listTrades();
    if (resp) {
      setTrades(resp.documents);
    }
  };
  useEffect(() => {
    fetchTrades();
    console.log(trades);
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      data.userId = user.$id;
      const newMockTest = await questionpaperservice.generateQuestionPaper(
        data.userId,
        data.trade,
        data.year
      );
      toast.success("Mock test created successfully!");
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
        <h1 className="text-2xl font-bold mb-6">Create Mock Test</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label
              htmlFor="trade"
              className="block text-gray-700 font-bold mb-2"
            >
              Trade
            </label>
            <select
              id="trade"
              {...register("trade", { required: "Trade is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Trade</option>
              {trades?.map((trade) => (
                <option key={trade.$id} value={trade.$id}>
                  {`${trade.tradeName}`}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label
              htmlFor="trade"
              className="block text-gray-700 font-bold mb-2"
            >
              Year
            </label>
            <select
              id="year"
              {...register("year", { required: "year is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Year</option>
              {trades?.map((trade) => (
                <option key={trade.$id} value={trade.year}>
                  {`${trade.year}`}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="trade"
              className="block text-gray-700 font-bold mb-2"
            >
              Subject
            </label>
            <select
              id="subject"
              {...register("subject", { required: "Subject is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Subject</option>
              {subjects?.map((subject) => (
                <option key={subject} value={subject}>
                  {`${subject}`}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 text-white font-bold rounded-md ${
              isLoading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Mock Test"}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default CreateMockTest;
