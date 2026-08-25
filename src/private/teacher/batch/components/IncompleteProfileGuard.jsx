import React from "react";
import { Building } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IncompleteProfileGuard = ({ missingFields = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-4 mb-4">
        <Building className="w-12 h-12 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-2xl font-black tracking-tight mb-2">
        Incomplete Profile Setup
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md text-xs sm:text-sm font-medium">
        You must complete your instructor profile before creating or managing academic batches.
      </p>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm mb-6 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          Required Details:
        </h3>
        <ul className="text-xs font-bold text-left text-slate-600 dark:text-slate-400 space-y-1.5">
          {missingFields.map((field, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {field}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => navigate("/profile/edit")}
        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md cursor-pointer"
      >
        Complete Profile Setup
      </button>
    </div>
  );
};

export default IncompleteProfileGuard;
