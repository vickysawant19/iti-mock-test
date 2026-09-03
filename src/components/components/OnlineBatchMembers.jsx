/* eslint-disable react/prop-types */
import React, { useState, useMemo } from "react";
import { useBatchPresence } from "@/hooks/useOnlineUsers";
import InteractiveAvatar from "./InteractiveAvatar";
import { Users, GraduationCap, Briefcase } from "lucide-react";

const OnlineBatchMembers = ({
  batchId,
  currentUserId,
  studentRows = [],
  compact = false,
  align = "left",
}) => {
  const { members, teachers, students, totalCount, getActivity } =
    useBatchPresence(batchId, studentRows, currentUserId);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "teachers" | "students"

  // Ordered list prioritizing instructors first for avatar stack preview
  const previewMembers = useMemo(
    () => [...teachers, ...students],
    [teachers, students]
  );

  if (!batchId) return null;

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 bg-white/70 dark:bg-slate-900/70 hover:bg-white/90 dark:hover:bg-slate-800/90 border border-slate-200/50 dark:border-slate-800 rounded-xl px-2.5 py-1 backdrop-blur-md transition-all active:scale-95 cursor-pointer pointer-events-auto shadow-sm select-none"
        >
          {totalCount > 0 ? (
            <div className="flex -space-x-1.5 overflow-hidden">
              {previewMembers.slice(0, 4).map((m) => {
                const isTeacher =
                  m.metadata?.role === "Teacher" ||
                  (Array.isArray(m.metadata?.role) &&
                    m.metadata.role.includes("Teacher"));
                return (
                  <InteractiveAvatar
                    key={m.userId}
                    src={m.metadata?.profileImage}
                    fallbackText={m.metadata?.userName?.charAt(0) || "U"}
                    userId={m.userId}
                    showStatus={true}
                    statusSize="xs"
                    userName={m.metadata?.userName || "Member"}
                    className={`w-5.5 h-5.5 rounded-full border shrink-0 ${
                      isTeacher
                        ? "border-pink-300 dark:border-pink-800 ring-1 ring-pink-500/40"
                        : "border-white dark:border-slate-900"
                    }`}
                  />
                );
              })}
              {previewMembers.length > 4 && (
                <div className="flex items-center justify-center w-5.5 h-5.5 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 text-[8px] font-black text-slate-500 dark:text-slate-400 z-10">
                  +{previewMembers.length - 4}
                </div>
              )}
            </div>
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400 dark:bg-slate-650" />
            </span>
          )}

          {/* Role-separated status text */}
          {totalCount === 0 ? (
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
              0 Active
            </span>
          ) : teachers.length > 0 && students.length > 0 ? (
            <div className="flex items-center gap-1.5 text-[10px] font-black whitespace-nowrap">
              <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                {teachers.length} {teachers.length === 1 ? "Teacher" : "Teachers"}
              </span>
              <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {students.length} {students.length === 1 ? "Student" : "Students"}
              </span>
            </div>
          ) : teachers.length > 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-black text-pink-600 dark:text-pink-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              {teachers.length} {teachers.length === 1 ? "Teacher" : "Teachers"}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {students.length} {students.length === 1 ? "Student" : "Students"}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            {/* Click-outside backdrop to close popover */}
            <div
              className="fixed inset-0 z-40 pointer-events-auto cursor-default"
              onClick={() => setIsOpen(false)}
            />
            {/* Floating popover */}
            <div
              className={`absolute top-full mt-2 w-80 max-h-96 overflow-y-auto z-50 rounded-2xl bg-white/95 dark:bg-slate-950/95 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-3.5 backdrop-blur-xl pointer-events-auto animate-in fade-in slide-in-from-top-1 duration-150 ${
                align === "right" ? "right-0" : "left-0"
              }`}
            >
              {/* Header with separated badges */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Lobby
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    {teachers.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-black bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200/60 dark:border-pink-900/50">
                        {teachers.length} T
                      </span>
                    )}
                    {students.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                        {students.length} S
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Filter Pills */}
              {totalCount > 0 && (teachers.length > 0 && students.length > 0) && (
                <div className="flex items-center gap-1 mb-3 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg select-none">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`flex-1 text-[9.5px] font-black py-1 px-2 rounded-md transition-all ${
                      activeFilter === "all"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    onClick={() => setActiveFilter("teachers")}
                    className={`flex-1 text-[9.5px] font-black py-1 px-2 rounded-md transition-all ${
                      activeFilter === "teachers"
                        ? "bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-xs"
                        : "text-slate-500 hover:text-pink-600 dark:hover:text-pink-400"
                    }`}
                  >
                    Teachers ({teachers.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter("students")}
                    className={`flex-1 text-[9.5px] font-black py-1 px-2 rounded-md transition-all ${
                      activeFilter === "students"
                        ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                    }`}
                  >
                    Students ({students.length})
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {totalCount === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 font-semibold">
                    No batch members are online right now.
                  </p>
                ) : (
                  <>
                    {/* Teachers Section */}
                    {teachers.length > 0 &&
                      (activeFilter === "all" || activeFilter === "teachers") && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-pink-500" />
                            Instructors ({teachers.length})
                          </p>
                          <div className="space-y-1">
                            {teachers.map((m) => (
                              <div
                                key={m.userId}
                                className="flex items-center gap-2 p-1.5 rounded-xl bg-pink-500/5 border border-pink-500/10 dark:bg-pink-900/10 dark:border-pink-900/20"
                              >
                                <InteractiveAvatar
                                  src={m.metadata?.profileImage}
                                  fallbackText={
                                    m.metadata?.userName?.charAt(0) || "T"
                                  }
                                  userId={m.userId}
                                  showStatus={true}
                                  statusSize="xs"
                                  userName={m.metadata?.userName || "Instructor"}
                                  className="w-7 h-7 shrink-0 rounded-lg ring-2 ring-pink-100 dark:ring-pink-900/30"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">
                                      {m.metadata?.userName || "Instructor"}
                                      {m.userId === currentUserId && (
                                        <span className="ml-1 text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded">
                                          You
                                        </span>
                                      )}
                                    </p>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/60 px-1 py-0.5 rounded shrink-0">
                                      Teacher
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-pink-600 dark:text-pink-400 font-medium truncate flex items-center gap-0.5">
                                    <Briefcase className="w-2.5 h-2.5" />
                                    {getActivity(m.metadata?.page)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Students Section */}
                    {students.length > 0 &&
                      (activeFilter === "all" || activeFilter === "students") && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-purple-500" />
                            Students ({students.length})
                          </p>
                          <div className="space-y-1">
                            {students.map((m) => (
                              <div
                                key={m.userId}
                                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900/50"
                              >
                                <InteractiveAvatar
                                  src={m.metadata?.profileImage}
                                  fallbackText={
                                    m.metadata?.userName?.charAt(0) || "S"
                                  }
                                  userId={m.userId}
                                  showStatus={true}
                                  statusSize="xs"
                                  userName={m.metadata?.userName || "Student"}
                                  className="w-7 h-7 shrink-0 rounded-lg"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                      {m.metadata?.userName || "Student"}
                                      {m.userId === currentUserId && (
                                        <span className="ml-1 text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded">
                                          You
                                        </span>
                                      )}
                                    </p>
                                    {(m.metadata?.rollNumber ||
                                      m.metadata?.registerId) && (
                                      <span className="text-[8.5px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                                        {m.metadata?.rollNumber
                                          ? `#${m.metadata.rollNumber}`
                                          : m.metadata?.registerId}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate flex items-center gap-0.5">
                                    <GraduationCap className="w-2.5 h-2.5 text-purple-500" />
                                    {getActivity(m.metadata?.page)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Non-compact card mode
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
            Live Batch Members
          </h3>
        </div>
        {totalCount > 0 ? (
          <div className="flex items-center gap-1.5">
            {teachers.length > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400 border border-pink-200/50 dark:border-pink-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                {teachers.length} {teachers.length === 1 ? "Teacher" : "Teachers"}
              </span>
            )}
            {students.length > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {students.length} {students.length === 1 ? "Student" : "Students"}
              </span>
            )}
          </div>
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
              <p className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-pink-500" />
                Instructors ({teachers.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teachers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-2.5 p-2 rounded-2xl bg-pink-500/5 border border-pink-500/10 dark:bg-pink-900/10 dark:border-pink-900/20"
                  >
                    <InteractiveAvatar
                      src={m.metadata?.profileImage}
                      fallbackText={m.metadata?.userName?.charAt(0) || "T"}
                      userId={m.userId}
                      showStatus={true}
                      statusSize="sm"
                      userName={m.metadata?.userName || "Instructor"}
                      className="w-8 h-8 shrink-0 ring-2 ring-pink-100 dark:ring-pink-900/30 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {m.metadata?.userName || "Instructor"}
                          {m.userId === currentUserId && (
                            <span className="ml-1.5 text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/60 px-1.5 py-0.5 rounded shrink-0">
                          Teacher
                        </span>
                      </div>
                      <p className="text-xs text-pink-600 dark:text-pink-400 font-medium flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3" />
                        {getActivity(m.metadata?.page)}
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
              <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-purple-500" />
                Students ({students.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {students.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <InteractiveAvatar
                      src={m.metadata?.profileImage}
                      fallbackText={m.metadata?.userName?.charAt(0) || "S"}
                      userId={m.userId}
                      showStatus={true}
                      statusSize="sm"
                      userName={m.metadata?.userName || "Student"}
                      className="w-8 h-8 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                          {m.metadata?.userName || "Student"}
                          {m.userId === currentUserId && (
                            <span className="ml-1.5 text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        {(m.metadata?.rollNumber || m.metadata?.registerId) && (
                          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                            {m.metadata?.rollNumber
                              ? `#${m.metadata.rollNumber}`
                              : m.metadata?.registerId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3 h-3 text-purple-500" />
                        {getActivity(m.metadata?.page)}
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
