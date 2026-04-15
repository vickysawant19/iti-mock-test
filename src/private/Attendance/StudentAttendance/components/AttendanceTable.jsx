import React from "react";
import { format } from "date-fns";

const getStatusClasses = (status) => {
  switch (status) {
    case "present":
      return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "absent":
      return "bg-rose-50 text-rose-600 border-rose-200";
    case "late":
      return "bg-amber-50 text-amber-600 border-amber-200";
    case "leave":
      return "bg-violet-50 text-violet-600 border-violet-200";
    case "holiday":
      return "bg-amber-50 text-amber-600 border-amber-200";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
};

const getStatusDotColor = (status) => {
  switch (status) {
    case "present":
      return "bg-emerald-500";
    case "absent":
      return "bg-rose-500";
    case "late":
      return "bg-amber-500";
    case "leave":
      return "bg-violet-500";
    case "holiday":
      return "bg-amber-500";
    default:
      return "bg-slate-400";
  }
};

// Subtle full-row tint matching the status colour
const getRowBgClass = (status) => {
  switch (status) {
    case "present":
      return "bg-emerald-50/60 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20";
    case "absent":
      return "bg-rose-50/60    dark:bg-rose-900/10    hover:bg-rose-50    dark:hover:bg-rose-900/20";
    case "late":
      return "bg-amber-50/60   dark:bg-amber-900/10   hover:bg-amber-50   dark:hover:bg-amber-900/20";
    case "leave":
      return "bg-violet-50/60  dark:bg-violet-900/10  hover:bg-violet-50  dark:hover:bg-violet-900/20";
    case "holiday":
      return "bg-amber-50/70   dark:bg-amber-900/15   hover:bg-amber-100  dark:hover:bg-amber-900/25";
    default:
      return "hover:bg-slate-50 dark:hover:bg-slate-800/50";
  }
};

const AttendanceTable = ({ attendanceRecords, holidays }) => {
  const normalizeStatus = (rawStatus) => {
    const value = String(rawStatus || "")
      .trim()
      .toLowerCase();
    if (["present", "p"].includes(value)) return "present";
    if (["absent", "a"].includes(value)) return "absent";
    if (["leave", "onleave", "on_leave", "l"].includes(value)) return "leave";
    if (["holiday", "h"].includes(value)) return "holiday";
    if (["late"].includes(value)) return "late";
    return value;
  };

  const safeRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];
  const holidayEntries =
    holidays instanceof Map ? Array.from(holidays.entries()) : [];
  const holidayMap = holidays instanceof Map ? holidays : new Map();

  if (safeRecords.length === 0 && holidayEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50">
        <p className="text-slate-500 text-sm font-medium">
          No attendance data found for this period.
        </p>
      </div>
    );
  }

  // Merge attendance and holiday-only dates so the table stays consistent with calendar/stats.
  const dateMap = new Map();
  safeRecords.forEach((record) => {
    if (!record?.date) return;
    dateMap.set(record.date, {
      ...record,
      status: normalizeStatus(record.status),
    });
  });
  holidayEntries.forEach(([date, holidayText]) => {
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        $id: `holiday-${date}`,
        date,
        status: "holiday",
        remarks: holidayText || "Holiday",
      });
    }
  });

  const mergedSortedRecords = Array.from(dateMap.values()).sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse text-[13px] min-w-[680px]">
        <colgroup>
          <col className="w-[120px]" />
          <col className="w-[45%]" />
          <col className="w-[100px]" />
          <col className="w-[110px]" />
        </colgroup>
        <thead>
          <tr>
            <th className="bg-[#f8fafc] dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-4 py-2.5 text-[11px] uppercase tracking-wider">
              Date
            </th>
            <th className="bg-[#f8fafc] dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-4 py-2.5 text-[11px] uppercase tracking-wider">
              Remarks
            </th>
            <th className="bg-[#f8fafc] dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-4 py-2.5 text-[11px] uppercase tracking-wider">
              Time In
            </th>
            <th className="bg-[#f8fafc] dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-4 py-2.5 text-[11px] uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9] dark:divide-slate-800">
          {mergedSortedRecords.map((record) => {
            const status = normalizeStatus(record.status);
            const hasAttendanceStatus = [
              "present",
              "absent",
              "late",
              "leave",
              "onleave",
            ].includes(status);
            const isHoliday =
              status === "holiday" ||
              (!hasAttendanceStatus && holidayMap.has(record.date));
            const holidayText = holidayMap.get(record.date);

            const dateObj = new Date(record.date);
            const dateFmt = format(dateObj, "dd MMM");
            const dayFmt = format(dateObj, "EEE");

            if (isHoliday) {
              return (
                <tr
                  key={record.$id || record.date}
                  className={`transition-colors ${getRowBgClass("holiday")}`}
                >
                  <td className="px-4 py-2.5 border-t border-amber-100 dark:border-amber-900/20">
                    <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                      {dateFmt}
                    </div>
                    <div className="text-[10px] text-slate-400">{dayFmt}</div>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {holidayText || "Public Holiday"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-slate-500">
                    —
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusClasses("holiday")}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor("holiday")}`}
                      />
                      Holiday
                    </span>
                  </td>
                </tr>
              );
            }

            const rowStatus = isHoliday ? "holiday" : status;
            const borderColor =
              {
                present: "border-emerald-100 dark:border-emerald-900/20",
                absent: "border-rose-100    dark:border-rose-900/20",
                late: "border-amber-100   dark:border-amber-900/20",
                leave: "border-violet-100  dark:border-violet-900/20",
                holiday: "border-amber-100   dark:border-amber-900/20",
              }[rowStatus] || "border-slate-100 dark:border-slate-800";

            return (
              <tr
                key={record.$id || record.date}
                className={`transition-colors ${getRowBgClass(rowStatus)}`}
              >
                <td className={`px-4 py-2.5 border-t ${borderColor}`}>
                  <div className="font-bold text-[13px] text-slate-900 dark:text-white">
                    {dateFmt}
                  </div>
                  <div className="text-[10px] text-slate-400">{dayFmt}</div>
                </td>
                <td
                  className={`px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 truncate border-t ${borderColor}`}
                >
                  {isHoliday
                    ? holidayText || record.remarks || "Public Holiday"
                    : record.remarks || "-"}
                </td>
                <td
                  className={`px-4 py-2.5 font-mono text-[12px] text-slate-500 truncate border-t ${borderColor}`}
                >
                  {record.$updatedAt
                    ? format(new Date(record.$updatedAt), "h:mm a")
                    : "—"}
                </td>
                <td className={`px-4 py-2.5 border-t ${borderColor}`}>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${getStatusClasses(rowStatus)}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDotColor(rowStatus)}`}
                    />
                    <span className="capitalize">{rowStatus || "unknown"}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
