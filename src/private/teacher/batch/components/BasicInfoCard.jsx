import React from "react";
import { Users, Building, BookOpen, ChevronDown } from "lucide-react";

const BasicInfoCard = ({
  register,
  collegesData = [],
  tradesData = [],
  isBatchDataLoading,
}) => {
  return (
    <section id="batch-information" className="scroll-mt-24 h-fit overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-500/10">
          <Users className="text-indigo-600 dark:text-indigo-400" size={18} />
        </div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Basic Information
        </h2>
      </div>
      <div className="space-y-4 p-5">
        {/* Batch Name */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
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
              className="block h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-800 transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              disabled={isBatchDataLoading}
            />
          </div>
        </div>

        {/* College Selection */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
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
              className="block h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm font-medium text-slate-800 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
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
              className="block h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm font-medium text-slate-800 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
    </section>
  );
};

export default BasicInfoCard;
