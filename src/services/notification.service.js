import { ID, Query } from "appwrite";
import { databases } from "@/services/appwriteClient";
import conf from "@/config/config";

class NotificationService {
  constructor() {
    this.databaseId = conf.databaseId;
    this.collectionId = "notifications";
  }

  async createNotification({ message, type, batchId, teacherId, paperId }) {
    try {
      return await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        {
          message,
          type,
          batchId,
          teacherId,
          paperId,
          readBy: []
        }
      );
    } catch (error) {
      console.error("Error creating notification", error);
      throw error;
    }
  }

  async getNotificationsByBatch(batchIds) {
    if (!batchIds || batchIds.length === 0) return [];
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal("batchId", batchIds),
          Query.orderDesc("$createdAt"),
          Query.limit(50)
        ]
      );
      return response.documents;
    } catch (error) {
      console.error("Error getting notifications", error);
      throw error;
    }
  }

  async markAsRead(notificationId, studentId) {
    try {
      // First get current readBy array
      const notification = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        notificationId
      );

      const readBy = notification.readBy || [];
      if (!readBy.includes(studentId)) {
        readBy.push(studentId);
        return await databases.updateDocument(
          this.databaseId,
          this.collectionId,
          notificationId,
          { readBy }
        );
      }
      return notification;
    } catch (error) {
      console.error("Error marking notification as read", error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
