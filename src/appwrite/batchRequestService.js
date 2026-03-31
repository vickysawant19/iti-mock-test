import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class BatchRequestService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  // Send a request to join a batch
  async sendRequest(batchId, studentId) {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    try {
      // First, check if a pending or approved request already exists
      const existing = await this.database.listDocuments(
        conf.databaseId,
        conf.batchRequestsCollectionId,
        [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ]
      );

      // If exists, handle based on status
      if (existing.total > 0) {
        const req = existing.documents[0];
        if (req.status === "pending" || req.status === "approved") {
          return req; // Already pending or approved, do nothing new
        } else if (req.status === "rejected") {
          // Reactivate rejected request
          return await this.updateRequestStatus(req.$id, "pending");
        }
      }

      // Create new request
      return await this.database.createDocument(
        conf.databaseId,
        conf.batchRequestsCollectionId,
        "unique()",
        {
          batchId,
          studentId,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error("Appwrite error: sendRequest:", error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  // Get requests for a specific batch, optionally filtered by status
  async getRequests(batchId, status = null) {
    if (!batchId) throw new Error("batchId is required");

    try {
      const queries = [Query.equal("batchId", batchId)];
      if (status) {
        queries.push(Query.equal("status", status));
      }
      queries.push(Query.orderDesc("$createdAt"));

      const response = await this.database.listDocuments(
        conf.databaseId,
        conf.batchRequestsCollectionId,
        queries
      );
      return response.documents;
    } catch (error) {
      console.error(`Appwrite error: getRequests for batch ${batchId}:`, error);
      throw new Error(`Error: ${error.message}`);
    }
  }
  
  // Get requests for a specific student
  async getStudentRequests(studentId) {
    if (!studentId) throw new Error("studentId is required");

    try {
      const response = await this.database.listDocuments(
        conf.databaseId,
        conf.batchRequestsCollectionId,
        [Query.equal("studentId", studentId)]
      );
      return response.documents;
    } catch (error) {
      console.error(`Appwrite error: getStudentRequests:`, error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  // Update request status (e.g., approve or reject)
  async updateRequestStatus(requestId, status) {
    if (!requestId || !status) throw new Error("requestId and status are required");

    try {
      return await this.database.updateDocument(
        conf.databaseId,
        conf.batchRequestsCollectionId,
        requestId,
        {
          status,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error("Appwrite error: updateRequestStatus:", error);
      throw new Error(`Error: ${error.message}`);
    }
  }
}

const batchRequestService = new BatchRequestService();
export default batchRequestService;
