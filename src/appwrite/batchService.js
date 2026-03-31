import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class BatchService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async createBatch(data) {
    //end_date	BatchName	start_date	teacherId	teacherName	tradeId	collegeId	studentIds	Created	Updated
    try {
      const timestamp = new Date().toISOString();
      const batchData = {
        ...data,
      };

      return await this.database.createDocument(
        conf.databaseId,
        conf.batchesCollectionId,
        "unique()",
        batchData,
      );
    } catch (error) {
      console.error("Appwrite error: creating batch:", error);
      throw new Error(`${error.message}`);
    }
  }

  async updateBatch(batchId, updatedData) {
    try {
      return await this.database.updateDocument(
        conf.databaseId,
        conf.batchesCollectionId,
        batchId,
        updatedData,
      );
    } catch (error) {
      console.error("Appwrite error: updating batch:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteBatch(batchId) {
    try {
      return await this.database.deleteDocument(
        conf.databaseId,
        conf.batchesCollectionId,
        batchId,
      );
    } catch (error) {
      console.error("Appwrite error: deleting batch:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getBatch(batchId, queries = []) {
    try {
      const data = await this.database.getDocument(
        conf.databaseId,
        conf.batchesCollectionId,
        batchId,
        queries,
      );

      return {
        ...data,
        attendanceTime: data.attendanceTime
          ? JSON.parse(data.attendanceTime)
          : {},
        location: data.location
          ? JSON.parse(data.location)
          : { lat: "", lon: "" },
      };
    } catch (error) {
      console.log("Appwrite error: get batch:", error);
      return false;
    }
  }

  async addStudentToBatchSync(batchId, studentProfile) {
    if (!batchId) return;
    try {
      const batchData = await this.database.getDocument(conf.databaseId, conf.batchesCollectionId, batchId);
      let batchStudentsParsed = [];
      if (batchData.studentIds && Array.isArray(batchData.studentIds)) {
        batchData.studentIds.forEach((itm) => {
          try { batchStudentsParsed.push(JSON.parse(itm)); } catch (error) {}
        });
      }

      // Check if already in batch
      if (batchStudentsParsed.some(s => s.userId === studentProfile.userId)) return;

      const occupied = new Set(batchStudentsParsed.map((b) => {
        const pos = b.position || { x: 0, y: 0 };
        return `${pos.x}_${pos.y}`;
      }));

      // Find first free position in a 5x5 grid (x:0-4, y:0-4)
      let freePos = null;
      for (let x = 0; x < 5 && !freePos; x++) {
        for (let y = 0; y < 5 && !freePos; y++) {
          const key = `${x}_${y}`;
          if (!occupied.has(key)) freePos = { x, y };
        }
      }

      if (!freePos) freePos = { x: 0, y: 0 }; // Fallback

      const newBatchStudent = {
        studentId: studentProfile.studentId || studentProfile.userId || "",
        userId: studentProfile.userId,
        status: "Active",
        position: freePos,
      };

      const updatedBatchStudents = [...batchStudentsParsed, newBatchStudent];
      await this.updateBatch(batchId, {
        studentIds: updatedBatchStudents.map((itm) => JSON.stringify(itm)),
      });
    } catch (e) {
      console.error("Appwrite error: addStudentToBatchSync:", e);
    }
  }

  async removeStudentFromBatchSync(batchId, userId) {
    if (!batchId || !userId) return;
    try {
      const batchData = await this.database.getDocument(conf.databaseId, conf.batchesCollectionId, batchId);
      if (!batchData.studentIds || !Array.isArray(batchData.studentIds)) return;
      
      let batchStudentsParsed = [];
      batchData.studentIds.forEach((itm) => {
        try { batchStudentsParsed.push(JSON.parse(itm)); } catch (error) {}
      });

      const updatedBatchStudents = batchStudentsParsed.filter(s => s.userId !== userId);
      
      if (updatedBatchStudents.length !== batchStudentsParsed.length) {
        await this.updateBatch(batchId, {
          studentIds: updatedBatchStudents.map((itm) => JSON.stringify(itm)),
        });
      }
    } catch (e) {
      console.error("Appwrite error: removeStudentFromBatchSync:", e);
    }
  }

  async listBatches(queries = [Query.orderDesc("$createdAt")]) {
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.batchesCollectionId,
        queries,
      );
    } catch (error) {
      console.error("Appwrite error: fetching batches:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }
}

const batchService = new BatchService();

export default batchService;
