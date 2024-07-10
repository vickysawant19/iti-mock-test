import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

import tradeservice from "../../appwrite/tradedetails";
import questionpaperservice from "../../appwrite/mockTest";

const CreateMockTest = () => {
  const { register, handleSubmit, reset, setValue } = useForm();

  const user = useSelector((state) => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [trades, setTrades] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const navigate = useNavigate();
  const subjects = ["TRADE THEORY"];

  useEffect(() => {
    const fetchTrades = async () => {
      const resp = await tradeservice.listTrades();
      if (resp) {
        setTrades(resp.documents);
      }
    };

    fetchTrades();
  }, []);

  console.log(user.labels.includes("admin"));

  const onTradeChange = (e) => {
    const selectedTradeName = e.target.value;
    setSelectedTrade(selectedTradeName);
    setValue("tradeId", ""); // Reset tradeId when tradeName changes
  };

  const onSubmit = async (data) => {
    if (!user.labels.includes("admin")) {
      toast.error("Server Busy! Contact Administration");
      return;
    }
    setIsLoading(true);

    const trade = trades.find(
      (trade) => trade.tradeName === data.tradeName && trade.year === data.year
    );

    if (!trade) {
      toast.error("Invalid trade selected");
      setIsLoading(false);
      return;
    }

    data.tradeName = trade.tradeName;
    data.userName = user.name;
    data.userId = user.$id;
    data.tradeId = trade.$id; // Set the correct tradeId

    try {
      const newMockTest = await questionpaperservice.generateQuestionPaper(
        data
      );

      toast.success("Mock test created successfully!");
      reset();
      navigate(`/start-mock-test/${newMockTest.$id}`);
    } catch (error) {
      toast.error(`Error creating mock test: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueTradeNames = [...new Set(trades.map((trade) => trade.tradeName))];

  return (
    <div className="bg-gray-100 min-h-screen flex items-start mt-32 justify-center">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Create Mock Test</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label
              htmlFor="tradeName"
              className="block text-gray-700 font-bold mb-2"
            >
              Trade
            </label>
            <select
              id="tradeName"
              {...register("tradeName", { required: "Trade is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              onChange={onTradeChange}
            >
              <option value="">Select Trade</option>
              {uniqueTradeNames.map((tradeName) => (
                <option key={tradeName} value={tradeName}>
                  {tradeName}
                </option>
              ))}
            </select>
          </div>

          {selectedTrade && (
            <div className="mb-4">
              <label
                htmlFor="year"
                className="block text-gray-700 font-bold mb-2"
              >
                Year
              </label>
              <select
                id="year"
                {...register("year", { required: "Year is required" })}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Year</option>
                {trades
                  .filter((trade) => trade.tradeName === selectedTrade)
                  .map((trade) => (
                    <option key={trade.$id} value={trade.year}>
                      {trade.year}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="subject"
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
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
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
