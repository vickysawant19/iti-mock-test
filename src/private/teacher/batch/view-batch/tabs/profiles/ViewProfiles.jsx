import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { format } from "date-fns";
import { Search, Users2 } from "lucide-react";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";

import LiveCommandPanel from "./components/LiveCommandPanel";
import StudentCardItem from "./components/StudentCardItem";
import StudentManagementModal from "./components/StudentManagementModal";

const ViewProfiles = ({ students = [], batchId, batchData }) => {
  const profile = useSelector(selectProfile);

  const effectiveBatchId = batchData?.$id || batchData?.id || batchId;
  const teamId = batchData?.teamId || effectiveBatchId;
  const { onlineUsers } = useOnlineUsers(teamId);

  const todayFormattedDisplay = useMemo(() => format(new Date(), "EEEE, d MMMM yyyy"), []);

  // UI Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [presenceFilter, setPresenceFilter] = useState("all"); // 'all', 'online', 'away', 'offline'
  
  // Profile Detail Modal State
  const [viewProfileUserId, setViewProfileUserId] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState("profile");

  // Filter valid student list (exclude teachers & logged-in user if needed)
  const actualStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    return students.filter(
      (s) => !s.isTeacher && !s.role?.includes("Teacher") && s.userId !== profile?.userId
    );
  }, [students, profile?.userId]);

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

  // Selected Student for Modal
  const selectedStudent = useMemo(() => {
    if (!viewProfileUserId) return null;
    return studentRoster.find(
      (s) => s.userId === viewProfileUserId || s.$id === viewProfileUserId
    );
  }, [viewProfileUserId, studentRoster]);

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

    return {
      total: studentRoster.length,
      onlineCount,
      awayCount,
      offlineCount,
      activityCounts,
    };
  }, [studentRoster]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return studentRoster.filter((student) => {
      const q = searchTerm.toLowerCase();
      const nameMatch = (student.userName || student.name || "").toLowerCase().includes(q);
      const rollMatch = (student.studentId || student.rollNumber || "").toLowerCase().includes(q);
      const regMatch = (student.registerId || "").toLowerCase().includes(q);
      const emailMatch = (student.email || "").toLowerCase().includes(q);

      if (!nameMatch && !rollMatch && !regMatch && !emailMatch) return false;

      if (presenceFilter !== "all" && student.presenceStatus !== presenceFilter) {
        return false;
      }

      return true;
    });
  }, [studentRoster, searchTerm, presenceFilter]);

  if (!students || !students.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <Users2 className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          No Students Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
          There are no students enrolled in this batch yet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6">
      {/* ── FULL WIDTH FLEX / GRID LAYOUT ── */}
      <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
        
        {/* ── LEFT SIDE — LIVE CLASSROOM COMMAND PANEL (Reusable Component) ── */}
        <LiveCommandPanel
          todayFormattedDisplay={todayFormattedDisplay}
          stats={stats}
          batchData={batchData}
          presenceFilter={presenceFilter}
          setPresenceFilter={setPresenceFilter}
          studentRosterCount={studentRoster.length}
        />

        {/* ── RIGHT SIDE — STUDENT CARDS GRID ── */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Top Header with Prominent Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pb-1">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
              Student Profiles Roster
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                {filteredRoster.length}
              </span>
            </h2>

            {/* Search Bar at Top */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, Roll No, Reg ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 dark:text-white shadow-sm"
              />
            </div>
          </div>

          {/* Grid with Increased Student Card Widths (Reusable StudentCardItem) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredRoster.map((student, index) => (
              <StudentCardItem
                key={student.userId || student.$id || index}
                student={student}
                onOpenDetailModal={setViewProfileUserId}
              />
            ))}

            {filteredRoster.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400 font-medium italic text-sm">
                  No students match your search or presence filter.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── ENHANCED STUDENT MANAGEMENT DIALOG MODAL (Reusable Component) ── */}
      <StudentManagementModal
        viewProfileUserId={viewProfileUserId}
        setViewProfileUserId={setViewProfileUserId}
        activeProfileTab={activeProfileTab}
        setActiveProfileTab={setActiveProfileTab}
        selectedStudent={selectedStudent}
        effectiveBatchId={effectiveBatchId}
      />
    </div>
  );
};

export default ViewProfiles;
