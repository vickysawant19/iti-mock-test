import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import { selectUserBatches, selectActiveBatchLoading } from "@/store/activeBatchSlice";
import { Query } from "appwrite";
import batchRequestService from "@/appwrite/batchRequestService";
import notificationService from "@/services/notification.service";
import { realtime } from "@/services/appwriteClient";
import conf from "@/config/config";


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
  const [studentBatches, setStudentBatches] = useState([]);

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
        const relevantReqs = reqs
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

        // Get student's mock test notifications based on their approved batches
        let mockTestNotifs = [];
        const approvedBatches = reqs.filter(r => r.status === "approved").map(r => r.batchId);
        
        setStudentBatches(prev => {
          const isSame = prev.length === approvedBatches.length && prev.every(b => approvedBatches.includes(b));
          return isSame ? prev : approvedBatches;
        });

        if (approvedBatches.length > 0) {
          const rawNotifs = await notificationService.getNotificationsByBatch(approvedBatches);
          
          // Deduplicate by paperId to prevent multiple notifications for the same mock test
          const uniqueNotifsMap = new Map();
          
          rawNotifs
            .filter(n => !n.readBy || !n.readBy.includes(user.$id))
            .forEach(n => {
              if (!uniqueNotifsMap.has(n.paperId)) {
                uniqueNotifsMap.set(n.paperId, {
                  id: n.$id,
                  type: n.type,
                  message: n.message,
                  batchId: n.batchId,
                  paperId: n.paperId,
                  createdAt: n.$createdAt,
                });
              }
            });
            
          mockTestNotifs = Array.from(uniqueNotifsMap.values());
        }

        const allStudentNotifs = [...relevantReqs, ...mockTestNotifs].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(allStudentNotifs);
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

  useEffect(() => {
    let active = true;
    let unsubFn = null;

    if (isStudent && user?.$id && studentBatches.length > 0) {
      const channel = `databases.${conf.databaseId}.collections.notifications.documents`;
      const setupRealtime = async () => {
        try {
          const sub = await realtime.subscribe(
            channel, 
            (response) => {
              if (response.events.some(e => e.includes('.create'))) {
                fetchNotifications();
              }
            },
            [Query.equal("batchId", studentBatches)]
          );
          
          const getUnsub = typeof sub === "function" ? sub : (sub?.unsubscribe ? sub.unsubscribe.bind(sub) : null);
          
          if (!active && getUnsub) {
            getUnsub(); // Unsubscribe immediately if unmounted while fetching
          } else {
            unsubFn = getUnsub;
          }
        } catch (e) {
          console.error("Failed to subscribe to notifications realtime", e);
        }
      };
      setupRealtime();
      
      return () => {
        active = false;
        if (unsubFn) unsubFn();
      };
    }
  }, [fetchNotifications, isStudent, user?.$id, studentBatches]);

  const notifCount = notifications.length;

  return {
    notifications,
    notifCount,
    isLoading,
    refresh: fetchNotifications,
  };
}
