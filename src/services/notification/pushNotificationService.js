/**
 * pushNotificationService.js
 * Handles browser Web Push permission requests, Service Worker registration,
 * and native Android/Capacitor local push notification dispatch for ITI Mitra.
 */
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import webPushSubscriptionService from "./webPushSubscriptionService";

class PushNotificationService {
  constructor() {
    this._nativePermission = "default";
    this._channelCreated = false;

    if (this.isNative()) {
      this._initNative();
    }
  }

  /**
   * Returns true if running as a native Android or iOS app via Capacitor
   */
  isNative() {
    return (
      typeof window !== "undefined" &&
      Boolean(window.Capacitor?.isNativePlatform?.() || Capacitor.isNativePlatform())
    );
  }

  async _initNative() {
    try {
      const status = await LocalNotifications.checkPermissions();
      this._nativePermission = this._mapNativeStatus(status.display);
      await this._ensureNotificationChannel();
      this._setupNativeClickListener();
    } catch (e) {
      console.warn("[PushNotificationService] Native init warning:", e);
    }
  }

  _mapNativeStatus(status) {
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "default";
  }

  async _ensureNotificationChannel() {
    if (!this.isNative() || this._channelCreated) return;
    try {
      await LocalNotifications.createChannel({
        id: "iti-mitra-alerts",
        name: "ITI Mitra Exam & Attendance Alerts",
        description: "Notifications for mock exams, results, and batch attendance updates",
        importance: 5, // High priority / heads-up notification
        visibility: 1, // Visible on lockscreen
        vibration: true,
        lights: true,
        lightColor: "#2563EB",
      });
      this._channelCreated = true;
    } catch (err) {
      console.warn("[PushNotificationService] Could not create notification channel:", err);
    }
  }

  _setupNativeClickListener() {
    try {
      LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
        const url = action.notification?.extra?.url;
        if (url && url !== "/") {
          window.location.href = url;
        }
      });
    } catch (err) {
      console.warn("[PushNotificationService] Could not attach native notification listener:", err);
    }
  }

  /**
   * Check if notifications are supported on this device/browser
   */
  isSupported() {
    if (typeof window === "undefined") return false;
    if (this.isNative()) return true;
    return "Notification" in window;
  }

  /**
   * Get current permission state ("granted", "denied", "default", or "unsupported")
   */
  getPermission() {
    if (!this.isSupported()) return "unsupported";
    if (this.isNative()) {
      return this._nativePermission;
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error("Notifications are not supported by your browser or device.");
    }

    if (this.isNative()) {
      try {
        const result = await LocalNotifications.requestPermissions();
        const mapped = this._mapNativeStatus(result.display);
        this._nativePermission = mapped;
        if (mapped === "granted") {
          await this._ensureNotificationChannel();
        }
        return mapped;
      } catch (err) {
        console.error("[PushNotificationService] Native requestPermissions failed:", err);
        throw err;
      }
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Listens for runtime permission changes
   */
  onPermissionChange(callback) {
    if (typeof window === "undefined") return () => {};

    let lastKnown = this.getPermission();
    let disposed = false;
    let permObj = null;

    if (!this.isNative() && "permissions" in navigator && typeof navigator.permissions.query === "function") {
      navigator.permissions
        .query({ name: "notifications" })
        .then((status) => {
          if (disposed) return;
          permObj = status;
          status.onchange = () => {
            const current = this.getPermission();
            if (current !== lastKnown) {
              lastKnown = current;
              callback(current);
            }
          };
        })
        .catch(() => {});
    }

    // Verify when returning from device app settings or another tab
    const handleFocus = async () => {
      if (this.isNative()) {
        try {
          const status = await LocalNotifications.checkPermissions();
          this._nativePermission = this._mapNativeStatus(status.display);
        } catch {}
      }
      const current = this.getPermission();
      if (current !== lastKnown) {
        lastKnown = current;
        callback(current);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      disposed = true;
      if (permObj) permObj.onchange = null;
      window.removeEventListener("focus", handleFocus);
    };
  }

  /**
   * Helper to get active SW registration with timeout
   */
  async getServiceWorkerRegistration(timeoutMs = 1500) {
    if (!("serviceWorker" in navigator)) return null;

    try {
      const swReadyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve(null), timeoutMs)
      );
      const registration = await Promise.race([swReadyPromise, timeoutPromise]);
      return registration || null;
    } catch {
      return null;
    }
  }

  /**
   * Dispatches a notification natively in the Android app or via Service Worker in browser
   */
  async showDirectNotification({ title, body, url = "/" }) {
    if (this.isNative()) {
      await this._ensureNotificationChannel();
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Date.now() % 1000000000),
              title,
              body,
              extra: { url },
              channelId: "iti-mitra-alerts",
              smallIcon: "ic_launcher_round",
            },
          ],
        });
        return;
      } catch (err) {
        console.error("[PushNotificationService] Native LocalNotification dispatch failed:", err);
        throw err;
      }
    }

    const options = {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [200, 100, 200],
      tag: "iti-mitra-alert",
      renotify: true,
      data: { url },
    };

    // 1. Try Service Worker showNotification first
    const registration = await this.getServiceWorkerRegistration(1500);
    if (registration && typeof registration.showNotification === "function") {
      try {
        await registration.showNotification(title, options);
        return;
      } catch (swErr) {
        console.warn("ServiceWorker showNotification failed, falling back to window Notification:", swErr);
      }
    }

    // 2. Direct Window Notification fallback
    try {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        if (url && url !== "/") {
          window.location.href = url;
        }
        notif.close();
      };
    } catch (winErr) {
      console.error("Window Notification failed:", winErr);
      throw winErr;
    }
  }

  /**
   * Dispatches a local system or Android notification.
   */
  async sendTestNotification({
    title = "ITI Mitra Practice Alert 🔔",
    body = "Push notifications are active! You will receive daily attendance and test alerts.",
    url = "/",
    delaySeconds = 0,
  } = {}) {
    if (!this.isSupported()) {
      throw new Error("Notifications are not supported on this device.");
    }

    let perm = this.getPermission();
    if (perm !== "granted") {
      perm = await this.requestPermission();
      if (perm !== "granted") {
        throw new Error("Notification permission denied. Please allow notifications in device settings.");
      }
    }

    if (delaySeconds > 0) {
      if (this.isNative()) {
        await this._ensureNotificationChannel();
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Date.now() % 1000000000),
              title,
              body: `[Background Test] ${body}`,
              schedule: { at: new Date(Date.now() + delaySeconds * 1000) },
              channelId: "iti-mitra-alerts",
              extra: { url },
              smallIcon: "ic_launcher_round",
            },
          ],
        });
        return `Notification scheduled in ${delaySeconds} seconds! You can minimize the app to see it pop up.`;
      }

      setTimeout(() => {
        this.showDirectNotification({
          title,
          body: `[Background Test] ${body}`,
          url,
        }).catch((err) => {
          console.error("Delayed notification dispatch failed:", err);
        });
      }, delaySeconds * 1000);

      return `Local notification scheduled in ${delaySeconds} seconds. Note: Requires this tab to remain open. For closed-browser testing, use Server Web Push.`;
    }

    await this.showDirectNotification({ title, body, url });
    return "Test notification sent! Check your device notification bar.";
  }

  /**
   * Dispatches a real Web Push notification from the Appwrite server (user-manage function).
   */
  async sendServerPushNotification({
    delaySeconds = 0,
    title = "ITI Mitra Practice Alert 🔔",
    body = "Server push delivered successfully even with browser closed!",
    url = "/test-notifications",
    subscription = null,
    userId = null,
    batchIds = [],
    runAsync = false,
  } = {}) {
    return await webPushSubscriptionService.testServerPush({
      delaySeconds,
      title,
      body,
      url,
      subscription,
      userId,
      batchIds,
      runAsync,
    });
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
