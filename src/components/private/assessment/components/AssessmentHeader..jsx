import React from "react";
import { ClipboardList } from "lucide-react";

const AssessmentHeader = ({ progress = 0 }) => {
  // Ensure progress is within valid range
  const validProgress = Math.min(Math.max(0, Number(progress) || 0), 100);

  // Determine progress color based on completion percentage
  const getProgressColor = () => {
    if (validProgress <= 30) return "bg-amber-500";
    if (validProgress <= 70) return "bg-blue-500";
    return "bg-emerald-500";
  };

  return (
    <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg relative md:rounded-b-none">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold flex items-center">
          <ClipboardList className="mr-2" size={20} />
          Assessments
        </h2>
        <div className="text-right">
          <span className="text-xs opacity-90">Completed</span>
          <div className="font-bold text-lg">
            {validProgress}
            <span className="text-xs ml-0.5">%</span>
          </div>
        </div>
      </div>

      {/* Progress bar container */}
      <div className="w-full h-2 bg-blue-800/50 rounded-full mt-2">
        {/* Progress bar fill */}
        <div
          style={{ width: `${validProgress}%` }}
          className={`h-full rounded-full transition-all duration-500  ${getProgressColor()}`}
          role="progressbar"
          aria-valuenow={validProgress}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
};

export default AssessmentHeader;
