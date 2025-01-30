import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../store/userSlice";

const CustomCalendar = ({
  selectedDate,
  setSelectedDate,
  tileClassName,
  tileContent,
  className,
  startDate = new Date(2020, 1, 1),
  handleActiveStartDateChange,
  distance = 1200,
  canMarkPrevious,
  attendanceTime,
}) => {
  const user = useSelector(selectUser);
  const isTeacher = user.labels.includes("Teacher");

  const tileDisabled = ({ date, view }) => {
    const today = new Date();
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setDate(adjustedStartDate.getDate() - 1);
    const isWithinRange = distance <= 1000;

    const attendanceStartTime = new Date(
      `${new Date().toDateString()} ${attendanceTime?.start || "09:00"}`
    );
    const attendanceEndTime = new Date(
      `${new Date().toDateString()} ${attendanceTime?.end || "17:00"}`
    );

    const isWithinAttendanceTime =
      today >= attendanceStartTime && today <= attendanceEndTime;

    const isNotToday = date.toDateString() !== today.toDateString();

    return (
      view === "month" &&
      (date > today ||
        date < adjustedStartDate ||
        (!isTeacher &&
          (!isWithinRange ||
            !isWithinAttendanceTime ||
            (!canMarkPrevious && isNotToday))))
    );
  };

  return (
    <div className="flex flex-col justify-center my-2 w-full items-center">
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileClassName={tileClassName}
        tileContent={tileContent}
        className={`w-full max-w-2xl ${className}`}
        view="month"
        minDetail="month"
        maxDetail="month"
        tileDisabled={tileDisabled}
        onActiveStartDateChange={handleActiveStartDateChange}
      />
      <style>{`
                .react-calendar {
                    width: 100% !important;
                    max-width: 800px !important;
                    border-radius: 1rem;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .react-calendar__tile {
                    aspect-ratio: 1 / 1;
                    height: 100px !important;
                    padding: 10px !important;
                    border: 1px solid white !important ;
                }

                .react-calendar__tile:enabled:hover {
                    opacity: 0.7;
                }

                .react-calendar__tile--now {
                    border: 1px solid #1f2937 !important; /* Dark gray border */
                    font-weight: 700;
                    position: relative;
                }

                .attendance-tile {
                background-color: #6ee7b7 !important; /* Soft mint green */
                color: #064e3b !important; /* Dark teal for contrast */
                
              }

                .default-tile { background-color: #f9fafb !important; color: #333 !important; }
                .present-tile { background-color: #d1fae5 !important; color: #064e3b !important; }
                .absent-tile { background-color: #fee2e2 !important; color: #7f1d1d !important; }
                .holiday-tile { background-color: #fef9c3 !important; color: red !important; }
                .react-calendar__tile--active {
                    filter: brightness(0.8);
                    /* background-color: #3b82f6 !important;  Soft blue */
                    /* color: white !important; */
                    font-weight: 700;
                }
            `}</style>
    </div>
  );
};

export default CustomCalendar;
