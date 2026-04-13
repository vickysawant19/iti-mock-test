import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";

export class BatchStudentService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  // Add an approved student to the batch
  async addStudent(batchId, studentId) {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    try {
      // Check for duplicate
      const existing = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,

        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ]
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
          joinedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Appwrite error: addStudent:", error);
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
        queries: [Query.equal("batchId", batchId), Query.limit(100), ...customQueries]
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
        ]
      });

      if (existing.total > 0) {
        // Delete all matching mappings
        for (const doc of existing.rows) {
          await this.database.deleteRow({
            databaseId: conf.databaseId,
            tableId: conf.batchStudentsCollectionId,
            rowId: doc.$id
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
        queries: [Query.equal("studentId", studentId), Query.limit(100)]
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
