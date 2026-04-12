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

      // Appwrite documents have non-serializable methods (e.g. toString via JSONbig).
      // Sanitize to a plain object before returning so it's safe to store in Redux.
      const plain = JSON.parse(JSON.stringify(data));

      return {
        ...plain,
        attendanceTime: plain.attendanceTime
          ? JSON.parse(plain.attendanceTime)
          : {},
        location: plain.location
          ? JSON.parse(plain.location)
          : { lat: "", lon: "" },
      };
    } catch (error) {
      console.log("Appwrite error: get batch:", error);
      return false;
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

  async getBatchesByIds(batchIds) {
    if (!batchIds || batchIds.length === 0) return [];
    try {
      // Chunking might be needed if batchIds > 100, assuming it's a small array.
      const queries = [Query.equal("$id", batchIds)];
      const response = await this.database.listDocuments(
        conf.databaseId,
        conf.batchesCollectionId,
        queries
      );
      return response.documents;
    } catch (error) {
      console.error("Appwrite error: getBatchesByIds:", error);
      return [];
    }
  }
}

const batchService = new BatchService();

export default batchService;
