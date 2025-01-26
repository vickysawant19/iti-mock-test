import React, { useState } from "react";
import { format } from "date-fns";
import {
  LuUser,
  LuCalendarCheck,
  LuCalendarX,
  LuCalendar,
  LuPercent,
} from "react-icons/lu";

import { useSelector } from "react-redux";
import { selectProfile } from "../../../../store/profileSlice";

const ViewAttendance = ({ isLoading, stats }) => {
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "MMMM yyyy")
  );

  const profile = useSelector(selectProfile);

  stats = stats.filter((item) => item.userId !== profile.userId);

  if (isLoading) return <div>Loading...</div>;

  // Get unique months from all students' attendance records and sort them
  const availableMonths = stats.reduce((months, student) => {
    Object.keys(student.monthlyAttendance).forEach((month) => {
      if (month !== "prototype") {
        months.add(month);
      }
    });
    return months;
  }, new Set());

  // Convert to array and sort by date
  const sortedMonths = Array.from(availableMonths).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  return (
    <div className="">
      <div className="w-full  mx-auto bg-white rounded-lg  overflow-hidden">
        {/* Month selector */}
        <div className="p-2 bg-gray-50">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 border rounded-md"
          >
            {sortedMonths.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Monthly stats for all students */}
        <div className="p-2 border-b ">
          <h3 className="font-semibold">
            Monthly Statistics - {selectedMonth}
          </h3>
          {stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {/* Calculate aggregated stats for selected month */}
              {(() => {
                const totalStats = stats.reduce(
                  (acc, student) => {
                    const monthData = student.monthlyAttendance[
                      selectedMonth
                    ] || {
                      presentDays: 0,
                      absentDays: 0,
                      totalDays: 0,
                    };
                    return {
                      present: acc.present + monthData.presentDays,
                      absent: acc.absent + monthData.absentDays,
                      total:
                        acc.total +
                        (monthData.presentDays + monthData.absentDays),
                    };
                  },
                  { present: 0, absent: 0, total: 0 }
                );

                const averageAttendance =
                  totalStats.total > 0
                    ? ((totalStats.present / totalStats.total) * 100).toFixed(2)
                    : 0;

                return (
                  <>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <div className="font-medium">Average Present</div>
                      <div className="text-xl">
                        {(totalStats.present / stats.length).toFixed(1)} days
                      </div>
                    </div>
                    <div className="p-2 bg-red-100 rounded-lg">
                      <div className="font-medium">Average Absent</div>
                      <div className="text-xl">
                        {(totalStats.absent / stats.length).toFixed(1)} days
                      </div>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <div className="font-medium">Total Students</div>
                      <div className="text-xl">{stats.length}</div>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <div className="font-medium">Average Attendance</div>
                      <div className="text-xl">{averageAttendance}%</div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">
                  Student
                </th>
                {/* Monthly Attendance Group */}
                <th
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-600 bg-blue-50"
                  colSpan="4"
                >
                  Monthly Attendance ({selectedMonth})
                </th>
                {/* Overall Attendance Group */}
                <th
                  className="px-4 py-2 text-center text-sm font-semibold text-gray-600 bg-green-50"
                  colSpan="4"
                >
                  Overall Attendance
                </th>
              </tr>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600"></th>
                {/* Monthly Attendance Subheaders */}
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 bg-blue-50">
                  Present
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 bg-blue-50">
                  Absent
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 bg-blue-50">
                  Total Days
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 bg-blue-50">
                  Percentage
                </th>
                {/* Overall Attendance Subheaders */}
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 bg-green-50">
                  Total Present
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 bg-green-50">
                  Total Absent
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 bg-green-50">
                  Total Days
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 bg-green-50">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.map((student) => {
                const monthData = student.monthlyAttendance[selectedMonth] || {
                  presentDays: 0,
                  absentDays: 0,
                  totalDays: 0,
                  attendancePercentage: 0,
                };

                let totalMonthDays =
                  monthData.presentDays + monthData.absentDays;

                monthData.attendancePercentage =
                  totalMonthDays > 0
                    ? (
                        (monthData.presentDays /
                          (monthData.presentDays + monthData.absentDays)) *
                        100
                      ).toFixed(2)
                    : 0;

                return (
                  <tr key={student.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-3">
                        <LuUser className="text-gray-500" />
                        <span>{student.userName}</span>
                      </div>
                    </td>
                    {/* Monthly Attendance Data */}
                    <td className="px-4 py-2 bg-blue-50">
                      <div className="flex items-center space-x-2">
                        <LuCalendarCheck className="text-green-500" />
                        <span>{monthData.presentDays}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 bg-blue-50">
                      <div className="flex items-center space-x-2">
                        <LuCalendarX className="text-red-500" />
                        <span>{monthData.absentDays}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 bg-blue-50">
                      <div className="flex items-center space-x-2">
                        <LuCalendar className="text-blue-500" />
                        <span>
                          {monthData.presentDays + monthData.absentDays}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 bg-blue-50">
                      <div className="flex items-center space-x-2">
                        <LuPercent className="text-purple-500" />
                        <span>{monthData.attendancePercentage}%</span>
                      </div>
                    </td>
                    {/* Overall Attendance Data */}
                    <td className="px-4 py-2 bg-green-50">
                      <div className="flex items-center space-x-2">
                        <LuCalendarCheck className="text-green-500" />
                        <span>{student.presentDays}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 bg-green-50">
                      <div className="flex items-center space-x-2">
                        <LuCalendarX className="text-red-500" />
                        <span>{student.absentDays}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 bg-green-50">
                      <div className="flex items-center space-x-2">
                        <LuCalendar className="text-blue-500" />
                        <span>{student.totalDays}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 bg-green-50">
                      <div className="flex items-center space-x-2">
                        <LuPercent className="text-purple-500" />
                        <span>{student.attendancePercentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Present Days
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Absent Days
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Total Month Days
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Month Attendance %
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Total Present Days
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Total Absent Days
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Total Days
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Attendance %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.map((student) => {
                const monthData = student.monthlyAttendance[selectedMonth] || {
                  presentDays: 0,
                  absentDays: 0,
                  totalDays: 0,
                  attendancePercentage: 0,
                };
                return (
                  <tr key={student.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <LuUser className="text-gray-500" />
                        <span>{student.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <LuCalendarCheck className="text-green-500" />
                        <span>{monthData.presentDays}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <LuCalendarX className="text-red-500" />
                        <span>{monthData.absentDays}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <LuCalendar className="text-blue-500" />
                        <span>
                          {monthData.presentDays + monthData.absentDays}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <LuPercent className="text-purple-500" />
                        <span>
                          {(monthData.presentDays /
                            (monthData.presentDays + monthData.absentDays)) *
                            100 || 0}
                          %
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <LuCalendarCheck className="text-green-500" />
                        <span>{student.presentDays}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <LuCalendarX className="text-red-500" />
                        <span>{student.absentDays}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <LuCalendar className="text-blue-500" />
                        <span>{student.totalDays}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <LuPercent className="text-purple-500" />
                        <span>{student.attendancePercentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table> */}
        </div>
      </div>
    </div>
  );
};

export default ViewAttendance;
