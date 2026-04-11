import React, { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Percent,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";

const StatCard = ({ icon: Icon, label, value, colorClass, borderClass }) => (
  <div className={`p-3 sm:p-4 rounded-2xl border ${borderClass} ${colorClass} transition-shadow hover:shadow-md`}>
    <div className="flex items-center gap-2 mb-1.5">
      <div className="p-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50">
        <Icon className="w-4 h-4 opacity-70" />
      </div>
      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-70 leading-none">{label}</p>
    </div>
    <p className="text-xl sm:text-2xl font-black leading-none">{value}</p>
  </div>
);

const AttendanceBadge = ({ pct }) => {
  const p = Number(pct);
  const color = p >= 75 ? "bg-green-500" : p >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${color}`}>
      {pct}%
    </span>
  );
};

const ViewAttendance = ({ isLoading, stats }) => {
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "MMMM yyyy")
  );

  const profile = useSelector(selectProfile);

  if (!stats || !stats.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Calendar className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Attendance Ready</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">Attendance data will appear here once records are available for this batch.</p>
      </div>
    );
  }

  const filteredStats = stats.filter((item) => item.userId !== profile.userId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Synchronizing records...</p>
      </div>
    );
  }

  const availableMonths = filteredStats.reduce((months, student) => {
    Object.keys(student.monthlyAttendance || {}).forEach((month) => {
      if (month !== "prototype") months.add(month);
    });
    return months;
  }, new Set());

  const sortedMonths = Array.from(availableMonths).sort((a, b) => new Date(a) - new Date(b));

  // --- aggregate stats for selected month ---
  const totalStats = filteredStats.reduce(
    (acc, student) => {
      const m = student.monthlyAttendance[selectedMonth] || { presentDays: 0, absentDays: 0 };
      return {
        present: acc.present + (m.presentDays || 0),
        absent: acc.absent + (m.absentDays || 0),
        total: acc.total + ((m.presentDays || 0) + (m.absentDays || 0)),
      };
    },
    { present: 0, absent: 0, total: 0 }
  );
  const avgPercentage = totalStats.total > 0
    ? ((totalStats.present / totalStats.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-5 pb-10">
      {/* Header & Month Picker */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Attendance Records</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Detailed tracking of student presence</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 self-start sm:self-auto">
          <div className="px-2 py-1 flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-gray-400" />
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider hidden sm:block">Month</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 dark:text-gray-200 shadow-sm"
          >
            {sortedMonths.length === 0 && <option value={selectedMonth}>{selectedMonth}</option>}
            {sortedMonths.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 sm:px-6 space-y-6">
        {/* Stats Grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monthly Summary — {selectedMonth}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={CheckCircle}
              label="Avg Present"
              value={`${(totalStats.present / (filteredStats.length || 1)).toFixed(1)}d`}
              colorClass="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400"
              borderClass="border-green-100 dark:border-green-800/30"
            />
            <StatCard
              icon={XCircle}
              label="Avg Absent"
              value={`${(totalStats.absent / (filteredStats.length || 1)).toFixed(1)}d`}
              colorClass="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"
              borderClass="border-red-100 dark:border-red-800/30"
            />
            <StatCard
              icon={Users}
              label="Students"
              value={filteredStats.length}
              colorClass="bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400"
              borderClass="border-blue-100 dark:border-blue-800/30"
            />
            <StatCard
              icon={Percent}
              label="Batch %"
              value={`${avgPercentage}%`}
              colorClass="bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400"
              borderClass="border-purple-100 dark:border-purple-800/30"
            />
          </div>
        </div>

        {/* Attendance Table — responsive with sticky first column */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap w-8">#</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Student</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 text-center bg-blue-50/50 dark:bg-blue-900/10">Present</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 dark:text-red-400 text-center bg-red-50/50 dark:bg-red-900/10">Absent</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Month %</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 text-center bg-green-50/50 dark:bg-green-900/10">Total P</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-orange-500 dark:text-orange-400 text-center bg-orange-50/50 dark:bg-orange-900/10">Total A</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 text-center bg-purple-50/50 dark:bg-purple-900/10">Overall %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {filteredStats.map((student, idx) => {
                  const m = student.monthlyAttendance[selectedMonth] || { presentDays: 0, absentDays: 0 };
                  const mTotal = (m.presentDays || 0) + (m.absentDays || 0);
                  const mPct = mTotal > 0 ? ((m.presentDays / mTotal) * 100).toFixed(0) : 0;

                  return (
                    <tr key={student.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                      <td className="px-4 py-3 text-xs font-mono font-bold text-gray-400 group-hover:text-blue-500 transition-colors whitespace-nowrap">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <InteractiveAvatar
                            src={student.profileImage}
                            fallbackText={student.userName?.charAt(0) || "U"}
                            userId={student.userId}
                            editable={false}
                            className="w-8 h-8 rounded-full text-xs font-black shrink-0"
                          />
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[110px] sm:max-w-none">{student.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center bg-blue-50/30 dark:bg-blue-900/5 whitespace-nowrap">
                        <span className="font-bold text-green-600 dark:text-green-500">{m.presentDays || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center bg-red-50/30 dark:bg-red-900/5 whitespace-nowrap">
                        <span className="font-bold text-red-500 dark:text-red-400">{m.absentDays || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <AttendanceBadge pct={mPct} />
                      </td>
                      <td className="px-4 py-3 text-center bg-green-50/30 dark:bg-green-900/5 whitespace-nowrap">
                        <span className="font-bold text-gray-600 dark:text-gray-400">{student.presentDays || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center bg-orange-50/30 dark:bg-orange-900/5 whitespace-nowrap">
                        <span className="font-bold text-gray-600 dark:text-gray-400">{student.absentDays || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center bg-purple-50/30 dark:bg-purple-900/5 whitespace-nowrap">
                        <span className="font-black text-purple-600 dark:text-purple-400">{student.attendancePercentage || 0}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAttendance;
