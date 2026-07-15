import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ChevronDown, Users, BookOpen, Star, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

// ─── Helpers ────────────────────────────────────────────────────────────────

const attColor = (p) =>
  p >= 95 ? "emerald" : p >= 80 ? "green" : p >= 60 ? "amber" : "red";

const attLabel = (p) =>
  p >= 95 ? "Excellent" : p >= 80 ? "Good" : p >= 60 ? "Average" : "Poor";

const colorMap = {
  emerald: {
    bar:    "from-emerald-400 to-emerald-500",
    text:   "text-emerald-600 dark:text-emerald-400",
    badge:  "bg-emerald-550/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-800/50",
    dot:    "bg-emerald-500",
  },
  green: {
    bar:    "from-green-400 to-green-500",
    text:   "text-green-600 dark:text-green-400",
    badge:  "bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-950/25 dark:text-green-400 dark:border-green-800/50",
    dot:    "bg-green-500",
  },
  amber: {
    bar:    "from-amber-400 to-amber-500",
    text:   "text-amber-605 dark:text-amber-405",
    badge:  "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-950/25 dark:text-amber-405 dark:border-amber-800/50",
    dot:    "bg-amber-500",
  },
  red: {
    bar:    "from-red-400 to-red-500",
    text:   "text-red-650 dark:text-red-450",
    badge:  "bg-red-500/10 text-red-750 border-red-500/20 dark:bg-red-950/25 dark:text-red-400 dark:border-red-800/50",
    dot:    "bg-red-500",
  },
};

// ─── Status Chip Component ──────────────────────────────────────────────────

const StatusChip = ({ percent }) => {
  const c = colorMap[attColor(percent)];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border select-none ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {attLabel(percent)}
    </span>
  );
};

// ─── Student Card (Expandable Row) Component ───────────────────────────────

const StudentCard = ({ row, selectedMonth }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const absent = Math.max(0, (row.totalWorkingDays || 0) - (row.presentDays || 0));
  const c = colorMap[attColor(row.totalAttendancePercent)];

  return (
    <div
      className={`border rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300 ${
        isExpanded
          ? "border-pink-500/30 ring-2 ring-pink-500/20 dark:ring-pink-500/10 scale-[1.005]"
          : "border-slate-100 dark:border-slate-800/40 hover:-translate-y-0.5 hover:shadow-md"
      }`}
    >
      {/* Header clickable to expand */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 sm:py-4 gap-3 sm:gap-4 hover:bg-white/40 dark:hover:bg-slate-950/20 transition-all cursor-pointer select-none"
      >
        {/* Profile Column */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <Avatar className="h-9.5 w-9.5 sm:h-10 sm:w-10 shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm">
            <AvatarImage src={row.profileImage} />
            <AvatarFallback className={`text-xs font-black ${c.badge} border-0`}>
              {row.userName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-slate-805 dark:text-white truncate max-w-[160px] sm:max-w-[220px]">
              {row.userName}
            </p>
            {row.registerId && (
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                {row.registerId}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Attendance, Test stats, Chevron */}
        <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-6 shrink-0 pt-2.5 sm:pt-0 border-t border-slate-100 dark:border-slate-800/40 sm:border-0">
          
          {/* Attendance metric */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-xs sm:text-sm font-black leading-none ${c.text}`}>
                {row.totalAttendancePercent}%
              </p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                Attendance
              </p>
            </div>
          </div>

          {/* Tests metric */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-xl shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-slate-707 dark:text-slate-200 leading-none flex items-center gap-0.5">
                <span>📝 {row.testsSubmitted}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">({row.avgScore}%)</span>
              </p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                Mock Tests
              </p>
            </div>
          </div>

          {/* Chevron Toggle */}
          <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-slate-400 shrink-0">
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180 text-pink-500" : ""}`} />
          </div>
        </div>
      </div>

      {/* Expanded statistics panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 pb-5 bg-slate-50/30 dark:bg-slate-900/10 border-t border-white/5 dark:border-slate-800/20 overflow-hidden"
          >
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Attendance Details */}
              <div className="bg-white/70 dark:bg-slate-950/40 p-4 rounded-2xl space-y-3.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 select-none">
                    <Calendar className="w-4 h-4 text-purple-550 shrink-0" />
                    Attendance Records
                  </span>
                  <StatusChip percent={row.totalAttendancePercent} />
                </div>
                
                <div className="space-y-3">
                  {/* Overall Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-extrabold">
                      <span className="text-slate-500 dark:text-slate-450">Overall Attendance</span>
                      <span className={`font-black ${c.text}`}>
                        {row.totalAttendancePercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-500`}
                        style={{ width: `${Math.min(row.totalAttendancePercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 mt-1 select-none">
                      <span>🟢 Present: {row.presentDays ?? 0}d</span>
                      <span>•</span>
                      <span>🔴 Absent: {absent}d</span>
                      <span>•</span>
                      <span>Total Working: {row.totalWorkingDays ?? 0}d</span>
                    </div>
                  </div>

                  {/* Monthly Progress */}
                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-900/60 pt-2.5">
                    <div className="flex justify-between text-[10px] font-extrabold">
                      <span className="text-slate-500 dark:text-slate-455">Monthly Attendance ({selectedMonth})</span>
                      <span className={`font-black ${colorMap[attColor(row.monthlyAttendancePercent)].text}`}>
                        {row.monthlyAttendancePercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colorMap[attColor(row.monthlyAttendancePercent)].bar} transition-all duration-500`}
                        style={{ width: `${Math.min(row.monthlyAttendancePercent, 105)}%` }}
                      />
                    </div>
                    {(row.monthlyWorkingDays || 0) > 0 ? (
                      <div className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 mt-1 select-none">
                        📅 Monthly Present: {row.monthlyPresentDays ?? 0} / {row.monthlyWorkingDays} working days
                      </div>
                    ) : (
                      <div className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 mt-1 select-none">
                        📅 No working days recorded for this month.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Mock Tests */}
              <div className="bg-white/70 dark:bg-slate-950/40 p-4 rounded-2xl space-y-3.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-505 flex items-center gap-1.5 select-none">
                    <Star className="w-4 h-4 text-yellow-500 shrink-0" />
                    Mock Test Performance
                  </span>
                  <span className="text-[8px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-wider select-none">
                    Scores
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-center pt-1.5">
                  <div className="bg-slate-100/50 dark:bg-slate-900/60 rounded-xl p-2.5">
                    <p className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-205">{row.testsSubmitted ?? 0}</p>
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase mt-1 tracking-wider truncate">Tests Taken</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${
                    (row.avgScore || 0) >= 75 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : (row.avgScore || 0) >= 50 ? 'bg-amber-500/10 text-amber-550 dark:text-amber-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    <p className="text-sm sm:text-base font-black">{row.avgScore !== undefined ? `${row.avgScore}%` : "0%"}</p>
                    <p className="text-[8px] font-extrabold text-slate-400 uppercase mt-1 tracking-wider truncate">Average Score</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const StudentTable = ({ studentRows = [], selectedMonth }) => {
  const [search,      setSearch]      = useState("");
  const [sort,        setSort]        = useState({ field: "totalAttendancePercent", dir: "desc" });
  const [showLowOnly, setShowLowOnly] = useState(false);

  const handleSort = (field) =>
    setSort((p) => p.field === field ? { field, dir: p.dir === "asc" ? "desc" : "asc" } : { field, dir: "desc" });

  const filtered = useMemo(() => {
    let rows = [...studentRows];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.userName?.toLowerCase().includes(q));
    }
    if (showLowOnly) rows = rows.filter((r) => r.totalAttendancePercent < 75);
    rows.sort((a, b) => {
      const va = a[sort.field] ?? 0, vb = b[sort.field] ?? 0;
      return sort.dir === "asc" ? va - vb : vb - va;
    });
    return rows;
  }, [studentRows, search, showLowOnly, sort]);

  // Quick class stats
  const classStats = useMemo(() => {
    if (!studentRows.length) return null;
    const n = studentRows.length;
    return {
      avgAtt:   parseFloat((studentRows.reduce((s, r) => s + r.totalAttendancePercent, 0) / n).toFixed(1)),
      avgScore: parseFloat((studentRows.reduce((s, r) => s + r.avgScore, 0) / n).toFixed(1)),
      lowCount: studentRows.filter((r) => r.totalAttendancePercent < 75).length,
    };
  }, [studentRows]);

  if (studentRows.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-10 text-center">
        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">No students enrolled in this batch yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Quick class summary strip ── */}
      {classStats && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm px-4 py-3 sm:px-5 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 mr-auto min-w-0">
            <Users className="w-4.5 h-4.5 text-purple-500 shrink-0" />
            <span className="text-sm font-extrabold text-slate-805 dark:text-white">
              Students <span className="text-slate-400 font-normal">({studentRows.length})</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center leading-none">
              <span className={`text-sm font-black tabular-nums ${colorMap[attColor(classStats.avgAtt)].text}`}>
                {classStats.avgAtt}%
              </span>
              <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-505 uppercase tracking-wider mt-0.5">AVG ATT.</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/60" />
            <div className="flex flex-col items-center leading-none">
              <span className={`text-sm font-black tabular-nums ${
                classStats.avgScore >= 75 ? "text-emerald-600 dark:text-emerald-400"
                : classStats.avgScore >= 50 ? "text-amber-600 dark:text-amber-400"
                : "text-red-655 dark:text-red-400"
              }`}>
                {classStats.avgScore}%
              </span>
              <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">AVG SCORE</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/60" />
            <div className="flex flex-col items-center leading-none">
              <span className="text-sm font-black tabular-nums text-red-600 dark:text-red-400">
                {classStats.lowCount}
              </span>
              <span className="text-[8px] font-extrabold text-red-400 dark:text-red-500 uppercase tracking-wider mt-0.5">LOW ATT.</span>
            </div>
          </div>
        </div>
      )}

      {/* Main card box containing controls & card list */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm p-4 space-y-4">
        
        {/* ── Search + filter row ── */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400/40 placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowLowOnly(!showLowOnly)}
            className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-colors shrink-0 cursor-pointer ${
              showLowOnly
                ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400"
                : "bg-slate-50 border-slate-200/60 text-slate-500 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
            }`}
            title={showLowOnly ? "Showing low attendance" : "Filter by attendance"}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Sorting Pills Bar ── */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5 border-t border-slate-100 dark:border-slate-800/40 pt-3">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mr-1">Sort By:</span>
          {[
            { id: "totalAttendancePercent", label: "Overall Attendance", icon: Calendar, color: "text-purple-500 bg-purple-500/10 hover:bg-purple-500/15" },
            { id: "monthlyAttendancePercent", label: "This Month", icon: Calendar, color: "text-blue-500 bg-blue-500/10 hover:bg-blue-500/15" },
            { id: "testsSubmitted", label: "Tests Taken", icon: BookOpen, color: "text-pink-500 bg-pink-500/10 hover:bg-pink-500/15" },
            { id: "avgScore", label: "Average Score", icon: Star, color: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/15" },
          ].map((tab) => {
            const isActive = sort.field === tab.id;
            const Icon = tab.icon;
            const isAsc = sort.field === tab.id && sort.dir === "asc";
            return (
              <button
                key={tab.id}
                onClick={() => handleSort(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-pink-650 text-white shadow-sm scale-102"
                    : `${tab.color} border border-transparent`
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
                {isActive && (isAsc ? " ↑" : " ↓")}
              </button>
            );
          })}
        </div>

        {/* ── Card-based Student List ── */}
        <div className="space-y-3 pt-2">
          {filtered.map((row) => (
            <StudentCard
              key={row.studentId}
              row={row}
              selectedMonth={selectedMonth}
            />
          ))}
          {filtered.length === 0 && studentRows.length > 0 && (
            <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
              No students match your search or filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTable;
