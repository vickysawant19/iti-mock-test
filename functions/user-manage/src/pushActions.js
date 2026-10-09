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
 * Send a push notification to a single PushSubscription JSON string or Object.
 * Returns "ok" | "gone" | "error"
 */
async function sendToSubscription(subscriptionInput, payload, trace) {
  try {
    let subscription = subscriptionInput;
    if (typeof subscriptionInput === "string") {
      try {
        subscription = JSON.parse(subscriptionInput);
      } catch (parseErr) {
        if (trace) trace(`[push] Failed to parse subscription string: ${parseErr.message}`);
        return "error";
      }
    }

    if (!subscription || !subscription.endpoint) {
      if (trace) trace("[push] Invalid subscription object: missing endpoint");
      return "error";
    }

    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    const res = await webpush.sendNotification(subscription, payloadStr);
    const status = res?.statusCode || 201;
    if (trace) trace(`[push] FCM dispatch SUCCESS (statusCode: ${status})`);
    return "ok";
  } catch (err) {
    if (trace) trace(`[push] FCM dispatch FAILED: ${err.message} (statusCode: ${err.statusCode || "N/A"})`);
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
async function dispatchPushToBatches(tablesDB, batchIds, payload, trace) {
  configureWebPush();
  const subs = await getSubscriptionsForBatches(tablesDB, batchIds);
  let sent = 0, gone = 0, errors = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      const result = await sendToSubscription(sub.subscriptionJson, payload, trace);
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
  const result = await dispatchPushToBatches(tablesDB, [batchId], payload, trace);
  trace(`[push-event] Push result: sent=${result.sent} gone=${result.gone} errors=${result.errors}`);
  return result;
}

/**
 * HTTP action: "send_push"
 * Body: {
 *   action: "send_push",
 *   title: string,
 *   body?: string,
 *   url?: string,
 *   tag?: string,
 *   delaySeconds?: number, // Delays push dispatch to allow testing with browser closed!
 *   subscriptionJson?: string | object, // Direct device test
 *   userId?: string, // Target all registered devices for user
 *   batchIds?: string[], // Target all students enrolled in batches
 * }
 */
export async function handleSendPush(body, tablesDB, trace) {
  const {
    batchIds,
    userId,
    subscriptionJson,
    subscription,
    title,
    body: msgBody,
    url,
    tag,
    delaySeconds = 0,
  } = body;

  if (!title) {
    throw new Error("send_push requires a title");
  }

  const payload = {
    title,
    body: msgBody || "",
    url: url || "/",
    tag: tag || "iti-mitra-general",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: {
      url: url || "/",
      sentAt: new Date().toISOString(),
    },
  };

  // 1. Direct subscription test (used by Admin Closed-Browser diagnostic tester)
  const targetSub = subscriptionJson || subscription;
  if (targetSub) {
    configureWebPush();
    if (delaySeconds > 0) {
      const waitTime = Math.min(Number(delaySeconds), 25);
      trace(`[send_push] Waiting ${waitTime}s before sending so user can close browser...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }
    trace(`[send_push] Dispatching direct Web Push: "${title}"`);
    const status = await sendToSubscription(targetSub, payload, trace);
    const isOk = status === "ok";
    const isGone = status === "gone";
    return {
      sent: isOk ? 1 : 0,
      gone: isGone ? 1 : 0,
      errors: !isOk && !isGone ? 1 : 0,
      total: 1,
      mode: "direct_subscription",
      delaySeconds,
      status,
    };
  }

  // 2. Direct user targeting (target all devices registered for this user ID)
  if (userId) {
    configureWebPush();
    if (delaySeconds > 0) {
      const waitTime = Math.min(Number(delaySeconds), 25);
      trace(`[send_push] Waiting ${waitTime}s before sending to user ${userId}...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }
    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PUSH_SUBS_COLLECTION,
      queries: [Query.equal("userId", userId), Query.limit(10)],
    });
    const subs = result?.rows || result?.documents || [];
    if (!subs.length) {
      trace(`[send_push] No push subscriptions found for user ${userId}`);
      return {
        sent: 0,
        gone: 0,
        errors: 0,
        total: 0,
        mode: "user_id",
        message: "No active push subscription registered for this user in DB",
      };
    }
    let sent = 0,
      gone = 0,
      errors = 0;
    await Promise.allSettled(
      subs.map(async (sub) => {
        const res = await sendToSubscription(sub.subscriptionJson, payload, trace);
        if (res === "ok") sent++;
        else if (res === "gone") {
          gone++;
          await deleteStaleSubscription(tablesDB, sub.$id);
        } else errors++;
      })
    );
    trace(`[send_push] Dispatched to user ${userId}: sent=${sent} gone=${gone} errors=${errors}`);
    return { sent, gone, errors, total: subs.length, mode: "user_id", delaySeconds };
  }

  // 3. Batch broadcast targeting
  if (!batchIds || !batchIds.length) {
    throw new Error("send_push requires batchIds[], userId, or subscriptionJson");
  }

  if (delaySeconds > 0) {
    const waitTime = Math.min(Number(delaySeconds), 25);
    trace(`[send_push] Waiting ${waitTime}s before sending to batch(es)...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
  }

  trace(`[send_push] Dispatching "${title}" to ${batchIds.length} batch(es)`);
  const result = await dispatchPushToBatches(tablesDB, batchIds, payload, trace);
  return { ...result, mode: "batch", delaySeconds };
}

/**
 * HTTP action: "diagnose_vapid"
 * Returns the current VAPID server configuration, key health, and subscription count
 */
export async function handleVapidDiagnostics(body, tablesDB, trace) {
  configureWebPush();
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ||
    "BJSKTMzlVkGsv9gEQlbHmr2yDg5LzMXhbjhkAzBfi1zEW5RC5PWUBfHsKTWY7bwlCWd4cQMo6GLP32PDJh3EDTk";
  const hasPrivateKey = Boolean(
    process.env.VAPID_PRIVATE_KEY || "Zsi3d-AGqobnEMbGlXuDP9XW0xed-iJvMB7V34vPfQI"
  );
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@itimitra.in";

  let totalSubscriptions = 0;
  let activeBatchesCount = 0;
  try {
    const listRes = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PUSH_SUBS_COLLECTION,
      queries: [Query.limit(100)],
    });
    const rows = listRes?.rows || listRes?.documents || [];
    totalSubscriptions = listRes?.total ?? rows.length;

    const batches = new Set();
    rows.forEach((r) => {
      if (Array.isArray(r.batchIds)) {
        r.batchIds.forEach((b) => batches.add(b));
      }
    });
    activeBatchesCount = batches.size;
  } catch (err) {
    trace(`[vapid-diag] Error querying push_subscriptions: ${err.message}`);
  }

  return {
    vapidConfigured: true,
    hasPrivateKey,
    publicKey,
    subject,
    totalSubscriptions,
    activeBatchesCount,
    serverTimestamp: new Date().toISOString(),
  };
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
    return await dispatchPushToBatches(tablesDB, [batchId], payload, trace);
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
        const res = await sendToSubscription(sub.subscriptionJson, payload, trace);
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
