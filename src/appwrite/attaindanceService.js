import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class AttendanceService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async getBatchAttendance(batchId) {
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.studentAttendanceCollectionId,
        [Query.equal("batchId", batchId)]
      );
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

      return userAttendance.documents[0];
    } catch (error) {
      console.log("Appwrite error: get user attendance:", error);
      return false;
    }
  }

  async markUserAttendance(userId, record) {
    try {
      console.log("recored", userId, record);

      // const userAttendance = await this.getUserAttendance(userId);

      // if (!userAttendance) {
      //   this.database.createDocument(
      //     conf.databaseId,
      //     conf.studentAttendanceCollectionId,
      //     "unique()",
      //     attendanceRecord
      //   );
      // }

      // userAttendance.attendanceRecords.push(attendanceRecord);

      // console.log("userAttaindance", userAttendance);

      // return await this.database.updateDocument(
      //   conf.databaseId,
      //   conf.studentAttendanceCollectionId,
      //   userAttendance.$id,
      //   { attendanceRecords: JSON.stringify(userAttendance.attendanceRecords) }
      // );
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
