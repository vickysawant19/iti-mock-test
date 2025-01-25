import { Award, CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import React from "react";

const ShowStats = ({ attendance, label = "Attendance" }) => {
  const totalDays = attendance?.presentDays + attendance?.absentDays;
  return (
    <>
      <h2 className="text-xl font-bold mb-4 flex items-center mt-5">
        <CalendarIcon className="mr-2 text-blue-600" size={24} />
        {label}
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            className="bg-white rounded-xl shadow-md p-4 flex items-center hover:scale-105 transition-transform duration-300"
          >
            <div className="mr-4">
              {React.cloneElement(stat.icon, { size: 40 })}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <span className="text-xl font-bold">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ShowStats;
