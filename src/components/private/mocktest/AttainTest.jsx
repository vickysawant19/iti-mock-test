import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import { Functions } from "appwrite";

import { appwriteService } from "../../../appwrite/appwriteConfig";
import conf from "../../../config/config";

const AttainTest = () => {
  const [paperId, setPaperId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        action: "createNewMockTest",
        userId: user.$id,
        userName: user.name,
        paperId,
      };

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
      // const newPaper = await questionpaperservice.createNewPaperDocument(
      //   paperId,
      //   user.$id,
      //   user.name
      // );
      const msg = parsedRes.message
        ? parsedRes.message
        : "Paper generated successfully!";

      toast.success(msg);
      navigate(`/start-mock-test/${parsedRes.paperId}`);
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
    </div>
  );
};

export default AttainTest;
