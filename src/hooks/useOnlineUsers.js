import { useState, useEffect, useCallback } from "react";
import { Channel } from "appwrite";
import { presences, realtime } from "@/services/appwriteClient";

/**
 * Maintains a live Map<userId, presence> of every online/away user.
 *
 * 1. Fetches an initial snapshot with presences.list()
 * 2. Subscribes to Channel.presences() for real-time updates
 *    - upsert / update  → set(userId, presence)
 *    - delete           → delete(userId)
 *
 * Returns:
 *   onlineUsers   - Map<userId, presence>
 *   isOnline(id)  - true if status === 'online'
 *   isAway(id)    - true if status === 'away'
 *   getStatus(id) - 'online' | 'away' | 'offline'
 */
export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  // ── Helper: apply a single presence event to the map ─────────────────────
  const applyEvent = useCallback((response) => {
    const presence = response.payload;
    if (!presence?.userId) return;

    const isDelete = response.events?.some((e) => e.includes(".delete"));

    setOnlineUsers((prev) => {
      const next = new Map(prev);
      if (isDelete) {
        next.delete(presence.userId);
      } else {
        next.set(presence.userId, presence);
      }
      return next;
    });
  }, []);

  // ── Mount: snapshot + realtime subscription ───────────────────────────────
  useEffect(() => {
    let sub = null;
    let mounted = true;

    const setup = async () => {
      // 1. Initial snapshot
      try {
        const result = await presences.list();
        if (!mounted) return;
        const map = new Map(
          (result.presences ?? []).map((p) => [p.userId, p])
        );
        setOnlineUsers(map);
      } catch (err) {
        // 401/403/404 = server doesn't support Presences API (< 1.9.5) — skip silently
        if (err?.code !== 401 && err?.code !== 403 && err?.code !== 404) {
          console.warn("[useOnlineUsers] list failed:", err?.message);
        }
        return; // Don't subscribe if list already failed with auth/not-found error
      }

      // 2. Subscribe to Channel.presences() — SDK v26 async, returns { close() }
      try {
        sub = await realtime.subscribe(Channel.presences(), applyEvent);
        if (!mounted && sub?.close) sub.close();
      } catch (err) {
        if (err?.code !== 401 && err?.code !== 403 && err?.code !== 404) {
          console.warn("[useOnlineUsers] subscribe failed:", err?.message);
        }
      }
    };

    setup();

    return () => {
      mounted = false;
      if (sub?.close) sub.close();
    };
  }, [applyEvent]);

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
