import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { Functions } from "appwrite";

import tradeservice from "../../../appwrite/tradedetails";
import conf from "../../../config/config";
import { appwriteService } from "../../../appwrite/appwriteConfig";

const CreateMockTest = () => {
  const { register, handleSubmit, reset, setValue } = useForm();

  const user = useSelector((state) => state.user);

  const [trades, setTrades] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const profile = useSelector((state) => state.profile);

  useEffect(() => {
    const fetchTrades = async () => {
      const resp = await tradeservice.listTrades();
      if (resp) {
        setTrades(resp.documents);
      }
    };

    fetchTrades();
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (trades.length < 0) return;
    setValue("tradeId", profile.tradeId);
    const trade = trades.find((tr) => tr.$id === profile.tradeId);
    setSelectedTrade(trade);
  }, [profile, trades]);

  const onTradeChange = (e) => {
    const selectedTradeid = e.target.value;
    const trade = trades.find((tr) => tr.$id === selectedTradeid);
    setSelectedTrade(trade);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    data.userName = user.name;
    data.userId = user.$id;
    data.tradeName = selectedTrade.tradeName;
    data.action = "generateMockTest";

    try {
      const functions = new Functions(appwriteService.getClient());
      const res = await functions.createExecution(
        conf.mockTestFunctionId,
        JSON.stringify(data)
      );
      const { responseBody } = res;
      if (!responseBody) {
        throw new Error("No response received from the server.");
      }
      const parsedRes = JSON.parse(responseBody);
      if (parsedRes.error) {
        throw new Error(parsedRes.error);
      }
      toast.success("Mock test created successfully!");
      reset();
      navigate(`/start-mock-test/${parsedRes.paperId}`);
    } catch (error) {
      console.log(error);
      toast.error(`Error creating mock test: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-start mt-32 justify-center">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Create Mock Test</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label
              htmlFor="tradeId"
              className="block text-gray-700 font-bold mb-2"
            >
              Trade
            </label>
            <select
              id="tradeId"
              {...register("tradeId", { required: "Trade is required" })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              onChange={onTradeChange}
            >
              <option value="">Select Trade</option>
              {trades.map((trade) => (
                <option key={trade.$id} value={trade.$id}>
                  {trade.tradeName}
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
                {new Array(selectedTrade.duration)
                  .fill(null)
                  .map((_, index) => (
                    <option
                      key={index}
                      value={index === 0 ? "FIRST" : "SECOND"}
                    >
                      {index === 0 ? "FIRST" : "SECOND"}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* <div className="mb-4">
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
          </div> */}
          {/* //Number of Questions */}
          <div className="mb-4">
            <label
              htmlFor="subject"
              className="block text-gray-700 font-bold mb-2"
            >
              Questions Count
            </label>
            <select
              id="subject"
              {...register("quesCount", {
                required: "Questions count is required",
              })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Questions Count</option>
              {[25, 50].map((count, index) => {
                return (
                  <option key={index} value={count}>
                    {count}
                  </option>
                );
              })}
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
    </div>
  );
};

export default CreateMockTest;
