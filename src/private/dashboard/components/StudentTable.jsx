import React, { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, Filter, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50",
    warning: "bg-amber-100/60 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50",
    critical: "bg-red-100/60 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200/50 dark:border-red-800/50",
  };

  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border backdrop-blur-sm ${styles[status] || styles.active}`}>
      {status === "critical" ? "Low" : status === "warning" ? "Warn" : "Good"}
    </span>
  );
};

const AttendanceBar = ({ percent }) => {
  let color = "from-emerald-400 to-emerald-600";
  if (percent < 50) color = "from-red-400 to-red-600";
  else if (percent < 75) color = "from-amber-400 to-amber-600";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums w-10 text-right ${
        percent < 50 ? "text-red-600 dark:text-red-400" : percent < 75 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
      }`}>
        {percent}%
      </span>
    </div>
  );
};

const SortHeader = ({ label, field, currentSort, onSort, className = "" }) => {
  const isActive = currentSort.field === field;
  const icon = isActive && currentSort.dir === "asc" ? ChevronUp : ChevronDown;
  const Icon = icon;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer ${className}`}
    >
      {label}
      <Icon className={`w-3 h-3 ${isActive ? "text-pink-500" : "text-slate-300 dark:text-slate-600"}`} />
    </button>
  );
};

const StudentTable = ({ studentRows = [], selectedMonth }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: "totalAttendancePercent", dir: "desc" });
  const [showLowOnly, setShowLowOnly] = useState(false);

  const handleSort = (field) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "desc" }
    );
  };

  const filtered = useMemo(() => {
    let rows = [...studentRows];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.userName?.toLowerCase().includes(q));
    }

    // Low attendance filter
    if (showLowOnly) {
      rows = rows.filter((r) => r.totalAttendancePercent < 75);
    }

    // Sort
    rows.sort((a, b) => {
      const valA = a[sort.field] ?? 0;
      const valB = b[sort.field] ?? 0;
      return sort.dir === "asc" ? valA - valB : valB - valA;
    });

    return rows;
  }, [studentRows, search, showLowOnly, sort]);

  if (studentRows.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-10 text-center">
        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">No students enrolled in this batch yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/30 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Users className="w-5 h-5 text-purple-500 shrink-0" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
            Students <span className="text-slate-400 font-normal">({filtered.length})</span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 w-44"
            />
          </div>
          {/* Filter button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLowOnly(!showLowOnly)}
            className={`rounded-xl text-xs font-semibold ${
              showLowOnly
                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Filter className="w-3.5 h-3.5 mr-1" />
            {showLowOnly ? "Low <75%" : "Filter"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20 dark:border-slate-800">
              <th className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Student</th>
              <th className="px-3 py-3"><SortHeader label="Overall" field="totalAttendancePercent" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-3 py-3 hidden sm:table-cell"><SortHeader label="Monthly" field="monthlyAttendancePercent" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-3 py-3 hidden md:table-cell"><SortHeader label="Tests" field="testsSubmitted" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-3 py-3 hidden md:table-cell"><SortHeader label="Avg Score" field="avgScore" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-3 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.studentId}
                className="border-b border-white/10 dark:border-slate-800/50 hover:bg-pink-50/30 dark:hover:bg-pink-900/5 transition-colors"
              >
                {/* Student Info */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={row.profileImage} />
                      <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300">
                        {row.userName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[260px]">{row.userName}</p>
                      {row.registerId && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{row.registerId}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Overall Attendance */}
                <td className="px-3 py-3">
                  <AttendanceBar percent={row.totalAttendancePercent} />
                </td>

                {/* Monthly Attendance */}
                <td className="px-3 py-3 hidden sm:table-cell">
                  <AttendanceBar percent={row.monthlyAttendancePercent} />
                </td>

                {/* Tests */}
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">{row.testsSubmitted}</span>
                </td>

                {/* Avg Score */}
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className={`text-sm font-bold tabular-nums ${
                    row.avgScore >= 75 ? "text-emerald-600 dark:text-emerald-400"
                    : row.avgScore >= 50 ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
                  }`}>
                    {row.avgScore}%
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && studentRows.length > 0 && (
        <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
          No students match your search or filter.
        </div>
      )}
    </div>
  );
};

export default StudentTable;
