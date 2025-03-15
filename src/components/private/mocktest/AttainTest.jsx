import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
  createSearchParams,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Functions } from "appwrite";
import { FileInput, Loader2, ArrowLeft } from "lucide-react";

import { appwriteService } from "../../../appwrite/appwriteConfig";
import conf from "../../../config/config";

const AttainTest = () => {
  const [paperId, setPaperId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [searchParams, setSerachParams] = useSearchParams();

  const year = searchParams.get("year") || "";
  const subject = searchParams.get("subject") || "";
  const assessmentSearchParams = createSearchParams({ year, subject });
  const assessmentUrl = `/assessment?${assessmentSearchParams.toString()}`;
  const encodedRedirect = encodeURIComponent(assessmentUrl);
  // Build the new URL for /attain-test with the redirect parameter
  const redirectSearchParams = createSearchParams({
    redirect: encodedRedirect,
  });
  const newUrl = `${redirectSearchParams.toString()}`;

  useEffect(() => {
    setPaperId(searchParams.get("paperid") || "");
  }, [searchParams]);

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

      const msg = parsedRes.message || "Paper generated successfully!";
      toast.success(msg);
      navigate(`/start-mock-test/${parsedRes.paperId}?${newUrl}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Generate Test Paper
            </h1>
            <div className="w-12"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          {/* Paper ID Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileInput className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Enter Paper ID
                  </h2>
                  <p className="text-sm text-gray-500">
                    Please enter the paper ID to generate your test
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="paperId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Paper ID
                  </label>
                  <input
                    type="text"
                    id="paperId"
                    value={paperId}
                    onChange={(e) => setPaperId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter paper ID"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating Paper...</span>
                    </>
                  ) : (
                    <>
                      <FileInput className="w-5 h-5" />
                      <span>Generate Paper</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Instructions
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                • Enter the paper ID provided by your instructor
              </li>
              <li className="flex items-start gap-2">
                • Make sure you have a stable internet connection
              </li>
              <li className="flex items-start gap-2">
                • Once generated, the test will start automatically
              </li>
              <li className="flex items-start gap-2">
                • Complete all questions within the given time limit
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AttainTest;
