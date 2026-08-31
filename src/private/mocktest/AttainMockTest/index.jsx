import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Functions } from "appwrite";
import { KeyRound, FileText, ArrowLeft, Plus } from "lucide-react";

import { appwriteService } from "@/services/core/appwriteClient";
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
    if (!paperId.trim()) {
      toast.error("Please enter a valid Paper ID");
      return;
    }
    setLoading(true);
    try {
      const data = {
        action: "createNewMockTest",
        userId: user.$id,
        userName: user.name,
        paperId: paperId.trim(),
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
          redirect || "/all-mock-tests"
        )}`
      );
    } catch (error) {
      toast.error(error.message || "Failed to attain test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-0 m-0 flex flex-col">
      {/* ── Attendance Register Styled Edge-to-Edge Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-none p-3 sm:p-4 text-white shadow-xs border-b border-blue-400/30 dark:border-indigo-500/20 m-0">
        {/* Ambient background glow orbs */}
        <div className="absolute top-[-70px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[160px] h-[160px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-7xl mx-auto px-1 sm:px-2">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 shrink-0">
              <KeyRound className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                Take Mock Exam
              </h1>
              <p className="text-[11px] sm:text-xs text-blue-100/90 dark:text-slate-400">
                Enter your test Paper ID to generate questions and begin the timed examination.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Link
              to="/all-mock-tests"
              className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-xs transition-all border border-white/30 dark:border-slate-700 flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>My Exams</span>
            </Link>
            <Link
              to="/mock-exam"
              className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xs transition-all shadow-xs border border-amber-300 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Paper</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Content Body ── */}
      <main className="max-w-md w-full mx-auto px-4 py-8 sm:py-12 space-y-6 flex-1">
        <PaperIdForm
          paperId={paperId}
          setPaperId={setPaperId}
          loading={loading}
          onSubmit={handleSubmit}
        />
        <InstructionsCard />
      </main>
    </div>
  );
};

export default AttainTest;
