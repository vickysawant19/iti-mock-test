/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import {
  Bell,
  Megaphone,
  AlertTriangle,
  FileText,
  Users,
  Trophy,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ArrowLeft,
  X,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-toastify";

import { selectUser } from "@/store/userSlice";
import { selectUserBatches, selectActiveBatch } from "@/store/activeBatchSlice";
import notificationService from "@/services/notification/notification.service";
import batchRequestService from "@/services/batch/batchRequestService";
import batchStudentService from "@/services/batch/batchStudentService";
import userProfileService from "@/services/auth/userProfileService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import SendAnnouncementModal from "@/components/notifications/SendAnnouncementModal";

export default function TeacherNotificationsPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const userBatches = useSelector(selectUserBatches) || [];
  const activeBatch = useSelector(selectActiveBatch);

  // Filters & Search
  const [selectedBatchId, setSelectedBatchId] = useState(
    activeBatch?.$id || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState("all"); // "all" | "announcements" | "mock_tests" | "requests" | "challenges"
  const [searchQuery, setSearchQuery] = useState("");

  // Data
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Student rosters per batch for read-receipt enrichment { [batchId]: studentList }
  const [batchRosters, setBatchRosters] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [reNotifyingId, setReNotifyingId] = useState(null);

  // Details Modal (Who Viewed Receipts)
  const [inspectingNotif, setInspectingNotif] = useState(null);
  const [receiptTab, setReceiptTab] = useState("all"); // "all" | "seen" | "unseen"

  // ── 1. Fetch All Notifications across Batches ──────────────────────────────
  const fetchAllNotifications = useCallback(async () => {
    if (!user?.$id) return;
    setIsLoading(true);

    try {
      const batchIds = userBatches.map((b) => b.$id);
      if (batchIds.length === 0) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      // Fetch batch notifications + pending join requests in parallel
      const [notifsResult, reqsResult] = await Promise.allSettled([
        notificationService.getNotificationsByBatch(batchIds, 100),
        batchRequestService.getPendingRequestsForBatches(batchIds),
      ]);

      const rawNotifs =
        notifsResult.status === "fulfilled" ? notifsResult.value || [] : [];
      const rawReqs =
        reqsResult.status === "fulfilled" ? reqsResult.value || [] : [];

      // Map notifications
      const mappedNotifs = rawNotifs.map((n) => ({
        id: n.$id,
        type: n.type,
        message: n.message,
        batchId: n.batchId,
        teacherId: n.teacherId,
        paperId: n.paperId,
        readBy: n.readBy || [],
        createdAt: n.$createdAt,
        updatedAt: n.$updatedAt,
      }));

      // Map join requests
      const mappedReqs = rawReqs.map((r) => {
        const b = userBatches.find((batch) => batch.$id === r.batchId);
        return {
          id: r.$id,
          type: "pending_request",
          message: `Join request from ${r.userName || "Student"} for batch "${
            b?.BatchName || "Class"
          }"`,
          batchId: r.batchId,
          studentId: r.studentId,
          requestId: r.$id,
          userName: r.userName,
          rollNumber: r.rollNumber,
          createdAt: r.createdAt || r.$createdAt,
        };
      });

      // Combine and sort by createdAt descending
      const combined = [...mappedNotifs, ...mappedReqs].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotifications(combined);
    } catch (err) {
      console.error("[TeacherNotificationsPage] fetch error:", err);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.$id, userBatches]);

  useEffect(() => {
    fetchAllNotifications();
  }, [fetchAllNotifications]);

  // ── 2. Lazy Fetch Batch Student Rosters for Read Tracking ──────────────────
  const fetchRosterForBatch = useCallback(
    async (batchId) => {
      if (!batchId || batchRosters[batchId]) return;
      try {
        const students = await batchStudentService.getBatchStudents(batchId);
        const studentIds = (students || []).map((s) => s.studentId).filter(Boolean);

        // Fetch user profiles to get real userName and profileImage
        const profileMap = await userProfileService.getProfilesByUserIds(studentIds);

        const enrichedStudents = (students || []).map((s) => {
          const prof = profileMap.get(s.studentId) || {};
          return {
            ...s,
            studentId: s.studentId,
            userId: s.studentId,
            userName: prof.userName || s.userName || "Student",
            profileImage: prof.profileImage || null,
            rollNumber: s.rollNumber || null,
          };
        });

        setBatchRosters((prev) => ({ ...prev, [batchId]: enrichedStudents }));
      } catch (err) {
        console.warn(
          `[TeacherNotificationsPage] failed to fetch roster for batch ${batchId}:`,
          err
        );
      }
    },
    [batchRosters]
  );

  // Extra profiles cache for students in readBy not present in batch roster
  const [extraProfiles, setExtraProfiles] = useState({});

  useEffect(() => {
    if (!inspectingNotif) return;
    const readIds = (inspectingNotif.readBy || []).map(String);
    const roster = batchRosters[inspectingNotif.batchId] || [];
    const knownIds = new Set(roster.map((r) => String(r.studentId)));
    const missingIds = readIds.filter((id) => !knownIds.has(id) && !extraProfiles[id]);

    if (missingIds.length > 0) {
      userProfileService
        .getProfilesByUserIds(missingIds)
        .then((resMap) => {
          const updates = {};
          resMap.forEach((prof, uid) => {
            updates[uid] = prof;
          });
          setExtraProfiles((prev) => ({ ...prev, ...updates }));
        })
        .catch((err) => console.warn("Could not fetch extra profiles:", err));
    }
  }, [inspectingNotif, batchRosters, extraProfiles]);

  // Automatically fetch rosters for batches in the notification list
  useEffect(() => {
    const uniqueBatchIds = [
      ...new Set(notifications.map((n) => n.batchId).filter(Boolean)),
    ];
    uniqueBatchIds.forEach((bId) => {
      if (!batchRosters[bId]) {
        fetchRosterForBatch(bId);
      }
    });
  }, [notifications, batchRosters, fetchRosterForBatch]);

  // ── 3. Actions: Delete & Re-notify ─────────────────────────────────────────
  const handleDelete = async (notifId, e) => {
    e?.stopPropagation();
    if (!notifId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this notification? It will be removed immediately from all student screens."
    );
    if (!confirmed) return;

    setDeletingId(notifId);
    try {
      await notificationService.deleteNotification(notifId);
      toast.success("Notification deleted successfully");
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      if (inspectingNotif?.id === notifId) {
        setInspectingNotif(null);
      }
    } catch (err) {
      console.error("Delete notification failed:", err);
      toast.error("Could not delete notification.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReNotify = async (notifId, e) => {
    e?.stopPropagation();
    if (!notifId) return;

    setReNotifyingId(notifId);
    try {
      await notificationService.reNotifyBatch(notifId);
      toast.info("📢 Re-notified batch! Students will receive a new alert.");
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, readBy: [] } : n))
      );
    } catch (err) {
      console.error("Re-notify failed:", err);
      toast.error("Could not re-notify batch.");
    } finally {
      setReNotifyingId(null);
    }
  };

  // ── 4. Filtering & Search Computation ──────────────────────────────────────
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Batch Filter
      if (selectedBatchId !== "all" && notif.batchId !== selectedBatchId) {
        return false;
      }

      // 2. Category Filter
      if (categoryFilter === "announcements") {
        if (
          notif.type !== "announcement" &&
          notif.type !== "urgent_announcement"
        )
          return false;
      } else if (categoryFilter === "mock_tests") {
        if (notif.type !== "mock_test_assigned") return false;
      } else if (categoryFilter === "requests") {
        if (
          notif.type !== "pending_request" &&
          notif.type !== "request_approved" &&
          notif.type !== "request_rejected"
        )
          return false;
      } else if (categoryFilter === "challenges") {
        if (notif.type !== "challenge_assigned") return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const msg = (notif.message || "").toLowerCase();
        const batch = (
          userBatches.find((b) => b.$id === notif.batchId)?.BatchName || ""
        ).toLowerCase();
        if (!msg.includes(query) && !batch.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, selectedBatchId, categoryFilter, searchQuery, userBatches]);

  // ── 5. Quick Stats Calculation ─────────────────────────────────────────────
  const stats = useMemo(() => {
    let announcementsCount = 0;
    let testsCount = 0;
    let requestsCount = 0;
    let totalReads = 0;
    let totalPossibleReads = 0;

    notifications.forEach((n) => {
      if (n.type === "announcement" || n.type === "urgent_announcement") {
        announcementsCount++;
      } else if (n.type === "mock_test_assigned") {
        testsCount++;
      } else if (n.type === "pending_request") {
        requestsCount++;
      }

      if (Array.isArray(n.readBy)) {
        totalReads += n.readBy.length;
        const roster = batchRosters[n.batchId] || [];
        totalPossibleReads += roster.length || n.readBy.length;
      }
    });

    const avgReadRate = totalPossibleReads
      ? Math.round((totalReads / totalPossibleReads) * 100)
      : 0;

    return {
      total: notifications.length,
      announcementsCount,
      testsCount,
      requestsCount,
      avgReadRate,
    };
  }, [notifications, batchRosters]);

  // ── 6. Read Receipts Breakdown for Inspecting Modal ────────────────────────
  const inspectBreakdown = useMemo(() => {
    if (!inspectingNotif) return { seen: [], unseen: [], total: 0 };
    const roster = batchRosters[inspectingNotif.batchId] || [];
    const readBySet = new Set((inspectingNotif.readBy || []).map(String));

    const seen = [];
    const unseen = [];

    for (const s of roster) {
      const sId = String(s.studentId || s.userId || s.$id);
      const extra = extraProfiles[sId] || {};
      const enriched = {
        ...s,
        userName:
          s.userName && s.userName !== "Student"
            ? s.userName
            : extra.userName || "Student",
        profileImage: s.profileImage || extra.profileImage || null,
        rollNumber: s.rollNumber || extra.rollNumber || null,
      };

      if (readBySet.has(sId)) {
        seen.push(enriched);
      } else {
        unseen.push(enriched);
      }
    }

    // Capture any user IDs in readBy that aren't in current roster snapshot
    for (const rId of readBySet) {
      if (
        !roster.some((s) => String(s.studentId || s.userId || s.$id) === rId)
      ) {
        const prof = extraProfiles[rId] || {};
        seen.push({
          studentId: rId,
          userId: rId,
          userName: prof.userName || "Student",
          profileImage: prof.profileImage || null,
          rollNumber: prof.rollNumber || null,
        });
      }
    }

    const total = roster.length || seen.length + unseen.length;
    return { seen, unseen, total };
  }, [inspectingNotif, batchRosters, extraProfiles]);

  // Batch name helper
  const getBatchName = (bId) => {
    const b = userBatches.find((batch) => batch.$id === bId);
    return b?.BatchName || "Class Batch";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-24 pt-4 sm:pt-6 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Notification Center
              </h1>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/40 text-[10px] font-black uppercase tracking-wider">
                Teacher Hub
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Manage past broadcasts, inspect student read receipts, and track notices.
            </p>
          </div>
        </div>

        {/* Right action group */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsRefreshing(true);
              fetchAllNotifications();
            }}
            disabled={isRefreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-1.5 cursor-pointer bg-white dark:bg-slate-900 shadow-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <SendAnnouncementModal
            customBatch={
              userBatches.find((b) => b.$id === selectedBatchId) ||
              userBatches[0]
            }
            trigger={
              <Button
                size="sm"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Broadcast</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* ─── Metric Strip Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-xs backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold">
            <span>Announcements</span>
            <Megaphone className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.announcementsCount}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Broadcast notices
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-xs backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold">
            <span>Mock Tests</span>
            <FileText className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.testsCount}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Assigned exams
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-xs backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold">
            <span>Join Requests</span>
            <Users className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.requestsCount}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Pending student joins
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-xs backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold">
            <span>Average Seen</span>
            <Eye className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.avgReadRate}%
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Student view rate
          </span>
        </div>
      </div>

      {/* ─── Search & Filter Bar ───────────────────────────────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3 shadow-xs backdrop-blur-xl mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by message or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Batch Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 hidden sm:inline">
              Batch:
            </span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="all">All Batches ({userBatches.length})</option>
              {userBatches.map((b) => (
                <option key={b.$id} value={b.$id}>
                  {b.BatchName || "Batch"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pill Switcher (Mobile scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 select-none">
          {[
            { id: "all", label: "All", count: notifications.length },
            {
              id: "announcements",
              label: "Announcements",
              count: stats.announcementsCount,
            },
            { id: "mock_tests", label: "Mock Tests", count: stats.testsCount },
            {
              id: "requests",
              label: "Join Requests",
              count: stats.requestsCount,
            },
          ].map((tab) => {
            const isActive = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Notification List ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
          <span className="text-xs font-bold">Loading notification feed...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 p-6">
          <Bell className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No notifications found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {searchQuery
              ? `No results match "${searchQuery}". Try a different search term.`
              : "No broadcast notices or student requests exist under this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUrgent = notif.type === "urgent_announcement";
            const isAnnouncement = notif.type === "announcement" || isUrgent;
            const isMockTest = notif.type === "mock_test_assigned";
            const isRequest = notif.type === "pending_request";
            const isChallenge = notif.type === "challenge_assigned";

            // Compute read metrics for announcements / tests
            const roster = batchRosters[notif.batchId] || [];
            const readCount = (notif.readBy || []).length;
            const totalTarget = roster.length || readCount;
            const readPercent = totalTarget
              ? Math.min(100, Math.round((readCount / totalTarget) * 100))
              : 0;

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  isUrgent
                    ? "bg-red-50/50 dark:bg-red-950/15 border-red-200/70 dark:border-red-900/40"
                    : isAnnouncement
                    ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/30"
                    : isMockTest
                    ? "bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/60 dark:border-blue-900/30"
                    : isRequest
                    ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/30"
                    : "bg-white/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-800"
                } shadow-xs hover:shadow-md`}
              >
                {/* Header Row: Type Badge, Batch Name, and Time */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Category Badge */}
                    <span
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                        isUrgent
                          ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-300/50"
                          : isAnnouncement
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300/50"
                          : isMockTest
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-300/50"
                          : isRequest
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300/50"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-300/50"
                      }`}
                    >
                      {isUrgent && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      {isAnnouncement && !isUrgent && (
                        <Megaphone className="h-3 w-3 text-amber-500" />
                      )}
                      {isMockTest && <FileText className="h-3 w-3 text-blue-500" />}
                      {isRequest && <Users className="h-3 w-3 text-emerald-500" />}
                      {isChallenge && <Trophy className="h-3 w-3 text-purple-500" />}
                      <span>
                        {isUrgent
                          ? "Urgent Alert"
                          : isAnnouncement
                          ? "Broadcast Notice"
                          : isMockTest
                          ? "Mock Test"
                          : isRequest
                          ? "Join Request"
                          : "Challenge"}
                      </span>
                    </span>

                    {/* Batch Name Pill */}
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                      {getBatchName(notif.batchId)}
                    </span>

                    {/* Relative Time */}
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {notif.createdAt
                        ? formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                          })
                        : "Recently"}
                    </span>
                  </div>

                  {/* Top Action Icons */}
                  <div className="flex items-center gap-1">
                    {/* Re-notify (Announcements only) */}
                    {isAnnouncement && (
                      <button
                        title="Re-broadcast notice to students"
                        disabled={reNotifyingId === notif.id}
                        onClick={(e) => handleReNotify(notif.id, e)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                      >
                        {reNotifyingId === notif.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}

                    {/* Delete button (Announcements, Tests, Challenges) */}
                    {!isRequest && (
                      <button
                        title="Delete this notification permanently"
                        disabled={deletingId === notif.id}
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        {deletingId === notif.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {notif.message}
                </p>

                {/* Footer Strip: Read Receipts or Request Action */}
                {isRequest ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Requires teacher approval
                    </span>
                    <Button
                      size="sm"
                      onClick={() => navigate("/manage-batch/approvals")}
                      className="text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Review Request</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Progress bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-emerald-500" />
                          Seen by {readCount} of {totalTarget} students
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {readPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${readPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* View Receipts Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setInspectingNotif(notif)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl px-3 py-1 shrink-0 self-end sm:self-auto cursor-pointer"
                    >
                      <span>Who&apos;s Viewed</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Who's Viewed (Read Receipts) Details Modal ─────────────────────── */}
      {inspectingNotif && (
        <Dialog
          open={!!inspectingNotif}
          onOpenChange={(open) => !open && setInspectingNotif(null)}
        >
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-0 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl z-60">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-black text-slate-900 dark:text-white">
                      Read Receipts
                    </DialogTitle>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">
                      &ldquo;{inspectingNotif.message}&rdquo;
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingNotif(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Summary Card */}
              <div className="mt-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300">
                    Viewer Progress
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {inspectBreakdown.total
                      ? Math.round(
                          (inspectBreakdown.seen.length /
                            inspectBreakdown.total) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${
                        inspectBreakdown.total
                          ? (inspectBreakdown.seen.length /
                              inspectBreakdown.total) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 mt-3 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-850 text-xs font-bold select-none">
                <button
                  type="button"
                  onClick={() => setReceiptTab("all")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    receiptTab === "all"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All ({inspectBreakdown.total})
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptTab("seen")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    receiptTab === "seen"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-emerald-600"
                  }`}
                >
                  Seen ({inspectBreakdown.seen.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptTab("unseen")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    receiptTab === "unseen"
                      ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs"
                      : "text-slate-500 hover:text-amber-600"
                  }`}
                >
                  Unseen ({inspectBreakdown.unseen.length})
                </button>
              </div>
            </div>

            {/* Students List Content */}
            <div className="p-4 space-y-2 max-h-[380px] overflow-y-auto">
              {(receiptTab === "all" || receiptTab === "seen") &&
                inspectBreakdown.seen.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Viewed ({inspectBreakdown.seen.length})
                    </p>
                    <div className="space-y-1">
                      {inspectBreakdown.seen.map((s, idx) => {
                        const sId = s.studentId || s.userId || s.$id || idx;
                        return (
                          <div
                            key={sId}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <InteractiveAvatar
                                src={s.profileImage}
                                fallbackText={s.userName?.charAt(0) || "S"}
                                userId={s.studentId || s.userId || s.$id}
                                showStatus={false}
                                userName={s.userName || "Student"}
                                className="w-8 h-8 shrink-0 rounded-lg"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {s.userName || "Student"}
                                </p>
                                {s.rollNumber && (
                                  <p className="text-[10px] text-slate-400">
                                    Roll #{s.rollNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="flex items-center gap-1 text-[9.5px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Seen
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {(receiptTab === "all" || receiptTab === "unseen") &&
                inspectBreakdown.unseen.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-500" />
                      Not Viewed Yet ({inspectBreakdown.unseen.length})
                    </p>
                    <div className="space-y-1">
                      {inspectBreakdown.unseen.map((s, idx) => {
                        const sId = s.studentId || s.userId || s.$id || idx;
                        return (
                          <div
                            key={sId}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <InteractiveAvatar
                                src={s.profileImage}
                                fallbackText={s.userName?.charAt(0) || "S"}
                                userId={s.studentId || s.userId || s.$id}
                                showStatus={false}
                                userName={s.userName || "Student"}
                                className="w-8 h-8 shrink-0 rounded-lg opacity-75"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {s.userName || "Student"}
                                </p>
                                {s.rollNumber && (
                                  <p className="text-[10px] text-slate-400">
                                    Roll #{s.rollNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-[9.5px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                              Pending
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {inspectBreakdown.seen.length === 0 &&
                inspectBreakdown.unseen.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No enrolled students found for this batch.
                  </div>
                )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
