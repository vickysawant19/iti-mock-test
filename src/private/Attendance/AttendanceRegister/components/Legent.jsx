import React from "react";

const Legent = () => {
  return (
    <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400 font-bold text-lg">
            P
          </span>
          <span className="text-gray-700 dark:text-gray-300">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-600 dark:text-red-400 font-bold text-lg">
            A
          </span>
          <span className="text-gray-700 dark:text-gray-300">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-200 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300">Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-300 dark:text-gray-600 font-bold text-lg">
            -
          </span>
          <span className="text-gray-700 dark:text-gray-300">No Record</span>
        </div>
      </div>
    </div>
  );
};

export default Legent;
