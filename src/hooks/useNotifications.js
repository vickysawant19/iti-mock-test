import { useCallback, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import { selectUserBatches, selectActiveBatchLoading, selectActiveBatch } from "@/store/activeBatchSlice";
import { Query, Channel } from "appwrite";
import { toast } from "react-toastify";
import batchRequestService from "@/appwrite/batchRequestService";
import notificationService from "@/services/notification.service";
import { realtime } from "@/services/appwriteClient";
import conf from "@/config/config";
import mockTestService from "@/services/mocktest.service";


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
  const isFetchingRef = useRef(false);

  const userBatchIds = isTeacher && userBatches ? userBatches.map(b => b.$id).sort().join(',') : '';
  const loadingDependency = isTeacher ? isBatchLoading : false;

  const fetchNotifications = useCallback(async () => {
    if (!user?.$id) return;
    if (isTeacher && isBatchLoading) return; // Wait until Redux loads the batches
    if (isFetchingRef.current) return; // Prevent concurrent fetching
    
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      if (isTeacher) {
        // Use batches already loaded by activeBatchSlice instead of duplicating API calls
        const batches = userBatches ?? [];

        if (!batches.length) {
          setNotifications([]);
          return;
        }

        // Use the optimized single query to fetch all pending requests
        const batchIds = batches.map(b => b.$id);
        const pendingReqs = await batchRequestService.getPendingRequestsForBatches(batchIds);
        
        const mappedReqs = pendingReqs.map(r => {
          const b = batches.find(batch => batch.$id === r.batchId);
          return {
            id: r.$id,
            type: "pending_request",
            message: `New join request for batch "${b?.BatchName || 'Unknown'}"`,
            batchId: r.batchId,
            studentId: r.studentId,
            requestId: r.$id,
            createdAt: r.createdAt,
          };
        });
        setNotifications(mappedReqs);
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

          if (uniqueNotifsMap.size > 0) {
            try {
              // Extract only mock test paperIds to check for attempts
              const mockTestNotifIds = Array.from(uniqueNotifsMap.values())
                .filter(n => n.type === "mock_test_assigned")
                .map(n => n.paperId);

              if (mockTestNotifIds.length > 0) {
                const userPapers = await mockTestService.listQuestions([
                  Query.equal("userId", user.$id),
                  Query.equal("paperId", mockTestNotifIds)
                ]);
                
                // Consider a test "attempted" if it has been submitted or at least started
                const attemptedPaperIds = new Set(
                  userPapers
                    .filter((p) => p.submitted || p.startTime)
                    .map((p) => p.paperId)
                );

                for (const [paperId, notif] of uniqueNotifsMap.entries()) {
                  if (notif.type === "mock_test_assigned" && attemptedPaperIds.has(paperId)) {
                    // Mark as read in DB so it doesn't fetch again next time
                    notificationService.markAsRead(notif.id, user.$id).catch(console.error);
                    // Remove from local UI map
                    uniqueNotifsMap.delete(paperId);
                  }
                }
              }
            } catch (err) {
              console.error("Failed to check attempted papers for notifications", err);
            }
          }
            
          mockTestNotifs = Array.from(uniqueNotifsMap.values());
        }

        const EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const now = Date.now();

        const allStudentNotifs = [...relevantReqs, ...mockTestNotifs]
          .filter(n => now - new Date(n.createdAt).getTime() < EXPIRY_TIME)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
        setNotifications(allStudentNotifs);
      }
    } catch (err) {
      console.error("useNotifications fetch error:", err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.$id, isTeacher, isStudent, userBatchIds, loadingDependency]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    let active = true;
    let subNotifications = null; // SDK v24: { close(): Promise<void> }
    let subRequests = null;      // SDK v24: { close(): Promise<void> }

    const setupRealtime = async () => {
      try {
        if (isStudent && user?.$id && studentBatches.length > 0) {
          const notifChannel = Channel.tablesdb(conf.databaseId).table("notifications").row();
          const sub = await realtime.subscribe(
            notifChannel,
            (response) => {
              if (response.events.some(e => e.includes('.create') || e.includes('.update'))) {
                const doc = response.payload;
                
                // If user has already read it, remove from unread state
                if (doc.readBy && doc.readBy.includes(user.$id)) {
                  setNotifications(prev => prev.filter(n => n.id !== doc.$id));
                  return;
                }

                // Fire real-time toast alert for announcements
                if (response.events.some(e => e.includes('.create'))) {
                  if (doc.type === "urgent_announcement") {
                    toast.error(`🚨 URGENT ANNOUNCEMENT: ${doc.message}`, { autoClose: 10000 });
                  } else if (doc.type === "announcement") {
                    toast.info(`📣 Announcement: ${doc.message}`, { autoClose: 7000 });
                  }
                }

                // Upsert to the top of the unread list
                setNotifications(prev => {
                  const filtered = prev.filter(n => n.id !== doc.$id);
                  return [{
                    id: doc.$id,
                    type: doc.type,
                    message: doc.message,
                    batchId: doc.batchId,
                    paperId: doc.paperId,
                    createdAt: doc.$updatedAt || doc.$createdAt,
                  }, ...filtered];
                });
              }
            },
            [Query.equal("batchId", studentBatches)]
          );
          // SDK v24: store the sub object; close() tears it down
          subNotifications = sub;
          if (!active && subNotifications?.unsubscribe) subNotifications.unsubscribe();
        }

        // BatchRequests realtime
        if (user?.$id) {
          const reqChannel = Channel.tablesdb(conf.databaseId).table("batchRequests").row();
          let reqSub = null;

          if (isTeacher && userBatches && userBatches.length > 0) {
            const batchIds = userBatches.map(b => b.$id);
            reqSub = await realtime.subscribe(
              reqChannel,
              (response) => {
                if (response.events.some(e => e.includes('.create') || e.includes('.update'))) {
                  const doc = response.payload;
                  if (doc.status === 'pending') {
                    setNotifications(prev => {
                      if (prev.some(n => n.requestId === doc.$id)) return prev; // Avoid duplicate
                      const b = userBatches.find(batch => batch.$id === doc.batchId);
                      return [{
                        id: doc.$id,
                        type: "pending_request",
                        message: `New join request for batch "${b?.BatchName || 'Unknown'}"`,
                        batchId: doc.batchId,
                        studentId: doc.studentId,
                        requestId: doc.$id,
                        createdAt: doc.createdAt,
                      }, ...prev];
                    });
                  } else {
                     // if status changed to approved/rejected, remove it from the list
                     setNotifications(prev => prev.filter(n => n.requestId !== doc.$id));
                  }
                }
              },
              [Query.equal("batchId", batchIds)]
            );
          } else if (isStudent) {
            reqSub = await realtime.subscribe(
              reqChannel,
              (response) => {
                if (response.events.some(e => e.includes('.update'))) {
                  const doc = response.payload;
                  if (doc.status === 'approved' || doc.status === 'rejected') {
                    setNotifications(prev => {
                      // Remove old one if exists
                      const filtered = prev.filter(n => n.requestId !== doc.$id);
                      return [{
                        id: doc.$id,
                        type: doc.status === "approved" ? "request_approved" : "request_rejected",
                        message: doc.status === "approved"
                          ? `Your request to join a batch was approved! 🎉`
                          : `Your request to join a batch was rejected.`,
                        batchId: doc.batchId,
                        requestId: doc.$id,
                        createdAt: doc.updatedAt,
                      }, ...filtered];
                    });
                  }
                }
              },
              [Query.equal("studentId", [user.$id])]
            );
          }

          // SDK v24: store the sub object; close() tears it down
          subRequests = reqSub;
          if (!active && subRequests?.unsubscribe) subRequests.unsubscribe();
        }

      } catch (e) {
        console.error("Failed to subscribe to realtime", e);
      }
    };
    
    setupRealtime();

    // SDK v26: cleanup via sub.unsubscribe() — not sub() or sub.close()
    return () => {
      active = false;
      if (subNotifications?.unsubscribe) subNotifications.unsubscribe();
      if (subRequests?.unsubscribe) subRequests.unsubscribe();
    };
  }, [isStudent, isTeacher, user?.$id, studentBatches, userBatches]);

  const notifCount = notifications.length;

  return {
    notifications,
    notifCount,
    isLoading,
    refresh: fetchNotifications,
  };
}
