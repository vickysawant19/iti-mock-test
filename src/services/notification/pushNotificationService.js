/**
 * pushNotificationService.js
 * Handles browser Web Push permission requests, Service Worker registration,
 * and background notification dispatch for ITI Mitra.
 */

class PushNotificationService {
  isSupported() {
    return typeof window !== "undefined" && "Notification" in window;
  }

  getPermission() {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  }

  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error("Notifications are not supported by your browser.");
    }
    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Helper to get active SW registration with a timeout so it never hangs
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
   * Dispatches a notification via Service Worker if available, or falls back to new Notification()
   */
  async showDirectNotification({ title, body, url = "/" }) {
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

    // 2. Direct Window Notification fallback (works in all browsers without SW dependency)
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
   * Dispatches a local system/PWA notification.
   * If delaySeconds > 0, sets a timer so the user can test background delivery!
   */
  async sendTestNotification({
    title = "ITI Mitra Practice Alert 🔔",
    body = "Push notifications are active! You will receive daily attendance and test alerts.",
    url = "/",
    delaySeconds = 0,
  } = {}) {
    if (!this.isSupported()) {
      throw new Error("Notifications are not supported on this browser.");
    }

    let perm = Notification.permission;
    if (perm !== "granted") {
      perm = await this.requestPermission();
      if (perm !== "granted") {
        throw new Error("Notification permission denied. Please allow notifications in browser site settings.");
      }
    }

    if (delaySeconds > 0) {
      setTimeout(() => {
        this.showDirectNotification({
          title,
          body: `[Background Test] ${body}`,
          url,
        }).catch((err) => {
          console.error("Delayed notification dispatch failed:", err);
        });
      }, delaySeconds * 1000);

      return `Notification scheduled in ${delaySeconds} seconds. You can minimize or switch tabs now!`;
    }

    await this.showDirectNotification({ title, body, url });
    return "Test notification sent! Check your system notification banner/center.";
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

