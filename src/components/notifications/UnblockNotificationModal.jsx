import React, { useState } from "react";
import {
  X,
  SlidersHorizontal,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bell,
  Globe,
  Settings,
  HelpCircle,
} from "lucide-react";
import pushNotificationService from "@/services/notification/pushNotificationService";
import webPushSubscriptionService from "@/services/notification/webPushSubscriptionService";
import { toast } from "react-toastify";

export default function UnblockNotificationModal({ isOpen, onClose, user, userBatches, onGranted }) {
  const [activeTab, setActiveTab] = useState("browser"); // 'browser' | 'app'
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleCheckPermission = async () => {
    setChecking(true);
    setErrorMessage("");
    try {
      const current = pushNotificationService.getPermission();
      if (current === "granted") {
        if (user?.$id) {
          const batchIds = (userBatches || []).map((b) => b.$id).filter(Boolean);
          await webPushSubscriptionService.subscribeAndSave(user.$id, batchIds);
        }
        toast.success("Push notifications enabled successfully! 🎉");
        if (onGranted) onGranted();
        onClose();
        return;
      }

      // If browser allows prompt again (state became default)
      if (current === "default") {
        const perm = await pushNotificationService.requestPermission();
        if (perm === "granted") {
          if (user?.$id) {
            const batchIds = (userBatches || []).map((b) => b.$id).filter(Boolean);
            await webPushSubscriptionService.subscribeAndSave(user.$id, batchIds);
          }
          toast.success("Push notifications enabled! 🎉");
          if (onGranted) onGranted();
          onClose();
          return;
        }
      }

      setErrorMessage(
        "Notifications are still marked as Blocked. Please follow the steps below in Chrome or Android Settings, then tap Check Again."
      );
    } catch (err) {
      setErrorMessage(err.message || "Failed to check permission");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Notifications Blocked in Chrome
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Follow these simple steps to allow practice alerts without clearing site data or reinstalling.
            </p>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-5">
          <button
            onClick={() => setActiveTab("browser")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "browser"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Chrome Browser Tab</span>
          </button>
          <button
            onClick={() => setActiveTab("app")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "app"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Installed PWA / Home Screen App</span>
          </button>
        </div>

        {/* Tab 1: Browser Tab Instructions */}
        {activeTab === "browser" && (
          <div className="space-y-3 mb-5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Tap the Tune / Settings Icon</span>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500 inline" />
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  At the top of Chrome, look at the address bar next to <strong>itimitra.in</strong> and tap the tune/slider icon (or lock 🔒).
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Tap &ldquo;Permissions&rdquo; or &ldquo;Site settings&rdquo;
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Select <strong>Permissions</strong> from the popup menu that appears.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Change Notifications to &ldquo;Allow&rdquo;
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Toggle Notifications to <strong>Allow</strong> (or tap <strong>Reset permissions</strong>).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PWA Installed App Instructions */}
        {activeTab === "app" && (
          <div className="space-y-3 mb-5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Go to Home Screen &amp; Long-Press App
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Long-press the <strong>ITI Mitra</strong> app icon on your phone home screen or app drawer.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Tap &ldquo;App info&rdquo; (circle ⓘ)
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Tap the <strong>App info</strong> or <strong>(i)</strong> button in the context menu.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Tap Notifications &rarr; Turn ON
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Tap <strong>Notifications</strong> and toggle <strong>Allow all notifications</strong> to ON.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pro-Tip: Android OS "Sites" Category */}
        <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200 mb-5 leading-relaxed">
          <span className="font-bold">⚠️ If Notifications is grayed out: </span>
          Android OS has muted Chrome sites. Go to phone <strong>Settings &gt; Apps &gt; Chrome &gt; Notifications &gt; Notification categories &gt; Sites (Turn ON)</strong>.
        </div>

        {/* Error Feedback Message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-2">
          <button
            onClick={handleCheckPermission}
            disabled={checking}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Verifying..." : "I've Allowed It &mdash; Check Again"}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold text-xs text-center cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
