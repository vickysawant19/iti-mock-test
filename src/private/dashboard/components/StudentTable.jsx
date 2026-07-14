import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ChevronUp, ChevronDown, Users, CheckCircle, XCircle, Calendar, BookOpen, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ─── Helpers ────────────────────────────────────────────────────────────────

const attColor = (p) =>
  p >= 95 ? "emerald" : p >= 80 ? "green" : p >= 60 ? "amber" : "red";

const attLabel = (p) =>
  p >= 95 ? "Excellent" : p >= 80 ? "Good" : p >= 60 ? "Average" : "Poor";

const colorMap = {
  emerald: {
    bar:    "from-emerald-400 to-emerald-500",
    text:   "text-emerald-600 dark:text-emerald-400",
    badge:  "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-900/25 dark:text-emerald-400 dark:border-emerald-800/50",
    dot:    "bg-emerald-500",
  },
  green: {
    bar:    "from-green-400 to-green-500",
    text:   "text-green-600 dark:text-green-400",
    badge:  "bg-green-50 text-green-700 border-green-200/70 dark:bg-green-900/25 dark:text-green-400 dark:border-green-800/50",
    dot:    "bg-green-500",
  },
  amber: {
    bar:    "from-amber-400 to-amber-500",
    text:   "text-amber-600 dark:text-amber-400",
    badge:  "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-900/25 dark:text-amber-400 dark:border-amber-800/50",
    dot:    "bg-amber-500",
  },
  red: {
    bar:    "from-red-400 to-red-500",
    text:   "text-red-600 dark:text-red-400",
    badge:  "bg-red-50 text-red-700 border-red-200/70 dark:bg-red-900/25 dark:text-red-400 dark:border-red-800/50",
    dot:    "bg-red-500",
  },
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatusChip = ({ percent }) => {
  const c = colorMap[attColor(percent)];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {attLabel(percent)}
    </span>
  );
};

const ProgressBar = ({ percent }) => {
  const c = colorMap[attColor(percent)];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-black tabular-nums w-10 text-right ${c.text}`}>
        {percent}%
      </span>
    </div>
  );
};

const SortHeader = ({ label, field, currentSort, onSort }) => {
  const isActive = currentSort.field === field;
  const Icon = isActive && currentSort.dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer"
    >
      {label}
      <Icon className={`w-3 h-3 ${isActive ? "text-pink-500" : "text-slate-300 dark:text-slate-600"}`} />
    </button>
  );
};

// ─── Desktop row ─────────────────────────────────────────────────────────────

const DesktopRow = ({ row }) => {
  const absent = Math.max(0, (row.totalWorkingDays || 0) - (row.presentDays || 0));
  const mAbsent = Math.max(0, (row.monthlyWorkingDays || 0) - (row.monthlyPresentDays || 0));
  const c = colorMap[attColor(row.totalAttendancePercent)];

  return (
    <tr className="border-b border-slate-100/60 dark:border-slate-800/40 hover:bg-pink-50/20 dark:hover:bg-pink-900/5 transition-colors group">
      {/* Student */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm">
            <AvatarImage src={row.profileImage} />
            <AvatarFallback className={`text-xs font-black ${c.badge} border-0`}>
              {row.userName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[220px]">{row.userName}</p>
            {row.registerId && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{row.registerId}</p>}
          </div>
        </div>
      </td>

      {/* Overall attendance — bar + chips */}
      <td className="px-3 py-3 min-w-[170px]">
        <div className="flex flex-col gap-1.5">
          <ProgressBar percent={row.totalAttendancePercent} />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 tabular-nums">
              🟢 {row.presentDays ?? 0}
            </span>
            <span className="text-[9px] font-bold text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded border border-red-200/50 dark:border-red-800/40 tabular-nums">
              🔴 {absent}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
              /{row.totalWorkingDays ?? 0}d
            </span>
          </div>
        </div>
      </td>

      {/* Monthly compact */}
      <td className="px-3 py-3 hidden sm:table-cell">
        <div className="flex flex-col gap-1">
          <span className={`text-sm font-black tabular-nums ${colorMap[attColor(row.monthlyAttendancePercent)].text}`}>
            {row.monthlyAttendancePercent}%
          </span>
          {(row.monthlyWorkingDays || 0) > 0 ? (
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
              📅 {row.monthlyPresentDays ?? 0}/{row.monthlyWorkingDays}d
            </span>
          ) : (
            <span className="text-[9px] text-slate-300 dark:text-slate-600">—</span>
          )}
        </div>
      </td>

      {/* Tests + Score */}
      <td className="px-3 py-3 hidden md:table-cell">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">📝 {row.testsSubmitted}</span>
          <span className={`text-[11px] font-black tabular-nums ${
            row.avgScore >= 75 ? "text-emerald-600 dark:text-emerald-400"
            : row.avgScore >= 50 ? "text-amber-600 dark:text-amber-400"
            : "text-red-600 dark:text-red-400"
          }`}>⭐ {row.avgScore}%</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <StatusChip percent={row.totalAttendancePercent} />
      </td>
    </tr>
  );
};

// ─── Mobile card ─────────────────────────────────────────────────────────────

const MobileCard = ({ row }) => {
  const absent  = Math.max(0, (row.totalWorkingDays  || 0) - (row.presentDays       || 0));
  const mWorking = row.monthlyWorkingDays || 0;
  const mPresent = row.monthlyPresentDays || 0;
  const mText = mWorking > 0 ? `${mPresent}/${mWorking}d` : "—";
  const c = colorMap[attColor(row.totalAttendancePercent)];

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100/80 dark:border-slate-800/80 shadow-sm p-4 rounded-3xl flex flex-col gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
      {/* Top section: Avatar + Name on left, Status + % on right */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm">
            <AvatarImage src={row.profileImage} />
            <AvatarFallback className={`text-sm font-black ${c.badge} border-0`}>
              {row.userName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 dark:text-white truncate leading-tight">
              {row.userName}
            </p>
            {row.registerId && (
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                {row.registerId}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusChip percent={row.totalAttendancePercent} />
          <span className={`text-base font-black tabular-nums leading-none ${c.text}`}>
            {row.totalAttendancePercent}%
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-slate-100 dark:bg-slate-800/60" />

      {/* Grid of 5 stats */}
      <div className="grid grid-cols-5 gap-1.5 w-full">
        {/* Stat 1: Present */}
        <div className="flex flex-col items-center text-center">
          <div className="p-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-1 flex items-center justify-center shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black text-slate-850 dark:text-white leading-tight">
            {row.presentDays ?? 0}
          </span>
          <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">
            Present
          </span>
        </div>

        {/* Stat 2: Absent */}
        <div className="flex flex-col items-center text-center">
          <div className="p-1 rounded-full bg-red-500/10 dark:bg-red-950/30 text-red-600 dark:text-red-400 mb-1 flex items-center justify-center shrink-0">
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black text-slate-850 dark:text-white leading-tight">
            {absent}
          </span>
          <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">
            Absent
          </span>
        </div>

        {/* Stat 3: This Month */}
        <div className="flex flex-col items-center text-center">
          <div className="p-1 rounded-full bg-blue-500/10 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 mb-1 flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black text-slate-850 dark:text-white leading-tight">
            {mText}
          </span>
          <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">
            This Month
          </span>
        </div>

        {/* Stat 4: Tests */}
        <div className="flex flex-col items-center text-center">
          <div className="p-1 rounded-full bg-amber-500/10 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 mb-1 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black text-slate-850 dark:text-white leading-tight">
            {row.testsSubmitted ?? 0}
          </span>
          <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">
            Tests
          </span>
        </div>

        {/* Stat 5: Avg Score */}
        <div className="flex flex-col items-center text-center">
          <div className="p-1 rounded-full bg-yellow-500/10 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 mb-1 flex items-center justify-center shrink-0">
            <Star className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black text-slate-850 dark:text-white leading-tight">
            {row.avgScore ?? 0}%
          </span>
          <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">
            Avg Score
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const StudentTable = ({ studentRows = [], selectedMonth }) => {
  const [search,      setSearch]      = useState("");
  const [sort,        setSort]        = useState({ field: "totalAttendancePercent", dir: "desc" });
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showFilter,  setShowFilter]  = useState(false);

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
    <div className="bg-transparent sm:bg-white/60 sm:dark:bg-slate-900/60 sm:backdrop-blur-xl sm:border sm:border-white/40 sm:dark:border-slate-800 sm:rounded-3xl sm:shadow-sm sm:overflow-hidden">

      {/* ── Quick class summary strip ───────────────────────────────────── */}
      {classStats && (
        <div className="px-4 py-3 sm:px-5 border-b border-slate-100 dark:border-slate-800/40 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 mr-auto min-w-0">
            <Users className="w-4.5 h-4.5 text-purple-500 shrink-0" />
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">
              Students <span className="text-slate-400 font-normal">({studentRows.length})</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center leading-none">
              <span className={`text-sm font-black tabular-nums ${colorMap[attColor(classStats.avgAtt)].text}`}>
                {classStats.avgAtt}%
              </span>
              <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">AVG ATT.</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/60" />
            <div className="flex flex-col items-center leading-none">
              <span className={`text-sm font-black tabular-nums ${
                classStats.avgScore >= 75 ? "text-emerald-600 dark:text-emerald-400"
                : classStats.avgScore >= 50 ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
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

      {/* ── Search + filter row ─────────────────────────────────────────── */}
      <div className="px-4 py-2.5 sm:px-5 border-b border-slate-100 dark:border-slate-800/40 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400/40 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
            showLowOnly
              ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400"
              : "bg-slate-50 border-slate-200/60 text-slate-500 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
          }`}
          title={showLowOnly ? "Showing low attendance" : "Filter by attendance"}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Desktop table ────────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Student</th>
              <th className="px-3 py-2.5"><SortHeader label="Overall" field="totalAttendancePercent" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-3 py-2.5 hidden sm:table-cell"><SortHeader label="Monthly" field="monthlyAttendancePercent" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-3 py-2.5"><SortHeader label="Tests / Score" field="testsSubmitted" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => <DesktopRow key={row.studentId} row={row} />)}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ─────────────────────────────────────────────── */}
      <div className="block md:hidden space-y-3">
        {filtered.map((row) => <MobileCard key={row.studentId} row={row} />)}
      </div>

      {filtered.length === 0 && studentRows.length > 0 && (
        <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
          No students match your search{showLowOnly ? " or filter" : ""}.
        </div>
      )}
    </div>
  );
};

export default StudentTable;
