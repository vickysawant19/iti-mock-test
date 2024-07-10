import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import questionpaperservice from "../../appwrite/mockTest";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";

const AttainTest = () => {
  const [paperId, setPaperId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newPaper = await questionpaperservice.createNewPaperDocument(
        paperId,
        user.$id,
        user.name
      );
      toast.success("Paper generated successfully!");
      navigate(`/start-mock-test/${newPaper.$id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-start mt-32 justify-center">
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
            disabled={loading}
          >
            {loading ? (
              <div className="flex justify-center items-center">
                <ClipLoader size={20} color={"#fff"} loading={loading} />
                <span className="ml-2">Generating...</span>
              </div>
            ) : (
              "Generate Paper"
            )}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AttainTest;
