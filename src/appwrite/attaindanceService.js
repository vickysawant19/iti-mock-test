import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class AttendanceService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async getStudentsAttendance(queries = []) {
    try {
      const batchAttendance = await this.database.listDocuments(
        conf.databaseId,
        conf.studentAttendanceCollectionId,
        queries
      );
      return batchAttendance.documents.map((userAttendance) => ({
        ...userAttendance,
        attendanceRecords: userAttendance.attendanceRecords.map((a) =>
          JSON.parse(a)
        ),
      }));
    } catch (error) {
      console.error("Appwrite error: fetching batch attendance:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
}
  }

  async getBatchAttendance(batchId, queries = []) {
    try {
      const batchAttendance = await this.database.listDocuments(
        conf.databaseId,
        conf.studentAttendanceCollectionId,
        [Query.equal("batchId", batchId), ...queries]
      );

      return batchAttendance.documents.map((userAttendance) => ({
        ...userAttendance,
        attendanceRecords: userAttendance.attendanceRecords.map((a) =>
          JSON.parse(a)
        ),
      }));
    } catch (error) {
      console.error("Appwrite error: fetching batch attendance:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getUserAttendance(userId, batchId, queries = []) {
    try {
      queries.push(Query.equal("userId", userId));

      if (batchId) {
        queries.push(Query.equal("batchId", batchId));
      }

      const userAttendance = await this.database.listDocuments(
        conf.databaseId,
        conf.studentAttendanceCollectionId,
        queries
      );
      if (userAttendance.total === 0) {
        throw new Error("User attendance not found.");
      }

      if (userAttendance.total > 1) {
        console.log("Multiple User attendance found.");
        // Pass userId here to fix the undefined userId error
        await this.cleanupDuplicateUserRecords(userAttendance, userId);
      }

      return {
        ...userAttendance.documents[0],
        attendanceRecords: userAttendance.documents[0].attendanceRecords.map(
          (a) => JSON.parse(a)
        ),
      };
    } catch (error) {
      console.log("Appwrite error: get user attendance:", error);
      return false;
    }
  }

  async cleanupDuplicateUserRecords(userAttendances, userId) {
    try {
      // If there's only one record or none, no duplicates to clean
      if (userAttendances.total <= 1) {
        console.log(`No duplicates found for user ${userId}`);
        return false;
      }

      console.log(
        `Found ${userAttendances.total} records for user ${userId}, cleaning up duplicates...`
      );

      // Parse all attendance records and sort by length (descending)
      const parsedAttendances = userAttendances.documents.map((doc) => ({
        ...doc,
        recordCount: doc.attendanceRecords.length,
      }));

      // Sort by number of attendance records (descending)
      parsedAttendances.sort((a, b) => b.recordCount - a.recordCount);

      // Keep the record with most entries, delete others
      const recordToKeep = parsedAttendances[0];
      const recordsToDelete = parsedAttendances.slice(1);

      // Delete duplicate records
      for (const record of recordsToDelete) {
        await this.database.deleteDocument(
          conf.databaseId,
          conf.studentAttendanceCollectionId,
          record.$id
        );
        console.log(
          `Deleted duplicate record ${record.$id} for user ${userId}`
        );
      }

      return {
        keptRecord: recordToKeep,
        deletedRecords: recordsToDelete,
        deletedCount: recordsToDelete.length,
      };
    } catch (error) {
      console.error(
        "Appwrite error: cleaning up duplicate user records:",
        error
      );
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async markUserAttendance(record, keepPrevious = true) {
    try {
      const userAttendance = await this.getUserAttendance(
        record.userId,
        record.batchId
      );

      if (!userAttendance) {
        const stringyfyRecord = {
          ...record,
          attendanceRecords: record.attendanceRecords.map((item) =>
            JSON.stringify(item)
          ),
        };
        return await this.database.createDocument(
          conf.databaseId,
          conf.studentAttendanceCollectionId,
          "unique()",
          stringyfyRecord
        );
      }
      //if user attenddance already present
      const newAttendanceRecords = record.attendanceRecords;

      let updatedUserAttendance = newAttendanceRecords;

      if (keepPrevious) {
        updatedUserAttendance = [
          ...userAttendance.attendanceRecords.filter(
            (item) =>
              !newAttendanceRecords.some(
                (newItem) => newItem.date === item.date
              )
          ),
          ...newAttendanceRecords,
        ];
      }

      const updatedAttendeceRes = await this.database.updateDocument(
        conf.databaseId,
        conf.studentAttendanceCollectionId,
        userAttendance.$id,
        {
          attendanceRecords: updatedUserAttendance.map((a) =>
            JSON.stringify(a)
          ),
        }
      );
      return {
        ...updatedAttendeceRes,
        attendanceRecords: updatedAttendeceRes.attendanceRecords.map((a) =>
          JSON.parse(a)
        ),
      };
    } catch (error) {
      console.error("Appwrite error: marking user attendance:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }
}

const attendanceService = new AttendanceService();

export default attendanceService;
