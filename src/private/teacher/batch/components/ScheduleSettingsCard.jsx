import React from "react";
import { Calendar } from "lucide-react";

const ScheduleSettingsCard = ({
  register,
  canMarkAttendance,
  isBatchDataLoading,
}) => {
  return (
    <section id="batch-schedule" className="scroll-mt-24 h-fit overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-500/10">
          <Calendar className="text-indigo-600 dark:text-indigo-400" size={18} />
        </div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Schedule & Settings
        </h2>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
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
                className="block h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                disabled={isBatchDataLoading}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
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
                className="block h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                disabled={isBatchDataLoading}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
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

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
            <div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
    </section>
  );
};

export default ScheduleSettingsCard;
