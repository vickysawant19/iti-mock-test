import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, XCircle, Clock, Users, ArrowRight, X } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";

function NotifItem({ notif, onClose }) {
  const navigate = useNavigate();
  const isTeacher = notif.type === "pending_request";
  const isApproved = notif.type === "request_approved";
  const isRejected = notif.type === "request_rejected";

  const handleClick = () => {
    onClose();
    if (isTeacher) {
      navigate("/manage-batch/approvals");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
        isTeacher ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div
        className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isApproved
            ? "bg-green-100 dark:bg-green-900/30"
            : isRejected
            ? "bg-red-100 dark:bg-red-900/30"
            : "bg-amber-100 dark:bg-amber-900/30"
        }`}
      >
        {isApproved && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
        {isRejected && <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
        {isTeacher && <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-snug">
          {notif.message}
        </p>
        {notif.createdAt && (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(notif.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
      {isTeacher && <ArrowRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />}
    </button>
  );
}

export default function NotificationPanel({ notifications, isOpen, onClose }) {
  const panelRef = useRef(null);
  const user = useSelector(selectUser);
  const isTeacher = user?.labels?.includes("Teacher");

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
      style={{ maxHeight: "480px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Notifications
          </h3>
          {notifications.length > 0 && (
            <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
              {notifications.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto" style={{ maxHeight: "380px" }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              All caught up!
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {isTeacher
                ? "No pending batch requests right now."
                : "No updates on your batch requests."}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notif) => (
              <NotifItem key={notif.id} notif={notif} onClose={onClose} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
