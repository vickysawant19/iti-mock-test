import { Award, CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import React from "react";

const ShowStats = ({ attendance, label = "Attendance" }) => {
  const totalDays = attendance?.presentDays + attendance?.absentDays;

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <CalendarIcon className="mr-2 text-blue-600" size={20} />
        {label}
      </h2>

      <div className="flex flex-wrap gap-3">
        {[
          {
            icon: <CalendarIcon className="text-blue-500" />,
            label: "Total Days",
            value: totalDays,
          },
          {
            icon: <CheckCircle className="text-green-500" />,
            label: "Present Days",
            value: attendance?.presentDays,
          },
          {
            icon: <XCircle className="text-red-500" />,
            label: "Absent Days",
            value: attendance?.absentDays,
          },
          {
            icon: <Award className="text-purple-500" />,
            label: "Attendance %",
            value: `${
              totalDays > 0
                ? ((attendance?.presentDays / totalDays) * 100).toFixed(2)
                : 0
            }%`,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="flex-1 min-w-[140px] bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3 hover:shadow-md transition-shadow duration-200"
          >
            <div className="shrink-0">
              {React.cloneElement(stat.icon, { size: 32 })}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-gray-500 font-medium">
                {stat.label}
              </span>
              <span className="text-lg font-bold truncate">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowStats;
