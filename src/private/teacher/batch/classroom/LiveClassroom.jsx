import React, { useState, useMemo } from "react";
import {
  Users,
  Activity,
  CheckCircle2,
  Clock,
  UserX,
  Search,
  BookOpen,
  ClipboardList,
  Award,
  Filter,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import LiveStudentCard from "./components/LiveStudentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SendAnnouncementModal from "@/components/notifications/SendAnnouncementModal";

export const LiveClassroom = ({ students = [], batchData }) => {
  const teamId = batchData?.teamId || batchData?.$id;
  const { onlineUsers } = useOnlineUsers(teamId);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'online', 'away', 'offline'
  const [activityFilter, setActivityFilter] = useState("all"); // 'all', 'Mock Test', 'Attendance', 'Leaderboard', 'Dashboard'

  // Map student presences
  const studentRoster = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];

    return students.map((student) => {
      const presence = onlineUsers.get(student.userId) || onlineUsers.get(student.$id);
      const status = presence?.status || "offline";
      const metadata = presence?.metadata || {};

      return {
        ...student,
        presenceStatus: status,
        presenceMeta: metadata,
      };
    });
  }, [students, onlineUsers]);

  // Compute status & activity statistics
  const stats = useMemo(() => {
    let onlineCount = 0;
    let awayCount = 0;
    let offlineCount = 0;
    const activityCounts = {
      "Mock Test": 0,
      Attendance: 0,
      Leaderboard: 0,
      Dashboard: 0,
    };

    studentRoster.forEach((s) => {
      if (s.presenceStatus === "online") {
        onlineCount++;
        const act = s.presenceMeta?.activity || "Dashboard";
        if (activityCounts[act] !== undefined) {
          activityCounts[act]++;
        } else {
          activityCounts.Dashboard++;
        }
      } else if (s.presenceStatus === "away") {
        awayCount++;
      } else {
        offlineCount++;
      }
    });

    return {
      total: studentRoster.length,
      onlineCount,
      awayCount,
      offlineCount,
      activityCounts,
    };
  }, [studentRoster]);

  // Filter roster
  const filteredRoster = useMemo(() => {
    return studentRoster.filter((student) => {
      // Search term filter
      const nameMatch = (student.userName || "").toLowerCase().includes(searchTerm.toLowerCase());
      const rollMatch = (student.studentId || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!nameMatch && !rollMatch) return false;

      // Status filter
      if (statusFilter !== "all" && student.presenceStatus !== statusFilter) {
        return false;
      }

      // Activity filter
      if (activityFilter !== "all") {
        const studentAct = student.presenceMeta?.activity || "Dashboard";
        if (studentAct !== activityFilter) return false;
      }

      return true;
    });
  }, [studentRoster, searchTerm, statusFilter, activityFilter]);

  return (
    <div className="space-y-6">
      {/* Realtime Classroom Summary Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Enrolled */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Enrolled Students</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</span>
            <span className="text-xs text-slate-500">students in batch</span>
          </div>
        </div>

        {/* Live Online */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/10 p-4 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Active Now (Online)</span>
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.onlineCount}</span>
            <span className="text-xs text-emerald-600/80 dark:text-emerald-500">
              ({stats.total > 0 ? Math.round((stats.onlineCount / stats.total) * 100) : 0}% live)
            </span>
          </div>
        </div>

        {/* Away / Idle */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-50/10 p-4 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Away / Idle</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.awayCount}</span>
            <span className="text-xs text-amber-600/80 dark:text-amber-500">inactive tab</span>
          </div>
        </div>

        {/* Offline */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Offline</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.offlineCount}</span>
            <span className="text-xs text-slate-500">not active</span>
          </div>
        </div>
      </div>

      {/* Live Activity Breakdown Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mr-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Active Tasks Breakdown:</span>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-800">
            <BookOpen className="mr-1 h-3 w-3" />
            Mock Test: {stats.activityCounts["Mock Test"]}
          </Badge>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800">
            <ClipboardList className="mr-1 h-3 w-3" />
            Attendance: {stats.activityCounts["Attendance"]}
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800">
            <Award className="mr-1 h-3 w-3" />
            Leaderboard: {stats.activityCounts["Leaderboard"]}
          </Badge>
        </div>

        {/* Teacher Announcement Broadcast Trigger */}
        <SendAnnouncementModal customBatch={batchData} />
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {[
            { id: "all", label: "All Students" },
            { id: "online", label: `Online (${stats.onlineCount})` },
            { id: "away", label: `Away (${stats.awayCount})` },
            { id: "offline", label: `Offline (${stats.offlineCount})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === item.id
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search student or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {/* Live Student Cards Grid */}
      {filteredRoster.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredRoster.map((student) => (
            <LiveStudentCard
              key={student.userId || student.$id}
              student={student}
              presenceStatus={student.presenceStatus}
              presenceMeta={student.presenceMeta}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-800">
          <Users className="h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">No students found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter options"
              : "No students are currently enrolled in this batch"}
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveClassroom;
