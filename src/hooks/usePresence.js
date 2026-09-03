import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Permission, Role } from "appwrite";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import { selectActiveBatchId, selectActiveBatch } from "@/store/activeBatchSlice";
import { realtime } from "@/services/core/appwriteClient";
import { updateLocalUserPresence } from "./useOnlineUsers";

const AWAY_DELAY_MS = 60_000;          // Wait 60 seconds before marking user as away on window blur
const IDLE_TIMEOUT_MS = 300_000;      // 5 minutes of inactivity before marking user as away

/**
 * usePresence — manages the current user's live presence via Appwrite Realtime WebSocket.
 *
 * Tying presence to WebSocket connection:
 * - No API key needed in frontend (uses authenticated client session)
 * - Automatic server-side cleanup on disconnect / tab close
 * - Automatic reconnection recovery by the SDK
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
  const lastBatchIdRef = useRef("");

  // Fallback to redux user if currentUserId isn't explicitly passed
  const effectiveUserId = currentUserId || reduxUser?.$id;

  // Resolve batch ID from Redux, Profile, or localStorage cache so presence has activeBatchId immediately
  const cachedBatchId =
    effectiveUserId ? localStorage.getItem(`activeBatch_${effectiveUserId}`) : "";
  const resolvedBatchId =
    activeBatchId ||
    profile?.batchId ||
    profile?.activeBatchId ||
    cachedBatchId ||
    "";
  const resolvedTeamId =
    activeBatch?.teamId ||
    profile?.teamId ||
    "";

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
    page: location.pathname || "",
    activity: getActivityType(location.pathname),
    userName: profile?.userName || reduxUser?.name || "User",
    profileImage: profile?.profileImage || "",
    role: profile?.role?.[0] || (reduxUser?.labels?.[0] || "Student"),
    activeBatchId: resolvedBatchId,
    batchId: resolvedBatchId,
    teamId: resolvedTeamId,
    device: typeof window !== "undefined" && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop",
    sessionId: sessionIdRef.current,
    lastSeen: new Date().toISOString(),
    ...metadata,
  };

  // ── Core Upsert via Native Realtime WebSocket ─────────────────────────────
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

    // Deduplicate rapid identical upserts (bypass dedupe if batch changed)
    const currentPayloadJson = JSON.stringify({
      status,
      metadata: metadataRef.current,
    });
    const now = Date.now();
    const batchChanged = lastBatchIdRef.current !== metadataRef.current.activeBatchId;
    if (batchChanged) {
      lastBatchIdRef.current = metadataRef.current.activeBatchId;
    }

    if (
      !batchChanged &&
      lastUpsertRef.current.payloadJson === currentPayloadJson &&
      now - lastUpsertRef.current.time < 3000
    ) {
      return;
    }
    lastUpsertRef.current = { time: now, payloadJson: currentPayloadJson };

    try {
      await realtime.upsertPresence({
        presenceId: String(userId),
        status,
        metadata: metadataRef.current,
        permissions: [Permission.read(Role.users())],
      });
      // Synchronize immediately with local roster so current user appears in own lobby instantly
      updateLocalUserPresence(userId, status, metadataRef.current);
      setError(null);
    } catch (err) {
      const code = err?.code;
      if (code === 401 || code === 403 || code === 404) {
        disabledRef.current = true;
      }
      setError(err);
    }
  }, []);

  // ── Main Effect: Presence registration, focus/blur, idle timers ──────────
  useEffect(() => {
    if (!effectiveUserId) {
      setIsLoading(false);
      return;
    }

    isMountedRef.current = true;
    disabledRef.current = false; // Reset on user sign-in

    // Initial register self
    upsertSelfPresence();

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

    // Focus/Blur and Visibility states with transition grace period
    const onFocus = () => {
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
      const wasFocused = isFocusedRef.current;
      isFocusedRef.current = true;

      // Re-trigger upsert immediately if returning from a blurred/hidden "away" status
      if (!wasFocused) {
        upsertSelfPresence("online");
      }
    };

    const onBlur = () => {
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);

      // Grace period before marking user as away to prevent instant flip/flop on app switching
      awayTimerRef.current = setTimeout(() => {
        isFocusedRef.current = false;
        upsertSelfPresence("away");
      }, AWAY_DELAY_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onFocus();
      } else {
        onBlur();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    setIsLoading(false);

    // Cleanup
    return () => {
      isMountedRef.current = false;

      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
    };
  }, [effectiveUserId, upsertSelfPresence]);

  // ── Effect: Trigger update on status or metadata change ───────────────────
  useEffect(() => {
    if (!effectiveUserId) return;
    isIdleRef.current = false; // Reset idle status when manual state changes
    upsertSelfPresence();
  }, [
    effectiveUserId,
    currentStatus,
    location.pathname,
    resolvedBatchId,
    resolvedTeamId,
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
