import React from "react";
import { FaTimes } from "react-icons/fa";

const TodaysTestsPopup = ({ isOpen, onClose, data, timePeriod = "Day" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 z-10"
        >
          <FaTimes size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4 capitalize text-slate-600 dark:text-gray-300">
          {timePeriod} Tests Counts
        </h2>
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <th className="py-2 px-4 text-left text-gray-700 dark:text-gray-300">
                Sr.No
              </th>
              <th className="py-2 px-4 text-left text-gray-700 dark:text-gray-300">
                User Name
              </th>
              <th className="py-2 px-4 text-left text-gray-700 dark:text-gray-300">
                Tests Count
              </th>
              <th className="py-2 px-4 text-left text-gray-700 dark:text-gray-300">
                Max Percent
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className="border-b dark:border-gray-700">
                  <td className="py-2 px-4 text-gray-700 dark:text-gray-300">
                    {index + 1}
                  </td>
                  <td className="py-2 px-4 text-gray-700 dark:text-gray-300">
                    {item.userName}
                  </td>
                  <td className="py-2 px-4 text-center text-gray-700 dark:text-gray-300">
                    {item.totalTests}
                  </td>
                  <td className="py-2 px-4 text-center text-gray-700 dark:text-gray-300">
                    {item.maxPercent}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="py-2 px-4 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TodaysTestsPopup;
