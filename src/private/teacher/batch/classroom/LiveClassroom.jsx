import React, { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  Clock,
  Search,
  BookOpen,
  ClipboardList,
  Award,
  Sparkles,
  Calendar,
  Radio,
} from "lucide-react";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SendAnnouncementModal from "@/components/notifications/SendAnnouncementModal";

export const LiveClassroom = ({ students = [], batchData }) => {
  const batchId = batchData?.$id || batchData?.id;
  const teamId = batchData?.teamId || batchId;
  const { onlineUsers } = useOnlineUsers(teamId);

  const todayFormattedDisplay = useMemo(() => format(new Date(), "EEEE, d MMMM yyyy"), []);

  // UI Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [presenceFilter, setPresenceFilter] = useState("all"); // 'all', 'online', 'away', 'offline'

  // Filter valid student list (exclude teachers)
  const actualStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    return students.filter((s) => !s.isTeacher && !s.role?.includes("Teacher"));
  }, [students]);

  // Enrich Student Roster with Realtime Presence
  const studentRoster = useMemo(() => {
    return actualStudents.map((student) => {
      const presence = onlineUsers.get(student.userId) || onlineUsers.get(student.$id);
      const liveStatus = presence?.status || "offline";
      const liveMeta = presence?.metadata || {};

      return {
        ...student,
        presenceStatus: liveStatus,
        presenceMeta: liveMeta,
      };
    });
  }, [actualStudents, onlineUsers]);

  // Compute Realtime Statistics
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

    const total = studentRoster.length;

    return {
      total,
      onlineCount,
      awayCount,
      offlineCount,
      activityCounts,
    };
  }, [studentRoster]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return studentRoster.filter((student) => {
      const nameMatch = (student.userName || student.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const rollMatch = (student.studentId || student.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!nameMatch && !rollMatch) return false;

      if (presenceFilter !== "all" && student.presenceStatus !== presenceFilter) {
        return false;
      }

      return true;
    });
  }, [studentRoster, searchTerm, presenceFilter]);

  return (
    <div className="space-y-5">
      {/* ── UNIFIED COMMAND CENTER HEADER BAR ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Dark Navy / Indigo Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Today's Date & Live Status Badges */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 backdrop-blur-md flex-shrink-0">
                <Calendar className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Live Classroom Monitor
                  </span>
                  {/* Realtime Live Online Badge */}
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {stats.onlineCount} Active Now
                  </Badge>
                </div>

                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                  {todayFormattedDisplay}
                </h3>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              {/* Send Announcement Trigger */}
              <SendAnnouncementModal customBatch={batchData} />
            </div>
          </div>

          {/* ── METRICS STRIP ── */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 pt-3 border-t border-white/10">
            {/* Total Enrolled */}
            <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <span>Total Enrolled</span>
                <Users className="h-3.5 w-3.5 text-indigo-300" />
              </div>
              <p className="mt-1 text-base sm:text-lg font-bold text-white">{stats.total}</p>
            </div>

            {/* Online Live */}
            <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300">
                <span>Online Now</span>
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="mt-1 text-base sm:text-lg font-bold text-emerald-300">
                {stats.onlineCount}{" "}
                <span className="text-[10px] text-emerald-400/80 font-normal">
                  ({stats.total > 0 ? Math.round((stats.onlineCount / stats.total) * 100) : 0}%)
                </span>
              </p>
            </div>

            {/* Away */}
            <div className="rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-amber-300">
                <span>Away</span>
                <Clock className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="mt-1 text-base sm:text-lg font-bold text-amber-300">{stats.awayCount}</p>
            </div>

            {/* Offline */}
            <div className="rounded-xl bg-slate-500/10 p-2.5 border border-slate-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <span>Offline</span>
                <Clock className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <p className="mt-1 text-base sm:text-lg font-bold text-slate-300">{stats.offlineCount}</p>
            </div>
          </div>

          {/* ── ACTIVE TASKS BREAKDOWN STRIP ── */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs text-slate-300">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Active Tasks Breakdown:
            </span>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-400/30 text-[11px]">
              <BookOpen className="mr-1 h-3 w-3" />
              Mock Test: {stats.activityCounts["Mock Test"]}
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-400/30 text-[11px]">
              <ClipboardList className="mr-1 h-3 w-3" />
              Attendance: {stats.activityCounts["Attendance"]}
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-400/30 text-[11px]">
              <Award className="mr-1 h-3 w-3" />
              Leaderboard: {stats.activityCounts["Leaderboard"]}
            </Badge>
          </div>
        </div>

        {/* ── WORKSPACE AREA ── */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Controls & Filters Bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pt-1">
            {/* Realtime Status Filter Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/80 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Live Status:</span>
              {[
                { id: "all", label: `All (${studentRoster.length})` },
                { id: "online", label: `Online (${stats.onlineCount})` },
                { id: "away", label: `Away (${stats.awayCount})` },
                { id: "offline", label: `Offline (${stats.offlineCount})` },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPresenceFilter(item.id)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    presenceFilter === item.id
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search student or roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          {/* Student Roster Cards Grid */}
          {filteredRoster.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRoster.map((student) => {
                const presence = student.presenceStatus;
                const activity = student.presenceMeta?.activity || "Dashboard";
                const lastSeenTime =
                  student.presenceMeta?.lastSeen ||
                  student.presenceMeta?.lastActivity ||
                  student.lastseen;
                
                const getLastSeenText = () => {
                  if (!lastSeenTime) return "Never active";
                  try {
                    const d = new Date(lastSeenTime);
                    if (isNaN(d.getTime())) return "Never active";
                    return formatDistanceToNow(d, { addSuffix: true });
                  } catch {
                    return "Never active";
                  }
                };

                return (
                  <div
                    key={student.userId || student.$id}
                    className="flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-700 bg-white dark:bg-slate-900 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <InteractiveAvatar
                          src={student.profileImage}
                          fallbackText={
                            student.userName
                              ? student.userName.charAt(0).toUpperCase()
                              : "S"
                          }
                          userId={student.userId}
                          userName={student.userName || student.name}
                          lastseen={lastSeenTime}
                          showStatus={true}
                          editable={false}
                          className="h-11 w-11 border border-slate-200 dark:border-slate-700"
                        />
                        <span
                          title={`Live status: ${presence}`}
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                            presence === "online"
                              ? "bg-emerald-500"
                              : presence === "away"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {student.userName || student.name || "Student"}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-mono flex-shrink-0"
                          >
                            Roll: {student.studentId || student.rollNumber || "NA"}
                          </Badge>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
                          <span
                            className={`font-semibold capitalize ${
                              presence === "online"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : presence === "away"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-400"
                            }`}
                          >
                            {presence}
                          </span>
                          {presence === "online" ? (
                            <span className="text-slate-400 dark:text-slate-500 truncate">
                              · {activity}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 truncate" title={`Last active: ${lastSeenTime ? new Date(lastSeenTime).toLocaleString() : "N/A"}`}>
                              · Last active {getLastSeenText()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Users className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No matching students found
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Try adjusting your search term or presence filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClassroom;
