import React from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

const AttendanceStatus = ({
  distance,
  locationText,
  batchData,
  currentTime = new Date(),
}) => {
  // Check if current time is within attendance window
  const currentTimeStr = format(currentTime, "HH:mm");
  const isWithinTimeWindow =
    currentTimeStr >= batchData?.attendanceTime?.start &&
    currentTimeStr <= batchData?.attendanceTime?.end;

  // Check if within radius
  const isWithinRadius = distance <= batchData.circleRadius;

  // Can mark attendance only if both conditions are met
  const canMarkAttendance = isWithinRadius && isWithinTimeWindow;

  return (
    <div className="bg-white rounded-lg shadow p-4 max-w-md mx-auto h-fit">
      <h3 className="text-lg font-semibold mb-4">Attendance Requirements</h3>

      {/* Location Status */}
      <div className="space-y-4 mb-4">
        <div className="flex items-start gap-2">
          {isWithinRadius ? (
            <CheckCircle className="text-green-500 mt-1" size={20} />
          ) : (
            <XCircle className="text-red-500 mt-1" size={20} />
          )}
          <div>
            <p className="font-medium">Location Requirement</p>
            <p className="text-sm text-gray-600">
              You are{" "}
              {distance > 1000
                ? `${(distance / 1000).toFixed(2)} km`
                : `${distance.toFixed(2)} meters`}{" "}
              away from {locationText.batch}.
              <br />
              Must be within {batchData.circleRadius} meters.
            </p>
          </div>
        </div>

        {/* Time Status */}
        <div className="flex items-start gap-2">
          {isWithinTimeWindow ? (
            <CheckCircle className="text-green-500 mt-1" size={20} />
          ) : (
            <XCircle className="text-red-500 mt-1" size={20} />
          )}
          <div>
            <p className="font-medium">Time Requirement</p>
            <p className="text-sm text-gray-600">
              Current time: {format(currentTime, "HH:mm")}
              <br />
              Marking window: {batchData?.attendanceTime?.start} -{" "}
              {batchData?.attendanceTime?.end}
            </p>
          </div>
        </div>
      </div>

      {/* Final Status */}
      <div
        className={`mt-4 p-2 rounded-md text-center ${
          canMarkAttendance
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {canMarkAttendance ? (
          <p className="font-medium">You can mark attendance now ✓</p>
        ) : (
          <p className="font-medium">Cannot mark attendance ✗</p>
        )}
      </div>
    </div>
  );
};

export default AttendanceStatus;
