import React from "react";
import CustomCalendar from "@/private/Attendance/Calender";

const AttendanceCalendar = ({
  selectedDate,
  setSelectedDate,
  handleMonthChange,
  openModal,
  workingDays,
  holidays,
  batchData,
  profile
}) => {

  const tileContent = ({ date }) => {
    // We don't render edit history text here for simplicity on student view, but we could
    return <div className="w-full h-full p-1 border-t border-transparent" />;
  };

  const tileClassName = ({ date }) => {
    const d = new Date(date);
    // adjust for timezone diffs if needed, simple format
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    if (holidays.has(formattedDate)) {
      return "holiday-tile";
    }
    const record = workingDays.get(formattedDate);
    if (!record) return null;
    
    if (record.status === "present") return "present-tile";
    if (record.status === "absent") return "absent-tile";
    if (record.status === "late") return "late-tile";
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <CustomCalendar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        startDate={profile?.enrolledAt ? new Date(profile.enrolledAt) : undefined}
        handleActiveStartDateChange={handleMonthChange}
        openModal={openModal} /* Disabled modal for students unless configured */
        distance={Infinity} /* Disabled distance check on calendar tiles since button implies location */
        canMarkPrevious={false} /* Students cannot edit past attendance */
        enableNextTiles={false}
        attendanceTime={batchData?.attendanceTime}
        circleRadius={batchData?.circleRadius}
      />
    </div>
  );
};

export default AttendanceCalendar;
