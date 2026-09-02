import React, { useState } from "react";
import { AlertCircle, Megaphone, X, ChevronRight } from "lucide-react";

export default function AnnouncementBanner({ announcement, onDismiss }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!announcement) return null;

  const isUrgent = announcement.type === "urgent_announcement";

  return (
    <div
      className={`relative w-full transition-all duration-300 z-40 border-b ${
        isUrgent
          ? "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-800 shadow-md"
          : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-700 shadow-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="p-1 rounded-full bg-white/20 shrink-0">
            {isUrgent ? (
              <AlertCircle className="w-4 h-4 animate-pulse text-white" />
            ) : (
              <Megaphone className="w-4 h-4 text-white" />
            )}
          </div>
          <span className="font-bold uppercase tracking-wider text-[11px] shrink-0 px-2 py-0.5 rounded bg-white/20">
            {isUrgent ? "Urgent Broadcast" : "Announcement"}
          </span>
          <p
            className={`font-medium ${
              isExpanded ? "whitespace-normal" : "truncate"
            }`}
          >
            {announcement.message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {announcement.message?.length > 70 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] underline opacity-90 hover:opacity-100 flex items-center gap-0.5"
            >
              <span>{isExpanded ? "Show Less" : "Read More"}</span>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </button>
          )}

          <button
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
