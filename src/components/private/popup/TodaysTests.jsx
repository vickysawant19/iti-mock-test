import React from "react";
import { FaTimes } from "react-icons/fa";

const TodaysTestsPopup = ({ isOpen, onClose, data, timePeriod = "Day" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          <FaTimes size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4 capitalize text-slate-600">
          {timePeriod} Tests Counts
        </h2>
        <table className="min-w-full bg-white border border-gray-300 rounded">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="py-2 px-4 text-left">Sr.No</th>
              <th className="py-2 px-4 text-left">User Name</th>
              <th className="py-2 px-4 text-left">Tests Count</th>
              <th className="py-2 px-4 text-left">Max Percent</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{index + 1}</td>
                  <td className="py-2 px-4">{item.userName}</td>
                  <td className="py-2 px-4 text-center">{item.totalTests}</td>
                  <td className="py-2 px-4 text-center">{item.maxPercent}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="py-2 px-4 text-center text-gray-500">
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
