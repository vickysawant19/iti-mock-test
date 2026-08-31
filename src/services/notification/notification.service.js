import { ID, Query } from "appwrite";
import { tablesDb } from "../core/appwriteClient";
import conf from "../../config/config";
import PermissionBuilder from "../../utils/permissionBuilder";

class NotificationService {
  constructor() {
    this.databaseId = conf.databaseId;
    this.collectionId = "notifications";
  }

  async createNotification({ message, type, batchId, teacherId, paperId, teamId }) {
    try {
      const permissions = teamId ? PermissionBuilder.message(teamId) : undefined;

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

  async getNotificationsByBatch(batchIds) {
    if (!batchIds || batchIds.length === 0) return [];
    try {
      const response = await tablesDb.listRows({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        queries: [
          Query.equal("batchId", batchIds),
          Query.orderDesc("$createdAt"),
          Query.limit(50)
        ]
      });
      return response.rows || response.documents || [];
    } catch (error) {
      console.error("Error getting notifications", error);
      throw error;
    }
  }

  async markAsRead(notificationId, studentId) {
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
      console.error("Error marking notification as read", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
