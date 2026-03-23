import React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiaryTable({
  monthDays,
  diaryData,
  holidays,
  attendance,
  isLoadingData,
}) {
  return (
    <Card className="shadow-md border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-6">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/60 text-muted-foreground">
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs">
                  Date
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs">
                  Day
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[200px]">
                  Theory / Work Done
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs min-w-[200px]">
                  Practical Details
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-xs w-32">
                  Prac #
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoadingData ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="bg-white dark:bg-gray-950">
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-12" />
                    </td>
                  </tr>
                ))
              ) : monthDays.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-muted-foreground"
                  >
                    No entries found for selected month.
                  </td>
                </tr>
              ) : (
                monthDays.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const entry = diaryData[dateKey] || {};
                  const isHoliday = holidays.has(dateKey);
                  const isAbsent = attendance.get(dateKey) === "absent";
                  const dayOfWeek = format(day, "E");
                  const isWeekend = dayOfWeek === "Sat" || dayOfWeek === "Sun";

                  return (
                    <tr
                      key={dateKey}
                      className={`hover:bg-muted/30 transition-colors ${
                        isHoliday
                          ? "bg-red-50/50 dark:bg-red-950/20"
                          : isAbsent
                            ? "bg-pink-50/50 dark:bg-pink-950/20"
                            : isWeekend
                              ? "bg-gray-50/50 dark:bg-gray-900/40"
                              : "bg-white dark:bg-gray-950"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                        {format(day, "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(day, "EEEE")}
                      </td>
                      <td className="px-6 py-4 whitespace-pre-wrap">
                        {isHoliday ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {holidays.get(dateKey)?.holidayText}
                          </span>
                        ) : isAbsent ? (
                          <span className="text-pink-600 dark:text-pink-400 font-medium">
                            Absent
                          </span>
                        ) : (
                          entry.theory || (
                            <span className="text-muted-foreground italic">
                              No theory
                            </span>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-pre-wrap">
                        {!isHoliday && !isAbsent
                          ? entry.practical || (
                              <span className="text-muted-foreground italic">
                                No practical
                              </span>
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!isHoliday && !isAbsent ? (
                          <div className="flex items-center">
                            {entry.practicalNumber ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
                                #{entry.practicalNumber}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
