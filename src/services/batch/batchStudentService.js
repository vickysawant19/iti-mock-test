import { Query } from "appwrite";
import conf from "../../config/config";
import { appwriteClientService as appwriteService } from "../core/appwriteClient";
import { newAttendanceService } from "../attendance/newAttendanceService";

export class BatchStudentService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  /**
   * Sanitizes (deletes) any attendance records that exist prior to a student's enrollmentDate,
   * and resyncs monthly stats for affected months.
   */
  async sanitizePreEnrollmentAttendance(batchId, studentId, enrollmentDate) {
    if (!batchId || !studentId || !enrollmentDate) return 0;
    try {
      const enrollStr =
        typeof enrollmentDate === "string"
          ? enrollmentDate.substring(0, 10)
          : new Date(enrollmentDate).toISOString().substring(0, 10);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(enrollStr)) return 0;

      const orphanedRes = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.newAttendanceCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("userId", studentId),
          Query.lessThan("date", enrollStr),
          Query.limit(500),
        ],
      });

      const toDelete = orphanedRes.rows || orphanedRes.documents || [];
      if (toDelete.length === 0) return 0;

      const idsToDelete = toDelete.map((doc) => doc.$id);
      const deletedIds = await newAttendanceService.deleteMultipleAttendance(idsToDelete);

      const uniqueMonths = [...new Set(toDelete.map((doc) => doc.date.substring(0, 7)))];
      for (const ym of uniqueMonths) {
        await newAttendanceService.syncMonthlyAttendanceStats(studentId, batchId, `${ym}-01`);
      }

      console.log(
        `[batchStudentService] Sanitized ${deletedIds.length} pre-enrollment attendance records (date < ${enrollStr}) for student ${studentId} in batch ${batchId}`
      );
      return deletedIds.length;
    } catch (error) {
      console.error("Error sanitizing pre-enrollment attendance:", error);
      return 0;
    }
  }

  async addStudent(batchId, studentId, details = {}) {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    const { enrollmentDate, status = "active", approvedBy = null, remarks = null, rollNumber = null, registerId = null } = details;

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
        return (existing.rows || existing.documents)[0];
      }

      return await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        rowId: "unique()",
        data: {
          batchId,
          studentId,
          joinedAt: new Date().toISOString(),
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

  async updateStudentRecord(batchId, studentId, fields = {}) {
    if (!batchId || !studentId) throw new Error("batchId and studentId are required");

    try {
      if (fields.enrollmentDate) {
        await this.sanitizePreEnrollmentAttendance(batchId, studentId, fields.enrollmentDate);
      }

      const existing = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [
          Query.equal("batchId", batchId),
          Query.equal("studentId", studentId),
        ],
      });

      if (existing.total === 0) throw new Error("Student record not found in batch.");

      const docId = (existing.rows || existing.documents)[0].$id;
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
      return (response.rows || response.documents)?.[0] || null;
    } catch (error) {
      console.error("Appwrite error: getStudentRecord:", error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  async getBatchStudents(batchId, customQueries = []) {
    if (!batchId) throw new Error("batchId is required");

    try {
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [Query.equal("batchId", batchId), Query.limit(100), ...customQueries],
      });
      return response.rows || response.documents || [];
    } catch (error) {
      console.error(`Appwrite error: getBatchStudents for batch ${batchId}:`, error);
      throw new Error(`Error: ${error.message}`);
    }
  }

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
        const rows = existing.rows || existing.documents || [];
        for (const doc of rows) {
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

  async getStudentBatches(studentId) {
    if (!studentId) throw new Error("studentId is required");

    try {
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchStudentsCollectionId,
        queries: [Query.equal("studentId", studentId), Query.limit(100)],
      });
      return response.rows || response.documents || [];
    } catch (error) {
      console.error(`Appwrite error: getStudentBatches for student ${studentId}:`, error);
      throw new Error(`Error: ${error.message}`);
    }
  }
}

export const batchStudentService = new BatchStudentService();
export default batchStudentService;
