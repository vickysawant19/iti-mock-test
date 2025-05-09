import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
  createSearchParams,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Functions } from "appwrite";
import { FileInput, Loader2, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { appwriteService } from "../../../appwrite/appwriteConfig";
import conf from "../../../config/config";
import { selectUser } from "@/store/userSlice";

const AttainTest = () => {
  const [paperId, setPaperId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [searchParams, setSerachParams] = useSearchParams();

  const redirect = searchParams.get("redirect");

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
      navigate(
        `/start-mock-test/${parsedRes.paperId}?redirect=${encodeURIComponent(
          redirect
        )}`
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          {/* Paper ID Card */}
          <Card className="overflow-hidden border-gray-200 dark:border-gray-900 dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Enter Paper ID
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please enter the paper ID to generate your test
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="paperId"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Paper ID
                  </label>
                  <Input
                    type="text"
                    id="paperId"
                    value={paperId}
                    onChange={(e) => setPaperId(e.target.value)}
                    className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Enter paper ID"
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span>Generating Paper...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      <span>Generate Paper</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="mt-6 dark:bg-gray-800 dark:border-gray-800">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Instructions
              </h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AttainTest;
