import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CustomCalendar = ({
  selectedDate,
  setSelectedDate,
  tileClassName,
  tileContent,
  className,
  startDate = new Date(2020, 1, 1),
}) => {
  const tileDisabled = ({ date, view }) => {
    const today = new Date();
    return (
      view === "month" &&
      (date > today || date < startDate.setDate(startDate.getDate() - 1))
    );
  };

  return (
    <div className="flex justify-center">
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
                    border: 1px solid #e0e0e0;
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
                    background-color: #3b82f6 !important; /* Soft blue */
                    color: white !important;
                }
            `}</style>
    </div>
  );
};

export default CustomCalendar;
