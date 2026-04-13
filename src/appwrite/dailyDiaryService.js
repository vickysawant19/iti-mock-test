import { Query, ID } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";

export class DailyDiaryService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
    this.collectionId = "dailyDiary"; // Hardcoded as per migration
  }

  async getDatesByPracticalNumber(batchId, practicalNumber) {
    try {
      // practicalNumbers is an array of strings in Appwrite
      const queries = [
        Query.equal("batchId", batchId),
        Query.contains("practicalNumbers", [practicalNumber.toString()]),
        Query.limit(100),
      ];

      const res = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: this.collectionId,
        queries: queries
      });
      return res.rows.map((doc) => doc.date);
    } catch (error) {
      console.error(
        `Appwrite error fetching dates for practical ${practicalNumber}:`,
        error,
      );
      return [];
    }
  }

  async createDocument(data) {
    try {
      const timestamp = new Date().toISOString();
      return await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: this.collectionId,
        rowId: ID.unique(),

        data: {
          ...data,
        }
      });
    } catch (error) {
      console.error("Appwrite error: creating daily diary entry:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async updateDocument(documentId, updatedData) {
    try {
      return await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: this.collectionId,
        rowId: documentId,
        data: updatedData
      });
    } catch (error) {
      console.error("Appwrite error: updating daily diary entry:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteDocument(documentId) {
    try {
      return await this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: this.collectionId,
        rowId: documentId
      });
    } catch (error) {
      console.error("Appwrite error: deleting daily diary entry:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getBatchInstructorDiary(batchId, instructorId, startDate, endDate) {
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.limit(100), // Reverted back to 100 default
      ];

      if (instructorId) {
        // Query.equal("instructorId", instructorId) is optional depending on if we want ALL or just for this instructor
        // We might just show all entries for the batch, but filter on client, or filter here.
      }

      if (startDate && endDate) {
        queries.push(Query.greaterThanEqual("date", startDate));
        queries.push(Query.lessThanEqual("date", endDate));
      }

      const res = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: this.collectionId,
        queries: queries
      });

      return res.rows;
    } catch (error) {
      console.error("Appwrite error: fetching daily diary:", error);
      return [];
    }
  }
}

const dailyDiaryService = new DailyDiaryService();
export default dailyDiaryService;
