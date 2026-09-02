import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ArrowRight,
  X,
  FileText,
  Trophy,
  Megaphone,
  AlertCircle,
  Smartphone,
  Send,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import notificationService from "@/services/notification/notification.service";
import pushNotificationService from "@/services/notification/pushNotificationService";
import { Functions } from "appwrite";
import { appwriteService } from "@/services/core/appwriteClient";
import conf from "@/config/config";
import { toast } from "react-toastify";

function NotifItem({ notif, onClose, user }) {
  const navigate = useNavigate();
  const isTeacher = notif.type === "pending_request";
  const isApproved = notif.type === "request_approved";
  const isRejected = notif.type === "request_rejected";
  const isMockTest = notif.type === "mock_test_assigned";
  const isChallenge = notif.type === "challenge_assigned";
  const isUrgent = notif.type === "urgent_announcement";
  const isAnnouncement = notif.type === "announcement" || isUrgent;

  const handleClick = async () => {
    if (isMockTest || isChallenge || isAnnouncement) {
      try {
        await notificationService.markAsRead(notif.id, user.$id);
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
      onClose();
      if (isMockTest) {
        try {
          const data = {
            action: "createNewMockTest",
            userId: user.$id,
            userName: user.userName || user.name || "Student",
            paperId: notif.paperId,
            databaseId: conf.databaseId,
            questionPapersCollectionId: conf.questionPapersCollectionId,
          };
          const functions = new Functions(appwriteService.getClient());
          const res = await functions.createExecution(
            conf.mockTestFunctionId,
            JSON.stringify(data)
          );
          if (res.responseBody) {
            const parsed = JSON.parse(res.responseBody);
            if (parsed.paperId) {
              navigate(`/start-mock-test/${parsed.paperId}`);
              return;
            }
          }
        } catch (err) {
          console.error("Auto-instantiate student mock test error:", err);
        }
        navigate(`/attain-test?paperid=${notif.paperId}`);
      } else if (isChallenge) {
        navigate("/arena?tab=missions&sub=challenges");
      }
    } else {
      onClose();
      if (isTeacher) {
        navigate("/manage-batch/approvals");
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
        isUrgent
          ? "border-l-4 border-red-500 bg-red-50/30 dark:bg-red-950/10"
          : isAnnouncement
          ? "border-l-4 border-amber-500 bg-amber-50/20 dark:bg-amber-950/10"
          : ""
      } ${
        isTeacher || isMockTest || isChallenge || isAnnouncement ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div
        className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUrgent
            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
            : isAnnouncement
            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
            : isApproved
            ? "bg-green-100 dark:bg-green-900/30"
            : isRejected
            ? "bg-red-100 dark:bg-red-900/30"
            : isMockTest
            ? "bg-blue-100 dark:bg-blue-900/30"
            : isChallenge
            ? "bg-pink-100 dark:bg-pink-900/30"
            : "bg-amber-100 dark:bg-amber-900/30"
        }`}
      >
        {isUrgent && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />}
        {isAnnouncement && !isUrgent && <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
        {isApproved && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
        {isRejected && <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
        {isTeacher && <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
        {isMockTest && <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
        {isChallenge && <Trophy className="w-4 h-4 text-pink-600 dark:text-pink-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-snug">
          {notif.message}
        </p>
        {notif.createdAt && (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(notif.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
      {(isTeacher || isMockTest || isChallenge) && <ArrowRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />}
    </button>
  );
}

export default function NotificationPanel({ notifications, isOpen, onClose }) {
  const panelRef = useRef(null);
  const user = useSelector(selectUser);
  const isTeacher = user?.labels?.includes("Teacher");
  const [permission, setPermission] = useState(pushNotificationService.getPermission());
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Close on outside click and sync permission state
  useEffect(() => {
    if (!isOpen) return;
    setPermission(pushNotificationService.getPermission());
    const handleOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  const handleEnablePush = async () => {
    try {
      const perm = await pushNotificationService.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        toast.success("Push notifications enabled! 🎉");
      } else {
        toast.warn("Notification permission was not granted.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to enable notifications");
    }
  };

  const handleSendTest = async (delaySeconds = 0) => {
    setIsSendingTest(true);
    try {
      const msg = await pushNotificationService.sendTestNotification({
        title: "ITI Mitra Practice Alert 🔔",
        body: delaySeconds > 0
          ? `[Test Alert] This notification was delivered in background! Tap to open ITI Mitra.`
          : `[Test Alert] Background push is active and working!`,
        url: "/arena",
        delaySeconds,
      });
      toast.info(msg);
      setPermission(pushNotificationService.getPermission());
    } catch (err) {
      toast.error(err.message || "Failed to dispatch test notification");
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col"
      style={{ maxHeight: "540px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Notifications
          </h3>
          {notifications.length > 0 && (
            <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
              {notifications.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "320px" }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Bell className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              All caught up!
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {isTeacher
                ? "No pending batch requests right now."
                : "No updates on your batch requests."}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notif) => (
              <NotifItem key={notif.id} notif={notif} onClose={onClose} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* Footer: Notification Permission Prompt (shown only if not granted) */}
      {permission !== "granted" && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Smartphone className="w-3.5 h-3.5 text-blue-500" />
              <span>Instant Device Alerts</span>
            </span>
          </div>

          <button
            onClick={handleEnablePush}
            className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable System Notifications</span>
          </button>
        </div>
      )}
    </div>
  );
}

