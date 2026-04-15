import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";

export class BatchStudentService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  /**
   * Add an approved student to a batch.
   * @param {string} batchId
   * @param {string} studentId
   * @param {object} [details] - Optional enrollment details
   * @param {string} [details.enrollmentDate]  - ISO date string (batch start date by default)
   * @param {string} [details.status]          - "active" | "inactive" | "dropped" | "graduated" | "on_leave"
   * @param {string} [details.approvedBy]      - teacher userId
   * @param {string} [details.remarks]         - Optional notes
   */
  async addStudent(batchId, studentId, details = {}) {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    const { enrollmentDate, status = "active", approvedBy = null, remarks = null, rollNumber = null, registerId = null } = details;

    try {
      // Check for duplicate
      const existing = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ],
      });

      if (existing.total > 0) {
        return existing.rows[0]; // Already joined
      }

      return await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        rowId: "unique()",
        data: {
          batchId,
          studentId,
          joinedAt: new Date().toISOString(),       // keep for backwards compat
          enrollmentDate: enrollmentDate || new Date().toISOString(),
          status,
          approvedBy,
          remarks,
          rollNumber,
          registerId,
        },
      });
    } catch (error) {
      console.error("Appwrite error: addStudent:", error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  /**
   * Update enrollment details for an existing student-batch record.
   * @param {string} batchId
   * @param {string} studentId
   * @param {object} fields - Only the fields to update
   */
  async updateStudentRecord(batchId, studentId, fields = {}) {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    try {
      const existing = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ],
      });

      if (existing.total === 0) throw new Error("Student record not found in batch.");

      const docId = existing.rows[0].$id;
      return await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        rowId: docId,
        data: fields,
      });
    } catch (error) {
      console.error("Appwrite error: updateStudentRecord:", error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  /**
   * Get a single student's record within a batch.
   */
  async getStudentRecord(batchId, studentId) {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    try {
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
          Query.limit(1),
        ],
      });
      return response.rows[0] || null;
    } catch (error) {
      console.error("Appwrite error: getStudentRecord:", error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  // Get all students for a specific batch
  async getBatchStudents(batchId, customQueries = []) {
    if (!batchId) throw new Error("batchId is required");

    try {
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [Query.equal("batchId", batchId), Query.limit(100), ...customQueries],
      });
      return response.rows;
    } catch (error) {
      console.error(`Appwrite error: getBatchStudents for batch ${batchId}:`, error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  // Remove a student from a batch (revoke approval)
  async removeStudent(batchId, studentId) {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    try {
      const existing = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ],
      });

      if (existing.total > 0) {
        for (const doc of existing.rows) {
          await this.database.deleteRow({
            databaseId: conf.databaseId,
            tableId: conf.batchStudentsCollectionId,
            rowId: doc.$id,
          });
        }
      }
      return true;
    } catch (error) {
      console.error("Appwrite error: removeStudent:", error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  // Get all batches a student is a part of
  async getStudentBatches(studentId) {
    if (!studentId) throw new Error("studentId is required");

    try {
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [Query.equal("studentId", studentId), Query.limit(100)],
      });
      return response.rows;
    } catch (error) {
      console.error(`Appwrite error: getStudentBatches for student ${studentId}:`, error);
      throw new Error(`Error: ${error.message}`);
    }
  }
}

const batchStudentService = new BatchStudentService();
export default batchStudentService;
