import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Permission, Role, Channel, Query } from "appwrite";
import { realtime, presences } from "@/services/appwriteClient";
import { selectUser } from "@/store/userSlice";

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
const PRESENCE_TTL_MINUTES = 2;       // expires 2 minutes after last heartbeat

/**
 * usePresence — manages the current user's live presence and tracks online/offline status of all users.
 *
 * CRITICAL: permissions MUST include BOTH read AND update so any future
 * heartbeat upsert (PUT) can succeed. Omitting update causes a persistent
 * 401 "No permissions provided for action 'update'" on every heartbeat.
 *
 * @param {string|undefined} currentUserId  - The logged-in user's $id (falls back to Redux user)
 * @param {string}           currentStatus  - e.g. "online", "away", "typing"
 * @param {object}           metadata       - Extra data (page, device, etc.)
 */
export function usePresence(currentUserId, currentStatus = "online", metadata = {}) {
  const reduxUser = useSelector(selectUser);
  const location = useLocation();

  const [onlineUsers, setOnlineUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const disabledRef = useRef(false);
  const isMountedRef = useRef(false);
  const isFocusedRef = useRef(true);

  // Fallback to redux user if currentUserId isn't explicitly passed
  const effectiveUserId = currentUserId || reduxUser?.$id;

  // Stable refs for values used inside callbacks to avoid stale closures and unnecessary reruns
  const userIdRef = useRef(effectiveUserId);
  userIdRef.current = effectiveUserId;

  const statusRef = useRef(currentStatus);
  statusRef.current = currentStatus;

  const metadataRef = useRef(metadata);
  metadataRef.current = {
    page: location.pathname,
    ...metadata,
  };

  // ── Core Upsert ───────────────────────────────────────────────────────────
  const upsertSelfPresence = useCallback(async (statusOverride) => {
    const userId = userIdRef.current;
    if (!userId || disabledRef.current) return;

    const status = statusOverride || (isFocusedRef.current ? statusRef.current : "away");
    const expiresAt = new Date(
      Date.now() + PRESENCE_TTL_MINUTES * 60 * 1000
    ).toISOString();

    try {
      await presences.upsert({
        presenceId: userId, // use userId so only one record exists per user
        status,
        expiresAt,
        metadata: metadataRef.current,
        // permissions: [
        //   // All users can read (see) this presence record
        //   Permission.read(Role.users()),
        //   // Only the owner can update or delete their own presence record
        //   Permission.update(Role.user(userId)),
        //   Permission.delete(Role.user(userId)),
        // ],
      });
    } catch (err) {
      const code = err?.code;
      if (code === 401 || code === 403 || code === 404) {
        disabledRef.current = true;
        console.info(
          `[usePresence] Presences service is unavailable (code ${code}: ${err?.message}). ` +
          "Presence tracking gracefully disabled."
        );
      } else {
        console.error("[usePresence] upsert failed:", {
          code: err.code,
          type: err.type,
          message: err.message,
        });
      }
      setError(err);
    }
  }, []);

  // ── Core Delete ───────────────────────────────────────────────────────────
  const deleteSelfPresence = useCallback(async (userIdToDelete) => {
    if (!userIdToDelete || disabledRef.current) return;
    try {
      await presences.delete({ presenceId: userIdToDelete });
    } catch (err) {
      // Ignore: session or presence record might already be gone on logout
    }
  }, []);

  // ── Main Effect: Presence registration, heartbeat, focus listeners, subscription ──
  useEffect(() => {
    if (!effectiveUserId) {
      setIsLoading(false);
      return;
    }

    isMountedRef.current = true;
    disabledRef.current = false; // Reset on user sign-in

    // 1. Initial register self
    upsertSelfPresence();

    // 2. Fetch the current snapshot of online users
    const fetchInitialPresences = async () => {
      try {
        const response = await presences.list({
          queries: [Query.limit(100)],
        });
        if (isMountedRef.current) {
          const map = {};
          (response.presences ?? []).forEach((p) => {
            map[p.userId] = p;
          });
          setOnlineUsers(map);
        }
      } catch (err) {
        if (err?.code !== 401 && err?.code !== 403 && err?.code !== 404) {
          console.error("[usePresence] list failed:", err.message);
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };
    fetchInitialPresences();

    // 3. Heartbeat: push expiresAt forward periodically
    const heartbeatId = setInterval(() => {
      upsertSelfPresence();
    }, HEARTBEAT_INTERVAL_MS);

    // 4. Focus/Blur state listeners
    const onFocus = () => {
      isFocusedRef.current = true;
      upsertSelfPresence(statusRef.current);
    };
    const onBlur = () => {
      isFocusedRef.current = false;
      upsertSelfPresence("away");
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    // 5. Subscribe to live presence changes
    let subscription = null;
    let isSubscribed = true;

    const setupSubscription = async () => {
      try {
        const sub = await realtime.subscribe(Channel.presences(), (response) => {
          if (!isSubscribed || !isMountedRef.current) return;
          const event = response.events[0] ?? "";
          const payload = response.payload;
          if (!payload?.userId) return;

          setOnlineUsers((prev) => {
            const updated = { ...prev };
            if (event.endsWith(".delete")) {
              delete updated[payload.userId];
            } else {
              updated[payload.userId] = payload;
            }
            return updated;
          });
        });

        if ((!isSubscribed || !isMountedRef.current) && sub?.close) {
          sub.close();
        } else {
          subscription = sub;
        }
      } catch (err) {
        if (err?.code !== 401 && err?.code !== 403 && err?.code !== 404) {
          console.error("[usePresence] subscription failed:", err);
        }
      }
    };
    setupSubscription();

    // Cleanup
    return () => {
      isMountedRef.current = false;
      isSubscribed = false;

      clearInterval(heartbeatId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);

      if (subscription?.close) {
        subscription.close();
      }

      // Cleanup presence when user signs out or hook is unmounted
      deleteSelfPresence(effectiveUserId);
    };
  }, [effectiveUserId, upsertSelfPresence, deleteSelfPresence]);

  // ── Effect: Trigger update on status or metadata change ───────────────────
  useEffect(() => {
    if (!effectiveUserId) return;
    upsertSelfPresence();
  }, [effectiveUserId, currentStatus, location.pathname, upsertSelfPresence]);

  return {
    onlineUsers: Object.values(onlineUsers),
    isLoading,
    error,
    /** Call this to manually refresh own presence (e.g., on action/route change) */
    refreshPresence: upsertSelfPresence,
  };
}
