import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import questionpaperservice from "../../appwrite/mockTest";
import { useSelector } from "react-redux";

const AttainTest = () => {
  const [paperId, setPaperId] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newPaper = await questionpaperservice.createNewPaperDocument(
        paperId,
        user.$id
      );
      navigate(`/start-mock-test/${newPaper.$id}`);
    } catch (error) {
      console.error("Error generating new paper:", error);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Enter Paper ID
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="paperId"
              className="block text-gray-700 font-semibold mb-2"
            >
              Paper ID
            </label>
            <input
              type="text"
              id="paperId"
              value={paperId}
              onChange={(e) => setPaperId(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
          >
            Generate Paper
          </button>
        </form>
      </div>
    </div>
  );
};

export default AttainTest;