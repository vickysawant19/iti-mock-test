import React from "react";
import {
  Smartphone,
  Laptop,
  Clock,
  BookOpen,
  ClipboardList,
  Award,
  LayoutDashboard,
  ShieldCheck,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fixProfileImageUrl } from "@/utils/fixProfileImageUrl";

const getActivityBadge = (activity) => {
  switch (activity) {
    case "Mock Test":
      return {
        label: "Mock Test",
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        icon: BookOpen,
      };
    case "Attendance":
      return {
        label: "Attendance",
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        icon: ClipboardList,
      };
    case "Leaderboard":
      return {
        label: "Leaderboard",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        icon: Award,
      };
    default:
      return {
        label: activity || "Dashboard",
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        icon: LayoutDashboard,
      };
  }
};

export const LiveStudentCard = ({ student, presenceStatus, presenceMeta }) => {
  const status = presenceStatus || "offline";
  const isOnline = status === "online";
  const isAway = status === "away";

  const activityInfo = getActivityBadge(presenceMeta?.activity);
  const ActivityIcon = activityInfo.icon;
  const isMobile = presenceMeta?.device === "mobile";

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "N/A";
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
        isOnline
          ? "border-emerald-500/30 bg-emerald-50/20 dark:border-emerald-900/50 dark:bg-emerald-950/10"
          : isAway
          ? "border-amber-500/30 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-950/10"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Avatar & Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {student.profileImage ? (
              <img
                src={fixProfileImageUrl(student.profileImage)}
                alt={student.userName || "Student"}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold dark:bg-slate-800 dark:text-slate-300">
                {student.userName ? student.userName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
              </div>
            )}

            {/* Live Indicator Dot */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                isOnline
                  ? "bg-emerald-500 animate-pulse"
                  : isAway
                  ? "bg-amber-500"
                  : "bg-slate-400"
              }`}
            />
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
              {student.userName || "Unnamed Student"}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Roll: {student.studentId || "N/A"}</span>
              {student.tradeName && <span>• {student.tradeName}</span>}
            </div>
          </div>
        </div>

        {/* Device Icon */}
        <div className="text-slate-400 dark:text-slate-500" title={isMobile ? "Mobile Device" : "Desktop Device"}>
          {isMobile ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
        </div>
      </div>

      {/* Activity & Last Seen Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800/80 text-xs">
        {/* Current Activity Badge */}
        {isOnline || isAway ? (
          <Badge
            variant="outline"
            className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium ${activityInfo.color}`}
          >
            <ActivityIcon className="h-3 w-3" />
            <span>{activityInfo.label}</span>
          </Badge>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Offline</span>
        )}

        {/* Heartbeat / Last Seen */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{isOnline ? "Active now" : formatLastSeen(presenceMeta?.lastSeen || presenceMeta?.lastActivity)}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveStudentCard;
