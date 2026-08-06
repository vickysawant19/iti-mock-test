import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Eye, Phone, IdCard, UserCircle2, Calendar } from "lucide-react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import { Badge } from "@/components/ui/badge";

const StudentCardItem = ({ student, onOpenDetailModal }) => {
  const presence = student.presenceStatus;
  const activity = student.presenceMeta?.activity || "Dashboard";
  const lastSeenTime =
    student.presenceMeta?.lastSeen ||
    student.presenceMeta?.lastActivity ||
    student.lastseen;

  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden flex flex-col min-w-0">
      {/* Profile Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <InteractiveAvatar
            src={student.profileImage}
            fallbackText={student.userName?.charAt(0) || "U"}
            userId={student.userId || student.$id}
            editable={false}
            showStatus={true}
            statusSize="xs"
            className="w-13 h-13 rounded-2xl ring-2 ring-gray-100 dark:ring-gray-800 shadow-md text-xl font-black shrink-0"
          />
          
          {/* Live Presence Badge */}
          {presence === "online" ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider gap-1.5 py-1 px-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {activity}
            </Badge>
          ) : presence === "away" ? (
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold uppercase tracking-wider gap-1.5 py-1 px-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Away
            </Badge>
          ) : (
            <div
              className={`px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-widest ${
                student.status?.toLowerCase() === "active"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {student.status || "offline"}
            </div>
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {student.userName || student.name || "Student"}
          </h3>
          {presence === "offline" && lastSeenTime && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Active {formatDistanceToNow(new Date(lastSeenTime), { addSuffix: true })}
            </p>
          )}
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
            {student.email || "No email"}
          </p>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="px-4 py-3 grid grid-cols-1 gap-2 bg-gray-50/60 dark:bg-gray-800/30 border-y border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
            <IdCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-0.5">
              Roll Number / ID
            </p>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
              {student.studentId || student.rollNumber || "PENDING"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
            <IdCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-0.5">
              Registration ID
            </p>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
              {student.registerId || "N/A"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
            <UserCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-0.5">
              Trade Roles
            </p>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
              {Array.isArray(student.role)
                ? student.role.join(", ")
                : student.role || "Trainee"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-0.5">
              Admission Date
            </p>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
              {student.enrolledAt
                ? format(new Date(student.enrolledAt), "MMM dd, yyyy")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto p-2.5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2">
        <button
          onClick={() => onOpenDetailModal(student.userId || student.$id)}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all active:scale-95 border border-transparent hover:border-blue-100 dark:hover:border-blue-800 cursor-pointer font-bold"
          title="View Full Profile"
        >
          <Eye className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">
            Detail
          </span>
        </button>

        <a
          href={`tel:${student.phone}`}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-all active:scale-95 border border-transparent hover:border-green-100 dark:hover:border-green-800 cursor-pointer font-bold"
          title="Call Student"
        >
          <Phone className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">
            Call
          </span>
        </a>
      </div>
    </div>
  );
};

export default StudentCardItem;
