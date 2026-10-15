import React, { useState, useEffect } from "react";
import { Download, Sparkles, X, CheckCircle2, AlertCircle } from "lucide-react";
import { APP_VERSION } from "@/config/version";

/**
 * Compare two semver strings like "1.2.1" and "1.2.0".
 * Returns true if latest > current.
 */
function isNewerVersion(latest, current) {
  if (!latest || !current) return false;
  const lParts = String(latest).replace(/^v/, "").split(".").map(Number);
  const cParts = String(current).replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

const AppUpdateNotifier = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkUpdates = async () => {
      try {
        const response = await fetch(`/app-version.json?_t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = await response.json();
        if (!isMounted) return;

        const hasUpdate = isNewerVersion(data.latestVersion, APP_VERSION);
        if (hasUpdate) {
          const dismissedKey = `dismissed_update_${data.latestVersion}`;
          const isDismissed = sessionStorage.getItem(dismissedKey) === "true";

          if (data.forceUpdate || !isDismissed) {
            setUpdateInfo(data);
            setIsOpen(true);
          }
        }
      } catch (err) {
        // Silently ignore network failures on version checks
      }
    };

    // Run check shortly after app boot
    const timer = setTimeout(checkUpdates, 2000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (!isOpen || !updateInfo) return null;

  const handleDismiss = () => {
    if (updateInfo.forceUpdate) return;
    sessionStorage.setItem(`dismissed_update_${updateInfo.latestVersion}`, "true");
    setIsOpen(false);
  };

  const handleUpdate = () => {
    if (updateInfo.apkUrl) {
      window.open(updateInfo.apkUrl, "_system");
    }
    if (!updateInfo.forceUpdate) {
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-indigo-100 dark:border-indigo-950/50 overflow-hidden select-none">
        {/* Glow ambient accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button (if not forced) */}
        {!updateInfo.forceUpdate && (
          <button
            onClick={handleDismiss}
            aria-label="Close update notice"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Icon & Tag */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Update Available
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                v{updateInfo.latestVersion}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
              {updateInfo.title || "New Version Ready!"}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 font-medium leading-relaxed">
          {updateInfo.description ||
            "A newer and improved version of ITI Mitra is now available. Update now for the best performance and features."}
        </p>

        {/* Release highlights */}
        {Array.isArray(updateInfo.features) && updateInfo.features.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-5 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              What's New in v{updateInfo.latestVersion}:
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {updateInfo.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleUpdate}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
          >
            <Download size={16} />
            <span>Update App Now</span>
          </button>
          {!updateInfo.forceUpdate && (
            <button
              onClick={handleDismiss}
              className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Later
            </button>
          )}
        </div>

        {/* Footer Version notice */}
        <div className="mt-3 text-center text-[10px] text-slate-400">
          Installed: v{APP_VERSION} &bull; Latest: v{updateInfo.latestVersion}
        </div>
      </div>
    </div>
  );
};

export default AppUpdateNotifier;
