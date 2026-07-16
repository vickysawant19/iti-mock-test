import React from "react";
import StudentTable from "./StudentTable";

export default function TeacherAttendanceTab({
  studentRows,
  selectedMonth,
}) {
  return (
    <StudentTable studentRows={studentRows} selectedMonth={selectedMonth} />
  );
}
