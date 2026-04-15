import React from "react";
import { Award } from "lucide-react";
import { parse, getDaysInMonth } from "date-fns";

export const TopStatsRow = ({ totalDays, presentDays, absentDays, attendancePercentage, monthlyStats }) => {
  const prevPresent = Math.max(0, presentDays - (monthlyStats?.presentDays || 0));
  const prevAbsent = Math.max(0, absentDays - (monthlyStats?.absentDays || 0));
  const prevTotal = prevPresent + prevAbsent;
  const prevPercentage = prevTotal > 0 ? ((prevPresent / prevTotal) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {/* Total Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 inset-x-0 h-1 bg-slate-200 dark:bg-slate-700"></div>
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Overall Days</h4>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{presentDays + absentDays}</p>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-3">Till last month: {prevTotal}</p>
      </div>

      {/* Present Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
        <div>
          <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Present</h4>
          <p className="text-3xl font-extrabold text-emerald-500 leading-none">{presentDays}</p>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-3">Till last month: {prevPresent}</p>
      </div>

      {/* Absent Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 inset-x-0 h-1 bg-rose-500"></div>
        <div>
          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-widest mb-1">Absent</h4>
          <p className="text-3xl font-extrabold text-rose-500 leading-none">{absentDays}</p>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-3">Till last month: {prevAbsent}</p>
      </div>

      {/* Rate Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between shadow-indigo-600/20 shadow-xl">
        <div>
          <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">Overall Rate</h4>
          <p className="text-3xl font-extrabold leading-none">{attendancePercentage}%</p>
        </div>
        <p className="text-xs text-indigo-100 font-medium mt-3 flex items-center gap-1">
           Till last month: {prevPercentage}%
        </p>
      </div>
    </div>
  );
};

export const RightPanelStats = ({ stats, currentMonth }) => {
  const { totalDays, presentDays, absentDays, leaveDays = 0, holidayDays = 0, attendancePercentage } = stats;
  
  const parsedDate = parse(currentMonth, "MMMM yyyy", new Date());
  const monthTotalDays = getDaysInMonth(parsedDate);
  const monthWorkingDays = monthTotalDays - holidayDays;

  return (
    <div className="flex flex-col gap-4">
      {/* Perf Ring Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-5">
        <div className="relative w-[88px] h-[88px] flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" className="stroke-indigo-50 dark:stroke-slate-800" strokeWidth="8" />
            <circle 
              cx="44" cy="44" r="36" fill="none" 
              className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-1000 ease-out" 
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(attendancePercentage / 100) * (2 * Math.PI * 36)} 999`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">{attendancePercentage}%</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rate</span>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Attendance Performance</h4>
          <p className="text-xs text-slate-500 mb-2">Overall rate based on present days vs recorded days</p>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${attendancePercentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <Award size={12} /> {attendancePercentage >= 75 ? 'Good Standing' : 'Risk Warning'}
          </div>
        </div>
      </div>

      {/* Mini Stats Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden text-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex justify-between font-bold"><span className="text-slate-500 text-xs">Overall Days</span><span className="text-slate-900 dark:text-white">{presentDays + absentDays}</span></div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-slate-300 dark:bg-slate-600 rounded-full w-full"></div></div>
        </div>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex justify-between font-bold"><span className="text-emerald-500 text-xs">Present Days</span><span className="text-emerald-500">{presentDays}</span></div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${totalDays > 0 ? (presentDays/totalDays)*100 : 0}%` }}></div></div>
        </div>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex justify-between font-bold"><span className="text-violet-500 text-xs">Leave Days</span><span className="text-violet-500">{leaveDays}</span></div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width: `${totalDays > 0 ? (leaveDays/totalDays)*100 : 0}%` }}></div></div>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <div className="flex justify-between font-bold"><span className="text-amber-500 text-xs">Holidays</span><span className="text-amber-500">{holidayDays}</span></div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"><div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${(totalDays + holidayDays) > 0 ? (holidayDays/(totalDays + holidayDays))*100 : 0}%` }}></div></div>
        </div>
      </div>

      {/* Month Summary Grid */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-3xl p-5 border border-indigo-100 dark:border-indigo-900/50">
        <h4 className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest mb-3">{currentMonth} Summary</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Working</div>
             <div className="text-xl font-extrabold text-indigo-600 mt-0.5">{monthWorkingDays}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Holidays</div>
             <div className="text-xl font-extrabold text-indigo-600 mt-0.5">{holidayDays}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
             <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Present</div>
             <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{presentDays}</div>
          </div>
           <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
             <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Absent</div>
             <div className="text-xl font-extrabold text-rose-600 mt-0.5">{absentDays}</div>
          </div>
        </div>
      </div>

    </div>
  );
};
