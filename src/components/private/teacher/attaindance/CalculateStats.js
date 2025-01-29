import { format } from "date-fns";

export const calculateStats = ({ data, setAttendance, setAttendanceStats }) => {
  if (!data || data.attendanceRecords.length === 0) {
    const stats = {
      userId: data.userId,
      userName: data.userName,
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      holidayDays: 0,
      attendancePercentage: 0,
      monthlyAttendance: {},
    };
    setAttendance && setAttendance([]);
    setAttendanceStats && setAttendanceStats(stats);
    return stats;
  }
  

  setAttendance && setAttendance(data.attendanceRecords);

  // Calculate attendance statistics
  let presentDays = 0;
  let absentDays = 0;
  let holidayDays = 0;
  const monthlyAttendance = {};

  

  data.attendanceRecords.forEach((record) => {
    if (typeof record === "string") return;
    const month = format(new Date(record.date), "MMMM yyyy");

    if (!monthlyAttendance[month]) {
      monthlyAttendance[month] = {
        presentDays: 0,
        absentDays: 0,
        holidayDays: 0,
      };
    }

    if (record.isHoliday) {
      holidayDays++;
      monthlyAttendance[month].holidayDays++;
    } else if (record.attendanceStatus === "Present") {
      presentDays++;
      monthlyAttendance[month].presentDays++;
    } else if (record.attendanceStatus === "Absent") {
      absentDays++;
      monthlyAttendance[month].absentDays++;
    }
  });

  let totalDays = presentDays+absentDays;

  const attendancePercentage =
    totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

  const stats = {
    studentId : data.studentId,
    userName: data.userName,
    userId: data.userId,
    totalDays,
    presentDays,
    absentDays,
    holidayDays,
    attendancePercentage,
    monthlyAttendance,
  };

  setAttendanceStats && setAttendanceStats(stats);
  return stats;
};
