import React, { useState } from "react";
import geminiServiceV2 from "@/geminiAi/geminiServiceV2";

const useModuleEvalutionPoints = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const generateEvalutionPoint = async ({ practicalName }) => {
    // Check if practicalName is provided and not empty.
    if (!practicalName || practicalName.trim() === "") {
      const errMsg = "Practical name is required.";
      setError(errMsg);
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError("");

    try {
      const result = await geminiServiceV2.getEvaluationPoints(practicalName);

      if (!result || typeof result !== "string") {
        throw new Error("No evaluation points received.");
      }

      const evalutionPoints = result.split(",").map((item, index) => {
        const [label, points] = item.split(":");
        return {
          id: index + 1,
          evaluation: label ? label.trim() : "",
          points: points ? points.trim() : "",
        };
      });
      setData(evalutionPoints);
      return evalutionPoints;
    } catch (err) {
      console.error("Error generating evaluation points:", err);
      setIsError(true);
      setError(
        err.message || "An error occurred while generating evaluation points."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateEvalutionPoint,
    data,
    isLoading,
    isError,
    error,
  };
};

export default useModuleEvalutionPoints;
