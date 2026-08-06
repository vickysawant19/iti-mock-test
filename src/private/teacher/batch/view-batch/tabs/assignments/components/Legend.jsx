import React from "react";

const Legend = () => {
  return (
    <div className="mt-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">📖 Legend</h3>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
            5
          </div>
          <span className="text-sm font-medium text-gray-700">
            Excellent (5)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg">
            4
          </div>
          <span className="text-sm font-medium text-gray-700">
            Very Good (4)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
            3
          </div>
          <span className="text-sm font-medium text-gray-700">Good (3)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg">
            2
          </div>
          <span className="text-sm font-medium text-gray-700">Fair (2)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg">
            1
          </div>
          <span className="text-sm font-medium text-gray-700">Poor (1-0)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold shadow-lg">
            NA
          </div>
          <span className="text-sm font-medium text-gray-700">
            Not Attempted
          </span>
        </div>
      </div>
    </div>
  );
};

export default Legend;
