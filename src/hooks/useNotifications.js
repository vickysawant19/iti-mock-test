import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import { selectUserBatches, selectActiveBatchLoading } from "@/store/activeBatchSlice";
import { Query } from "appwrite";
import batchRequestService from "@/appwrite/batchRequestService";


/**
 * Lightweight notification system.
 *
 * For teachers:
 *   - Polls for pending batch requests across all their batches
 *   - Returns count + notification items
 *
 * For students:
 *   - Polls for recently accepted/rejected requests
 *   - Returns count + notification items
 *
 * Returns:
 *   - notifCount    : total badge count
 *   - notifications : array of notification objects { id, message, type, batchId }
 *   - isLoading
 *   - refresh()     : manually re-fetch
 */
export function useNotifications() {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isTeacher = user?.labels?.includes("Teacher");
  const isStudent = user && !isTeacher && !user?.labels?.includes("admin");

  const userBatches = useSelector(selectUserBatches);
  const isBatchLoading = useSelector(selectActiveBatchLoading);

  const fetchNotifications = useCallback(async () => {
    if (!user?.$id) return;
    if (isTeacher && isBatchLoading) return; // Wait until Redux loads the batches
    
    setIsLoading(true);

    try {
      if (isTeacher) {
        // Use batches already loaded by activeBatchSlice instead of duplicating API calls
        const batches = userBatches ?? [];

        if (!batches.length) {
          setNotifications([]);
          return;
        }

        // For each batch, get pending requests
        const allPending = await Promise.all(
          batches.map((b) =>
            batchRequestService.getRequests(b.$id, "pending").then((reqs) =>
              reqs.map((r) => ({
                id: r.$id,
                type: "pending_request",
                message: `New join request for batch "${b.BatchName}"`,
                batchId: b.$id,
                studentId: r.studentId,
                requestId: r.$id,
                createdAt: r.createdAt,
              }))
            )
          )
        );
        setNotifications(allPending.flat());
      } else if (isStudent) {
        // Get student's own requests that changed recently
        const reqs = await batchRequestService.getStudentRequests(user.$id);
        const relevant = reqs
          .filter((r) => r.status === "approved" || r.status === "rejected")
          .map((r) => ({
            id: r.$id,
            type: r.status === "approved" ? "request_approved" : "request_rejected",
            message:
              r.status === "approved"
                ? `Your request to join a batch was approved! 🎉`
                : `Your request to join a batch was rejected.`,
            batchId: r.batchId,
            requestId: r.$id,
            createdAt: r.updatedAt,
          }));
        setNotifications(relevant);
      }
    } catch (err) {
      console.error("useNotifications fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isTeacher, isStudent, userBatches, isBatchLoading]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const notifCount = notifications.length;

  return {
    notifications,
    notifCount,
    isLoading,
    refresh: fetchNotifications,
  };
}
