import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { selectActiveBatch } from "@/store/activeBatchSlice";
import { useNotifications } from "@/hooks/useNotifications";
import newAttendanceService from "@/services/attendance/newAttendanceService";
import AttendanceReminderModal from "./AttendanceReminderModal";
import TestAssignedModal from "./TestAssignedModal";
import AnnouncementBanner from "./AnnouncementBanner";
import PushPermissionPrompt from "./PushPermissionPrompt";
import notificationService from "@/services/notification/notification.service";

export default function NotificationModalManager() {
  const user = useSelector(selectUser);
  const activeBatch = useSelector(selectActiveBatch);
  const { notifications } = useNotifications();

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [activeTestNotification, setActiveTestNotification] = useState(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);

  const isStudent = user && !user?.labels?.includes("Teacher") && !user?.labels?.includes("admin");

  // 1. Check Attendance Trigger
  useEffect(() => {
    if (!isStudent || !user?.$id || !activeBatch?.$id) return;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Only prompt between 08:30 AM and 05:30 PM on Mon-Sat
    const isCollegeHours =
      dayOfWeek !== 0 &&
      (currentHour > 8 || (currentHour === 8 && currentMinute >= 30)) &&
      currentHour < 18;

    if (!isCollegeHours) return;

    const todayStr = now.toISOString().split("T")[0];
    const snoozeKey = `att_reminder_snooze_${user.$id}_${todayStr}`;
    const snoozedUntil = localStorage.getItem(snoozeKey);

    if (snoozedUntil && Date.now() < Number(snoozedUntil)) {
      return; // Still in snooze window
    }

    const checkTodayAttendance = async () => {
      try {
        const attendanceRes = await newAttendanceService.getStudentAttendanceByDateRange(
          user.$id,
          activeBatch.$id,
          todayStr,
          todayStr
        );

        const hasMarked =
          attendanceRes?.documents?.length > 0 &&
          attendanceRes.documents.some(
            (doc) => doc.attendanceStatus && doc.attendanceStatus !== "NOT_MARKED"
          );

        if (!hasMarked) {
          setShowAttendanceModal(true);
        }
      } catch (err) {
        console.warn("Non-fatal attendance check error:", err);
      }
    };

    // Slight delay so the app loads smoothly first
    const timer = setTimeout(checkTodayAttendance, 2500);
    return () => clearTimeout(timer);
  }, [isStudent, user?.$id, activeBatch?.$id]);

  // 2. Check Test Assigned Trigger
  useEffect(() => {
    if (!isStudent || !user?.$id) return;

    const latestTestNotif = notifications.find(
      (n) => n.type === "mock_test_assigned" && n.paperId && n.paperId !== "N/A"
    );

    if (latestTestNotif) {
      const sessionDismissKey = `test_modal_dismissed_${latestTestNotif.id}`;
      if (!sessionStorage.getItem(sessionDismissKey)) {
        setActiveTestNotification(latestTestNotif);
      }
    }
  }, [isStudent, user?.$id, notifications]);

  // 3. Check Urgent Announcements Trigger
  useEffect(() => {
    const latestAnnouncement = notifications.find(
      (n) => n.type === "urgent_announcement" || n.type === "announcement"
    );

    if (latestAnnouncement) {
      const dismissKey = `announcement_dismissed_${latestAnnouncement.id}`;
      if (!sessionStorage.getItem(dismissKey)) {
        setActiveAnnouncement(latestAnnouncement);
      }
    } else {
      setActiveAnnouncement(null);
    }
  }, [notifications]);

  // Handle Attendance Modal Actions
  const handleCloseAttendance = () => {
    if (user?.$id) {
      const todayStr = new Date().toISOString().split("T")[0];
      // Dismiss for the rest of today (expires at midnight)
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      localStorage.setItem(`att_reminder_snooze_${user.$id}_${todayStr}`, String(midnight.getTime()));
    }
    setShowAttendanceModal(false);
  };

  const handleSnoozeAttendance = () => {
    if (user?.$id) {
      const todayStr = new Date().toISOString().split("T")[0];
      // Snooze for 1 hour
      const oneHourLater = Date.now() + 60 * 60 * 1000;
      localStorage.setItem(`att_reminder_snooze_${user.$id}_${todayStr}`, String(oneHourLater));
    }
    setShowAttendanceModal(false);
  };

  // Handle Test Modal Actions
  const handleCloseTestModal = () => {
    if (activeTestNotification) {
      sessionStorage.setItem(`test_modal_dismissed_${activeTestNotification.id}`, "true");
    }
    setActiveTestNotification(null);
  };

  // Handle Announcement Dismiss
  const handleDismissAnnouncement = () => {
    if (activeAnnouncement) {
      sessionStorage.setItem(`announcement_dismissed_${activeAnnouncement.id}`, "true");
      if (user?.$id) {
        notificationService.markAsRead(activeAnnouncement.id, user.$id).catch(() => {});
      }
    }
    setActiveAnnouncement(null);
  };

  return (
    <>
      {activeAnnouncement && (
        <AnnouncementBanner
          announcement={activeAnnouncement}
          onDismiss={handleDismissAnnouncement}
        />
      )}

      {showAttendanceModal && activeBatch && (
        <AttendanceReminderModal
          isOpen={showAttendanceModal}
          batch={activeBatch}
          onClose={handleCloseAttendance}
          onSnooze={handleSnoozeAttendance}
        />
      )}

      {activeTestNotification && (
        <TestAssignedModal
          isOpen={!!activeTestNotification}
          notification={activeTestNotification}
          user={user}
          onClose={handleCloseTestModal}
        />
      )}

      <PushPermissionPrompt user={user} />
    </>
  );
}
