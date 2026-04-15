import { format } from "date-fns";

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
      attendancePercentage: 0,
      monthlyAttendance: {},
    };
    setAttendance && setAttendance([]);
    setAttendanceStats && setAttendanceStats(stats);
    return stats;
  }
  setAttendance && setAttendance(data);
  // Calculate attendance statistics
  const normalizeStatus = (rawStatus) => {
    const value = String(rawStatus || "").trim().toLowerCase();
    if (["present", "p"].includes(value)) return "present";
    if (["absent", "a"].includes(value)) return "absent";
    if (["leave", "l"].includes(value)) return "leave";
    return value;
  };

  let presentDays = 0;
  let absentDays = 0;
  let holidayDays = 0;
  const monthlyAttendance = {};

  data.forEach((record) => {
    if (!record || typeof record === "string") return;
    const dateStr = record.date;
    if (!dateStr) return;

    const month = format(new Date(dateStr), "MMMM yyyy");
    const status = normalizeStatus(record.status);

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
    }

    if (status === "present") {
      presentDays++;
      monthlyAttendance[month].presentDays++;
    } else if (status === "absent") {
      absentDays++;
      monthlyAttendance[month].absentDays++;
    }
  });

  const totalDays = presentDays + absentDays;

  const attendancePercentage =
    totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

  const stats = {
    studentId,
    userName,
    userId,
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
