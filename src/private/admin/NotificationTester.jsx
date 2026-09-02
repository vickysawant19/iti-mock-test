import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  Clock,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Megaphone,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import pushNotificationService from "@/services/notification/pushNotificationService";
import AttendanceReminderModal from "@/components/notifications/AttendanceReminderModal";
import TestAssignedModal from "@/components/notifications/TestAssignedModal";
import AnnouncementBanner from "@/components/notifications/AnnouncementBanner";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";

export default function NotificationTester() {
  const user = useSelector(selectUser);
  const [permission, setPermission] = useState(pushNotificationService.getPermission());
  const [swStatus, setSwStatus] = useState("Checking...");
  const [isSending, setIsSending] = useState(false);

  // Modal test previews
  const [showAttendancePreview, setShowAttendancePreview] = useState(false);
  const [showTestPreview, setShowTestPreview] = useState(false);
  const [showBannerPreview, setShowBannerPreview] = useState(false);

  const checkSw = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.active) {
          setSwStatus(`Active (${reg.scope})`);
        } else {
          setSwStatus("Not active / waiting");
        }
      } catch {
        setSwStatus("Error checking SW");
      }
    } else {
      setSwStatus("Service Worker unsupported");
    }
  };

  useEffect(() => {
    setPermission(pushNotificationService.getPermission());
    checkSw();
  }, []);

  const handleRequestPermission = async () => {
    try {
      const perm = await pushNotificationService.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        toast.success("Notification permission granted! 🎉");
      } else {
        toast.warn(`Permission response: ${perm}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to request permission");
    }
  };

  const handleSendTestPush = async (delaySeconds = 0) => {
    setIsSending(true);
    try {
      const res = await pushNotificationService.sendTestNotification({
        title: "ITI Mitra Practice Alert 🔔",
        body:
          delaySeconds > 0
            ? "[Admin Test] Background notification delivered while tab was minimized or closed!"
            : "[Admin Test] Instant device push notification delivered successfully.",
        url: "/arena",
        delaySeconds,
      });
      toast.info(res);
      setPermission(pushNotificationService.getPermission());
    } catch (err) {
      toast.error(err.message || "Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Admin Diagnostic Suite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Notification & PWA Push Tester
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Private testing environment for verifying Service Worker push delivery, modal triggers, and background alerts.
        </p>
      </div>

      {/* Banner Preview (if active) */}
      {showBannerPreview && (
        <div className="mb-6">
          <AnnouncementBanner
            announcement={{
              id: "test-preview-1",
              type: "urgent_announcement",
              message: "[Preview Test] College semester final examination will commence on Monday at 09:30 AM sharp.",
            }}
            onDismiss={() => setShowBannerPreview(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Device Push & Service Worker Diagnostics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>PWA Web Push Status</span>
            </h2>
            <button
              onClick={() => {
                setPermission(pushNotificationService.getPermission());
                checkSw();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-600 dark:text-slate-400">Permission:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                  permission === "granted"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : permission === "denied"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                }`}
              >
                {permission}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-600 dark:text-slate-400">Service Worker:</span>
              <span className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {swStatus}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {permission !== "granted" && (
              <button
                onClick={handleRequestPermission}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Request Permission</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSendTestPush(0)}
                disabled={isSending}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>Instant Push</span>
              </button>

              <button
                onClick={() => handleSendTestPush(5)}
                disabled={isSending}
                className="py-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>5s Background Test</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              * Click "5s Background Test" then minimize tab to test background delivery.
            </p>
          </div>
        </div>

        {/* Card 2: In-App Interactive Modal Previews */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-amber-500" />
            <span>Interactive Modal Previews</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Preview the custom modals exactly as students see them in their session.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setShowAttendancePreview(true)}
              className="w-full p-3 border border-slate-200 dark:border-slate-700/60 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Attendance Reminder Modal
                  </h4>
                  <p className="text-xs text-slate-500">Triggers if attendance is unmarked</p>
                </div>
              </div>
              <span className="text-xs font-medium text-blue-600">Preview</span>
            </button>

            <button
              onClick={() => setShowTestPreview(true)}
              className="w-full p-3 border border-slate-200 dark:border-slate-700/60 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Test Assignment Modal
                  </h4>
                  <p className="text-xs text-slate-500">Triggers on new teacher test publication</p>
                </div>
              </div>
              <span className="text-xs font-medium text-blue-600">Preview</span>
            </button>

            <button
              onClick={() => setShowBannerPreview(true)}
              className="w-full p-3 border border-slate-200 dark:border-slate-700/60 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Urgent Broadcast Banner
                  </h4>
                  <p className="text-xs text-slate-500">Sticky banner at top of viewport</p>
                </div>
              </div>
              <span className="text-xs font-medium text-blue-600">Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Modal Preview */}
      {showAttendancePreview && (
        <AttendanceReminderModal
          isOpen={showAttendancePreview}
          batch={{
            $id: "demo-batch",
            BatchName: "Electrician 1st Year (Batch A)",
            attendanceTime: "09:00 AM - 05:00 PM",
          }}
          onClose={() => setShowAttendancePreview(false)}
          onSnooze={() => {
            toast.info("Attendance reminder snoozed for 1 hour");
            setShowAttendancePreview(false);
          }}
        />
      )}

      {/* Test Modal Preview */}
      {showTestPreview && (
        <TestAssignedModal
          isOpen={showTestPreview}
          notification={{
            id: "demo-notif",
            type: "mock_test_assigned",
            message: "New Test: Trade Theory Unit 4 - Electrical Motors",
            paperId: "sample-paper-123",
          }}
          user={user}
          onClose={() => setShowTestPreview(false)}
        />
      )}
    </div>
  );
}
