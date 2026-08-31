import { Query } from "appwrite";
import conf from "../../config/config";
import { appwriteClientService as appwriteService } from "../core/appwriteClient";
import teamService from "../auth/teamService";

export class StudentBatchAccessService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
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
      const activeCheck = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ]
      });

      if (activeCheck.total > 0) {
        return "ACTIVE";
      }

      // 2. If not active, check batchRequests lifecycle
      const requestCheck = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchRequestsCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ]
      });

      if (requestCheck.total > 0) {
        const rows = requestCheck.rows || requestCheck.documents || [];
        const req = rows[0];

        if (req.status === "pending") {
          return "PENDING";
        }
        
        if (req.status === "rejected") {
          return "REJECTED";
        }

        if (req.status === "approved") {
          // AUTO-HEALING: Request is approved but they are missing from batchStudents
          console.warn("Auto-healing active status for student:", studentId, "in batch:", batchId);
          await teamService.approveStudent(batchId, studentId);
          return "ACTIVE";
        }
      }

      // 3. Fallback: No connection to batch
      return "NOT_REQUESTED";

    } catch (error) {
      console.error("Error in checkStudentBatchStatus:", error);
      return "NOT_REQUESTED";
    }
  }
}

export const studentBatchAccessService = new StudentBatchAccessService();
export default studentBatchAccessService;
