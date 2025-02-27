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
        batchData
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
        updatedData
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
        batchId
      );
    } catch (error) {
      console.error("Appwrite error: deleting batch:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getBatch(batchId) {
    try {
      const data = await this.database.getDocument(
        conf.databaseId,
        conf.batchesCollectionId,
        batchId
      );

      return {
        ...data,
        attendanceTime: JSON.parse(data.attendanceTime),
        location: JSON.parse(data.location) || { lat: "", lon: "" },
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
        queries
      );
    } catch (error) {
      console.error("Appwrite error: fetching batches:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  static async customBatchBaseQuery({ method, data }) {
    const batchService = new BatchService();
    try {
      // Ensure method is uppercase
      const reqMethod = method.toUpperCase();

      const methodMap = {
        GET: () => batchService.getBatch(data.batchId),
        POST: () => batchService.createBatch(data.batchName),
        UPDATE: () =>
          batchService.updateBatch(data.batchId, data.updatedData),
        DELETE: () => batchService.deleteBatch(data.batchId),
      };

      if (!methodMap[reqMethod]) {
        throw new Error(`Method ${reqMethod} not supported`);
      }

      const result = await methodMap[reqMethod]();
      return { data: result };
    } catch (error) {
      return { error: error.message };
    }
  }
}

const batchService = new BatchService();

export default batchService;
