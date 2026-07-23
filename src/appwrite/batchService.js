import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";
import teamService from "./teamService";

export class BatchService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  async createBatch(data) {
    try {
      return await teamService.createBatch(data);
    } catch (error) {
      console.warn("Server function createBatch failed, falling back to database create:", error);
      return await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.batchesCollectionId,
        rowId: "unique()",
        data: {
          ...data,
          status: "active",
          memberCount: 1,
          version: 1,
        },
      });
    }
  }

  async updateBatch(batchId, updatedData) {
    try {
      return await teamService.updateBatch(batchId, updatedData);
    } catch (error) {
      console.warn("Server function updateBatch failed, falling back to database update:", error);
      return await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.batchesCollectionId,
        rowId: batchId,
        data: updatedData,
      });
    }
  }

  async deleteBatch(batchId) {
    try {
      return await teamService.deleteBatch(batchId);
    } catch (error) {
      console.warn("Server function deleteBatch failed, falling back to database delete:", error);
      return await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.batchesCollectionId,
        rowId: batchId,
        data: { status: "deleted" },
      });
    }
  }

  async getBatch(batchId, queries = []) {
    try {
      const data = await this.database.getRow({
        databaseId: conf.databaseId,
        tableId: conf.batchesCollectionId,
        rowId: batchId
      });

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
      return await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchesCollectionId,
        queries: queries
      });
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
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.batchesCollectionId,
        queries: queries
      });
      return response.rows;
    } catch (error) {
      console.error("Appwrite error: getBatchesByIds:", error);
      return [];
    }
  }
}

const batchService = new BatchService();

export default batchService;
