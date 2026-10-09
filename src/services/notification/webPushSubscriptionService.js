/**
 * webPushSubscriptionService.js
 *
 * Handles the full lifecycle of Web Push subscriptions:
 *  1. Subscribe the browser using the VAPID public key
 *  2. Persist the PushSubscription to Appwrite (push_subscriptions collection)
 *  3. Unsubscribe & remove from Appwrite on logout / permission revoke
 *
 * The Appwrite Function listens for `notifications.*.create` events and
 * calls web-push to deliver background notifications to every stored
 * subscription for the matching batch, even when the browser is closed.
 */

import { ID, Query, Permission, Role } from "appwrite";
import { tablesDb, functions } from "../core/appwriteClient";
import conf from "../../config/config";

const COLLECTION_ID = conf.pushSubscriptionsCollectionId || "push_subscriptions";
const DATABASE_ID = conf.databaseId || "itimocktest";

// VAPID public key with fallback so Vercel deployment works without setting .env
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  conf.vapidPublicKey ||
  "BJSKTMzlVkGsv9gEQlbHmr2yDg5LzMXhbjhkAzBfi1zEW5RC5PWUBfHsKTWY7bwlCWd4cQMo6GLP32PDJh3EDTk";

/** Convert a base64url string to Uint8Array (required by browser's subscribe API) */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class WebPushSubscriptionService {
  /**
   * Returns true if Web Push is fully supported in this browser.
   */
  isSupported() {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      Boolean(VAPID_PUBLIC_KEY)
    );
  }

  /**
   * Actively registers the service worker if not already registered.
   * Tries Workbox /sw.js, and falls back to /custom-sw.js.
   */
  async registerServiceWorker() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg || !reg.active) {
        try {
          reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        } catch {
          reg = await navigator.serviceWorker.register("/custom-sw.js", { scope: "/" });
        }
      }

      if (reg && !reg.active && (reg.installing || reg.waiting)) {
        await new Promise((resolve) => {
          const sw = reg.installing || reg.waiting;
          if (sw) {
            sw.addEventListener("statechange", () => {
              if (sw.state === "activated") resolve();
            });
          }
          setTimeout(resolve, 5000);
        });
      }

      return reg;
    } catch (err) {
      console.warn("[WebPush] registerServiceWorker error:", err);
      return null;
    }
  }

  /**
   * Gets the active SW registration (auto-registers and waits for ready state).
   */
  async _getRegistration(timeoutMs = 15000) {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active) return reg;

      // If registered but installing/waiting, give it time to activate
      if (reg && (reg.installing || reg.waiting)) {
        await new Promise((resolve) => {
          const sw = reg.installing || reg.waiting;
          if (sw) {
            sw.addEventListener("statechange", () => {
              if (sw.state === "activated") resolve();
            });
          }
          setTimeout(resolve, 5000);
        });
        if (reg.active) return reg;
      }

      // If no registration at all, actively trigger registration
      if (!reg) {
        reg = await this.registerServiceWorker();
        if (reg?.active) return reg;
      }

      // Race with navigator.serviceWorker.ready
      const swReady = navigator.serviceWorker.ready;
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs));
      const readyReg = await Promise.race([swReady, timeout]);
      if (readyReg) return readyReg;

      return await navigator.serviceWorker.getRegistration();
    } catch {
      return null;
    }
  }

  /**
   * Subscribe this browser to Web Push with robust Android Chrome support.
   * Returns the PushSubscription object, or throws a detailed descriptive error.
   */
  async subscribe(options = {}) {
    const forceNew = options?.forceNew || false;

    if (!this.isSupported()) {
      throw new Error("Web Push is not supported on this browser or platform.");
    }
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      throw new Error(
        `Notification permission is "${Notification.permission}". Please allow notifications in site settings and Android App settings.`
      );
    }

    const registration = await this._getRegistration(15000);
    if (!registration) {
      throw new Error(
        "Service Worker is not ready or failed to activate. Please reload the page."
      );
    }

    // Ensure registration is active before invoking PushManager
    if (!registration.active && (registration.installing || registration.waiting)) {
      await new Promise((resolve) => {
        const sw = registration.installing || registration.waiting;
        if (sw) {
          sw.addEventListener("statechange", () => {
            if (sw.state === "activated") resolve();
          });
        }
        setTimeout(resolve, 5000);
      });
    }

    try {
      const existing = await registration.pushManager.getSubscription();
      if (existing && !forceNew) {
        return existing;
      }

      if (existing && forceNew) {
        try {
          await existing.unsubscribe();
          // Android Chrome Google Play Services needs a moment to clear FCM registration
          await new Promise((resolve) => setTimeout(resolve, 800));
        } catch (unsubErr) {
          console.warn("[WebPush] Existing subscription unsubscribe warning:", unsubErr);
        }
      }

      const keyArray = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      let subscription = null;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyArray,
        });
      } catch (firstErr) {
        // Fallback for Chromium variants / WebViews that prefer ArrayBuffer
        if (keyArray.buffer) {
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: keyArray.buffer,
            });
          } catch {
            throw firstErr;
          }
        } else {
          throw firstErr;
        }
      }

      return subscription;
    } catch (err) {
      console.error("[WebPush] subscribe() failed:", err);
      let helpfulMsg = err.message || "Failed to subscribe to Web Push";
      if (err.name === "AbortError" || helpfulMsg.toLowerCase().includes("push service error")) {
        helpfulMsg =
          "Android Push Service error: Google Play Services could not register for push. Check that Chrome notifications are allowed in Android OS Settings > Apps > Chrome > Notifications, and Google Play Services is active.";
      } else if (err.name === "NotAllowedError") {
        helpfulMsg =
          "Notification permission was blocked or denied in browser settings.";
      } else if (err.name === "InvalidStateError") {
        helpfulMsg =
          "Service Worker activation incomplete. Please refresh the page and try again.";
      }
      throw new Error(helpfulMsg);
    }
  }

  /**
   * Unsubscribes from Web Push in the browser.
   */
  async unsubscribe() {
    const registration = await this._getRegistration();
    if (!registration) return;
    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    } catch (err) {
      console.warn("[WebPush] unsubscribe() failed:", err);
    }
  }

  /**
   * Gets the current browser subscription endpoint (for dedup checks).
   */
  async getCurrentEndpoint() {
    const registration = await this._getRegistration();
    if (!registration) return null;
    try {
      const sub = await registration.pushManager.getSubscription();
      return sub?.endpoint || null;
    } catch {
      return null;
    }
  }

  /**
   * Save a PushSubscription to the Appwrite push_subscriptions collection.
   * If a record with the same endpoint already exists, it is left unchanged
   * (idempotent). Includes batchIds and userId for server-side targeting.
   *
   * @param {PushSubscription} subscription
   * @param {string} userId
   * @param {string[]} batchIds  - the student's enrolled batch IDs
   */
  async saveSubscription(subscription, userId, batchIds = []) {
    if (!subscription || !userId) return null;

    const endpoint = subscription.endpoint;
    const subscriptionJson = JSON.stringify(subscription.toJSON());

    try {
      // Check if this endpoint is already saved
      const existing = await tablesDb.listRows({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [Query.equal("endpoint", endpoint), Query.limit(1)],
      });

      const rows = existing?.rows || existing?.documents || [];

      if (rows.length > 0) {
        // Update batchIds / userId in case they changed
        await tablesDb.updateRow({
          databaseId: DATABASE_ID,
          tableId: COLLECTION_ID,
          rowId: rows[0].$id,
          data: {
            userId,
            batchIds,
            subscriptionJson,
            updatedAt: new Date().toISOString(),
          },
        });
        return rows[0].$id;
      }

      // Create new record — readable only by the user (and server via API key)
      const doc = await tablesDb.createRow({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        rowId: ID.unique(),
        data: {
          userId,
          batchIds,
          endpoint,
          subscriptionJson,
          updatedAt: new Date().toISOString(),
        },
        permissions: [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ],
      });

      return doc.$id;
    } catch (err) {
      console.warn("[WebPush] saveSubscription() error:", err);
      return null;
    }
  }

  /**
   * Remove all push_subscriptions for this user from Appwrite.
   * Called on logout.
   */
  async removeSubscriptionsForUser(userId) {
    if (!userId) return;
    try {
      const result = await tablesDb.listRows({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [Query.equal("userId", userId), Query.limit(10)],
      });
      const rows = result?.rows || result?.documents || [];
      await Promise.allSettled(
        rows.map((row) =>
          tablesDb.deleteRow({
            databaseId: DATABASE_ID,
            tableId: COLLECTION_ID,
            rowId: row.$id,
          })
        )
      );
    } catch (err) {
      console.warn("[WebPush] removeSubscriptionsForUser() error:", err);
    }
  }

  /**
   * Full subscribe-and-save flow:
   *  1. Subscribe browser
   *  2. Save to Appwrite
   *
   * @param {string} userId
   * @param {string[]} batchIds
   * @returns {boolean} true if successfully subscribed & saved
   */
  async subscribeAndSave(userId, batchIds = []) {
    if (!this.isSupported() || !userId) return false;
    try {
      const subscription = await this.subscribe();
      if (!subscription) return false;
      await this.saveSubscription(subscription, userId, batchIds);
      // Persist batchIds locally for SW alarm scheduling
      localStorage.setItem(`wp_batchIds_${userId}`, JSON.stringify(batchIds));

      // Ask the service worker to register Periodic Background Sync
      // (Chrome/Android only — harmless no-op on unsupported browsers)
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "REGISTER_PERIODIC_SYNC" });
      }

      return true;
    } catch (err) {
      console.warn("[WebPush] subscribeAndSave() error:", err);
      return false;
    }
  }

  /**
   * Update the batchIds on the existing subscription (e.g., after joining a batch).
   */
  async updateBatchIds(userId, batchIds = []) {
    if (!userId) return;
    const endpoint = await this.getCurrentEndpoint();
    if (!endpoint) return;

    try {
      const existing = await tablesDb.listRows({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [Query.equal("endpoint", endpoint), Query.limit(1)],
      });
      const rows = existing?.rows || existing?.documents || [];
      if (rows.length > 0) {
        await tablesDb.updateRow({
          databaseId: DATABASE_ID,
          tableId: COLLECTION_ID,
          rowId: rows[0].$id,
          data: { batchIds, updatedAt: new Date().toISOString() },
        });
      }
      localStorage.setItem(`wp_batchIds_${userId}`, JSON.stringify(batchIds));
    } catch (err) {
      console.warn("[WebPush] updateBatchIds() error:", err);
    }
  }

  /**
   * Returns configured client-side VAPID Public Key
   */
  getVapidPublicKey() {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Returns comprehensive diagnostic details of the current browser's
   * PushManager registration, VAPID key pairing, and Appwrite DB sync state.
   */
  async getSubscriptionDetails(userId) {
    const details = {
      isSupported: this.isSupported(),
      permission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
      vapidPublicKey: VAPID_PUBLIC_KEY,
      isVapidKeyValid: Boolean(VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY.length >= 80),
      swStatus: "Unknown",
      swScope: null,
      isSubscribed: false,
      subscription: null,
      endpoint: null,
      provider: "None",
      keys: { p256dh: null, auth: null },
      dbRecord: null,
      isSyncedWithDb: false,
    };

    if (!details.isSupported) return details;

    const registration = await this._getRegistration();
    if (registration) {
      details.swStatus = registration.active ? "Active" : "Registered (Not Active)";
      details.swScope = registration.scope;
      try {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          details.isSubscribed = true;
          details.subscription = sub;
          details.endpoint = sub.endpoint;

          // Identify Push Provider
          if (sub.endpoint.includes("fcm.googleapis.com")) {
            details.provider = "Google FCM (Chrome / Edge / Android)";
          } else if (sub.endpoint.includes("mozilla.com")) {
            details.provider = "Mozilla Autopush (Firefox)";
          } else if (sub.endpoint.includes("apple.com") || sub.endpoint.includes("push.apple.com")) {
            details.provider = "Apple APNs (Safari / iOS / macOS)";
          } else if (sub.endpoint.includes("windows.com")) {
            details.provider = "Windows WNS";
          } else {
            details.provider = "Web Push Provider";
          }

          // Extract public keys
          const rawSub = sub.toJSON();
          details.keys = {
            p256dh: rawSub.keys?.p256dh || null,
            auth: rawSub.keys?.auth || null,
          };

          // Check if recorded in Appwrite push_subscriptions collection
          try {
            const listRes = await tablesDb.listRows({
              databaseId: DATABASE_ID,
              tableId: COLLECTION_ID,
              queries: [Query.equal("endpoint", sub.endpoint), Query.limit(1)],
            });
            const rows = listRes?.rows || listRes?.documents || [];
            if (rows.length > 0) {
              details.dbRecord = rows[0];
              details.isSyncedWithDb = true;
            }
          } catch (dbErr) {
            console.warn("[WebPush] Error checking DB subscription:", dbErr);
          }
        }
      } catch (err) {
        console.warn("[WebPush] getSubscriptionDetails error:", err);
        details.error = err.message || String(err);
      }
    } else {
      details.swStatus = "No Service Worker Registered";
    }

    return details;
  }

  /**
   * Force unregisters existing subscription, clears stale state,
   * creates a brand new subscription with current VAPID keys, and syncs to Appwrite DB.
   */
  async forceResubscribe(userId, batchIds = []) {
    // 1. Unsubscribe any existing subscription
    await this.unsubscribe();
    // 2. Give Android Google Play Services time to release the FCM token
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 3. Subscribe with forceNew: true
    const sub = await this.subscribe({ forceNew: true });
    if (!sub) {
      throw new Error("Failed to create new browser push subscription.");
    }
    // 4. Save to Appwrite
    if (userId) {
      await this.saveSubscription(sub, userId, batchIds);
    }
    return sub;
  }

  /**
   * Queries the Appwrite user-manage function for live server-side VAPID status & stats.
   */
  async getServerVapidDiagnostics() {
    try {
      const response = await functions.createExecution({
        functionId: conf.userManageFunctionId,
        body: JSON.stringify({ action: "diagnose_vapid" }),
        async: false,
      });

      const resData = JSON.parse(response.responseBody || "{}");
      return {
        success: resData.success || false,
        data: resData.data || {},
        logs: resData.logs || [],
      };
    } catch (err) {
      console.warn("[WebPush] getServerVapidDiagnostics error:", err);
      throw err;
    }
  }

  /**
   * Dispatches a real Web Push notification from the Appwrite server (user-manage function).
   * Supports:
   *  - Direct subscription push (to current device)
   *  - User ID targeting
   *  - Batch broadcast
   *  - delaySeconds (e.g. 10s, 15s) so the admin can CLOSE THE BROWSER and test background OS delivery!
   */
  async testServerPush({
    delaySeconds = 0,
    title = "ITI Mitra Practice Alert 🔔",
    body = "Server push delivered successfully even with browser closed!",
    url = "/test-notifications",
    tag = "iti-admin-test",
    subscription = null,
    userId = null,
    batchIds = [],
    runAsync = false,
  }) {
    let subJson = null;
    if (subscription) {
      subJson = typeof subscription.toJSON === "function" ? subscription.toJSON() : subscription;
    } else {
      // Default to current browser's subscription if available
      const reg = await this._getRegistration();
      const currentSub = await reg?.pushManager?.getSubscription();
      if (currentSub) {
        subJson = currentSub.toJSON();
      }
    }

    const payload = {
      action: "send_push",
      title,
      body,
      url,
      tag,
      delaySeconds: Number(delaySeconds) || 0,
    };

    if (subJson) {
      payload.subscription = subJson;
      payload.subscriptionJson = typeof subJson === "string" ? subJson : JSON.stringify(subJson);
    } else if (userId) {
      payload.userId = userId;
    } else if (batchIds && batchIds.length > 0) {
      payload.batchIds = batchIds;
    } else {
      throw new Error(
        "No target specified. Please ensure your device is subscribed or provide a userId / batchId."
      );
    }

    try {
      const response = await functions.createExecution({
        functionId: conf.userManageFunctionId,
        body: JSON.stringify(payload),
        async: runAsync,
      });

      if (runAsync) {
        return {
          success: true,
          status: "queued",
          message: `Execution queued on server! Push will be delivered in ${delaySeconds} seconds.`,
        };
      }

      const resData = JSON.parse(response.responseBody || "{}");
      return {
        success: resData.success || false,
        data: resData.data || {},
        logs: resData.logs || [],
      };
    } catch (err) {
      console.error("[WebPush] testServerPush execution failed:", err);
      throw err;
    }
  }
}

export const webPushSubscriptionService = new WebPushSubscriptionService();
export default webPushSubscriptionService;
