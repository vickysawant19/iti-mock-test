import React, { useState, useEffect } from "react";
import { Bell, X, ShieldCheck } from "lucide-react";
import pushNotificationService from "@/services/notification/pushNotificationService";
import { toast } from "react-toastify";

export default function PushPermissionPrompt({ user }) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user?.$id || !pushNotificationService.isSupported()) return;

    // Check if permission is already granted or explicitly denied
    const permission = pushNotificationService.getPermission();
    if (permission !== "default") return;

    // Check if user dismissed prompt recently
    const dismissedKey = `push_prompt_dismissed_${user.$id}`;
    const dismissedUntil = localStorage.getItem(dismissedKey);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    // Show prompt after a short 3-second delay on page load
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [user?.$id]);

  if (!showPrompt) return null;

  const handleAllow = async () => {
    try {
      const perm = await pushNotificationService.requestPermission();
      if (perm === "granted") {
        toast.success("Notifications enabled! You will receive daily attendance and test alerts. 🎉");
      }
    } catch (err) {
      console.warn("Push permission error:", err);
    } finally {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    if (user?.$id) {
      // Dismiss / snooze for 1 day (24 hours)
      const oneDayLater = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(`push_prompt_dismissed_${user.$id}`, String(oneDayLater));
    }
    setShowPrompt(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl shadow-2xl p-4 animate-slide-up transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
          <Bell className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Instant Alerts</span>
            </span>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Enable Daily Practice & Attendance Alerts
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Get notified about mock exams, daily attendance reminders, and instructor announcements even when ITI Mitra is closed.
          </p>

          <div className="flex items-center gap-2 mt-3.5">
            <button
              onClick={handleAllow}
              className="flex-1 py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all transform active:scale-95 text-center"
            >
              Enable Alerts
            </button>
            <button
              onClick={handleDismiss}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
