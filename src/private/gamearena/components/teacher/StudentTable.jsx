import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronUp,
  CheckCircle2,
  XCircle,
  CalendarDays,
  BookOpen,
  Star,
  Users,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { fixProfileImage } from "@/services/appwriteClient";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pct = (v) => Math.min(Math.max(v || 0, 0), 100);

const attTheme = (p) =>
  p >= 75
    ? { bar: "bg-blue-550 dark:bg-blue-500", text: "text-blue-600 dark:text-blue-400" }
    : p >= 50
    ? { bar: "bg-amber-550 dark:bg-amber-500", text: "text-amber-600 dark:text-amber-400" }
    : { bar: "bg-red-550 dark:bg-red-500", text: "text-red-600 dark:text-red-400" };

const scoreTheme = (p) =>
  p >= 75
    ? "text-emerald-600 dark:text-emerald-400"
    : p >= 50
    ? "text-amber-600 dark:text-amber-400"
    : "text-red-650 dark:text-red-450";

// ─── Month label ─────────────────────────────────────────────────────────────

const monthLabel = (iso) => {
  if (!iso) return "This Month";
  const [y, m] = iso.split("-");
  return new Date(y, parseInt(m) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

// ─── Single Student Card ─────────────────────────────────────────────────────

const StudentCard = ({ row, selectedMonth }) => {
  const [open, setOpen] = useState(false);

  const absent = Math.max(0, (row.totalWorkingDays || 0) - (row.presentDays || 0));
  const att = pct(row.totalAttendancePercent);
  const mAtt = pct(row.monthlyAttendancePercent);
  const theme = attTheme(att);
  const mTheme = attTheme(mAtt);
  const tests = row.testsSubmitted ?? 0;
  const score = row.avgScore ?? 0;

  return (
    <div
      className={`rounded-2xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm border transition-all duration-200 overflow-hidden ${
        open
          ? "border-blue-500/40 shadow-lg shadow-blue-500/5"
          : "border-slate-200/80 dark:border-slate-800/60 hover:border-slate-350 dark:hover:border-slate-700/60"
      }`}
    >
      {/* ── Clickable Header ── */}
      <div
        onClick={() => setOpen((p) => !p)}
        className="flex items-start justify-between gap-3 p-4 cursor-pointer select-none"
      >
        {/* Avatar + Name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-10 w-10 shrink-0 rounded-xl">
            <AvatarImage src={fixProfileImage(row.profileImage)} />
            <AvatarFallback className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-black">
              {row.userName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-slate-800 dark:text-white truncate leading-tight">
              {row.userName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {row.tradeName || row.registerId || "Student"}
            </p>
          </div>
        </div>

        {/* Chevron */}
        <div className={`mt-0.5 shrink-0 transition-transform duration-200 ${open ? "rotate-0" : "rotate-180"}`}>
          <ChevronUp className={`w-4 h-4 ${open ? "text-blue-500 dark:text-blue-400" : "text-slate-500"}`} />
        </div>
      </div>

      {/* ── Quick Stats Row (always visible) ── */}
      <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800/60 border-t border-slate-200/80 dark:border-slate-800/60">
        {/* Attendance */}
        <div className="flex flex-col items-center justify-center py-2.5 px-2">
          <span className={`text-xl font-black tabular-nums leading-none ${theme.text}`}>
            {att}%
          </span>
          <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1">
            Attendance
          </span>
        </div>
        {/* Tests */}
        <div className="flex flex-col items-center justify-center py-2.5 px-2">
          <span className="text-xl font-black tabular-nums leading-none text-slate-850 dark:text-white">
            {tests}
          </span>
          <span className="text-[9px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mt-1">
            Tests
          </span>
        </div>
        {/* Score */}
        <div className="flex flex-col items-center justify-center py-2.5 px-2">
          <span className={`text-xl font-black tabular-nums leading-none ${scoreTheme(score)}`}>
            {score}%
          </span>
          <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1">
            Score
          </span>
        </div>
      </div>

      {/* ── Expanded Detail ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 space-y-4 border-t border-slate-200/80 dark:border-slate-800/60">

              {/* Attendance section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Attendance
                  </span>
                  <span className={`text-[11px] font-black tabular-nums ${theme.text}`}>
                    {att}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${theme.bar} transition-all duration-500`}
                    style={{ width: `${att}%` }}
                  />
                </div>

                {/* Present / Absent / Working */}
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {row.presentDays ?? 0}
                    <span className="text-slate-500 font-normal">Present</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                    <XCircle className="w-3.5 h-3.5" />
                    {absent}
                    <span className="text-slate-500 font-normal">Absent</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {row.totalWorkingDays ?? 0}
                    <span className="text-slate-500 font-normal">Days</span>
                  </span>
                </div>

                {/* Monthly */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {monthLabel(selectedMonth)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {row.monthlyPresentDays ?? 0} / {row.monthlyWorkingDays ?? 0} Days
                  </span>
                </div>

                {/* Monthly bar */}
                <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${mTheme.bar} transition-all duration-500`}
                    style={{ width: `${mAtt}%` }}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200/80 dark:border-slate-800/60" />

              {/* Mock Test section */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mock Tests
                </span>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-pink-500 dark:text-pink-400 shrink-0" />
                    <div>
                      <p className="text-base font-black text-slate-800 dark:text-white leading-none">{tests}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tests taken</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 dark:text-amber-450 shrink-0" />
                    <div>
                      <p className={`text-base font-black leading-none ${scoreTheme(score)}`}>
                        {score}%
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Avg score</p>
                    </div>
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

// ─── Main Component ───────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { id: "totalAttendancePercent", label: "Overall" },
  { id: "monthlyAttendancePercent", label: "Month" },
  { id: "testsSubmitted", label: "Tests" },
  { id: "avgScore", label: "Score" },
];

const StudentTable = ({ studentRows = [], selectedMonth }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: "totalAttendancePercent", dir: "desc" });

  const handleSort = (field) =>
    setSort((p) =>
      p.field === field
        ? { field, dir: p.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "desc" }
    );

  const filtered = useMemo(() => {
    let rows = [...studentRows];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.userName?.toLowerCase().includes(q));
    }
    rows.sort((a, b) => {
      const va = a[sort.field] ?? 0,
        vb = b[sort.field] ?? 0;
      return sort.dir === "asc" ? va - vb : vb - va;
    });
    return rows;
  }, [studentRows, search, sort]);

  if (!studentRows.length) {
    return (
      <div className="rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/60 p-10 text-center">
        <Users className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-450 font-medium text-sm">
          No students enrolled in this batch yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 placeholder-slate-450 dark:placeholder-slate-600 text-slate-800 dark:text-white"
        />
      </div>

      {/* ── Filter Chips ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {SORT_OPTIONS.map((opt) => {
          const active = sort.field === opt.id;
          const asc = active && sort.dir === "asc";
          return (
            <button
              key={opt.id}
              onClick={() => handleSort(opt.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-150 cursor-pointer border ${
                active
                  ? "bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/20"
                  : "bg-white/60 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700"
              }`}
            >
              {opt.label}
              {active && <span className="opacity-80">{asc ? "↑" : "↓"}</span>}
            </button>
          );
        })}

        {/* Summary pill */}
        <div className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
          <TrendingUp className="w-3 h-3" />
          {filtered.length} / {studentRows.length}
        </div>
      </div>

      {/* Desktop-optimized Table View */}
      {filtered.length > 0 && (
        <div className="hidden md:block overflow-x-auto bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150/40 dark:border-slate-800/40 text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                <th className="py-4 px-5">Student</th>
                <th className="py-4 px-5 text-center">Overall Attendance</th>
                <th className="py-4 px-5 text-center">{monthLabel(selectedMonth)} Attendance</th>
                <th className="py-4 px-5 text-center">Present / Working Days</th>
                <th className="py-4 px-5 text-center">Mock Tests</th>
                <th className="py-4 px-5 text-center">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const att = pct(row.totalAttendancePercent);
                const mAtt = pct(row.monthlyAttendancePercent);
                const theme = attTheme(att);
                const mTheme = attTheme(mAtt);
                const tests = row.testsSubmitted ?? 0;
                const score = row.avgScore ?? 0;

                return (
                  <tr key={row.studentId} className="border-b border-slate-150/40 dark:border-slate-800/40 transition-colors hover:bg-slate-105/20 dark:hover:bg-slate-800/20">
                    {/* Student */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0 rounded-xl">
                          <AvatarImage src={fixProfileImage(row.profileImage)} />
                          <AvatarFallback className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black">
                            {row.userName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-black text-slate-850 dark:text-white truncate leading-tight">
                            {row.userName}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {row.tradeName || row.registerId || "Student"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Overall Attendance */}
                    <td className="py-3 px-5">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`text-xs font-black tabular-nums ${theme.text}`}>
                          {att}%
                        </span>
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${theme.bar}`}
                            style={{ width: `${att}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Monthly Attendance */}
                    <td className="py-3 px-5">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`text-xs font-black tabular-nums ${mTheme.text}`}>
                          {mAtt}%
                        </span>
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${mTheme.bar}`}
                            style={{ width: `${mAtt}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Working Days */}
                    <td className="py-3 px-5 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {row.presentDays ?? 0} / {row.totalWorkingDays ?? 0} Days
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                          {row.monthlyPresentDays ?? 0} / {row.monthlyWorkingDays ?? 0} in {monthLabel(selectedMonth)}
                        </span>
                      </div>
                    </td>

                    {/* Tests taken */}
                    <td className="py-3 px-5 text-center">
                      <span className="text-xs font-black text-slate-850 dark:text-white">
                        {tests}
                      </span>
                    </td>

                    {/* Average Score */}
                    <td className="py-3 px-5 text-center">
                      <span className={`text-xs font-black leading-none ${scoreTheme(score)}`}>
                        {score}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card list */}
      <div className="md:hidden space-y-2.5">
        {filtered.map((row) => (
          <StudentCard key={row.studentId} row={row} selectedMonth={selectedMonth} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/60 p-8 text-center text-sm text-slate-500">
          No students match your search.
        </div>
      )}
    </div>
  );
};

export default StudentTable;
