import { useState } from "react";
import questionpaperservice from "@/appwrite/mockTest";

import geminiServiceV2 from "@/geminiAi/geminiServiceV2";

const useModuleTestGenerator = ({
  tradeId,
  tradeName,
  year,
  userId,
  userName,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Validate that all required props are provided
  const validateProps = () => {
    if (!tradeId || !tradeName || !year || !userId || !userName) {
      throw new Error(
        "Missing required prop(s). Please ensure all props are provided."
      );
    }
  };

  // Function to generate paper data including questions
  const createPaper = async ({ practicalName, paperId }) => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError("");
      // Validate props before proceeding
      validateProps();
      // Get questions from GeminiService (limit to at most 5 questions)
      const questions = await geminiServiceV2.getQuestions(practicalName, 5);
      if (!questions) {
        throw new Error("No questions generated.");
      }

      // Prepare and return the new paper data
      const newPaperData = {
        tradeId,
        tradeName,
        year,
        paperId,
        userId,
        userName,
        questions,
        quesCount: 5,
        totalMinutes: 20,
        score: null,
        submitted: false,
        isOriginal: true,
        isProtected: true,
      };

      return newPaperData;
    } catch (err) {
      console.error("Error generating paper:", err);
      setError(err.message || "Unknown error");
      setIsError(true);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save paper data to the Appwrite DB
  const savePaper = async (paperData) => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError("");
      const createdPaper = await questionpaperservice.createPaper(paperData);
      setData(createdPaper);
      return createdPaper;
    } catch (err) {
      console.error("Error saving paper:", err);
      setError(err.message || "Unknown error");
      setIsError(true);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createPaper, savePaper, isLoading, isError, error, data };
};

export default useModuleTestGenerator;
