import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import quesdbservice from "../../appwrite/database";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import tradeservice from "../../appwrite/tradedetails";

const CreateQuestion = () => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [trades, setTrades] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await tradeservice.listTrades();
        setTrades(response.documents);
      } catch (error) {
        toast.error("Failed to fetch trades");
      }
    };
    fetchTrades();
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      data.userId = user.$id;
      data.userName = user.name;
      await quesdbservice.createQuestion(data);
      toast.success("Question created");
      reset();

      // navigate("/manage-questions");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
    setIsLoading(false);
  };

  const handleTradeChange = (event) => {
    const selectedTradeId = event.target.value;
    const trade = trades.find((t) => t.$id === selectedTradeId);
    setSelectedTrade(trade);
    setValue("tradeId", selectedTradeId);
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
              <label
                htmlFor="tradeName"
                className="block text-gray-800 font-semibold mb-2"
              >
                Trade
              </label>
              <select
                id="tradeId"
                {...register("tradeId", { required: "Trade is required" })}
                onChange={handleTradeChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Trade</option>
                {trades.map((trade) => (
                  <option key={trade.$id} value={trade.$id}>
                    {trade.tradeName}
                  </option>
                ))}
              </select>
              {errors.tradeId && (
                <p className="text-red-500">{errors.tradeId.message}</p>
              )}
            </div>
            {selectedTrade && (
              <div className="mb-6">
                <label
                  htmlFor="tradeName"
                  className="block text-gray-800 font-semibold mb-2"
                >
                  Trade Year
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
                        key={`${selectedTrade.$id}-${index}`}
                        value={index === 0 ? "FIRST" : "SECOND"}
                      >
                        {index === 0 ? "FIRST" : "SECOND"}
                      </option>
                    ))}
                </select>
                {errors.year && (
                  <p className="text-red-500">{errors.year.message}</p>
                )}
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
                spellCheck={true}
                id="question"
                {...register("question", { required: "Question is required" })}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                rows="3"
              ></textarea>
              {errors.question && (
                <p className="text-red-500">{errors.question.message}</p>
              )}
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
              {errors.correctAnswer && (
                <p className="text-red-500 w-full text-center">
                  {errors.correctAnswer.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold rounded-md py-2 px-4 w-full bg-blue-500`}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Question"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateQuestion;
