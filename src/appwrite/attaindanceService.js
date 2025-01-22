import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class AttendanceService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async getAttendanceByDate(date) {
    try {
      const response = await this.database.listDocuments(
        conf.databaseId,
        conf.studentAttendanceCollectionId,
        [Query.search("attendanceRecords", "2025-01-23")]
      );
      return response.documents;
    } catch (error) {
      console.error("Appwrite error: fetching attendance by date:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getBatchAttendance(batchId) {
    try {
      const batchAttendance = await this.database.listDocuments(
        conf.databaseId,
        conf.studentAttendanceCollectionId,
        [Query.equal("batchId", batchId)]
      );

      return batchAttendance.documents;
    } catch (error) {
      console.error("Appwrite error: fetching batch attendance:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getUserAttendance(userId) {
    try {
      const userAttendance = await this.database.listDocuments(
        conf.databaseId,
        conf.studentAttendanceCollectionId,
        [Query.equal("userId", userId)]
      );
      if (userAttendance.total === 0) {
        throw new Error("User attendance not found.");
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

  async markUserAttendance(record) {
    try {
      const userAttendance = await this.getUserAttendance(record.userId);

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
      //if user attenddance alredy present
      const newAttendanceRecord = record.attendanceRecords[0];
      const updatedUserAttendance = [
        ...userAttendance.attendanceRecords.filter(
          (item) => item.date !== newAttendanceRecord.date
        ),
        newAttendanceRecord,
      ];

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

  async markBatchAttendance(batchId, attendanceRecords) {
    try {
      const batchAttendance = await this.getBatchAttendance(batchId);

      const updatePromises = batchAttendance.documents.map((record) => {
        const studentAttendance = record;
        const attendanceRecord = attendanceRecords.find(
          (ar) => ar.studentId === studentAttendance.studentId
        );

        if (attendanceRecord) {
          studentAttendance.attendanceRecords.push(attendanceRecord);
          return this.database.updateDocument(
            conf.databaseId,
            conf.studentAttendanceCollectionId,
            studentAttendance.$id,
            {
              attendanceRecords: JSON.stringify(
                studentAttendance.attendanceRecords
              ),
            }
          );
        }
      });

      return await Promise.all(updatePromises);
    } catch (error) {
      console.error("Appwrite error: marking batch attendance:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }
}

const attendanceService = new AttendanceService();

export default attendanceService;
