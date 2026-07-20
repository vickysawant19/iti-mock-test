import { useState, useEffect, useCallback } from "react";
import { Channel } from "appwrite";
import { presenceService as presences, realtime } from "@/services/appwriteClient";

// Global singleton state for online users to prevent duplicate network calls and WebSocket subscriptions
let globalOnlineUsers = new Map();
const listeners = new Set();
let initialFetchPromise = null;
let activeSubscription = null;
let isTrackingActive = false;
let trackingSessionId = 0;
const deletedDuringFetch = new Set();

async function startPresenceTracking() {
  isTrackingActive = true;
  trackingSessionId += 1;
  const mySession = trackingSessionId;

  if (initialFetchPromise) return initialFetchPromise;

  deletedDuringFetch.clear();

  initialFetchPromise = (async () => {
    try {
      const result = await presences.list();
      
      // If tracking was deactivated while we were listing, or another session started, immediately discard
      if (!isTrackingActive || mySession !== trackingSessionId) return;

      const fetched = result.presences ?? [];
      // Merge snapshot results, giving priority to any live event updates that already arrived
      for (const p of fetched) {
        if (!globalOnlineUsers.has(p.userId) && !deletedDuringFetch.has(p.userId)) {
          globalOnlineUsers.set(p.userId, p);
        }
      }
      notifyListeners();
    } catch (err) {
      if (err?.code !== 401 && err?.code !== 403 && err?.code !== 404) {
        console.warn("[useOnlineUsers] list failed:", err?.message);
      }
    }
  })();

  (async () => {
    try {
      const sub = await realtime.subscribe(Channel.presences(), (response) => {
        const presence = response.payload;
        if (!presence?.userId) return;

        const isDelete = response.events?.some((e) => e.includes(".delete"));
        if (isDelete) {
          globalOnlineUsers.delete(presence.userId);
          deletedDuringFetch.add(presence.userId); // remember even after fetch resolves
        } else {
          globalOnlineUsers.set(presence.userId, presence);
        }
        notifyListeners();
      });

      // If tracking was deactivated while we were subscribing, or another session started, immediately unsubscribe to prevent leaks
      if (!isTrackingActive || mySession !== trackingSessionId) {
        if (sub && typeof sub.unsubscribe === "function") {
          sub.unsubscribe();
        }
        return null;
      }

      activeSubscription = sub;
      return sub;
    } catch (err) {
      if (err?.code !== 401 && err?.code !== 403 && err?.code !== 404) {
        console.warn("[useOnlineUsers] subscribe failed:", err?.message);
      }
      return null;
    }
  })();

  return initialFetchPromise;
}

function stopPresenceTracking() {
  isTrackingActive = false;
  trackingSessionId += 1; // invalidates any in-flight subscribe from this point on
  if (activeSubscription) {
    if (typeof activeSubscription.unsubscribe === "function") {
      activeSubscription.unsubscribe();
    }
  }
  globalOnlineUsers.clear();
  deletedDuringFetch.clear();
  initialFetchPromise = null;
  activeSubscription = null;
}

function notifyListeners() {
  const snapshot = new Map(globalOnlineUsers);
  listeners.forEach((listener) => listener(snapshot));
}

/**
 * Maintains a live Map<userId, presence> of every online/away user.
 * Shares a single global WebSocket subscription and snapshot fetch.
 *
 * Returns:
 *   onlineUsers   - Map<userId, presence>
 *   isOnline(id)  - true if status === 'online'
 *   isAway(id)    - true if status === 'away'
 *   getStatus(id) - 'online' | 'away' | 'offline'
 */
export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState(new Map(globalOnlineUsers));

  useEffect(() => {
    listeners.add(setOnlineUsers);

    // If first component using the hook mounts, start the shared tracking
    if (listeners.size === 1) {
      startPresenceTracking();
    }

    return () => {
      listeners.delete(setOnlineUsers);
      // If last component using the hook unmounts, stop the shared tracking
      if (listeners.size === 0) {
        stopPresenceTracking();
      }
    };
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const getStatus = useCallback(
    (userId) => {
      if (!userId) return "offline";
      const p = onlineUsers.get(userId);
      return p?.status ?? "offline";
    },
    [onlineUsers]
  );

  const isOnline = useCallback(
    (userId) => getStatus(userId) === "online",
    [getStatus]
  );

  const isAway = useCallback(
    (userId) => getStatus(userId) === "away",
    [getStatus]
  );

  return { onlineUsers, isOnline, isAway, getStatus };
}
