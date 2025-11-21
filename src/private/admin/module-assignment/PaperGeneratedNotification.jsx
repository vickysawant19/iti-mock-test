import React from "react";
import { FileCheck } from "lucide-react";

const PaperGeneratedNotification = ({
  paperId,
  setShowPaperModal,
  saveNewPaper,
}) => {
  return (
    <div className="w-full bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded-md shadow-md mb-6 dark:bg-gray-800 dark:border-yellow-500">
      <div className="flex items-start">
        <div className="shrink-0">
          <FileCheck className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            Paper Generated Successfully!
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
            <p>
              Your assessment paper has been created. You can now save it to the
              database.
            </p>
            <p className="mt-1">
              <span className="font-semibold">Paper ID:</span>{" "}
              {paperId || "GAHO250316104405"}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-4">
        <button
          type="button"
          onClick={() => setShowPaperModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Show Paper
        </button>
        <button
          onClick={saveNewPaper}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-hidden focus:border-green-700 focus:shadow-outline-green active:bg-green-800 transition ease-in-out duration-150 dark:bg-green-500 dark:hover:bg-green-600"
        >
          Save Paper
        </button>
      </div>
    </div>
  );
};

export default PaperGeneratedNotification;
