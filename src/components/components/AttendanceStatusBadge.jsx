import React from "react";
import { attendanceTrackingService } from "@/services/attendanceTrackingService";

/**
 * Reusable Global Attendance Status Badge Component
 * Standardizes attendance badge rendering across tables, cards, modals, and register views.
 */
export const AttendanceStatusBadge = ({
  status,
  leaveType,
  showLabel = false,
  size = "md", // "sm" | "md" | "lg"
  className = "",
  title,
}) => {
  const config = attendanceTrackingService.getStatusConfig(status, leaveType);

  const sizeClasses = {
    sm: "h-5 min-w-5 px-1 text-[9px]",
    md: "h-5.5 min-w-5.5 px-1 text-[10px]",
    lg: "h-6 px-2 text-xs",
  };

  return (
    <span
      title={title || config.label}
      className={`inline-flex items-center justify-center font-extrabold rounded shadow-2xs border transition-all select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${config.badgeClass} ${className}`}
    >
      {showLabel ? config.label : config.code}
    </span>
  );
};

export default AttendanceStatusBadge;
