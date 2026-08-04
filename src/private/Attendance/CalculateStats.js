import { attendanceAnalyticsService } from "@/services/attendanceAnalyticsService";

export const calculateStats = ({
  userId,
  userName,
  studentId,
  data,
  setAttendance,
  setAttendanceStats,
}) => {
  if (!data || data.length === 0) {
    const stats = {
      userId,
      userName,
      studentId,
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      holidayDays: 0,
      leaveDays: 0,
      attendancePercentage: 0,
      monthlyAttendance: {},
    };
    setAttendance && setAttendance([]);
    setAttendanceStats && setAttendanceStats(stats);
    return stats;
  }

  setAttendance && setAttendance(data);

  const computed = attendanceAnalyticsService.computeStats({ records: data });

  const stats = {
    studentId,
    userName,
    userId,
    totalDays: computed.totalDays,
    workingDays: computed.workingDays,
    presentDays: computed.presentDays,
    absentDays: computed.absentDays,
    holidayDays: computed.holidayDays,
    leaveDays: computed.leaveDays,
    leaveBreakdown: computed.leaveBreakdown,
    attendancePercentage: computed.attendancePercentage,
    monthlyAttendance: computed.monthlyAttendance,
  };

  setAttendanceStats && setAttendanceStats(stats);
  return stats;
};
