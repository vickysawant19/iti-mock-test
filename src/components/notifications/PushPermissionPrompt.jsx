import React, { useState, useEffect } from "react";
import { Bell, X, ShieldCheck, FileText, Calendar, Megaphone, Sparkles } from "lucide-react";
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

    // Show prompt after a smooth 2.5-second delay on page load
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [user?.$id]);

  if (!showPrompt) return null;

  const handleAllow = async () => {
    try {
      const perm = await pushNotificationService.requestPermission();
      if (perm === "granted") {
        toast.success("Notifications enabled! You will receive instant practice & attendance alerts. 🎉");
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden transform transition-all animate-scale-up">
        
        {/* Subtle Background Radial Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
              <Bell className="w-8 h-8 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500" />
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Instant Updates</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Enable Push Notifications
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed max-w-sm">
            Stay updated with real-time alerts on your device even when your browser or tab is closed.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 space-y-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">New Mock Tests Assigned</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Get notified the moment your teacher publishes practice exams.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Daily Attendance Check-In</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Never miss marking your college presence during college hours.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Urgent Announcements</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive urgent notices and schedule updates immediately.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2">
          <button
            onClick={handleAllow}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/30 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span>Allow Notifications</span>
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2 px-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold text-xs sm:text-sm transition-colors text-center cursor-pointer"
          >
            Maybe Tomorrow
          </button>
        </div>

        {/* Security Footer Note */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>You can disable notifications anytime in browser settings.</span>
        </p>

      </div>
    </div>
  );
}
