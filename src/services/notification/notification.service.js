import { ID, Query, Permission, Role } from "appwrite";
import { tablesDb } from "../core/appwriteClient";
import conf from "../../config/config";
import PermissionBuilder from "../../utils/permissionBuilder";

const READ_CACHE_PREFIX = "read_notif_ids_";

class NotificationService {
  constructor() {
    this.databaseId = conf.databaseId;
    this.collectionId = "notifications";
  }

  /**
   * Helper to get locally marked read notification IDs for instant UI updates
   */
  getLocalReadIds(studentId) {
    if (!studentId) return new Set();
    try {
      const raw = localStorage.getItem(`${READ_CACHE_PREFIX}${studentId}`);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  /**
   * Helper to record read notification ID locally
   */
  setLocalReadId(studentId, notifId) {
    if (!studentId || !notifId) return;
    try {
      const current = this.getLocalReadIds(studentId);
      current.add(notifId);
      // Keep at most 200 most recent IDs in local cache to prevent memory bloat
      const arr = Array.from(current).slice(-200);
      localStorage.setItem(`${READ_CACHE_PREFIX}${studentId}`, JSON.stringify(arr));
    } catch {
      // Ignore localStorage errors
    }
  }

  async createNotification({ message, type, batchId, teacherId, paperId, teamId }) {
    try {
      // Provide read & update permissions to authenticated users so students receive Realtime events
      const permissions = [
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ];
      if (teamId) {
        permissions.push(Permission.read(Role.team(teamId)));
        permissions.push(Permission.update(Role.team(teamId, "teacher")));
        permissions.push(Permission.delete(Role.team(teamId, "teacher")));
      }

      return await tablesDb.createRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: ID.unique(),
        data: {
          message,
          type,
          batchId,
          teacherId: teacherId || "system",
          paperId: paperId || "N/A",
          readBy: []
        },
        permissions
      });
    } catch (error) {
      console.error("Error creating notification", error);
      throw error;
    }
  }

  async createAnnouncement({ message, batchId, teamId, teacherId, isUrgent = false }) {
    return await this.createNotification({
      message,
      type: isUrgent ? "urgent_announcement" : "announcement",
      batchId,
      teacherId,
      teamId
    });
  }

  async reNotifyBatch(notificationId, newMessage) {
    try {
      const payload = { readBy: [] };
      if (newMessage) payload.message = newMessage;
      return await tablesDb.updateRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: notificationId,
        data: payload
      });
    } catch (error) {
      console.error("Error re-notifying batch", error);
      throw error;
    }
  }

  async updateNotification(notificationId, payload) {
    try {
      return await tablesDb.updateRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: notificationId,
        data: payload
      });
    } catch (error) {
      console.error("Error updating notification", error);
      throw error;
    }
  }

  async getNotificationsByBatch(batchIds, limit = 20) {
    if (!batchIds || batchIds.length === 0) return [];
    try {
      const response = await tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        queries: [
          Query.equal("batchId", batchIds),
          Query.orderDesc("$createdAt"),
          Query.limit(limit)
        ]
      });
      return response.rows || response.documents || [];
    } catch (error) {
      console.error("Error getting notifications", error);
      return [];
    }
  }

  async markAsRead(notificationId, studentId) {
    if (!notificationId || !studentId) return null;
    
    // 1. Immediately record in local cache for instant UI feedback
    this.setLocalReadId(studentId, notificationId);

    // 2. Persist to DB asynchronously with conflict tolerance
    try {
      const notification = await tablesDb.getRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: notificationId
      });

      const readBy = notification.readBy || [];
      if (!readBy.includes(studentId)) {
        readBy.push(studentId);
        return await tablesDb.updateRow({
          databaseId: this.databaseId,
          tableId: this.collectionId,
          rowId: notificationId,
          data: { readBy }
        });
      }
      return notification;
    } catch (error) {
      // Non-blocking: If conflict or network glitch happens, local cache still maintains read state
      console.warn("Non-fatal markAsRead warning:", error?.message || error);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
