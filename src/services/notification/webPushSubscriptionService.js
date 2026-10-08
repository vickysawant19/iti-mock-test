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
import { tablesDb } from "../core/appwriteClient";
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
   * Gets the active SW registration (waits up to 3 s).
   */
  async _getRegistration(timeoutMs = 3000) {
    if (!("serviceWorker" in navigator)) return null;
    try {
      const swReady = navigator.serviceWorker.ready;
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs));
      return await Promise.race([swReady, timeout]);
    } catch {
      return null;
    }
  }

  /**
   * Subscribe this browser to Web Push.
   * Returns the PushSubscription object, or null if unsupported/denied.
   */
  async subscribe() {
    if (!this.isSupported()) return null;
    if (Notification.permission !== "granted") return null;

    const registration = await this._getRegistration();
    if (!registration) return null;

    try {
      // Check if already subscribed
      const existing = await registration.pushManager.getSubscription();
      if (existing) return existing;

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      return subscription;
    } catch (err) {
      console.warn("[WebPush] subscribe() failed:", err);
      return null;
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
}

export const webPushSubscriptionService = new WebPushSubscriptionService();
export default webPushSubscriptionService;
