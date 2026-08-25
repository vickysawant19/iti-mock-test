import React from "react";
import { Calendar } from "lucide-react";

const ScheduleSettingsCard = ({
  register,
  canMarkAttendance,
  isBatchDataLoading,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-fit">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
        </div>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          Schedule & Settings
        </h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="date"
                {...register("start_date", {
                  required: "Start date is required",
                })}
                className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                disabled={isBatchDataLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              End Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="date"
                {...register("end_date", {
                  required: "End date is required",
                })}
                className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                disabled={isBatchDataLoading}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Batch Active Status
            </span>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("isActive")}
                className="sr-only peer"
                disabled={isBatchDataLoading}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </div>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Allow Attendance Marking
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Students can mark today's attendance</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("canMarkAttendance")}
                className="sr-only peer"
                disabled={isBatchDataLoading}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </div>
          </label>

          <label className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
            !canMarkAttendance
              ? 'border-slate-100 dark:border-slate-900 opacity-50 cursor-not-allowed'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}>
            <div>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Allow Previous Attendance
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Students can mark past days (batch start → yesterday)</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("canMarkPrevious")}
                className="sr-only peer"
                disabled={!canMarkAttendance}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSettingsCard;
