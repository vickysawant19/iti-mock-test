import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import quesdbservice from "../../appwrite/database";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import tradeservice from "../../appwrite/tradedetails";

const EditQuestion = () => {
  const { register, handleSubmit, setValue, watch } = useForm();
  const { quesId } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [trades, setTrades] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const fetchTradesAndQuestion = async () => {
      try {
        const response = await tradeservice.listTrades();
        setTrades(response.documents);

        const question = await quesdbservice.getQuestion(quesId);
        setValue("question", question.question);

        const trade = response.documents.find(
          (tr) => tr.$id === question.tradeId
        );
        setValue("tradeName", trade?.tradeName);
        setValue("year", question.year);
        setSelectedTrade(trade?.tradeName);
        question.options.forEach((option, index) =>
          setValue(`options.${index}`, option)
        );
        setValue("correctAnswer", question.correctAnswer);
      } catch (error) {
        toast.error("Error fetching data");
      }
    };

    fetchTradesAndQuestion();
  }, [quesId, setValue]);

  const onTradeChange = (e) => {
    const selectedTradeName = e.target.value;
    setSelectedTrade(selectedTradeName);
    setValue("tradeId", ""); // Reset tradeId when tradeName changes
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    if (!data.correctAnswer) {
      toast.error("Correct answer is required");
      setIsLoading(false);
      return;
    }

    const trade = trades.find(
      (trade) => trade.tradeName === data.tradeName && trade.year === data.year
    );

    if (!trade) {
      toast.error("Invalid trade selected");
      setIsLoading(false);
      return;
    }

    data.userId = user.$id;
    data.tradeId = trade.$id; // Set the correct tradeId

    try {
      await quesdbservice.updateQuestion(quesId, data);
      toast.success("Question updated");
      navigate("/manage-questions");
    } catch (error) {
      toast.error("Error updating question");
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueTradeNames = [...new Set(trades.map((trade) => trade.tradeName))];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="py-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Edit Question
          </h1>
        </header>

        <main className="mt-8 bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-6">
              <label
                htmlFor="tradeName"
                className="block text-gray-800 font-semibold mb-2"
              >
                Trade
              </label>
              <select
                id="tradeName"
                {...register("tradeName", { required: "Trade is required" })}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                onChange={onTradeChange}
                value={selectedTrade || ""}
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
              <div className="mb-6">
                <label
                  htmlFor="year"
                  className="block text-gray-800 font-semibold mb-2"
                >
                  Year
                </label>
                <select
                  id="year"
                  {...register("year", { required: "Year is required" })}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                  value={watch("year") || ""}
                >
                  <option value="">Select Year</option>
                  {trades
                    .filter((trade) => trade.tradeName === selectedTrade)
                    .map((trade) => (
                      <option key={trade.$id} value={trade.year}>
                        {trade.year} YEAR
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="question"
                className="block text-gray-800 font-semibold mb-2"
              >
                Question
              </label>
              <textarea
                id="question"
                {...register("question", { required: "Question is required" })}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                rows="3"
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-gray-800 font-semibold mb-2">
                Options
              </label>
              {["A", "B", "C", "D"].map((value, index) => (
                <div
                  key={index}
                  className="flex items-center mb-2 p-2 rounded-md"
                >
                  <input
                    type="radio"
                    id={`option-${value}`}
                    value={value}
                    {...register("correctAnswer", {
                      required: "Correct answer is required",
                    })}
                    className="mr-2"
                  />
                  <label
                    htmlFor={`option-${value}`}
                    className="block text-gray-800 text-nowrap m-2"
                  >
                    Option {value}
                  </label>
                  <textarea
                    id={`option-text-${value}`}
                    {...register(`options.${index}`, {
                      required: "Option is required",
                    })}
                    className="ml-2 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                    rows="2"
                  ></textarea>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className={`hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full ${
                isLoading ? "bg-gray-500" : "bg-blue-500"
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Question"}
            </button>
          </form>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default EditQuestion;
