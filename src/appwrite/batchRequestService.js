import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";
import batchStudentService from "./batchStudentService";

export class BatchRequestService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  // Send a request to join a batch
  async sendRequest(batchId, studentId, requestedBy = "student") {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    try {
      // 1. Check if the user is ALREADY ACTIVE in the batch (via batchStudents)
      const activeCheck = await this.database.listDocuments(
        conf.databaseId,
        conf.batchStudentsCollectionId,
        [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ]
      );

      if (activeCheck.total > 0) {
        return { alreadyJoined: true }; // Custom state instead of throwing error if preferred by UI
      }

      // 2. check if a pending or approved request already exists
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

  // Centralized unified status evaluation function
  async getStudentBatchStatus(studentId, batchId) {
    if (!studentId || !batchId) return "unrequested";
    
    // First check if they are already in the batch
    const activeCheck = await this.database.listDocuments(
      conf.databaseId,
      conf.batchStudentsCollectionId,
      [Query.equal("batchId", batchId), Query.equal("studentId", studentId)]
    );
    if (activeCheck.total > 0) return "approved";

    // Second check their request status
    const reqCheck = await this.database.listDocuments(
      conf.databaseId,
      conf.batchRequestsCollectionId,
      [Query.equal("batchId", batchId), Query.equal("studentId", studentId)]
    );
    if (reqCheck.total > 0) {
      return reqCheck.documents[0].status; // "pending", "approved", or "rejected"
    }

    return "unrequested";
  }

  // Teacher specific: Approve a request & map to batch
  async approveRequest(requestId, batchId, studentId) {
    if (!requestId || !batchId || !studentId) {
       // if we only have requestId, we need to fetch it first to get batchId and studentId, 
       // but typically we can pass all 3 if known from UI
       throw new Error("Missing params for complete approval");
    }
    
    // 1. Mark request as approved
    const updatedRequest = await this.updateRequestStatus(requestId, "approved");
    
    // 2. Add student to batch
    await batchStudentService.addStudent(batchId, studentId);
    
    return updatedRequest;
  }

  // Teacher specific: Reject a request
  async rejectRequest(requestId) {
    return await this.updateRequestStatus(requestId, "rejected");
  }

  // Teacher specific: direct assign (skip request process via auto-approve)
  async assignStudentDirectly(studentId, batchId) {
    // 1. Try to fetch existing request, create one if not existing
    const existing = await this.database.listDocuments(
      conf.databaseId,
      conf.batchRequestsCollectionId,
      [
        Query.equal("batchId", batchId),
        Query.equal("studentId", studentId),
      ]
    );

    let request;
    if (existing.total > 0) {
      request = existing.documents[0];
      if (request.status !== "approved") {
        request = await this.updateRequestStatus(request.$id, "approved");
      }
    } else {
      request = await this.database.createDocument(
        conf.databaseId,
        conf.batchRequestsCollectionId,
        "unique()",
        {
          batchId,
          studentId,
          status: "approved",
          requestedBy: "teacher", 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
    }

    // 2. Add to batch
    await batchStudentService.addStudent(batchId, studentId);
    return request;
  }

  // Teacher specific: revoke approval and mark request as rejected
  async revokeStudent(batchId, studentId, requestId = null) {
    if (!batchId || !studentId) {
      throw new Error("batchId and studentId are required");
    }

    // 1. Remove active enrollment from batch
    await batchStudentService.removeStudent(batchId, studentId);

    // 2. Mark corresponding request as rejected
    if (requestId) {
      return await this.updateRequestStatus(requestId, "rejected");
    }

    const existing = await this.database.listDocuments(
      conf.databaseId,
      conf.batchRequestsCollectionId,
      [Query.equal("batchId", batchId), Query.equal("studentId", studentId)]
    );

    if (existing.total > 0) {
      return await this.updateRequestStatus(existing.documents[0].$id, "rejected");
    }

    // Keep request history consistent when no prior request exists
    return await this.database.createDocument(
      conf.databaseId,
      conf.batchRequestsCollectionId,
      "unique()",
      {
        batchId,
        studentId,
        status: "rejected",
        requestedBy: "teacher",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }
}

const batchRequestService = new BatchRequestService();
export default batchRequestService;
