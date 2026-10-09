import React, { useState, useEffect, useRef } from "react";
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
  Server,
  Key,
  Database,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Sparkles,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Power,
  Zap,
} from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { selectUser } from "@/store/userSlice";
import { selectUserBatches } from "@/store/activeBatchSlice";
import pushNotificationService from "@/services/notification/pushNotificationService";
import webPushSubscriptionService from "@/services/notification/webPushSubscriptionService";
import AttendanceReminderModal from "@/components/notifications/AttendanceReminderModal";
import TestAssignedModal from "@/components/notifications/TestAssignedModal";
import AnnouncementBanner from "@/components/notifications/AnnouncementBanner";

export default function NotificationTester() {
  const user = useSelector(selectUser);
  const userBatches = useSelector(selectUserBatches);

  // Diagnostics state
  const [diagLoading, setDiagLoading] = useState(true);
  const [permission, setPermission] = useState(pushNotificationService.getPermission());
  const [subDetails, setSubDetails] = useState(null);
  const [serverVapid, setServerVapid] = useState(null);
  const [serverLogs, setServerLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Closed-Browser push testing configuration
  const [isSending, setIsSending] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(15);
  const [targetMode, setTargetMode] = useState("direct"); // 'direct' | 'user' | 'batch'
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [testTitle, setTestTitle] = useState("ITI Mitra Practice Alert 🔔");
  const [testBody, setTestBody] = useState(
    "[Background Delivery] Verified push received while browser was completely closed!"
  );
  const [testUrl, setTestUrl] = useState("/test-notifications");

  // Countdown for Closed-Browser testing
  const [countdown, setCountdown] = useState(null);
  const [testPhase, setTestPhase] = useState("idle"); // 'idle' | 'scheduled' | 'dispatched'
  const timerRef = useRef(null);

  // Modal previews state
  const [showAttendancePreview, setShowAttendancePreview] = useState(false);
  const [showTestPreview, setShowTestPreview] = useState(false);
  const [showBannerPreview, setShowBannerPreview] = useState(false);

  // Load diagnostics
  const refreshDiagnostics = async () => {
    setDiagLoading(true);
    try {
      setPermission(pushNotificationService.getPermission());

      // 1. Browser Push & VAPID Subscription Details
      const details = await webPushSubscriptionService.getSubscriptionDetails(user?.$id);
      setSubDetails(details);

      // 2. Server-side VAPID Diagnostics
      try {
        const sRes = await webPushSubscriptionService.getServerVapidDiagnostics();
        if (sRes.success) {
          setServerVapid(sRes.data);
          if (Array.isArray(sRes.logs)) {
            setServerLogs((prev) => [...prev, ...sRes.logs]);
          }
        }
      } catch (sErr) {
        console.warn("[AdminDiag] Server VAPID check error:", sErr);
        setServerVapid({ error: sErr.message || "Failed to query server function" });
      }
    } catch (err) {
      console.error("[AdminDiag] Diagnostic refresh failed:", err);
      toast.error("Failed to load diagnostic details");
    } finally {
      setDiagLoading(false);
    }
  };

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      webPushSubscriptionService.registerServiceWorker().finally(() => {
        refreshDiagnostics();
      });
    } else {
      refreshDiagnostics();
    }
    // Default batch selection if available
    if (userBatches && userBatches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(userBatches[0].$id);
    }
  }, [user?.$id, userBatches]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (countdown === 0) {
      setTestPhase("dispatched");
    }

    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  // Copy helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Generate full structured diagnostic report text
  const generateDiagnosticReport = () => {
    const timestamp = new Date().toISOString();
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "N/A";
    const origin = typeof window !== "undefined" ? window.location.origin : "N/A";

    return `================================================================================
ITI MITRA — WEB PUSH & VAPID DIAGNOSTIC REPORT
Timestamp: ${timestamp}
Origin: ${origin}
User Agent: ${userAgent}
User ID: ${user?.$id || "Not logged in"}
Batches Enrolled: ${(userBatches || []).map((b) => b.BatchName || b.name || b.$id).join(", ") || "None"}
================================================================================

[LAYER 1: BROWSER PERMISSION]
- Notification Permission: ${permission}
- Notification API Supported: ${pushNotificationService.isSupported() ? "YES" : "NO"}

[LAYER 2: SERVICE WORKER & WORKBOX]
- Service Worker State: ${subDetails?.swStatus || "Unknown"}
- Active Scope: ${subDetails?.swScope || "None"}
- Service Worker Script: /custom-sw.js (PWA background push & notificationclick handler)

[LAYER 3: PUSHMANAGER & VAPID SUBSCRIPTION]
- Device Subscribed: ${subDetails?.isSubscribed ? "YES" : "NO"}
- Push Provider: ${subDetails?.provider || "None"}
- Client VAPID Public Key: ${subDetails?.vapidPublicKey || "None"}
- Key Length: ${subDetails?.vapidPublicKey?.length || 0} characters (Valid NIST P-256: ${subDetails?.isVapidKeyValid ? "YES" : "NO"})
- Push Endpoint: ${subDetails?.endpoint || "None"}
- Key p256dh: ${subDetails?.keys?.p256dh || "None"}
- Key auth: ${subDetails?.keys?.auth || "None"}

[LAYER 4: APPWRITE DATABASE SYNC (push_subscriptions)]
- Synced in Database: ${subDetails?.isSyncedWithDb ? "YES" : "NO"}
- Database Document ID: ${subDetails?.dbRecord?.$id || "Not found in DB"}
- Enrolled Batches in DB: ${JSON.stringify(subDetails?.dbRecord?.batchIds || [])}
- Last Updated in DB: ${subDetails?.dbRecord?.updatedAt || "N/A"}

[LAYER 5: SERVER CLOUD FUNCTION (user-manage)]
- Function Connected: ${serverVapid?.vapidConfigured ? "YES" : "NO"}
- Server Private Key: ${serverVapid?.hasPrivateKey ? "Configured (Secure)" : "MISSING"}
- Server Public Key: ${serverVapid?.publicKey || "N/A"}
- Public Keys Match: ${serverVapid?.publicKey === subDetails?.vapidPublicKey ? "YES (100% MATCH)" : "MISMATCH WARNING"}
- Total System Push Subscribers: ${serverVapid?.totalSubscriptions ?? "N/A"} devices
- Active Batches with Subscribers: ${serverVapid?.activeBatchesCount ?? "N/A"}
- Server Timestamp: ${serverVapid?.serverTimestamp || "N/A"}

[DEVICE SUBSCRIPTION JSON]
${subDetails?.subscription ? JSON.stringify(subDetails.subscription.toJSON(), null, 2) : "No active subscription"}

================================================================================
SERVER TRACE LOGS
================================================================================
${serverLogs && serverLogs.length > 0 ? serverLogs.join("\n") : "No execution logs in current session."}
================================================================================
END OF REPORT
================================================================================`;
  };

  const handleCopyDiagnosticReport = () => {
    const report = generateDiagnosticReport();
    handleCopy(report, "Diagnostic Result");
  };

  // Request browser permission
  const handleRequestPermission = async () => {
    try {
      const perm = await pushNotificationService.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        toast.success("Notification permission granted! 🎉");
        const batchIds = (userBatches || []).map((b) => b.$id).filter(Boolean);
        await webPushSubscriptionService.subscribeAndSave(user?.$id, batchIds);
        await refreshDiagnostics();
      } else {
        toast.warn(`Permission response: ${perm}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to request permission");
    }
  };

  // Re-subscribe device
  const handleResubscribe = async () => {
    try {
      toast.info("Generating fresh VAPID subscription and syncing with Appwrite...");
      const batchIds = (userBatches || []).map((b) => b.$id).filter(Boolean);
      await webPushSubscriptionService.forceResubscribe(user?.$id, batchIds);
      toast.success("Device successfully re-subscribed and synced! 🔔");
      await refreshDiagnostics();
    } catch (err) {
      toast.error(err.message || "Failed to re-subscribe");
    }
  };

  // Unsubscribe device
  const handleUnsubscribe = async () => {
    try {
      await webPushSubscriptionService.unsubscribe();
      toast.info("Unsubscribed from Web Push on this device.");
      await refreshDiagnostics();
    } catch (err) {
      toast.error(err.message || "Failed to unsubscribe");
    }
  };

  // Execute CLOSED-BROWSER test (triggers Appwrite Function with delay)
  const handleScheduleClosedBrowserPush = async () => {
    if (permission !== "granted") {
      toast.error("Please grant notification permission before running push tests.");
      return;
    }

    if (!subDetails?.isSubscribed && targetMode === "direct") {
      toast.error("Device is not subscribed yet. Click 'Re-subscribe Device' first.");
      return;
    }

    setIsSending(true);
    setTestPhase("scheduled");
    setCountdown(delaySeconds);

    try {
      const targetBatchIds =
        targetMode === "batch"
          ? selectedBatchId
            ? [selectedBatchId]
            : (userBatches || []).map((b) => b.$id).filter(Boolean)
          : [];

      const payload = {
        delaySeconds,
        title: testTitle,
        body:
          delaySeconds > 0
            ? `${testBody} (Delivered via ${delaySeconds}s background timer)`
            : testBody,
        url: testUrl,
        userId: targetMode === "user" ? user?.$id : null,
        batchIds: targetBatchIds,
        subscription: targetMode === "direct" ? subDetails?.subscription : null,
      };

      toast.info(
        `Server timer started! Delivering in ${delaySeconds}s. You can CLOSE YOUR BROWSER now.`,
        { autoClose: 7000 }
      );

      // Execute on server
      const result = await webPushSubscriptionService.testServerPush(payload);

      if (Array.isArray(result.logs)) {
        setServerLogs((prev) => [...prev, ...result.logs]);
      }

      if (result.success) {
        const data = result.data || {};
        toast.success(
          `Server finished dispatch! (Sent: ${data.sent ?? 1}, Stale cleaned: ${data.gone ?? 0})`
        );
      } else {
        toast.warn(`Server push response: ${JSON.stringify(result.data)}`);
      }
    } catch (err) {
      console.error("[AdminDiag] Push test error:", err);
      toast.error(err.message || "Push test dispatch failed");
      setTestPhase("idle");
      setCountdown(null);
    } finally {
      setIsSending(false);
      setTestPhase("dispatched");
    }
  };

  // Instant local preview
  const handleSendInstantLocal = async () => {
    try {
      await pushNotificationService.showDirectNotification({
        title: testTitle,
        body: "[Instant Local Test] Direct browser notification rendered immediately.",
        url: testUrl,
      });
      toast.success("Local notification dispatched! Check your notification shade.");
    } catch (err) {
      toast.error(err.message || "Local notification failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Diagnostic Suite</span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>Production VAPID Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Web Push & Closed-Browser Notification Tester
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Verify end-to-end background Web Push delivery when the browser or app is completely closed,
            inspect VAPID key pairs, and debug Appwrite service worker dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyDiagnosticReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            title="Copy complete 5-layer diagnostic result and VAPID state to clipboard"
          >
            {copiedField === "Diagnostic Result" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            )}
            <span>
              {copiedField === "Diagnostic Result" ? "Result Copied!" : "Copy Diagnostic Result"}
            </span>
          </button>

          <button
            onClick={refreshDiagnostics}
            disabled={diagLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${diagLoading ? "animate-spin text-blue-600" : ""}`} />
            <span>{diagLoading ? "Diagnosing..." : "Refresh Diagnostics"}</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 1: VAPID & Architecture Health Matrix (5 Layers) ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>VAPID & Delivery Engine Health Matrix</span>
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyDiagnosticReport}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Report</span>
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              5-Layer Verification System
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Layer 1: Browser Permission */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Layer 1</span>
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Permission</h3>
              <p className="text-xs text-slate-500 mt-0.5">Browser notification prompt</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  permission === "granted"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : permission === "denied"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {permission}
              </span>
              {permission !== "granted" && (
                <button
                  onClick={handleRequestPermission}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Request
                </button>
              )}
            </div>
          </div>

          {/* Layer 2: Service Worker */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Layer 2</span>
                <Radio className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Service Worker</h3>
              <p className="text-xs text-slate-500 mt-0.5">custom-sw.js Workbox engine</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  subDetails?.swStatus === "Active"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {subDetails?.swStatus || "Checking..."}
              </span>
              {subDetails?.swStatus !== "Active" && (
                <button
                  onClick={async () => {
                    toast.info("Registering Service Worker...");
                    await webPushSubscriptionService.registerServiceWorker();
                    await refreshDiagnostics();
                    toast.success("Service Worker registered & ready!");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 underline cursor-pointer"
                >
                  Register SW
                </button>
              )}
            </div>
          </div>

          {/* Layer 3: PushManager & VAPID Key */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Layer 3</span>
                <Key className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">PushManager</h3>
              <p className="text-xs text-slate-500 mt-0.5">VAPID device subscription</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  subDetails?.isSubscribed
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                }`}
              >
                {subDetails?.isSubscribed ? "Subscribed" : "Unsubscribed"}
              </span>
              {!subDetails?.isSubscribed && permission === "granted" ? (
                <button
                  onClick={handleResubscribe}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 underline cursor-pointer"
                >
                  Subscribe
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">P-256 Valid</span>
              )}
            </div>
          </div>

          {/* Layer 4: Appwrite Database Sync */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Layer 4</span>
                <Database className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Appwrite DB Sync</h3>
              <p className="text-xs text-slate-500 mt-0.5">push_subscriptions row</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  subDetails?.isSyncedWithDb
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {subDetails?.isSyncedWithDb ? "Synced in DB" : "Not In DB"}
              </span>
              {subDetails?.isSubscribed && !subDetails?.isSyncedWithDb && (
                <button
                  onClick={handleResubscribe}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Sync Now
                </button>
              )}
            </div>
          </div>

          {/* Layer 5: Cloud Function & Server VAPID */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Layer 5</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Server Function</h3>
              <p className="text-xs text-slate-500 mt-0.5">user-manage VAPID engine</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  serverVapid?.vapidConfigured
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                }`}
              >
                {serverVapid?.vapidConfigured ? "Live & Ready" : "Error"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {serverVapid?.totalSubscriptions ?? "?"} devices
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Banner Preview (if active) ── */}
      {showBannerPreview && (
        <div className="mb-6 animate-fade-in">
          <AnnouncementBanner
            announcement={{
              id: "test-preview-1",
              type: "urgent_announcement",
              message:
                "[Preview Test] College semester final examination will commence on Monday at 09:30 AM sharp.",
            }}
            onDismiss={() => setShowBannerPreview(false)}
          />
        </div>
      )}

      {/* ── SECTION 2 & 3: Main Testing Center (Two Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column: Closed-Browser Push Testing Center (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Closed-Browser Push Delivery Test
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dispatched from Appwrite Server via FCM / VAPID
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Background Capable</span>
              </span>
            </div>

            {/* Explanatory Callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              <p className="font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1.5">
                <span>How the Closed-Browser Test Works:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li>Select a countdown delay (e.g. 15s) and click <strong>"Schedule Closed-Browser Push"</strong>.</li>
                <li>The server immediately queues the task and starts counting down.</li>
                <li><strong>COMPLETELY CLOSE ALL BROWSER WINDOWS & TABS</strong> before the timer reaches 0.</li>
                <li>The server fires the VAPID Web Push packet to Google FCM / Apple APNs.</li>
                <li>Your operating system wakes up the Service Worker in the background and presents a native notification banner!</li>
              </ol>
            </div>

            {/* Test Configuration Controls */}
            <div className="space-y-4 mb-6">
              {/* Delay Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Timer Delay (Time to Close Your Browser)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { sec: 0, label: "Instant (0s)" },
                    { sec: 10, label: "10 Seconds" },
                    { sec: 15, label: "15s (Best)" },
                    { sec: 30, label: "30 Seconds" },
                  ].map(({ sec, label }) => (
                    <button
                      key={sec}
                      onClick={() => setDelaySeconds(sec)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                        delaySeconds === sec
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30"
                          : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Mode Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Dispatch Target
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "direct", label: "Current Device", desc: "Via PushSubscription JSON" },
                    { id: "user", label: "My User ID", desc: `user: ${user?.$id?.slice(0, 6) || "current"}...` },
                    { id: "batch", label: "Batch Broadcast", desc: "All batch students" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setTargetMode(m.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        targetMode === m.id
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold">{m.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Batch Selector if in Batch Mode */}
              {targetMode === "batch" && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Target Batch:
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    {(userBatches || []).map((b) => (
                      <option key={b.$id} value={b.$id}>
                        {b.BatchName || b.name || b.$id} ({b.$id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notification Payload Customizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Target Deep-Link URL
                  </label>
                  <input
                    type="text"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Countdown Banner when Scheduled */}
          {countdown !== null && (
            <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 text-amber-900 dark:text-amber-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-extrabold text-lg flex items-center justify-center">
                    {countdown}s
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                      {countdown > 0 ? "🚨 CLOSE YOUR BROWSER NOW!" : "✓ Dispatched from Server!"}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {countdown > 0
                        ? "Server is counting down. Close Chrome/Edge now to test background arrival."
                        : "Server has sent the Web Push. Watch your system notification center!"}
                    </p>
                  </div>
                </div>
                {countdown === 0 && (
                  <button
                    onClick={() => {
                      setCountdown(null);
                      setTestPhase("idle");
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900/60 font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleScheduleClosedBrowserPush}
              disabled={isSending || permission !== "granted"}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {delaySeconds > 0
                  ? `Schedule Closed-Browser Push (${delaySeconds}s)`
                  : "Dispatch Instant Server Push"}
              </span>
            </button>

            <button
              onClick={handleSendInstantLocal}
              disabled={permission !== "granted"}
              className="py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Renders notification locally without server execution"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Local Preview Only</span>
            </button>
          </div>
        </div>

        {/* Right Column: VAPID Diagnostics & Device Registration Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>VAPID & Device Details</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">RFC 8292</span>
            </div>

            <div className="space-y-3 text-xs mb-6">
              {/* Push Provider */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <span className="text-slate-500">Push Provider:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {subDetails?.provider || "None"}
                </span>
              </div>

              {/* VAPID Public Key */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500">VAPID Public Key:</span>
                  <button
                    onClick={() => handleCopy(subDetails?.vapidPublicKey, "VAPID Public Key")}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copiedField === "VAPID Public Key" ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg">
                  {subDetails?.vapidPublicKey || "None"}
                </div>
              </div>

              {/* Endpoint */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500">Device Push Endpoint:</span>
                  {subDetails?.endpoint && (
                    <button
                      onClick={() => handleCopy(subDetails?.endpoint, "Push Endpoint")}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {copiedField === "Push Endpoint" ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg">
                  {subDetails?.endpoint || "Device not registered in PushManager"}
                </div>
              </div>

              {/* Appwrite DB Row ID */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <span className="text-slate-500">DB Row ID:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {subDetails?.dbRecord?.$id || "Not found in database"}
                </span>
              </div>

              {/* Server VAPID Health */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <span className="text-slate-500">Server Private Key:</span>
                <span
                  className={`font-semibold ${
                    serverVapid?.hasPrivateKey ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {serverVapid?.hasPrivateKey ? "Configured (Secure)" : "Missing on Server"}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Action Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleResubscribe}
                className="py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-subscribe Device</span>
              </button>

              <button
                onClick={handleUnsubscribe}
                disabled={!subDetails?.isSubscribed}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Power className="w-3.5 h-3.5 text-slate-400" />
                <span>Unsubscribe</span>
              </button>
            </div>

            {subDetails?.subscription && (
              <button
                onClick={() =>
                  handleCopy(
                    JSON.stringify(subDetails.subscription.toJSON(), null, 2),
                    "Full PushSubscription JSON"
                  )
                }
                className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Full Subscription JSON for Debugging</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Interactive In-App Modal Previews ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-amber-500" />
          <span>In-App Modal & Realtime Alert Previews</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Preview the in-session interactive alert modals triggered by student test assignments and attendance reminders.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setShowAttendancePreview(true)}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-start gap-3 transition-colors cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Attendance Reminder Modal
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Pops up in active session if attendance is unmarked
              </p>
              <span className="inline-block mt-2 text-xs font-semibold text-blue-600">
                Preview Modal →
              </span>
            </div>
          </button>

          <button
            onClick={() => setShowTestPreview(true)}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-start gap-3 transition-colors cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Test Assignment Modal
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Pops up immediately when teacher assigns test
              </p>
              <span className="inline-block mt-2 text-xs font-semibold text-blue-600">
                Preview Modal →
              </span>
            </div>
          </button>

          <button
            onClick={() => setShowBannerPreview(true)}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-start gap-3 transition-colors cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Urgent Broadcast Banner
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays top sticky banner across all pages
              </p>
              <span className="inline-block mt-2 text-xs font-semibold text-blue-600">
                Preview Banner →
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── SECTION 5: Server Function Debug Console Logs ── */}
      <div className="bg-slate-950 text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold font-mono text-emerald-400">
              Appwrite Function Execution Traces (user-manage)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {serverLogs.length > 0 && (
              <button
                onClick={() => handleCopy(serverLogs.join("\n"), "Server Execution Logs")}
                className="text-xs font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                title="Copy all server execution logs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Logs</span>
              </button>
            )}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <span>{showLogs ? "Collapse Logs" : "Expand Logs"}</span>
              {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showLogs && (
          <div className="mt-3 p-4 rounded-2xl bg-black/60 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto space-y-1">
            {serverLogs.length === 0 ? (
              <p className="text-slate-600 italic">No execution logs recorded in this session.</p>
            ) : (
              serverLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span className="text-emerald-300/90">{log}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Attendance Modal Preview ── */}
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

      {/* ── Test Modal Preview ── */}
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
