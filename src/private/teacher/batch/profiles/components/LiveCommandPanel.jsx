import React from "react";
import {
  Calendar,
  Sparkles,
  BookOpen,
  ClipboardList,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SendAnnouncementModal from "@/components/notifications/SendAnnouncementModal";

const LiveCommandPanel = ({
  todayFormattedDisplay,
  stats,
  batchData,
  presenceFilter,
  setPresenceFilter,
  studentRosterCount,
}) => {
  return (
    <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4 lg:sticky lg:top-20 self-start">
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
        
        {/* Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-2xl text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-300" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                Live Classroom
              </span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] gap-1 px-2 py-0.5 font-bold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              {stats.onlineCount} Active
            </Badge>
          </div>

          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              {todayFormattedDisplay}
            </h3>
          </div>

          {/* Announcement Trigger */}
          <div className="pt-1">
            <SendAnnouncementModal customBatch={batchData} />
          </div>
        </div>

        {/* Metrics Strip Cards */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            Class Stats
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Total Enrolled</span>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Online Now</span>
              <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.onlineCount}</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">Away</span>
              <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.awayCount}</p>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800/80 p-3 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Offline</span>
              <p className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5">{stats.offlineCount}</p>
            </div>
          </div>
        </div>

        {/* Active Tasks Breakdown */}
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Active Tasks
          </span>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-400/30 text-[11px] py-1 px-2.5 font-bold">
              <BookOpen className="mr-1 h-3.5 w-3.5" />
              Mock Test: {stats.activityCounts["Mock Test"]}
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-400/30 text-[11px] py-1 px-2.5 font-bold">
              <ClipboardList className="mr-1 h-3.5 w-3.5" />
              Attendance: {stats.activityCounts["Attendance"]}
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-400/30 text-[11px] py-1 px-2.5 font-bold">
              <Award className="mr-1 h-3.5 w-3.5" />
              Leaderboard: {stats.activityCounts["Leaderboard"]}
            </Badge>
          </div>
        </div>

        {/* Presence Filter */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
            Presence Filter
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: "all", label: `All (${studentRosterCount})` },
              { id: "online", label: `Online (${stats.onlineCount})` },
              { id: "away", label: `Away (${stats.awayCount})` },
              { id: "offline", label: `Offline (${stats.offlineCount})` },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPresenceFilter(item.id)}
                className={`rounded-xl px-2.5 py-2 text-xs font-bold text-center transition-all cursor-pointer ${
                  presenceFilter === item.id
                    ? "bg-slate-900 text-white shadow-md dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LiveCommandPanel;
