import { Query, ID } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class DailyDiaryService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
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

      const res = await this.database.listDocuments(
        conf.databaseId,
        this.collectionId,
        queries,
      );
      return res.documents.map((doc) => doc.date);
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
      return await this.database.createDocument(
        conf.databaseId,
        this.collectionId,
        ID.unique(),
        {
          ...data,
        },
      );
    } catch (error) {
      console.error("Appwrite error: creating daily diary entry:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async updateDocument(documentId, updatedData) {
    try {
      return await this.database.updateDocument(
        conf.databaseId,
        this.collectionId,
        documentId,
        updatedData,
      );
    } catch (error) {
      console.error("Appwrite error: updating daily diary entry:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteDocument(documentId) {
    try {
      return await this.database.deleteDocument(
        conf.databaseId,
        this.collectionId,
        documentId,
      );
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

      const res = await this.database.listDocuments(
        conf.databaseId,
        this.collectionId,
        queries,
      );

      return res.documents;
    } catch (error) {
      console.error("Appwrite error: fetching daily diary:", error);
      return [];
    }
  }
}

const dailyDiaryService = new DailyDiaryService();
export default dailyDiaryService;
