/* eslint-disable react/prop-types */
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import InteractiveAvatar from "./InteractiveAvatar";
import { Users, GraduationCap, Briefcase } from "lucide-react";

const getActivityText = (path) => {
  if (!path) return "Online";
  if (path === "/dash" || path === "/") return "On Dashboard";
  if (path === "/profile") return "Viewing Profile";
  if (path === "/student-attendance" || path === "/attendance") return "Viewing Attendance";
  if (path.includes("mock-test")) return "Taking Mock Test";
  if (path.includes("leaderboard")) return "Checking Leaderboard";
  return "Browsing App";
};

const OnlineBatchMembers = ({ batchId, currentUserId }) => {
  const { onlineUsers } = useOnlineUsers();

  if (!batchId) return null;

  // Filter online users in this batch
  const members = Array.from(onlineUsers.values()).filter(
    (u) => u.metadata?.activeBatchId === batchId
  );

  // Group by role
  const teachers = members.filter((m) => m.metadata?.role === "Teacher");
  const students = members.filter((m) => m.metadata?.role === "Student" || m.metadata?.role !== "Teacher");

  const totalCount = members.length;

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
            Live Batch Members
          </h3>
        </div>
        {totalCount > 0 ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {totalCount} {totalCount === 1 ? "Active" : "Active"}
          </span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            0 Active
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
          No other batch members are online right now.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Teachers Section */}
          {teachers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Instructors
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teachers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-pink-500/5 border border-pink-500/10 dark:bg-pink-900/10 dark:border-pink-900/20"
                  >
                    <InteractiveAvatar
                      src={m.metadata?.profileImage}
                      fallbackText={m.metadata?.userName?.charAt(0) || "T"}
                      userId={m.userId}
                      showStatus={true}
                      statusSize="sm"
                      className="w-10 h-10 shrink-0 ring-2 ring-pink-100 dark:ring-pink-900/30 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {m.metadata?.userName || "Instructor"}
                        {m.userId === currentUserId && (
                          <span className="ml-1.5 text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-pink-600 dark:text-pink-400 font-medium flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3" />
                        {getActivityText(m.metadata?.page)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students Section */}
          {students.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Students
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {students.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <InteractiveAvatar
                      src={m.metadata?.profileImage}
                      fallbackText={m.metadata?.userName?.charAt(0) || "S"}
                      userId={m.userId}
                      showStatus={true}
                      statusSize="sm"
                      className="w-10 h-10 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                        {m.metadata?.userName || "Student"}
                        {m.userId === currentUserId && (
                          <span className="ml-1.5 text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3 h-3 text-purple-500" />
                        {getActivityText(m.metadata?.page)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineBatchMembers;
