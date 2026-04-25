import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, parse } from "date-fns";
import { Query } from "appwrite";
import {
  Calendar,
  Percent,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
} from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import { getMonthsArray } from "@/private/teacher/batch/util/util";

const StatCard = ({ icon: Icon, label, value, colorClass, borderClass, gradientClass, shadowClass }) => (
  <div className={`relative overflow-hidden p-4 sm:p-5 rounded-3xl border ${borderClass} bg-white dark:bg-gray-900 ${shadowClass} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl ${gradientClass}`}></div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-xl ${colorClass} bg-opacity-20 dark:bg-opacity-10 backdrop-blur-md`}>
          <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-').split(' ')[0]}`} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
    </div>
  </div>
);

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
    <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg border font-bold text-[10px] shadow-sm ${styles}`}>
      {pct}%
    </div>
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
        const statsMap = {};
        
        const fetchPromises = students.map(async (student) => {
          const [presentDays, absentDays] = await Promise.all([
            newAttendanceService.getStudentAttendanceCount(student.userId, batchData.$id, "present"),
            newAttendanceService.getStudentAttendanceCount(student.userId, batchData.$id, "absent")
          ]);
          
          const total = presentDays + absentDays;
          const attendancePercentage = total > 0 ? ((presentDays / total) * 100).toFixed(0) : 0;
          
          statsMap[student.userId] = { presentDays, absentDays, attendancePercentage };
        });
        
        await Promise.all(fetchPromises);
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
        const minDate = format(startOfMonth(dateObj), "yyyy-MM-dd");
        const maxDate = format(endOfMonth(dateObj), "yyyy-MM-dd");
        
        const statsMap = {};
        
        const fetchPromises = students.map(async (student) => {
          const [presentDays, absentDays] = await Promise.all([
            newAttendanceService.getStudentAttendanceCount(student.userId, batchData.$id, "present", minDate, maxDate),
            newAttendanceService.getStudentAttendanceCount(student.userId, batchData.$id, "absent", minDate, maxDate)
          ]);
          
          statsMap[student.userId] = { presentDays, absentDays };
        });
        
        await Promise.all(fetchPromises);
        setMonthlyStats(statsMap);
      } catch (err) {
        console.error("Error fetching monthly stats:", err);
      }
    };
    
    fetchMonth();
  }, [batchData, selectedMonth, students]);

  if (!students || !students.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mt-8">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Attendance Ready</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">Attendance data will appear here once records are available for this batch.</p>
      </div>
    );
  }

  const filteredStudents = students.filter((item) => item.userId !== profile.userId);

  if (isLoadingStats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 mt-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900/50 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-bold tracking-wide animate-pulse">Synchronizing records...</p>
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
    <div className="pb-12 w-full animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
        
        {/* Left Column: Header & Stats */}
        <div className="w-full xl:w-[35%] flex flex-col gap-6 lg:gap-8">
          {/* Header Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/20">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col gap-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md mb-3 border border-white/30">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Analytics Dashboard</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black mb-1 tracking-tight">Attendance Records</h2>
                <p className="text-blue-100 font-medium text-xs sm:text-sm">Comprehensive view of student presence and performance tracking.</p>
              </div>
              
              <div className="flex flex-col bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
                <div className="px-3 py-1.5 flex items-center gap-2 border-b border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-blue-200" />
                  <span className="text-[10px] font-bold uppercase text-blue-100 tracking-wider">Select Period</span>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent px-3 py-1.5 text-white font-bold text-sm outline-none cursor-pointer appearance-none"
                >
                  {sortedMonths.length === 0 && <option className="text-gray-900" value={selectedMonth}>{selectedMonth}</option>}
                  {sortedMonths.map((month) => (
                    <option className="text-gray-900" key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2 mb-5 px-1">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Monthly Snapshot — {selectedMonth}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <StatCard
                icon={CheckCircle}
                label="Avg Present"
                value={`${(totalStats.present / (filteredStudents.length || 1)).toFixed(1)}d`}
                colorClass="bg-emerald-500 text-emerald-600 dark:text-emerald-400"
                borderClass="border-emerald-100 dark:border-emerald-900/30"
                gradientClass="bg-emerald-400"
                shadowClass="shadow-emerald-500/5"
              />
              <StatCard
                icon={XCircle}
                label="Avg Absent"
                value={`${(totalStats.absent / (filteredStudents.length || 1)).toFixed(1)}d`}
                colorClass="bg-rose-500 text-rose-600 dark:text-rose-400"
                borderClass="border-rose-100 dark:border-rose-900/30"
                gradientClass="bg-rose-400"
                shadowClass="shadow-rose-500/5"
              />
              <StatCard
                icon={Users}
                label="Students"
                value={filteredStudents.length}
                colorClass="bg-blue-500 text-blue-600 dark:text-blue-400"
                borderClass="border-blue-100 dark:border-blue-900/30"
                gradientClass="bg-blue-400"
                shadowClass="shadow-blue-500/5"
              />
              <StatCard
                icon={Percent}
                label="Batch %"
                value={`${avgPercentage}%`}
                colorClass="bg-purple-500 text-purple-600 dark:text-purple-400"
                borderClass="border-purple-100 dark:border-purple-900/30"
                gradientClass="bg-purple-400"
                shadowClass="shadow-purple-500/5"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Modern Table Layout */}
        <div className="w-full xl:w-[65%] flex flex-col h-full">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none overflow-hidden h-full">
            <div className="overflow-x-auto p-4 h-full">
              <table className="w-full text-left border-separate" style={{ borderSpacing: "0 6px" }}>
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap w-10 text-center">#</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Student Details</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 whitespace-nowrap text-center">Present</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 whitespace-nowrap text-center">Absent</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-500 whitespace-nowrap text-center">Month %</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap text-center">Total P</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap text-center">Total A</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-purple-500 whitespace-nowrap text-center">Overall %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => {
                    const m = monthlyStats[student.userId] || { presentDays: 0, absentDays: 0 };
                    const mTotal = (m.presentDays || 0) + (m.absentDays || 0);
                    const mPct = mTotal > 0 ? ((m.presentDays / mTotal) * 100).toFixed(0) : 0;
                    
                    const o = overallStats[student.userId] || { presentDays: 0, absentDays: 0, attendancePercentage: 0 };

                    return (
                      <tr key={student.userId} className="group bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-300 rounded-xl">
                        <td className="px-3 py-3 text-xs font-bold text-gray-400 text-center rounded-l-xl">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <InteractiveAvatar
                              src={student.profileImage}
                              fallbackText={student.userName?.charAt(0) || "U"}
                              userId={student.userId}
                              editable={false}
                              className="w-8 h-8 rounded-xl shadow-sm text-xs font-black shrink-0 border border-gray-200 dark:border-gray-700"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{student.userName}</span>
                              <span className="text-[10px] font-semibold text-gray-500 mt-0.5">ID: {student.studentId || student.userId.substring(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            {m.presentDays || 0}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold text-sm">
                            {m.absentDays || 0}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <AttendanceBadge pct={mPct} />
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className="font-bold text-xs text-gray-600 dark:text-gray-400">{o.presentDays || 0}</span>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className="font-bold text-xs text-gray-600 dark:text-gray-400">{o.absentDays || 0}</span>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap rounded-r-xl">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-black text-purple-600 dark:text-purple-400 text-sm">{o.attendancePercentage || 0}%</span>
                            <div className="w-12 h-1 bg-purple-100 dark:bg-purple-900/30 rounded-full mt-1 overflow-hidden">
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
