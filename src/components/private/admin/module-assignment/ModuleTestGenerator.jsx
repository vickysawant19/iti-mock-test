import { useState } from "react";
import questionpaperservice from "../../../../appwrite/mockTest";
import geminiService from "../../../../geminiAi/geminiService";

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

  const generatePaper = async ({ practicalName, paperId }) => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError("");

      // Validate props before proceeding
      validateProps();

      // Get questions from GeminiService (limit to at most 5 questions)
      const questions = await geminiService.getJSONObject(practicalName, 5);
      console.log("Generated questions:", questions);

      if (!questions) {
        throw new Error("No questions generated.");
      }

      // Prepare the new paper data
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

      // Create the paper using the question paper service
      const createdPaper = await questionpaperservice.createPaper(newPaperData);
      console.log("Created paper:", createdPaper);
      setData(createdPaper);
    } catch (err) {
      console.error("Error generating paper:", err);
      setError(err.message || "Unknown error");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return { generatePaper, isLoading, isError, error, data };
};

export default useModuleTestGenerator;
