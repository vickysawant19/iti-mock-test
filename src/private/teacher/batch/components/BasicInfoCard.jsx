import React from "react";
import { Users, Building, BookOpen, ChevronDown } from "lucide-react";

const BasicInfoCard = ({
  register,
  collegesData = [],
  tradesData = [],
  isBatchDataLoading,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-fit">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Users className="text-blue-600 dark:text-blue-400" size={20} />
        </div>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          Basic Information
        </h2>
      </div>
      <div className="p-6 space-y-4">
        {/* Batch Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Batch Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              {...register("BatchName", {
                required: "Batch name is required",
              })}
              placeholder="e.g. 2026-2028 Electronics Mechanic Batch A"
              className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
              disabled={isBatchDataLoading}
            />
          </div>
        </div>

        {/* College Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            College / Institution <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-4 w-4 text-slate-400" />
            </div>
            <select
              {...register("collegeId", {
                required: "College is required",
              })}
              className="block w-full pl-10 pr-10 py-2 text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
              disabled={isBatchDataLoading}
            >
              <option value="">Select College</option>
              {collegesData.map((college) => (
                <option key={college.$id} value={college.$id}>
                  {college.collageName}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Trade Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Trade <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BookOpen className="h-4 w-4 text-slate-400" />
            </div>
            <select
              {...register("tradeId", {
                required: "Trade is required",
              })}
              className="block w-full pl-10 pr-10 py-2 text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
              disabled={isBatchDataLoading}
            >
              <option value="">Select Trade</option>
              {tradesData.map((trade) => (
                <option key={trade.$id} value={trade.$id}>
                  {trade.tradeName}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoCard;
