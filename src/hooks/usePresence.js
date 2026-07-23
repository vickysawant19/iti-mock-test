import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Permission, Role } from "appwrite";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import { selectActiveBatchId, selectActiveBatch } from "@/store/activeBatchSlice";
import { presenceClient } from "@/services/appwriteClient";

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
const PRESENCE_TTL_MINUTES = 2;       // expires 2 minutes after last heartbeat
const AWAY_DELAY_MS = 60_000;          // Wait 60 seconds before marking user as away on window blur
const IDLE_TIMEOUT_MS = 300_000;      // 5 minutes of inactivity before marking user as away

const getPresenceResources = () => ({ presenceClient });

/**
 * usePresence — manages the current user's live presence and tracks online/offline status of all users.
 *
 * @param {string|undefined} currentUserId  - The logged-in user's $id (falls back to Redux user)
 * @param {string}           currentStatus  - e.g. "online", "away", "typing"
 * @param {object}           metadata       - Extra data (page, device, etc.)
 */
export function usePresence(currentUserId, currentStatus = "online", metadata = {}) {
  const reduxUser = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector(selectActiveBatchId);
  const activeBatch = useSelector(selectActiveBatch);
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const disabledRef = useRef(false);
  const isMountedRef = useRef(false);
  const isFocusedRef = useRef(true);
  const isIdleRef = useRef(false);

  // Timer references for blur-delay and idle tracking
  const awayTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(0);
  const lastUpsertRef = useRef({ time: 0, payloadJson: "" });

  // Fallback to redux user if currentUserId isn't explicitly passed
  const effectiveUserId = currentUserId || reduxUser?.$id;

  // Stable refs for values used inside callbacks to avoid stale closures and unnecessary reruns
  const userIdRef = useRef(effectiveUserId);
  userIdRef.current = effectiveUserId;

  const sessionIdRef = useRef(Math.random().toString(36).substring(2, 9));

  const statusRef = useRef(currentStatus);
  statusRef.current = currentStatus;

  const getActivityType = (path) => {
    if (path.includes("mock")) return "Mock Test";
    if (path.includes("attendance")) return "Attendance";
    if (path.includes("leaderboard")) return "Leaderboard";
    if (path.includes("profile")) return "Profile";
    if (path.includes("settings")) return "Settings";
    return "Dashboard";
  };

  const metadataRef = useRef(metadata);
  metadataRef.current = {
    page: location.pathname,
    activity: getActivityType(location.pathname),
    userName: profile?.userName || reduxUser?.name || "User",
    profileImage: profile?.profileImage || null,
    role: profile?.role?.[0] || (reduxUser?.labels?.[0] || "Student"),
    activeBatchId: activeBatchId || null,
    batchId: activeBatchId || null,
    teamId: activeBatch?.teamId || null,
    device: typeof window !== "undefined" && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop",
    sessionId: sessionIdRef.current,
    lastSeen: new Date().toISOString(),
    ...metadata,
  };

  // ── Core Upsert ───────────────────────────────────────────────────────────
  const upsertSelfPresence = useCallback(async (statusOverride) => {
    const userId = userIdRef.current;
    if (!userId || disabledRef.current) return;

    // Deduce status:
    // 1. statusOverride if explicitly passed
    // 2. "away" if either tab is blurred or user is inactive (idle)
    // 3. Current active status otherwise (defaulting to "online")
    let status = statusOverride;
    if (!status) {
      if (!isFocusedRef.current || isIdleRef.current) {
        status = "away";
      } else {
        status = statusRef.current;
      }
    }

    // Deduplicate rapid identical upserts (such as on route mount and state initialization renders)
    const currentPayloadJson = JSON.stringify({
      status,
      metadata: metadataRef.current,
    });
    const now = Date.now();
    if (
      lastUpsertRef.current.payloadJson === currentPayloadJson &&
      now - lastUpsertRef.current.time < 3000
    ) {
      return;
    }
    lastUpsertRef.current = { time: now, payloadJson: currentPayloadJson };

    const expiresAt = new Date(
      Date.now() + PRESENCE_TTL_MINUTES * 60 * 1000
    ).toISOString();

    const { presenceClient } = getPresenceResources();

    // CRITICAL: The client SDK's `presences.upsert` does not serialize `userId` in the HTTP payload.
    // However, the Appwrite backend requires `userId` when using API key authentication.
    // To resolve this, we bypass the SDK method and invoke `presenceClient.call` directly,
    // explicitly providing the `userId` in the payload body.
    const apiPath = `/presences/${encodeURIComponent(String(userId))}`;
    const uri = new URL(presenceClient.config.endpoint + apiPath);
    const apiHeaders = {
      "X-Appwrite-Project": presenceClient.config.project,
      "content-type": "application/json",
      "accept": "application/json",
    };
    const payload = {
      userId,
      status,
      expiresAt,
      metadata: metadataRef.current,
      permissions: [
        // All users can read (see) this presence record
        Permission.read(Role.users()),
        // Only the owner can update or delete their own presence record
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    };

    try {
      await presenceClient.call("put", uri, apiHeaders, payload);
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
    const { presenceClient } = getPresenceResources();
    const apiPath = `/presences/${encodeURIComponent(String(userIdToDelete))}`;
    const uri = new URL(presenceClient.config.endpoint + apiPath);
    const apiHeaders = {
      "X-Appwrite-Project": presenceClient.config.project,
      "content-type": "application/json",
      "accept": "application/json",
    };
    const payload = {
      userId: userIdToDelete,
    };

    try {
      await presenceClient.call("delete", uri, apiHeaders, payload);
    } catch (err) {
      // Ignore: session or presence record might already be gone on logout
    }
  }, []);

  // ── Main Effect: Presence registration, heartbeat, focus/blur, idle timers ──
  useEffect(() => {
    if (!effectiveUserId) {
      setIsLoading(false);
      return;
    }

    isMountedRef.current = true;
    disabledRef.current = false; // Reset on user sign-in

    // Heartbeat: push expiresAt forward periodically
    const heartbeatId = setInterval(() => {
      upsertSelfPresence();
    }, HEARTBEAT_INTERVAL_MS);

    // Inactivity Idle Tracking
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      const wasIdle = isIdleRef.current;
      isIdleRef.current = false;

      // Restore back to online immediately if they were previously idle and are focused
      if (wasIdle && isFocusedRef.current) {
        upsertSelfPresence();
      }

      idleTimerRef.current = setTimeout(() => {
        isIdleRef.current = true;
        // Only mark as away if the tab is focused (if blurred, focus handlers handle it)
        if (isFocusedRef.current) {
          upsertSelfPresence();
        }
      }, IDLE_TIMEOUT_MS);
    };

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < 2000) return; // Throttle to every 2 seconds
      lastActivityRef.current = now;
      resetIdleTimer();
    };

    const activityEvents = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity));
    resetIdleTimer();

    // Focus/Blur states with transition grace period
    const onFocus = () => {
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
      const wasFocused = isFocusedRef.current;
      isFocusedRef.current = true;

      // Re-trigger upsert immediately if returning from a blurred "away" status
      if (!wasFocused) {
        upsertSelfPresence();
      }
    };

    const onBlur = () => {
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);

      // Grace period before marking user as away to prevent instant flip/flop on app switching
      awayTimerRef.current = setTimeout(() => {
        isFocusedRef.current = false;
        upsertSelfPresence();
      }, AWAY_DELAY_MS);
    };

    const handleBeforeUnload = () => {
      deleteSelfPresence(effectiveUserId);
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    setIsLoading(false);

    // Cleanup
    return () => {
      isMountedRef.current = false;

      clearInterval(heartbeatId);
      
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));

      // Cleanup presence when user signs out or hook is unmounted
      deleteSelfPresence(effectiveUserId);
    };
  }, [effectiveUserId, upsertSelfPresence, deleteSelfPresence]);

  // ── Effect: Trigger update on status or metadata change ───────────────────
  useEffect(() => {
    if (!effectiveUserId) return;
    isIdleRef.current = false; // Reset idle status when manual state changes
    upsertSelfPresence();
  }, [
    effectiveUserId,
    currentStatus,
    location.pathname,
    activeBatchId,
    profile?.userName,
    profile?.profileImage,
    profile?.role?.[0],
    upsertSelfPresence
  ]);

  return {
    onlineUsers: [],
    isLoading,
    error,
    /** Call this to manually refresh own presence (e.g., on action/route change) */
    refreshPresence: upsertSelfPresence,
  };
}
