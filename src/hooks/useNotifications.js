import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { selectUserBatches, selectActiveBatchLoading } from "@/store/activeBatchSlice";
import { Query, Channel } from "appwrite";
import { toast } from "react-toastify";
import batchRequestService from "@/services/batch/batchRequestService";
import batchStudentService from "@/services/batch/batchStudentService";
import notificationService from "@/services/notification/notification.service";
import pushNotificationService from "@/services/notification/pushNotificationService";
import { realtime } from "@/services/core/appwriteClient";
import conf from "@/config/config";
import mockTestService from "@/services/academic/mocktest.service";

/**
 * High-performance notification hook.
 *
 * For teachers:
 *   - Fast indexed query for pending batch requests across their batches
 *
 * For students:
 *   - Parallel queries for batch requests & batch notifications
 *   - Local-read caching to prevent write-lock database storms
 *   - Clean, leak-free Realtime WebSocket updates with native system push alerts
 */
export function useNotifications() {
  const user = useSelector(selectUser);
  const userBatches = useSelector(selectUserBatches);
  const isBatchLoading = useSelector(selectActiveBatchLoading);

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studentBatchIds, setStudentBatchIds] = useState([]);

  const isTeacher = user?.labels?.includes("Teacher");
  const isStudent = user && !isTeacher && !user?.labels?.includes("admin");
  const isFetchingRef = useRef(false);

  const userBatchIdsString = useMemo(() => {
    return userBatches ? userBatches.map((b) => b.$id).sort().join(",") : "";
  }, [userBatches]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.$id) return;
    if (isTeacher && isBatchLoading) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      if (isTeacher) {
        const batches = userBatches ?? [];
        if (!batches.length) {
          setNotifications([]);
          return;
        }

        const batchIds = batches.map((b) => b.$id);
        const pendingReqs = await batchRequestService.getPendingRequestsForBatches(batchIds);

        const mappedReqs = (pendingReqs || []).map((r) => {
          const b = batches.find((batch) => batch.$id === r.batchId);
          return {
            id: r.$id,
            type: "pending_request",
            message: `New join request for batch "${b?.BatchName || "Unknown"}"`,
            batchId: r.batchId,
            studentId: r.studentId,
            requestId: r.$id,
            createdAt: r.createdAt || r.$createdAt,
          };
        });

        setNotifications(mappedReqs);
      } else if (isStudent) {
        // Parallel queries: Student requests & batches
        const [requestsResult, directBatchesResult] = await Promise.allSettled([
          batchRequestService.getStudentRequests(user.$id),
          userBatches?.length
            ? Promise.resolve(userBatches)
            : batchStudentService.getStudentBatches(user.$id),
        ]);

        const reqs = requestsResult.status === "fulfilled" ? requestsResult.value || [] : [];
        const directBatches = directBatchesResult.status === "fulfilled" ? directBatchesResult.value || [] : [];

        // 1. Process batch request status notifications
        const relevantReqs = reqs
          .filter((r) => r.status === "approved" || r.status === "rejected")
          .map((r) => ({
            id: r.$id,
            type: r.status === "approved" ? "request_approved" : "request_rejected",
            message:
              r.status === "approved"
                ? "Your request to join a batch was approved! 🎉"
                : "Your request to join a batch was rejected.",
            batchId: r.batchId,
            requestId: r.$id,
            createdAt: r.updatedAt || r.$updatedAt || r.createdAt,
          }));

        // 2. Resolve enrolled batch IDs
        const enrolledBatchIds = (directBatches || [])
          .map((sb) => {
            if (!sb) return null;
            if (typeof sb === "object" && sb.$id) return sb.$id;
            if (typeof sb.batchId === "object" && sb.batchId?.$id) return sb.batchId.$id;
            if (typeof sb.batchId === "string") return sb.batchId;
            return null;
          })
          .filter(Boolean);

        const approvedReqBatches = reqs
          .filter((r) => r.status === "approved")
          .map((r) => (typeof r.batchId === "object" ? r.batchId?.$id : r.batchId))
          .filter(Boolean);

        const approvedBatches = [...new Set([...enrolledBatchIds, ...approvedReqBatches])];
        setStudentBatchIds(approvedBatches);

        let batchNotifs = [];
        if (approvedBatches.length > 0) {
          const rawNotifs = await notificationService.getNotificationsByBatch(approvedBatches, 30);
          const localReadIds = notificationService.getLocalReadIds(user.$id);

          // Deduplicate by paperId and filter out read notifications
          const uniqueNotifsMap = new Map();
          (rawNotifs || [])
            .filter((n) => {
              if (localReadIds.has(n.$id)) return false;
              if (n.readBy && n.readBy.includes(user.$id)) return false;
              return true;
            })
            .forEach((n) => {
              const dedupeKey = n.paperId && n.paperId !== "N/A" ? n.paperId : n.$id;
              if (!uniqueNotifsMap.has(dedupeKey)) {
                uniqueNotifsMap.set(dedupeKey, {
                  id: n.$id,
                  type: n.type,
                  message: n.message,
                  batchId: n.batchId,
                  paperId: n.paperId,
                  createdAt: n.$createdAt,
                });
              }
            });

          // Check for already attempted mock test papers
          const mockTestNotifIds = Array.from(uniqueNotifsMap.values())
            .filter((n) => n.type === "mock_test_assigned" && n.paperId && n.paperId !== "N/A")
            .map((n) => n.paperId);

          if (mockTestNotifIds.length > 0) {
            try {
              const userPapers = await mockTestService.listQuestions([
                Query.equal("userId", user.$id),
                Query.equal("paperId", mockTestNotifIds),
              ]);

              const attemptedPaperIds = new Set(
                (userPapers || [])
                  .filter((p) => p.submitted || p.startTime)
                  .map((p) => p.paperId)
              );

              for (const [key, notif] of uniqueNotifsMap.entries()) {
                if (notif.type === "mock_test_assigned" && attemptedPaperIds.has(notif.paperId)) {
                  notificationService.markAsRead(notif.id, user.$id).catch(() => {});
                  uniqueNotifsMap.delete(key);
                }
              }
            } catch (err) {
              console.warn("Non-fatal paper attempt check warning:", err);
            }
          }

          batchNotifs = Array.from(uniqueNotifsMap.values());
        }

        const EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days
        const now = Date.now();

        const allStudentNotifs = [...relevantReqs, ...batchNotifs]
          .filter((n) => now - new Date(n.createdAt).getTime() < EXPIRY_TIME)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setNotifications(allStudentNotifs);
      }
    } catch (err) {
      console.error("useNotifications fetch error:", err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.$id, isTeacher, isStudent, userBatches, isBatchLoading]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription setup
  useEffect(() => {
    let isCancelled = false;
    let subNotifications = null;
    let subRequests = null;

    const closeSub = (sub) => {
      if (!sub) return;
      if (typeof sub === "function") sub();
      else if (typeof sub.close === "function") sub.close();
      else if (typeof sub.unsubscribe === "function") sub.unsubscribe();
    };

    const setupRealtime = async () => {
      try {
        if (isStudent && user?.$id) {
          const notifChannel = Channel.tablesdb(conf.databaseId).table("notifications").row();
          const sub = await realtime.subscribe(notifChannel, (response) => {
            if (response.events.some((e) => e.includes(".create") || e.includes(".update"))) {
              const doc = response.payload;
              if (!doc) return;

              // If batch-specific, only proceed if student is in this batch
              if (studentBatchIds.length > 0 && doc.batchId && !studentBatchIds.includes(doc.batchId)) {
                return;
              }

              if (doc.readBy && doc.readBy.includes(user.$id)) {
                setNotifications((prev) => prev.filter((n) => n.id !== doc.$id));
                return;
              }

              // On new notification creation, trigger native push notification & in-app toast
              if (response.events.some((e) => e.includes(".create"))) {
                const title =
                  doc.type === "urgent_announcement"
                    ? "🚨 URGENT ANNOUNCEMENT"
                    : doc.type === "mock_test_assigned"
                    ? "📝 New Mock Test Assigned"
                    : doc.type === "challenge_assigned"
                    ? "🏆 New Challenge Mission"
                    : "📣 Batch Announcement";

                const url =
                  doc.type === "mock_test_assigned" && doc.paperId && doc.paperId !== "N/A"
                    ? `/attain-test?paperid=${doc.paperId}`
                    : doc.type === "challenge_assigned"
                    ? "/arena?tab=missions&sub=challenges"
                    : "/";

                // Native OS / Browser Push Notification
                pushNotificationService
                  .showDirectNotification({
                    title,
                    body: doc.message || "You have a new update in ITI Mitra.",
                    url,
                  })
                  .catch((err) => console.warn("Native push dispatch warning:", err));

                // In-App Toast
                if (doc.type === "urgent_announcement") {
                  toast.error(`🚨 URGENT: ${doc.message}`, { autoClose: 10000 });
                } else if (doc.type === "announcement") {
                  toast.info(`📣 Announcement: ${doc.message}`, { autoClose: 7000 });
                } else if (doc.type === "mock_test_assigned") {
                  toast.info(`📝 New Test: ${doc.message}`, { autoClose: 7000 });
                } else if (doc.type === "challenge_assigned") {
                  toast.info(`🏆 Challenge: ${doc.message}`, { autoClose: 7000 });
                }
              }

              setNotifications((prev) => {
                const filtered = prev.filter((n) => n.id !== doc.$id);
                return [
                  {
                    id: doc.$id,
                    type: doc.type,
                    message: doc.message,
                    batchId: doc.batchId,
                    paperId: doc.paperId,
                    createdAt: doc.$updatedAt || doc.$createdAt,
                  },
                  ...filtered,
                ];
              });
            }
          });

          if (isCancelled) {
            closeSub(sub);
          } else {
            subNotifications = sub;
          }
        }

        if (user?.$id) {
          const reqChannel = Channel.tablesdb(conf.databaseId).table("batchRequests").row();

          if (isTeacher && userBatches && userBatches.length > 0) {
            const batchIds = userBatches.map((b) => b.$id);
            const reqSub = await realtime.subscribe(reqChannel, (response) => {
              if (response.events.some((e) => e.includes(".create") || e.includes(".update"))) {
                const doc = response.payload;
                if (!doc || !batchIds.includes(doc.batchId)) return;

                if (doc.status === "pending") {
                  const b = userBatches.find((batch) => batch.$id === doc.batchId);
                  const msg = `New join request for batch "${b?.BatchName || "Unknown"}"`;

                  if (response.events.some((e) => e.includes(".create"))) {
                    pushNotificationService
                      .showDirectNotification({
                        title: "👥 New Student Join Request",
                        body: msg,
                        url: "/manage-batch/approvals",
                      })
                      .catch(() => {});
                    toast.info(`👥 ${msg}`, { autoClose: 7000 });
                  }

                  setNotifications((prev) => {
                    if (prev.some((n) => n.requestId === doc.$id)) return prev;
                    return [
                      {
                        id: doc.$id,
                        type: "pending_request",
                        message: msg,
                        batchId: doc.batchId,
                        studentId: doc.studentId,
                        requestId: doc.$id,
                        createdAt: doc.createdAt || doc.$createdAt,
                      },
                      ...prev,
                    ];
                  });
                } else {
                  setNotifications((prev) => prev.filter((n) => n.requestId !== doc.$id));
                }
              }
            });

            if (isCancelled) {
              closeSub(reqSub);
            } else {
              subRequests = reqSub;
            }
          } else if (isStudent) {
            const reqSub = await realtime.subscribe(reqChannel, (response) => {
              if (response.events.some((e) => e.includes(".update"))) {
                const doc = response.payload;
                if (!doc || doc.studentId !== user.$id) return;

                if (doc.status === "approved" || doc.status === "rejected") {
                  const isApproved = doc.status === "approved";
                  const msg = isApproved
                    ? "Your request to join a batch was approved! 🎉"
                    : "Your request to join a batch was rejected.";

                  pushNotificationService
                    .showDirectNotification({
                      title: isApproved ? "🎉 Batch Request Approved!" : "Batch Request Update",
                      body: msg,
                      url: "/",
                    })
                    .catch(() => {});

                  if (isApproved) {
                    toast.success(msg, { autoClose: 8000 });
                  } else {
                    toast.warn(msg, { autoClose: 8000 });
                  }

                  setNotifications((prev) => {
                    const filtered = prev.filter((n) => n.requestId !== doc.$id);
                    return [
                      {
                        id: doc.$id,
                        type: isApproved ? "request_approved" : "request_rejected",
                        message: msg,
                        batchId: doc.batchId,
                        requestId: doc.$id,
                        createdAt: doc.updatedAt || doc.$updatedAt,
                      },
                      ...filtered,
                    ];
                  });
                }
              }
            });

            if (isCancelled) {
              closeSub(reqSub);
            } else {
              subRequests = reqSub;
            }
          }
        }
      } catch (e) {
        console.warn("Failed to subscribe to realtime notifications", e);
      }
    };

    setupRealtime();

    return () => {
      isCancelled = true;
      closeSub(subNotifications);
      closeSub(subRequests);
    };
  }, [isStudent, isTeacher, user?.$id, studentBatchIds, userBatches]);

  const notifCount = notifications.length;

  return {
    notifications,
    notifCount,
    isLoading,
    refresh: fetchNotifications,
  };
}

export default useNotifications;
