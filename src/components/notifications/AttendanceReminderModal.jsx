import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Clock, AlertTriangle, ArrowRight, X } from "lucide-react";

export default function AttendanceReminderModal({ isOpen, batch, onClose, onSnooze }) {
  const navigate = useNavigate();

  if (!isOpen || !batch) return null;

  const handleMarkAttendance = () => {
    onClose();
    navigate("/attendance/mark-my-attendance");
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formatAttendanceWindow = (time) => {
    if (!time) return "09:00 AM - 05:00 PM";
    let parsed = time;
    if (typeof time === "string") {
      try {
        parsed = JSON.parse(time);
      } catch {
        return time;
      }
    }
    if (parsed && typeof parsed === "object") {
      if (parsed.start && parsed.end) {
        return `${parsed.start} - ${parsed.end}`;
      }
      if (parsed.start) return `From ${parsed.start}`;
      if (parsed.end) return `Until ${parsed.end}`;
    }
    return "09:00 AM - 05:00 PM";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-2xl transition-all">
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header Icon & Title */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Attendance Alert</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                Today's Attendance Pending
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
            You haven't marked your attendance yet today for{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {batch.BatchName || batch.batchName || batch.name || "your batch"}
            </span>
            . Please mark your presence to maintain your attendance streak!
          </p>

          {/* Date & Time Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3.5 space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date:</span>
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{todayStr}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Window:</span>
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatAttendanceWindow(batch.attendanceTime)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleMarkAttendance}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
            >
              <span>Mark Attendance Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onSnooze}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Remind me in 1 hour
              </button>
              <button
                onClick={onClose}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                Dismiss for today
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
