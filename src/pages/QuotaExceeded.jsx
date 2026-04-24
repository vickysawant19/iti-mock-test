import React from "react";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const QuotaExceeded = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden text-center border border-red-100 dark:border-red-900">
        <div className="bg-red-500 dark:bg-red-600 p-8 flex justify-center items-center">
          <div className="bg-red-400 dark:bg-red-500 rounded-full p-4 animate-pulse">
            <AlertCircle className="text-white w-16 h-16" />
          </div>
        </div>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Database Limit Reached
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            We're sorry, but the application has temporarily reached its database read limit. 
            Please wait a moment for the quota to reset, or contact the administrator to upgrade the plan.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotaExceeded;
