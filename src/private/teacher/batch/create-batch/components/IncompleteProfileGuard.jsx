import React from "react";
import { Building } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IncompleteProfileGuard = ({ missingFields = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-gray-50/50 dark:bg-gray-900">
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-full p-4 mb-4">
        <Building className="w-12 h-12 text-amber-500 dark:text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Incomplete Profile
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        You must complete your instructor profile before creating or managing batches.
      </p>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-sm mb-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
          Missing Details:
        </h3>
        <ul className="text-sm text-left text-gray-600 dark:text-gray-400 space-y-1">
          {missingFields.map((field, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500"></span>
              {field}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => navigate("/profile/edit")}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm cursor-pointer"
      >
        Go to Profile Edit
      </button>
    </div>
  );
};

export default IncompleteProfileGuard;
