/**
 * pushActions.js — Appwrite Function handler for Web Push delivery
 *
 * Handles two scenarios:
 *
 * 1. EVENT-TRIGGERED (databases.itimocktest.tables.notifications.rows.*.create)
 *    When a notification document is created in Appwrite, this function
 *    looks up all push_subscriptions for the affected batch and sends a
 *    real Web Push message to every subscribed device (works even when
 *    the browser / app is completely closed).
 *
 * 2. HTTP ACTION: "send_push"
 *    Allows direct push dispatch from other parts of the system
 *    (e.g., scheduled attendance reminders).
 *
 * 3. HTTP ACTION: "send_attendance_reminder"
 *    Sends a daily "mark your attendance" push to all subscribed
 *    students in a batch (called from the Appwrite cron schedule).
 */

import webpush from "web-push";
import { Query } from "node-appwrite";

const DATABASE_ID = process.env.DATABASE_ID || "itimocktest";
const PUSH_SUBS_COLLECTION = "push_subscriptions";

/** Configure VAPID — required once per invocation */
function configureWebPush() {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ||
    "BJSKTMzlVkGsv9gEQlbHmr2yDg5LzMXhbjhkAzBfi1zEW5RC5PWUBfHsKTWY7bwlCWd4cQMo6GLP32PDJh3EDTk";
  const privateKey =
    process.env.VAPID_PRIVATE_KEY ||
    "Zsi3d-AGqobnEMbGlXuDP9XW0xed-iJvMB7V34vPfQI";
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@itimitra.in";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY env vars are missing.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

/**
 * Send a push notification to a single PushSubscription JSON.
 * Returns "ok" | "gone" | "error"
 */
async function sendToSubscription(subscriptionJson, payload) {
  try {
    const subscription = JSON.parse(subscriptionJson);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return "ok";
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired / unsubscribed — caller should remove it
      return "gone";
    }
    console.warn("[push] sendToSubscription error:", err.message);
    return "error";
  }
}

/**
 * Fetch all push_subscriptions for a set of batchIds.
 */
async function getSubscriptionsForBatches(tablesDB, batchIds) {
  if (!batchIds || batchIds.length === 0) return [];
  try {
    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PUSH_SUBS_COLLECTION,
      queries: [
        Query.contains("batchIds", batchIds),
        Query.limit(200),
      ],
    });
    return result?.rows || result?.documents || [];
  } catch (err) {
    console.warn("[push] getSubscriptionsForBatches error:", err.message);
    return [];
  }
}

/**
 * Delete a stale (gone) push_subscription row.
 */
async function deleteStaleSubscription(tablesDB, rowId) {
  try {
    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: PUSH_SUBS_COLLECTION,
      rowId,
    });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Core dispatch: fan out a push payload to all subscriptions in batchIds.
 * Returns { sent, gone, errors }
 */
async function dispatchPushToBatches(tablesDB, batchIds, payload) {
  configureWebPush();
  const subs = await getSubscriptionsForBatches(tablesDB, batchIds);
  let sent = 0, gone = 0, errors = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      const result = await sendToSubscription(sub.subscriptionJson, payload);
      if (result === "ok") sent++;
      else if (result === "gone") {
        gone++;
        await deleteStaleSubscription(tablesDB, sub.$id);
      } else errors++;
    })
  );

  return { sent, gone, errors, total: subs.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ACTION HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle a Realtime `notifications.rows.*.create` event fired by Appwrite.
 * The event body is the newly created notification document.
 */
export async function handleNotificationCreatedEvent(notifDoc, tablesDB, trace) {
  const { batchId, type, message, paperId } = notifDoc;
  if (!batchId) {
    trace("[push-event] No batchId on notification — skipping push dispatch");
    return { skipped: true };
  }

  const title =
    type === "urgent_announcement"
      ? "🚨 URGENT ANNOUNCEMENT"
      : type === "mock_test_assigned"
      ? "📝 New Mock Test Assigned"
      : type === "challenge_assigned"
      ? "🏆 New Challenge Mission"
      : "📣 Batch Announcement";

  const url =
    type === "mock_test_assigned" && paperId && paperId !== "N/A"
      ? `/attain-test?paperid=${paperId}`
      : type === "challenge_assigned"
      ? "/arena?tab=missions&sub=challenges"
      : "/arena";

  const payload = {
    title,
    body: message || "You have a new update in ITI Mitra.",
    url,
    tag: `iti-notif-${type}-${batchId}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
  };

  trace(`[push-event] Dispatching "${title}" to batch ${batchId}`);
  const result = await dispatchPushToBatches(tablesDB, [batchId], payload);
  trace(`[push-event] Push result: sent=${result.sent} gone=${result.gone} errors=${result.errors}`);
  return result;
}

/**
 * HTTP action: "send_push"
 * Body: { action, batchIds, title, body, url, tag }
 */
export async function handleSendPush(body, tablesDB, trace) {
  const { batchIds, title, body: msgBody, url, tag } = body;

  if (!batchIds || !batchIds.length || !title) {
    throw new Error("send_push requires batchIds[] and title");
  }

  const payload = {
    title,
    body: msgBody || "",
    url: url || "/",
    tag: tag || "iti-mitra-general",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
  };

  trace(`[send_push] Dispatching "${title}" to ${batchIds.length} batch(es)`);
  return await dispatchPushToBatches(tablesDB, batchIds, payload);
}

/**
 * HTTP action: "send_attendance_reminder"
 * Body: { action, batchId?, batchName? }
 * Can be called per-batch or broadcast to all subscribed students (e.g. daily cron at 09:00).
 */
export async function handleAttendanceReminderPush(body = {}, tablesDB, trace) {
  const { batchId, batchName } = body;

  // 1. If a specific batchId is provided, deliver push to subscribers in that batch
  if (batchId) {
    const payload = {
      title: "📋 Attendance Reminder",
      body: `Don't forget to mark your attendance today${batchName ? ` for ${batchName}` : ""}! Tap to mark now.`,
      url: "/attendance/mark-my-attendance",
      tag: `iti-attendance-${batchId}`,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [200, 100, 200],
    };

    trace(`[attendance-reminder] Sending push to batch ${batchId}`);
    return await dispatchPushToBatches(tablesDB, [batchId], payload);
  }

  // 2. Broadcast mode: Send attendance reminder to all registered push subscribers
  configureWebPush();
  trace("[attendance-reminder] Broadcasting daily attendance reminder to all subscribed devices");
  try {
    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PUSH_SUBS_COLLECTION,
      queries: [Query.limit(500)],
    });
    const subs = result?.rows || result?.documents || [];
    let sent = 0, gone = 0, errors = 0;

    const payload = {
      title: "📋 Attendance Reminder",
      body: "Don't forget to mark your attendance today! Tap to mark your presence now.",
      url: "/attendance/mark-my-attendance",
      tag: "iti-attendance-daily",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [200, 100, 200],
    };

    await Promise.allSettled(
      subs.map(async (sub) => {
        const res = await sendToSubscription(sub.subscriptionJson, payload);
        if (res === "ok") sent++;
        else if (res === "gone") {
          gone++;
          await deleteStaleSubscription(tablesDB, sub.$id);
        } else errors++;
      })
    );

    trace(`[attendance-reminder] Broadcast result: sent=${sent} gone=${gone} errors=${errors}`);
    return { sent, gone, errors, total: subs.length };
  } catch (err) {
    trace(`[attendance-reminder] Broadcast error: ${err.message}`);
    throw err;
  }
}
