import React from "react";
import { DEFAULT_VISIBILITY } from "./ColumnGroupConfig";

const AttendanceTableSkeleton = ({
  columnVisibility = DEFAULT_VISIBILITY,
  compactView = false,
  nameWidthProp,
  rowCount = 10,
  daysCount = 30,
}) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const defaultNameWidth = compactView ? (isMobile ? 120 : 140) : (isMobile ? 140 : 180);
  const nameWidth = nameWidthProp !== undefined ? nameWidthProp : defaultNameWidth;

  const nameColStyle = {
    width: `${nameWidth}px`,
    minWidth: `${nameWidth}px`,
    maxWidth: `${nameWidth}px`,
  };

  const cell = compactView
    ? "h-7 w-7 min-w-7 max-w-7 px-0 py-0"
    : "h-9 w-9 min-w-9 max-w-9 px-0.5 py-0.5";

  const dummyDays = Array.from({ length: daysCount }, (_, i) => i + 1);
  const dummyRows = Array.from({ length: rowCount }, (_, i) => i + 1);

  return (
    <div className="min-w-full overflow-hidden dark:bg-slate-900">
      <table className="min-w-full dark:bg-slate-900 text-xs border-separate border-spacing-0">
        <thead className="text-white select-none">
          {/* Row 1: Group Headers */}
          <tr className="sticky top-0 z-40 bg-indigo-800 dark:bg-slate-950 shadow-xs">
            {columnVisibility.previous && (
              <th
                colSpan={7}
                className="border border-emerald-600 dark:border-emerald-900 bg-emerald-700 dark:bg-emerald-950 text-xs font-bold text-center py-1.5 px-2 tracking-wide"
              >
                Previous Month Stats
              </th>
            )}

            <th
              style={nameColStyle}
              className="sticky left-0 z-50 border border-indigo-600 dark:border-slate-800 bg-indigo-800 dark:bg-slate-950 text-xs font-bold text-left py-1.5 px-3 tracking-wide"
            >
              Student Register Roster
            </th>

            {columnVisibility.daily && (
              <th
                colSpan={daysCount}
                className="border border-indigo-600 dark:border-indigo-900 bg-indigo-700 dark:bg-indigo-950 text-xs font-bold text-center py-1.5 px-2 tracking-wide"
              >
                Daily Attendance
              </th>
            )}

            {columnVisibility.summary && (
              <th
                colSpan={7}
                className="border border-blue-600 dark:border-blue-900 bg-blue-700 dark:bg-blue-950 text-xs font-bold text-center py-1.5 px-2 tracking-wide"
              >
                Current Month Summary
              </th>
            )}
          </tr>

          {/* Row 2: Sub-headers */}
          <tr className="bg-indigo-900 dark:bg-slate-900 text-[11px] font-semibold text-slate-200">
            {columnVisibility.previous && (
              <>
                <th className="border border-emerald-700/60 text-center py-1 px-1 text-[10px]">WD</th>
                <th className="border border-emerald-700/60 text-center py-1 px-1 text-[10px]">P</th>
                <th className="border border-emerald-700/60 text-center py-1 px-1 text-[10px]">A</th>
                <th className="border border-emerald-700/60 text-center py-1 px-1 text-[10px]">CL</th>
                <th className="border border-emerald-700/60 text-center py-1 px-1 text-[10px]">SL</th>
                <th className="border border-emerald-700/60 text-center py-1 px-1 text-[10px]">SPL</th>
                <th className="border border-emerald-700/60 text-center py-1 px-1 text-[10px]">%</th>
              </>
            )}

            <th
              style={nameColStyle}
              className="sticky left-0 z-40 border border-indigo-700/60 bg-indigo-900 dark:bg-slate-900 text-left py-1 px-3 text-[11px]"
            >
              Roll • Name
            </th>

            {columnVisibility.daily &&
              dummyDays.map((d) => (
                <th
                  key={d}
                  className={`${cell} border border-indigo-700/60 text-center text-[10px] font-mono`}
                >
                  {d}
                </th>
              ))}

            {columnVisibility.summary && (
              <>
                <th className="border border-blue-700/60 text-center py-1 px-1 text-[10px]">WD</th>
                <th className="border border-blue-700/60 text-center py-1 px-1 text-[10px]">P</th>
                <th className="border border-blue-700/60 text-center py-1 px-1 text-[10px]">A</th>
                <th className="border border-blue-700/60 text-center py-1 px-1 text-[10px]">CL</th>
                <th className="border border-blue-700/60 text-center py-1 px-1 text-[10px]">SL</th>
                <th className="border border-blue-700/60 text-center py-1 px-1 text-[10px]">SPL</th>
                <th className="border border-blue-700/60 text-center py-1 px-1 text-[10px]">%</th>
              </>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {dummyRows.map((rowIdx) => (
            <tr
              key={rowIdx}
              className={rowIdx % 2 === 0 ? "bg-slate-50/70 dark:bg-slate-900/40" : "bg-white dark:bg-slate-900"}
            >
              {/* Previous Stats Skeletons */}
              {columnVisibility.previous && (
                <>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-4 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-4 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-4 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-3 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-3 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-3 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-6 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                </>
              )}

              {/* Student Name Sticky Skeleton */}
              <td
                style={nameColStyle}
                className="sticky left-0 z-20 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div
                      className="h-3 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse"
                      style={{ width: `${60 + (rowIdx % 4) * 10}%` }}
                    />
                  </div>
                </div>
              </td>

              {/* Daily Cells Skeletons */}
              {columnVisibility.daily &&
                dummyDays.map((d) => (
                  <td
                    key={d}
                    className={`${cell} border border-slate-200 dark:border-slate-800 text-center p-1`}
                  >
                    <div className="h-4 w-4 mx-auto rounded-sm bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
                  </td>
                ))}

              {/* Summary Stats Skeletons */}
              {columnVisibility.summary && (
                <>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-4 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-4 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-4 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-3 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-3 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-3 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                  <td className="border border-slate-200 dark:border-slate-800 text-center py-2 px-1">
                    <span className="inline-block h-2.5 w-6 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTableSkeleton;
