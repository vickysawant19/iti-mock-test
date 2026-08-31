import React, { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import {
  Calendar,
  Percent,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { newAttendanceService } from "@/services/attendance/newAttendanceService";
import { getMonthsArray } from "@/private/teacher/batch/util/util";

// Minimalist Compact StatCard Component
const StatCard = ({ icon: Icon, label, value, colorClass, borderClass }) => (
  <div className={`p-3 sm:p-3.5 rounded-2xl border ${borderClass} bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 hover:shadow-md`}>
    <div className="flex items-center gap-2 mb-1">
      <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-15 dark:bg-opacity-20`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">{label}</p>
    </div>
    <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none mt-1">{value}</p>
  </div>
);

// Attendance Badge Component
const AttendanceBadge = ({ pct }) => {
  const p = Number(pct);
  let styles = "";
  if (p >= 75) {
    styles = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30";
  } else if (p >= 50) {
    styles = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/30";
  } else {
    styles = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/30";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border font-extrabold text-[11px] ${styles}`}>
      {pct}%
    </span>
  );
};

const ViewAttendance = ({ students = [], batchData }) => {
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "MMMM yyyy")
  );

  const [overallStats, setOverallStats] = useState({});
  const [monthlyStats, setMonthlyStats] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const profile = useSelector(selectProfile);

  const sortedMonths = batchData
    ? getMonthsArray(batchData.start_date, batchData.end_date, "MMMM yyyy")
    : [];

  useEffect(() => {
    if (!batchData || !students || students.length === 0) return;

    const fetchOverall = async () => {
      setIsLoadingStats(true);
      try {
        const cumulativeMap = await newAttendanceService.getBatchCumulativeMonthlyStats(batchData.$id);
        const statsMap = {};

        students.forEach((student) => {
          const s = cumulativeMap.get(student.userId);
          const presentDays = s?.totalPresent !== undefined ? s.totalPresent : (s?.presentDays || 0);
          const absentDays = s?.absentDays || 0;
          const attendancePercentage = s?.percentage !== undefined ? s.percentage : 0;
          statsMap[student.userId] = { presentDays, absentDays, attendancePercentage };
        });

        setOverallStats(statsMap);
      } catch (err) {
        console.error("Error fetching overall stats:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchOverall();
  }, [batchData, students]);

  useEffect(() => {
    if (!batchData || !selectedMonth || !students || students.length === 0) return;

    const fetchMonth = async () => {
      try {
        const dateObj = parse(selectedMonth, "MMMM yyyy", new Date());
        const yearMonthStr = format(dateObj, "yyyy-MM");

        const monthMap = await newAttendanceService.getBatchMonthlyStats(batchData.$id, yearMonthStr);
        const statsMap = {};

        students.forEach((student) => {
          const s = monthMap.get(student.userId);
          const presentDays = s?.totalPresent !== undefined ? s.totalPresent : (s?.presentDays || 0);
          const absentDays = s?.absentDays || 0;
          statsMap[student.userId] = { presentDays, absentDays };
        });

        setMonthlyStats(statsMap);
      } catch (err) {
        console.error("Error fetching monthly stats:", err);
      }
    };

    fetchMonth();
  }, [batchData, selectedMonth, students]);

  if (!students || !students.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="w-7 h-7 text-blue-500" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Attendance Ready</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-xs sm:text-sm">Attendance data will appear here once records are available for this batch.</p>
      </div>
    );
  }

  const filteredStudents = students.filter((item) => item.userId !== profile.userId);

  if (isLoadingStats) {
    return (
      <div className="flex flex-col items-center justify-center py-28 mt-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-3 border-blue-200 dark:border-blue-900/50 rounded-full"></div>
          <div className="absolute inset-0 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-3 text-gray-500 dark:text-gray-400 text-xs font-bold tracking-wide animate-pulse">Synchronizing records...</p>
      </div>
    );
  }

  const totalStats = filteredStudents.reduce(
    (acc, student) => {
      const m = monthlyStats[student.userId] || { presentDays: 0, absentDays: 0 };
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
    <div className="pb-12 w-full animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row gap-5 lg:gap-6 items-start">
        
        {/* Left Column: Compact Header & Stats (Sticky on Desktop) */}
        <div className="w-full xl:w-[320px] xl:shrink-0 flex flex-col gap-4 xl:sticky xl:top-20">
          
          {/* Header Card */}
          <div className="relative overflow-hidden rounded-none m-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4 sm:p-5 text-white shadow-xs border-b border-blue-400/30">
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3 text-blue-200" />
                  Analytics Dashboard
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black tracking-tight">Attendance Records</h2>
                <p className="text-blue-100 font-medium text-xs mt-0.5">Student presence & performance analytics</p>
              </div>

              {/* Month Selector */}
              <div className="relative mt-1">
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 w-4 h-4 text-blue-200 pointer-events-none z-10" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-white/15 hover:bg-white/25 focus:bg-white/25 text-white font-bold text-xs pl-9 pr-8 py-2.5 rounded-xl border border-white/30 outline-none cursor-pointer appearance-none shadow-sm transition-all duration-200"
                  >
                    {sortedMonths.length === 0 && (
                      <option className="bg-gray-900 text-white font-semibold" value={selectedMonth}>
                        {selectedMonth}
                      </option>
                    )}
                    {sortedMonths.map((month) => (
                      <option className="bg-gray-900 text-white font-semibold py-1.5" key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 w-4 h-4 text-blue-200 pointer-events-none z-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Snapshot Grid */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 px-0.5">
              Monthly Snapshot — {selectedMonth}
            </h3>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <StatCard
                icon={CheckCircle}
                label="Avg Present"
                value={`${(totalStats.present / (filteredStudents.length || 1)).toFixed(1)}d`}
                colorClass="bg-emerald-500 text-emerald-600 dark:text-emerald-400"
                borderClass="border-emerald-100 dark:border-emerald-900/30"
              />
              <StatCard
                icon={XCircle}
                label="Avg Absent"
                value={`${(totalStats.absent / (filteredStudents.length || 1)).toFixed(1)}d`}
                colorClass="bg-rose-500 text-rose-600 dark:text-rose-400"
                borderClass="border-rose-100 dark:border-rose-900/30"
              />
              <StatCard
                icon={Users}
                label="Students"
                value={filteredStudents.length}
                colorClass="bg-blue-500 text-blue-600 dark:text-blue-400"
                borderClass="border-blue-100 dark:border-blue-900/30"
              />
              <StatCard
                icon={Percent}
                label="Batch %"
                value={`${avgPercentage}%`}
                colorClass="bg-purple-500 text-purple-600 dark:text-purple-400"
                borderClass="border-purple-100 dark:border-purple-900/30"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Records (Responsive Mobile Cards & Desktop Table) */}
        <div className="w-full xl:flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            
            {/* Mobile View: Cards (< md) */}
            <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-3 space-y-3">
              {filteredStudents.map((student, idx) => {
                const m = monthlyStats[student.userId] || { presentDays: 0, absentDays: 0 };
                const mTotal = (m.presentDays || 0) + (m.absentDays || 0);
                const mPct = mTotal > 0 ? ((m.presentDays / mTotal) * 100).toFixed(0) : 0;
                const o = overallStats[student.userId] || { presentDays: 0, absentDays: 0, attendancePercentage: 0 };

                return (
                  <div key={student.userId} className="pt-3 first:pt-0 bg-gray-50/50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-bold text-gray-400 w-4 text-center shrink-0">{idx + 1}</span>
                        <InteractiveAvatar
                          src={student.profileImage}
                          fallbackText={student.userName?.charAt(0) || "U"}
                          userId={student.userId}
                          editable={false}
                          className="w-8 h-8 rounded-xl shadow-sm text-xs font-black shrink-0 border border-gray-200 dark:border-gray-700"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{student.userName}</p>
                          <p className="text-[10px] font-semibold text-gray-500">ID: {student.studentId || student.userId.substring(0, 8)}</p>
                        </div>
                      </div>
                      <AttendanceBadge pct={mPct} />
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1 text-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800 text-xs">
                      <div>
                        <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Pres.</p>
                        <p className="font-extrabold text-gray-900 dark:text-white">{m.presentDays || 0}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase">Abs.</p>
                        <p className="font-extrabold text-gray-900 dark:text-white">{m.absentDays || 0}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Tot P</p>
                        <p className="font-bold text-gray-700 dark:text-gray-300">{o.presentDays || 0}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">Overall</p>
                        <p className="font-black text-purple-600 dark:text-purple-400">{o.attendancePercentage || 0}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Table (>= md) */}
            <div className="hidden md:block overflow-x-auto p-3 sm:p-4">
              <table className="w-full text-left border-separate" style={{ borderSpacing: "0 4px" }}>
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 whitespace-nowrap w-8 text-center">#</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 whitespace-nowrap">Student Details</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-500 whitespace-nowrap text-center">Present</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-rose-500 whitespace-nowrap text-center">Absent</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-blue-500 whitespace-nowrap text-center">Month %</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 whitespace-nowrap text-center">Total P</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 whitespace-nowrap text-center">Total A</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-purple-500 whitespace-nowrap text-center">Overall %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => {
                    const m = monthlyStats[student.userId] || { presentDays: 0, absentDays: 0 };
                    const mTotal = (m.presentDays || 0) + (m.absentDays || 0);
                    const mPct = mTotal > 0 ? ((m.presentDays / mTotal) * 100).toFixed(0) : 0;
                    const o = overallStats[student.userId] || { presentDays: 0, absentDays: 0, attendancePercentage: 0 };

                    return (
                      <tr key={student.userId} className="group bg-gray-50/60 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200 rounded-xl">
                        <td className="px-3 py-2.5 text-xs font-bold text-gray-400 text-center rounded-l-xl">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <InteractiveAvatar
                              src={student.profileImage}
                              fallbackText={student.userName?.charAt(0) || "U"}
                              userId={student.userId}
                              editable={false}
                              className="w-7 h-7 rounded-lg shadow-sm text-xs font-black shrink-0 border border-gray-200 dark:border-gray-700"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[160px]">{student.userName}</span>
                              <span className="text-[10px] font-semibold text-gray-500">ID: {student.studentId || student.userId.substring(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {m.presentDays || 0}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold text-xs">
                            {m.absentDays || 0}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <AttendanceBadge pct={mPct} />
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className="font-bold text-xs text-gray-600 dark:text-gray-400">{o.presentDays || 0}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className="font-bold text-xs text-gray-600 dark:text-gray-400">{o.absentDays || 0}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap rounded-r-xl">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-black text-purple-600 dark:text-purple-400 text-xs">{o.attendancePercentage || 0}%</span>
                            <div className="w-10 h-1 bg-purple-100 dark:bg-purple-900/30 rounded-full mt-0.5 overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${o.attendancePercentage || 0}%` }}></div>
                            </div>
                          </div>
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
    </div>
  );
};

export default ViewAttendance;
