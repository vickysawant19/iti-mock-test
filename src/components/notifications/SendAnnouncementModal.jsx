/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Megaphone,
  AlertTriangle,
  Send,
  Loader2,
  Sparkles,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Users,
  RefreshCw,
  Bell,
  AlertCircle,
  X,
  History,
} from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import { selectActiveBatch } from "@/store/activeBatchSlice";
import { selectProfile } from "@/store/profileSlice";
import notificationService from "@/services/notification/notification.service";
import batchStudentService from "@/services/batch/batchStudentService";
import userProfileService from "@/services/auth/userProfileService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

const PRESET_PILLS = [
  "⚡ Exam starts in 10 minutes! Please join test arena.",
  "⏰ Practical class delayed by 15 minutes.",
  "📚 Assignment submission deadline is today at 5:00 PM.",
  "📍 Report to Practical Workshop B immediately.",
  "📣 Revision session starting now in main hall.",
];

export function SendAnnouncementModal({
  trigger,
  customBatch,
  studentRows = [],
}) {
  const activeBatchFromStore = useSelector(selectActiveBatch);
  const activeBatch = customBatch || activeBatchFromStore;
  const profile = useSelector(selectProfile);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("compose"); // "compose" | "history"

  // Compose state
  const [message, setMessage] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // History & Read Receipts state
  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [reNotifyingId, setReNotifyingId] = useState(null);

  // Read receipts modal state
  const [selectedNoticeForReceipts, setSelectedNoticeForReceipts] = useState(null);
  const [receiptsFilter, setReceiptsFilter] = useState("all"); // "all" | "seen" | "unseen"

  // Enrolled students cache
  const [enrolledStudents, setEnrolledStudents] = useState(studentRows);

  const batchId = activeBatch?.$id || activeBatch?.batchId || activeBatch?.id;

  // Load batch students with full profiles
  const fetchBatchStudents = useCallback(async () => {
    if (!batchId) return;
    try {
      let rawList = studentRows;
      if (!rawList || rawList.length === 0) {
        rawList = await batchStudentService.getBatchStudents(batchId);
      }

      const studentIds = (rawList || []).map((s) => s.studentId || s.userId || s.$id).filter(Boolean);
      const profileMap = await userProfileService.getProfilesByUserIds(studentIds);

      const enriched = (rawList || []).map((s) => {
        const sId = s.studentId || s.userId || s.$id;
        const prof = profileMap.get(sId) || {};
        return {
          ...s,
          studentId: sId,
          userId: sId,
          userName:
            s.userName && s.userName !== "Student"
              ? s.userName
              : prof.userName || "Student",
          profileImage: s.profileImage || prof.profileImage || null,
          rollNumber: s.rollNumber || prof.rollNumber || null,
        };
      });

      setEnrolledStudents(enriched);
    } catch (err) {
      console.warn("[SendAnnouncementModal] student roster fetch error:", err);
    }
  }, [batchId, studentRows]);

  // Extra profiles cache for students in readBy not present in batch roster
  const [extraProfiles, setExtraProfiles] = useState({});

  useEffect(() => {
    if (!selectedNoticeForReceipts) return;
    const readIds = (selectedNoticeForReceipts.readBy || []).map(String);
    const knownIds = new Set(
      enrolledStudents.map((s) => String(s.studentId || s.userId || s.$id))
    );
    const missingIds = readIds.filter(
      (id) => !knownIds.has(id) && !extraProfiles[id]
    );

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
        .catch((err) => console.warn("Failed to fetch extra profiles:", err));
    }
  }, [selectedNoticeForReceipts, enrolledStudents, extraProfiles]);

  // Load announcements for this batch
  const fetchAnnouncements = useCallback(async () => {
    if (!batchId) return;
    setIsLoadingAnnouncements(true);
    try {
      const list = await notificationService.getBatchAnnouncements(batchId, 40);
      setAnnouncements(list);
    } catch (err) {
      console.error("[SendAnnouncementModal] fetch error:", err);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
      fetchBatchStudents();
    }
  }, [isOpen, fetchAnnouncements, fetchBatchStudents]);

  const handlePresetSelect = (presetText) => {
    setMessage(presetText);
    if (presetText.startsWith("⚡") || presetText.startsWith("📍")) {
      setIsUrgent(true);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter an announcement message");
      return;
    }

    if (!batchId) {
      toast.error("No active batch selected to send announcement");
      return;
    }

    setIsSending(true);

    try {
      await notificationService.createAnnouncement({
        message: message.trim(),
        batchId: batchId,
        teamId: activeBatch.teamId,
        teacherId: profile?.userId || profile?.$id,
        isUrgent,
      });

      toast.success("📢 Announcement broadcasted to team successfully!");
      setMessage("");
      setIsUrgent(false);
      setActiveTab("history");
      fetchAnnouncements();
    } catch (err) {
      console.error("Failed to send announcement:", err);
      toast.error("Failed to send announcement. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteAnnouncement = async (notifId, e) => {
    e.stopPropagation();
    if (!notifId) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this broadcast? It will be deleted immediately from all students' screens."
    );
    if (!confirmed) return;

    setDeletingId(notifId);
    try {
      await notificationService.deleteNotification(notifId);
      toast.success("Broadcast removed successfully");
      setAnnouncements((prev) => prev.filter((a) => a.$id !== notifId));
      if (selectedNoticeForReceipts?.$id === notifId) {
        setSelectedNoticeForReceipts(null);
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error("Could not delete announcement. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReNotify = async (notifId, messageText, e) => {
    e.stopPropagation();
    if (!notifId) return;

    setReNotifyingId(notifId);
    try {
      await notificationService.reNotifyBatch(notifId);
      toast.info("📢 Notice re-broadcasted! Students will receive an alert again.");
      setAnnouncements((prev) =>
        prev.map((a) => (a.$id === notifId ? { ...a, readBy: [] } : a))
      );
    } catch (err) {
      console.error("Failed to re-notify batch:", err);
      toast.error("Could not re-notify batch.");
    } finally {
      setReNotifyingId(null);
    }
  };

  // Build lookup map of enrolled students for read receipts
  const studentLookup = useMemo(() => {
    const map = new Map();
    for (const s of enrolledStudents) {
      const id = s.studentId || s.userId || s.$id;
      if (id) map.set(String(id), s);
    }
    return map;
  }, [enrolledStudents]);

  // Breakdown of seen vs unseen for the selected receipt announcement
  const receiptBreakdown = useMemo(() => {
    if (!selectedNoticeForReceipts) return { seen: [], unseen: [], total: 0 };
    const readBySet = new Set((selectedNoticeForReceipts.readBy || []).map(String));

    const seen = [];
    const unseen = [];

    // Enrolled students breakdown
    for (const s of enrolledStudents) {
      const sId = String(s.studentId || s.userId || s.$id);
      if (readBySet.has(sId)) {
        seen.push(s);
      } else {
        unseen.push(s);
      }
    }

    // Include any additional IDs from readBy that might not be in enrolledStudents list
    for (const readId of readBySet) {
      if (!enrolledStudents.some((s) => String(s.studentId || s.userId || s.$id) === readId)) {
        const prof = extraProfiles[readId] || {};
        seen.push({
          studentId: readId,
          userId: readId,
          userName: prof.userName || "Student",
          profileImage: prof.profileImage || null,
          rollNumber: prof.rollNumber || null,
        });
      }
    }

    const total = enrolledStudents.length || seen.length + unseen.length;
    return { seen, unseen, total };
  }, [selectedNoticeForReceipts, enrolledStudents, extraProfiles]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Broadcast Notice</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header with Navigation Tabs */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Megaphone className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Broadcast Announcements
                </DialogTitle>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activeBatch?.BatchName || "Active Batch"}
                </p>
              </div>
            </div>

            {/* Tab Pill Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-xs font-bold select-none">
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "compose"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>History</span>
                {announcements.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold">
                    {announcements.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Compose New Notice */}
        {activeTab === "compose" && (
          <form onSubmit={handleSend} className="p-5 space-y-4">
            {/* Quick Presets */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Quick Preset Notices</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PILLS.map((pill, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(pill)}
                    className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-950/20 cursor-pointer"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Announcement Message
              </label>
              <Textarea
                placeholder="Type your notice or urgent update for the entire class..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="text-xs min-h-[100px] rounded-xl"
                maxLength={300}
              />
              <div className="mt-1 flex justify-between items-center text-[10px] text-slate-400">
                <span>Displays on students&apos; screens and sends push alerts</span>
                <span>{message.length}/300</span>
              </div>
            </div>

            {/* Urgent Priority Checkbox */}
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200/60 bg-red-50/40 p-3 dark:border-red-900/40 dark:bg-red-950/20">
              <input
                type="checkbox"
                id="isUrgentNotice"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <label
                htmlFor="isUrgentNotice"
                className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 cursor-pointer select-none"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span>Mark as Urgent Alert (Persistent High-Priority Red Banner)</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSending}
                className="text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSending || !message.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-sm"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Broadcast Notice</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Broadcast History & Read Receipts */}
        {activeTab === "history" && (
          <div className="p-5 space-y-3">
            {isLoadingAnnouncements ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500 mb-2" />
                <span className="text-xs font-medium">Loading broadcasts...</span>
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <Megaphone className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  No active broadcasts
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Notices broadcasted to this batch will appear here.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("compose")}
                  className="mt-3 text-xs rounded-xl font-bold cursor-pointer"
                >
                  Create First Notice
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((notif) => {
                  const isUrgentNotif = notif.type === "urgent_announcement";
                  const readCount = (notif.readBy || []).length;
                  const totalStudents = enrolledStudents.length || readCount;
                  const readPercent = totalStudents
                    ? Math.min(100, Math.round((readCount / totalStudents) * 100))
                    : 0;

                  return (
                    <div
                      key={notif.$id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isUrgentNotif
                          ? "bg-red-50/40 border-red-200/80 dark:bg-red-950/15 dark:border-red-900/40"
                          : "bg-slate-50/70 border-slate-200/70 dark:bg-slate-900/50 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isUrgentNotif
                                ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/50"
                                : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50"
                            }`}
                          >
                            {isUrgentNotif ? (
                              <>
                                <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                                Urgent
                              </>
                            ) : (
                              <>
                                <Megaphone className="w-2.5 h-2.5 text-amber-500" />
                                Notice
                              </>
                            )}
                          </span>

                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {notif.$createdAt
                              ? formatDistanceToNow(new Date(notif.$createdAt), {
                                  addSuffix: true,
                                })
                              : "Recently"}
                          </span>
                        </div>

                        {/* Top action icons */}
                        <div className="flex items-center gap-1">
                          {/* Re-notify button */}
                          <button
                            title="Re-broadcast notice to alert students again"
                            disabled={reNotifyingId === notif.$id}
                            onClick={(e) => handleReNotify(notif.$id, notif.message, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          >
                            {reNotifyingId === notif.$id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete broadcast button */}
                          <button
                            title="Remove this broadcast immediately"
                            disabled={deletingId === notif.$id}
                            onClick={(e) => handleDeleteAnnouncement(notif.$id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            {deletingId === notif.$id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Message Body */}
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Read Receipts Meter & Viewer Trigger */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-emerald-500" />
                              Seen by {readCount} of {totalStudents} students
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

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedNoticeForReceipts(notif)}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl px-2.5 py-1 shrink-0 cursor-pointer"
                        >
                          Who&apos;s Seen
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Read Receipts Details Sub-Dialog */}
        {selectedNoticeForReceipts && (
          <Dialog
            open={!!selectedNoticeForReceipts}
            onOpenChange={(open) => !open && setSelectedNoticeForReceipts(null)}
          >
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-0 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl z-60">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <DialogTitle className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        Read Receipts
                      </DialogTitle>
                      <p className="text-[10px] text-slate-500 truncate max-w-[280px]">
                        &ldquo;{selectedNoticeForReceipts.message}&rdquo;
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNoticeForReceipts(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 mt-3 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-850 text-xs font-bold select-none">
                  <button
                    type="button"
                    onClick={() => setReceiptsFilter("all")}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                      receiptsFilter === "all"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    All ({receiptBreakdown.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptsFilter("seen")}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                      receiptsFilter === "seen"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-slate-500 hover:text-emerald-600"
                    }`}
                  >
                    Seen ({receiptBreakdown.seen.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptsFilter("unseen")}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                      receiptsFilter === "unseen"
                        ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs"
                        : "text-slate-500 hover:text-amber-600"
                    }`}
                  >
                    Unseen ({receiptBreakdown.unseen.length})
                  </button>
                </div>
              </div>

              {/* Students List */}
              <div className="p-4 space-y-2 max-h-[360px] overflow-y-auto">
                {(receiptsFilter === "all" || receiptsFilter === "seen") &&
                  receiptBreakdown.seen.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Seen ({receiptBreakdown.seen.length})
                      </p>
                      <div className="space-y-1">
                        {receiptBreakdown.seen.map((s, idx) => {
                          const sId = s.studentId || s.userId || s.$id || idx;
                          return (
                            <div
                              key={sId}
                              className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <InteractiveAvatar
                                  src={s.profileImage}
                                  fallbackText={s.userName?.charAt(0) || "S"}
                                  userId={s.studentId || s.userId || s.$id}
                                  showStatus={false}
                                  userName={s.userName || "Student"}
                                  className="w-7 h-7 shrink-0 rounded-lg"
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
                              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Seen
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {(receiptsFilter === "all" || receiptsFilter === "unseen") &&
                  receiptBreakdown.unseen.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Unseen / Pending ({receiptBreakdown.unseen.length})
                      </p>
                      <div className="space-y-1">
                        {receiptBreakdown.unseen.map((s, idx) => {
                          const sId = s.studentId || s.userId || s.$id || idx;
                          return (
                            <div
                              key={sId}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <InteractiveAvatar
                                  src={s.profileImage}
                                  fallbackText={s.userName?.charAt(0) || "S"}
                                  userId={s.studentId || s.userId || s.$id}
                                  showStatus={false}
                                  userName={s.userName || "Student"}
                                  className="w-7 h-7 shrink-0 rounded-lg opacity-80"
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
                              <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                                Not opened yet
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {receiptBreakdown.seen.length === 0 &&
                  receiptBreakdown.unseen.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No enrolled students found for this batch.
                    </div>
                  )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SendAnnouncementModal;
