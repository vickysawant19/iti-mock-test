import React from "react";
import { Loader2, UserCheck, UserX, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AttendanceStatusBadge from "@/components/components/AttendanceStatusBadge";

/**
 * Reusable Compact Teacher Attendance Control component
 * Renders compact Present (P) and Absent (A) buttons plus a 3-dot dropdown menu for CL, SL, OD, SPL, HD, L.
 */
export const TeacherAttendanceControl = React.memo(({
  dateKey,
  teacherStatus,
  isHoliday = false,
  actionLoadingDates = {},
  onSetTeacherAttendance,
  onDeleteTeacherAttendance,
  readOnly = false,
  compact = false,
  className = "",
}) => {
  const isPresentLoading = actionLoadingDates?.[dateKey] === "present";
  const isAbsentLoading = actionLoadingDates?.[dateKey] === "absent";
  const isDeletingLoading = actionLoadingDates?.[dateKey] === "deleting";
  const isLoading = Boolean(actionLoadingDates?.[dateKey]);

  if (readOnly || !onSetTeacherAttendance) {
    return <AttendanceStatusBadge status={teacherStatus} showLabel={true} size={compact ? "sm" : "md"} />;
  }

  const s = String(teacherStatus || "").toLowerCase();
  const isPresent = s === "present" || s === "p";
  const isAbsent = s === "absent" || s === "a";
  
  const getLeaveCode = (st) => {
    const str = String(st || "").toLowerCase();
    if (["casual", "cl"].includes(str)) return "CL";
    if (["sick", "sl"].includes(str)) return "SL";
    if (["on_duty", "od"].includes(str)) return "OD";
    if (["special", "spl"].includes(str)) return "SPL";
    if (["half_day", "hd"].includes(str)) return "HD";
    if (["late", "l"].includes(str)) return "L";
    return null;
  };

  const leaveCode = getLeaveCode(teacherStatus);

  return (
    <div className={`flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-fit ${className}`}>
      {/* Present Button (P) */}
      <button
        type="button"
        disabled={isLoading}
        onClick={() => onSetTeacherAttendance(dateKey, "present")}
        className={`h-7 px-2 sm:px-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 active:scale-95 ${
          isPresent
            ? "bg-emerald-600 text-white shadow-xs"
            : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
        } ${isPresentLoading ? "opacity-80 animate-pulse cursor-wait" : ""}`}
        title="Mark Teacher Present (P)"
      >
        {isPresentLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
        <span>P</span>
      </button>

      {/* On Holiday: Show Undo button if attendance is set */}
      {isHoliday ? (
        teacherStatus && onDeleteTeacherAttendance ? (
          <button
            type="button"
            disabled={isDeletingLoading}
            onClick={() => onDeleteTeacherAttendance(dateKey)}
            className="h-7 px-2 sm:px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-400"
            title="Undo attendance for this holiday"
          >
            {isDeletingLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Undo
          </button>
        ) : null
      ) : (
        <>
          {/* Absent Button (A) */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onSetTeacherAttendance(dateKey, "absent")}
            className={`h-7 px-2 sm:px-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 active:scale-95 ${
              isAbsent
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            } ${isAbsentLoading ? "opacity-80 animate-pulse cursor-wait" : ""}`}
            title="Mark Teacher Absent (A)"
          >
            {isAbsentLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
            <span>A</span>
          </button>

          {/* 3-Dot More Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={isLoading}
                className={`h-7 px-1.5 sm:px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-0.5 border ${
                  leaveCode
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 border-transparent"
                }`}
                title="More Attendance Options (CL, SL, OD, SPL, HD, L)"
              >
                {leaveCode ? (
                  <span className="font-extrabold text-[11px]">{leaveCode}</span>
                ) : (
                  <MoreVertical className="w-3.5 h-3.5" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => onSetTeacherAttendance(dateKey, "present")} className="cursor-pointer text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Present (P)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetTeacherAttendance(dateKey, "absent")} className="cursor-pointer text-xs font-semibold text-rose-700 dark:text-rose-400">
                Absent (A)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSetTeacherAttendance(dateKey, "casual")} className="cursor-pointer text-xs font-semibold text-amber-700 dark:text-amber-400">
                Casual Leave (CL)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetTeacherAttendance(dateKey, "sick")} className="cursor-pointer text-xs font-semibold text-sky-700 dark:text-sky-400">
                Sick Leave (SL)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetTeacherAttendance(dateKey, "on_duty")} className="cursor-pointer text-xs font-semibold text-teal-700 dark:text-teal-400">
                On Duty (OD)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetTeacherAttendance(dateKey, "special")} className="cursor-pointer text-xs font-semibold text-purple-700 dark:text-purple-400">
                Special Leave (SPL)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetTeacherAttendance(dateKey, "half_day")} className="cursor-pointer text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                Half Day (HD)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetTeacherAttendance(dateKey, "late")} className="cursor-pointer text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                Late (L)
              </DropdownMenuItem>
              {teacherStatus && onDeleteTeacherAttendance && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteTeacherAttendance(dateKey)}
                    disabled={isDeletingLoading}
                    className="cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/50 flex items-center gap-1.5"
                  >
                    {isDeletingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Undo / Clear Attendance
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
});

export default TeacherAttendanceControl;
