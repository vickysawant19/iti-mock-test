import { Query } from "appwrite";
import conf from "../../config/config";
import { appwriteClientService as appwriteService } from "../core/appwriteClient";
import batchStudentService from "./batchStudentService";
import teamService from "../auth/teamService";

export class BatchRequestService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  // Send a request to join a batch
  async sendRequest(batchId, studentId, requestedBy = "student") {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    try {
      // 1. Check if the user is ALREADY ACTIVE in the batch (via batchStudents)
      const activeCheck = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ]
      });

      if (activeCheck.total > 0) {
        return { alreadyJoined: true };
      }

      // 2. check if a pending or approved request already exists
      const existing = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchRequestsCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ]
      });

      if (existing.total > 0) {
        const req = existing.rows[0];
        if (req.status === "pending" || req.status === "approved") {
          return req;
        } else if (req.status === "rejected") {
          return await this.updateRequestStatus(req.$id, "pending");
        }
      }

      // Create new request
      return await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.batchRequestsCollectionId,
        rowId: "unique()",
        data: {
          batchId,
          studentId,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
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

      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchRequestsCollectionId,
        queries: queries
      });
      return response.rows || response.documents || [];
    } catch (error) {
      console.error(`Appwrite error: getRequests for batch ${batchId}:`, error);
      throw new Error(`Error: ${error.message}`);
    }
  }
  
  // Get pending requests for multiple batches at once
  async getPendingRequestsForBatches(batchIds) {
    if (!batchIds || batchIds.length === 0) return [];

    try {
      const queries = [
        Query.equal("batchId", batchIds),
        Query.equal("status", "pending"),
        Query.orderDesc("$createdAt")
      ];

      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchRequestsCollectionId,
        queries: queries
      });
      return response.rows || response.documents || [];
    } catch (error) {
      console.error(`Appwrite error: getPendingRequestsForBatches:`, error);
      throw new Error(`Error: ${error.message}`);
    }
  }
  
  // Get requests for a specific student
  async getStudentRequests(studentId) {
    if (!studentId) throw new Error("studentId is required");

    try {
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchRequestsCollectionId,
        queries: [Query.equal("studentId", studentId)]
      });
      return response.rows || response.documents || [];
    } catch (error) {
      console.error(`Appwrite error: getStudentRequests:`, error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  // Update request status (e.g., approve or reject)
  async updateRequestStatus(requestId, status, isCurrentBatch = undefined) {
    if (!requestId || !status) throw new Error("requestId and status are required");

    try {
      const payload = {
        status,
        updatedAt: new Date().toISOString()
      };
      if (isCurrentBatch !== undefined) {
        payload.isCurrentBatch = isCurrentBatch;
      }
      return await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.batchRequestsCollectionId,
        rowId: requestId,
        data: payload
      });
    } catch (error) {
      console.error("Appwrite error: updateRequestStatus:", error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  // Centralized unified status evaluation function
  async getStudentBatchStatus(studentId, batchId) {
    if (!studentId || !batchId) return "unrequested";
    
    const activeCheck = await this.database.listRows({
      databaseId: conf.databaseId,
      tableId: conf.batchStudentsCollectionId,
      queries: [Query.equal("batchId", batchId), Query.equal("studentId", studentId)]
    });
    if (activeCheck.total > 0) return "approved";

    const reqCheck = await this.database.listRows({
      databaseId: conf.databaseId,
      tableId: conf.batchRequestsCollectionId,
      queries: [Query.equal("batchId", batchId), Query.equal("studentId", studentId)]
    });
    if (reqCheck.total > 0) {
      return reqCheck.rows[0].status;
    }

    return "unrequested";
  }

  // Teacher specific: Approve a request & map to batch
  async approveRequest(requestId, batchId, studentId, enrollmentDetails = {}) {
    if (!requestId || !batchId || !studentId) {
      throw new Error("Missing params for complete approval");
    }
    
    const updatedRequest = await this.updateRequestStatus(requestId, "approved");
    
    try {
      await teamService.approveStudent(batchId, studentId, enrollmentDetails);
    } catch (err) {
      console.warn("[approveRequest] teamService.approveStudent error, falling back to batchStudentService:", err);
      await batchStudentService.addStudent(batchId, studentId, enrollmentDetails);
    }
    
    return updatedRequest;
  }

  // Teacher specific: Reject a request
  async rejectRequest(requestId) {
    return await this.updateRequestStatus(requestId, "rejected");
  }

  // Teacher specific: direct assign (skip request process via auto-approve)
  async assignStudentDirectly(studentId, batchId) {
    const existing = await this.database.listRows({
      databaseId: conf.databaseId,
      tableId: conf.batchRequestsCollectionId,
      queries: [
        Query.equal("batchId", batchId),
        Query.equal("studentId", studentId),
      ]
    });

    let request;
    if (existing.total > 0) {
      request = existing.rows[0];
      if (request.status !== "approved") {
        request = await this.updateRequestStatus(request.$id, "approved");
      }
    } else {
      request = await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.batchRequestsCollectionId,
        rowId: "unique()",
        data: {
          batchId,
          studentId,
          status: "approved",
          requestedBy: "teacher", 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }

    try {
      await teamService.approveStudent(batchId, studentId);
    } catch (err) {
      console.warn("[assignStudentDirectly] teamService.approveStudent failed, falling back to batchStudentService:", err);
      await batchStudentService.addStudent(batchId, studentId);
    }
    return request;
  }

  // Teacher specific: revoke approval and mark request as rejected
  async revokeStudent(batchId, studentId, requestId = null) {
    if (!batchId || !studentId) {
      throw new Error("batchId and studentId are required");
    }

    try {
      await teamService.removeStudent(batchId, studentId);
    } catch (err) {
      console.warn("teamService.removeStudent failed, falling back to batchStudentService:", err);
      await batchStudentService.removeStudent(batchId, studentId);
    }

    if (requestId) {
      return await this.updateRequestStatus(requestId, "rejected");
    }

    const existing = await this.database.listRows({
      databaseId: conf.databaseId,
      tableId: conf.batchRequestsCollectionId,
      queries: [Query.equal("batchId", batchId), Query.equal("studentId", studentId)]
    });

    if (existing.total > 0) {
      return await this.updateRequestStatus(existing.rows[0].$id, "rejected");
    }

    return await this.database.createRow({
      databaseId: conf.databaseId,
      tableId: conf.batchRequestsCollectionId,
      rowId: "unique()",
      data: {
        batchId,
        studentId,
        status: "rejected",
        requestedBy: "teacher",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
  }

  // Delete a request completely from the database
  async deleteRequest(requestId) {
    if (!requestId) throw new Error("requestId is required");

    try {
      return await this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: conf.batchRequestsCollectionId,
        rowId: requestId
      });
    } catch (error) {
      console.error("Appwrite error: deleteRequest:", error);
      throw new Error(`Error: ${error.message}`);
    }
  }
}

export const batchRequestService = new BatchRequestService();
export default batchRequestService;
