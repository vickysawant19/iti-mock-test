import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";
import batchStudentService from "./batchStudentService";

export class StudentBatchAccessService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  /**
   * Evaluates the activation status of a student for a specific batch.
   * Return states: "ACTIVE" | "PENDING" | "REJECTED" | "NOT_REQUESTED"
   */
  async checkStudentBatchStatus(batchId, studentId) {
    if (!batchId || !studentId) {
      console.warn("checkStudentBatchStatus called with missing parameters", { batchId, studentId });
      return "NOT_REQUESTED";
    }

    try {
      // 1. Check if the user is ALREADY ACTIVE in the batch via batchStudents collection
      const activeCheck = await this.database.listDocuments(
        conf.databaseId,
        conf.batchStudentsCollectionId,
        [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ]
      );

      // We don't strictly require status="active" internally yet unless the schema is updated,
      // but if the document exists in batchStudents, they are essentially active in the batch.
      if (activeCheck.total > 0) {
        return "ACTIVE";
      }

      // 2. If not active, check batchRequests lifecycle
      const requestCheck = await this.database.listDocuments(
        conf.databaseId,
        conf.batchRequestsCollectionId,
        [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ]
      );

      if (requestCheck.total > 0) {
        // Find the most recent/relevant request
        // Prioritize approved > pending > rejected
        const req = requestCheck.documents[0];

        if (req.status === "pending") {
          return "PENDING";
        }
        
        if (req.status === "rejected") {
          return "REJECTED";
        }

        if (req.status === "approved") {
          // AUTO-HEALING: Request is approved but they are missing from batchStudents
          console.warn("Auto-healing active status for student:", studentId, "in batch:", batchId);
          await batchStudentService.addStudent(batchId, studentId);
          return "ACTIVE";
        }
      }

      // 3. Fallback: No connection to batch
      return "NOT_REQUESTED";

    } catch (error) {
      console.error("Error in checkStudentBatchStatus:", error);
      // Fail safely
      return "NOT_REQUESTED";
    }
  }
}

const studentBatchAccessService = new StudentBatchAccessService();
export default studentBatchAccessService;
