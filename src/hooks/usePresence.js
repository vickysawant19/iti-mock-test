import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { ID, Permission, Role } from "appwrite";
import { presences } from "@/services/appwriteClient";
import { selectUser } from "@/store/userSlice";

const PRESENCE_ID_KEY = "appwrite_presence_id";
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
const PRESENCE_TTL_MINUTES = 2;       // expire 2 min after last heartbeat

/**
 * Manages the current user's own Appwrite Presence record.
 *
 * Gracefully self-disables when the server doesn't support the Presences API
 * (Appwrite < 1.9.5) — logs one warning then goes silent.
 *
 * Mount this once at the App root so it runs for the full session.
 */
export function usePresence() {
  const user = useSelector(selectUser);
  const location = useLocation();

  // Stable ref for the current path so callbacks don't need it as a dep
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  // Ref so async callbacks always hold the latest presenceId
  const presenceIdRef = useRef(localStorage.getItem(PRESENCE_ID_KEY) || null);

  // Set to true on the first unrecoverable server error (e.g. server < 1.9.5)
  // so we don't spam the console on every heartbeat.
  const disabledRef = useRef(false);

  // ── Core upsert ──────────────────────────────────────────────────────────
  const upsert = useCallback(async (status = "online", extraMeta = {}) => {
    if (!user?.$id || disabledRef.current) return;

    // Reuse the same presenceId if we already have one, otherwise create new
    if (!presenceIdRef.current) {
      presenceIdRef.current = ID.unique();
      localStorage.setItem(PRESENCE_ID_KEY, presenceIdRef.current);
    }

    const expiresAt = new Date(
      Date.now() + PRESENCE_TTL_MINUTES * 60 * 1000
    ).toISOString();

    try {
      await presences.upsert({
        presenceId: presenceIdRef.current,
        status,
        expiresAt,
        metadata: {
          page: pathRef.current,
          userId: user.$id,
          ...extraMeta,
        },
        // Any signed-in user can read each other's presence
        permissions: [Permission.read(Role.users())],
      });
    } catch (err) {
      const code = err?.code;
      if (code === 401 || code === 403 || code === 404) {
        // Presences service is either missing on the server or disabled for clients
        disabledRef.current = true;
        console.info(
          `[usePresence] Presences service is unavailable (code ${code}: ${err?.message}). ` +
          "Presence tracking gracefully disabled."
        );
        presenceIdRef.current = null;
        localStorage.removeItem(PRESENCE_ID_KEY);
      } else {
        // Other transient errors (like network offline)
        console.warn("[usePresence] upsert failed:", err?.message);
      }
    }
  }, [user?.$id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete own presence ───────────────────────────────────────────────────
  const deletePresence = useCallback(async () => {
    if (disabledRef.current) return;
    const id = presenceIdRef.current;
    if (!id) return;
    try {
      await presences.delete({ presenceId: id });
    } catch {
      // Ignore — session may already be gone
    } finally {
      presenceIdRef.current = null;
      localStorage.removeItem(PRESENCE_ID_KEY);
    }
  }, []);

  // ── Mount / unmount when user signs in or out ─────────────────────────────
  useEffect(() => {
    if (!user?.$id) {
      // User just signed out — clean up any lingering presence
      deletePresence();
      return;
    }

    // Reset disabled flag when a new user signs in (different server may work)
    disabledRef.current = false;

    // Sign-in: mark as online immediately
    upsert("online");

    // Heartbeat: push expiresAt forward every 30 s
    const heartbeatId = setInterval(() => upsert("online"), HEARTBEAT_INTERVAL_MS);

    // focus / blur
    const onFocus = () => upsert("online");
    const onBlur  = () => upsert("away");
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      clearInterval(heartbeatId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, [user?.$id, upsert, deletePresence]);

  // ── Update metadata.page on route change ─────────────────────────────────
  useEffect(() => {
    if (!user?.$id) return;
    upsert("online");
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
}
