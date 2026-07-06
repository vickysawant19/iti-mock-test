import { useState, useEffect, useCallback } from "react";
import { Channel } from "appwrite";
import { presenceService as presences, realtime } from "@/services/appwriteClient";

// Global singleton state for online users to prevent duplicate network calls and WebSocket subscriptions
let globalOnlineUsers = new Map();
const listeners = new Set();
let initialFetchPromise = null;
let activeSubscription = null;

async function startPresenceTracking() {
  if (initialFetchPromise) return initialFetchPromise;

  initialFetchPromise = (async () => {
    try {
      const result = await presences.list();
      globalOnlineUsers = new Map(
        (result.presences ?? []).map((p) => [p.userId, p])
      );
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
        } else {
          globalOnlineUsers.set(presence.userId, presence);
        }
        notifyListeners();
      });
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
  if (activeSubscription) {
    if (typeof activeSubscription.unsubscribe === "function") {
      activeSubscription.unsubscribe();
    }
  }
  globalOnlineUsers.clear();
  initialFetchPromise = null;
  activeSubscription = null;
}

function notifyListeners() {
  listeners.forEach((listener) => listener(new Map(globalOnlineUsers)));
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
