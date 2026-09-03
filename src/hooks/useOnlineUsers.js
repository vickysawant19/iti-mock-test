import { useState, useEffect, useCallback, useMemo } from "react";
import { Channel } from "appwrite";
import { presenceService as presences, presenceRealtime as realtime } from "@/services/core/appwriteClient";

// Global singleton state for online users to prevent duplicate network calls and WebSocket subscriptions
let globalOnlineUsers = new Map();
const listeners = new Set();
let initialFetchPromise = null;
let activeSubscription = null;
let isTrackingActive = false;
let trackingSessionId = 0;
const deletedDuringFetch = new Set();

/**
 * Standardized activity text helper
 */
export const formatUserActivity = (path) => {
  if (!path) return "Online";
  if (path === "/arena" || path === "/") return "In Game Arena";
  if (path === "/profile") return "Viewing Profile";
  if (path === "/student-attendance" || path === "/attendance" || path === "/todays-attendance") {
    return "Viewing Attendance";
  }
  if (path.includes("attendance-register")) return "Attendance Register";
  if (path.includes("mock-test")) return "Taking Mock Test";
  if (path.includes("leaderboard")) return "Checking Leaderboard";
  if (path.includes("settings")) return "Settings";
  return "Browsing App";
};

export function updateLocalUserPresence(userId, status, metadata) {
  if (!userId) return;
  const existing = globalOnlineUsers.get(userId) || {};
  globalOnlineUsers.set(userId, {
    ...existing,
    userId,
    status: status || "online",
    metadata: {
      ...(existing.metadata || {}),
      ...(metadata || {}),
    },
    $updatedAt: new Date().toISOString(),
  });
  notifyListeners();
}

export function removeLocalUserPresence(userId) {
  if (!userId) return;
  globalOnlineUsers.delete(userId);
  deletedDuringFetch.add(userId);
  notifyListeners();
}

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
 * Option to filter online users by teamId or batchId.
 *
 * @param {string|null} filterTeamId - Optional teamId to filter live roster
 */
export function useOnlineUsers(filterTeamId = null) {
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

  const filteredUsers = useMemo(() => {
    if (!filterTeamId) return onlineUsers;
    const map = new Map();
    for (const [userId, presence] of onlineUsers.entries()) {
      const meta = presence?.metadata;
      if (meta?.teamId === filterTeamId || meta?.batchId === filterTeamId || meta?.activeBatchId === filterTeamId) {
        map.set(userId, presence);
      }
    }
    return map;
  }, [onlineUsers, filterTeamId]);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const getStatus = useCallback(
    (userId) => {
      if (!userId) return "offline";
      const p = filteredUsers.get(userId);
      return p?.status ?? "offline";
    },
    [filteredUsers]
  );

  const isOnline = useCallback(
    (userId) => getStatus(userId) === "online",
    [getStatus]
  );

  const isAway = useCallback(
    (userId) => getStatus(userId) === "away",
    [getStatus]
  );

  return { onlineUsers: filteredUsers, isOnline, isAway, getStatus };
}

/**
 * High-performance, pre-memoized batch presence hook.
 *
 * Automatically resolves and groups members, instructors, and students in a given batch.
 * Accepts either a batchContext object, a batchId string, or studentRows.
 *
 * @param {object|string} batchContextOrId - { batchId, teamId, ... } or "batch_123"
 * @param {Array}         studentRows      - Optional enrolled students array [{ studentId: "..." }]
 * @param {string}        currentUserId    - Optional logged-in user ID
 */
export function useBatchPresence(batchContextOrId, studentRows = [], currentUserId = "") {
  const { onlineUsers, getStatus, isOnline, isAway } = useOnlineUsers();

  const batchId =
    typeof batchContextOrId === "object"
      ? batchContextOrId?.batchId || batchContextOrId?.$id || batchContextOrId?.id
      : batchContextOrId;

  const teamId =
    typeof batchContextOrId === "object" ? batchContextOrId?.teamId : undefined;

  // Build a Set of enrolled student IDs in this batch for 100% reliable matching
  const enrolledStudentIds = useMemo(() => {
    const set = new Set();
    for (const row of studentRows) {
      if (row?.studentId) set.add(String(row.studentId));
      if (row?.$id) set.add(String(row.$id));
      if (row?.userId) set.add(String(row.userId));
    }
    return set;
  }, [studentRows]);

  // Lookup map for fast enrichment of student info (name, avatar, rollNumber, etc.)
  const studentMap = useMemo(() => {
    const map = new Map();
    for (const row of studentRows) {
      const id = row?.studentId || row?.$id || row?.userId;
      if (id) {
        map.set(String(id), row);
      }
    }
    return map;
  }, [studentRows]);

  // Pre-filter and group members in this batch
  const { members, teachers, students, totalCount } = useMemo(() => {
    if (!batchId && enrolledStudentIds.size === 0 && !teamId) {
      return { members: [], teachers: [], students: [], totalCount: 0 };
    }

    const allMembers = [];
    const teacherList = [];
    const studentList = [];

    for (const u of onlineUsers.values()) {
      const meta = u.metadata || {};
      const uBatchId = meta.activeBatchId || meta.batchId;
      const isEnrolled = enrolledStudentIds.has(String(u.userId));
      const isTeacherOfBatch =
        (batchId && uBatchId === batchId) || (teamId && meta.teamId === teamId);
      const isSelf = currentUserId && (u.userId === currentUserId || String(u.userId) === String(currentUserId));

      if (isEnrolled || isTeacherOfBatch || isSelf) {
        const enrolledData = studentMap.get(String(u.userId));
        const enrichedUser = enrolledData
          ? {
              ...u,
              metadata: {
                ...meta,
                userName:
                  meta.userName && meta.userName !== "User" && meta.userName !== "Student"
                    ? meta.userName
                    : enrolledData.userName || enrolledData.name || "Student",
                profileImage: meta.profileImage || enrolledData.profileImage || null,
                rollNumber: enrolledData.rollNumber || meta.rollNumber || null,
                registerId: enrolledData.registerId || meta.registerId || null,
              },
            }
          : u;

        allMembers.push(enrichedUser);
        const isTeacherRole =
          meta.role === "Teacher" ||
          (Array.isArray(meta.role) && meta.role.includes("Teacher")) ||
          (isSelf && !isEnrolled && isTeacherOfBatch);

        if (isTeacherRole) {
          teacherList.push(enrichedUser);
        } else {
          studentList.push(enrichedUser);
        }
      }
    }

    return {
      members: allMembers,
      teachers: teacherList,
      students: studentList,
      totalCount: allMembers.length,
    };
  }, [onlineUsers, batchId, teamId, enrolledStudentIds, studentMap, currentUserId]);

  const getActivity = useCallback(
    (userIdOrPath) => {
      if (!userIdOrPath) return "Online";
      if (userIdOrPath.startsWith("/")) {
        return formatUserActivity(userIdOrPath);
      }
      const userPresence = onlineUsers.get(userIdOrPath);
      return formatUserActivity(userPresence?.metadata?.page);
    },
    [onlineUsers]
  );

  return {
    members,
    teachers,
    students,
    totalCount,
    onlineUsers,
    getStatus,
    isOnline,
    isAway,
    getActivity,
  };
}
