import React from "react";
import { attendanceTrackingService } from "@/services/attendance/attendanceTrackingService";

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
  variant = "badge", // "badge" | "plain"
}) => {
  const config = attendanceTrackingService.getStatusConfig(status, leaveType);

  if (variant === "plain") {
    const textColors = {
      emerald: "text-emerald-700 dark:text-emerald-400",
      rose: "text-rose-700 dark:text-rose-400",
      amber: "text-amber-700 dark:text-amber-400",
      sky: "text-sky-700 dark:text-sky-400",
      purple: "text-purple-700 dark:text-purple-400",
      teal: "text-teal-700 dark:text-teal-400",
      yellow: "text-yellow-700 dark:text-yellow-400",
      indigo: "text-indigo-700 dark:text-indigo-400",
      slate: "text-slate-400 dark:text-slate-500 font-normal",
    };

    return (
      <span
        title={title || config.label}
        className={`font-extrabold text-xs select-none inline-block text-center ${textColors[config.color] || "text-slate-700 dark:text-slate-300"} ${className}`}
      >
        {showLabel ? config.label : config.code}
      </span>
    );
  }

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
