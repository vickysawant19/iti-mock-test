import React from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

const AttendanceStatus = ({
  distance,
  locationText,
  batchData,
  currentTime = new Date(),
}) => {
  if (!batchData) return;
  const currentTimeStr = format(currentTime, "HH:mm");
  const isWithinTimeWindow =
    currentTimeStr >= batchData?.attendanceTime?.start &&
    currentTimeStr <= batchData?.attendanceTime?.end;
  const isWithinRadius = distance <= batchData?.circleRadius;
  const canMarkAttendance = isWithinRadius && isWithinTimeWindow;

  const StatusIcon = ({ isValid }) =>
    isValid ? (
      <CheckCircle className="text-green-500 shrink-0" size={16} />
    ) : (
      <XCircle className="text-red-500 shrink-0" size={16} />
    );

  return (
    <div className="p-3 h-full w-full dark:bg-gray-900">
      <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-100">
        Attendance Status
      </h3>

      <div className="space-y-2">
        {/* Location Check */}
        <div className="bg-gray-50 p-2 rounded-sm dark:bg-gray-800 dark:border dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon isValid={isWithinRadius} />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-100">
              Location Check
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 pl-6">
            {distance > 1000
              ? `${(distance / 1000).toFixed(2)} km`
              : `${distance.toFixed(0)}m`}{" "}
            from {locationText.batch}
            <br />
            Required: within {batchData.circleRadius}m
          </p>
        </div>

        {/* Time Check */}
        <div className="bg-gray-50 p-2 rounded-sm dark:bg-gray-800 dark:border dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon isValid={isWithinTimeWindow} />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-100">
              Time Check
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 pl-6">
            Now: {format(currentTime, "HH:mm")}
            <br />
            Window: {batchData?.attendanceTime?.start} -{" "}
            {batchData?.attendanceTime?.end}
          </p>
        </div>

        {/* Status Summary */}
        <div
          className={`text-xs font-medium p-2 rounded text-center ${
            canMarkAttendance
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          }`}
        >
          {canMarkAttendance ? "Ready to Mark ✓" : "Cannot Mark ✗"}
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatus;
