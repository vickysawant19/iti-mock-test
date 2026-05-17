import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Functions } from "appwrite";

import { appwriteService } from "@/services/appwriteClient";
import conf from "@/config/config";
import { selectUser } from "@/store/userSlice";

import PaperIdForm from "./components/PaperIdForm";
import InstructionsCard from "./components/InstructionsCard";

const AttainTest = () => {
  const [paperId, setPaperId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [searchParams] = useSearchParams();

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
        databaseId: conf.databaseId,
        questionPapersCollectionId: conf.questionPapersCollectionId,
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
          <PaperIdForm
            paperId={paperId}
            setPaperId={setPaperId}
            loading={loading}
            onSubmit={handleSubmit}
          />
          <InstructionsCard />
        </div>
      </main>
    </div>
  );
};

export default AttainTest;
