import { format } from "date-fns";

export const calculateStats = ({ data, setAttendance, setAttendanceStats }) => {
  if (data.attendanceRecords.length === 0) {
    setAttendance && setAttendance([]);
    setAttendanceStats({
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      holidayDays: 0,
      attendancePercentage: 0,
      monthlyAttendance: {},
    });
    return;
  }

  setAttendance && setAttendance(data.attendanceRecords);

  const workingDays = data.attendanceRecords.filter(
    (record) => !record.isHoliday
  );
  // Calculate attendance statistics
  const totalDays = workingDays.length;
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

  const attendancePercentage =
    totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

  setAttendanceStats({
    totalDays,
    presentDays,
    absentDays,
    holidayDays,
    attendancePercentage,
    monthlyAttendance,
  });
};
