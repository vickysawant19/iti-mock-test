import { Query, ID } from "appwrite";
import conf from "../../config/config";
import { appwriteClientService as appwriteService } from "../core/appwriteClient";
import PermissionBuilder from "../../utils/permissionBuilder";

export class DailyDiaryService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
    this.collectionId = conf.dailyDiaryCollectionId;
  }

  async getDatesByPracticalNumber(batchId, practicalNumber) {
    try {
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
      const rows = res.rows || res.documents || [];
      return rows.map((doc) => doc.date);
    } catch (error) {
      console.error(
        `Appwrite error fetching dates for practical ${practicalNumber}:`,
        error,
      );
      return [];
    }
  }

  async createRow(data, teamId = null) {
    try {
      const activeTeamId = teamId || data.teamId;
      const permissions = activeTeamId ? PermissionBuilder.diary(activeTeamId) : undefined;

      return await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: this.collectionId,
        rowId: ID.unique(),
        data: {
          ...data,
        },
        permissions: permissions
      });
    } catch (error) {
      console.error("Appwrite error: creating daily diary entry:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async updateRow(rowId, updatedData) {
    try {
      return await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: this.collectionId,
        rowId: rowId,
        data: updatedData
      });
    } catch (error) {
      console.error("Appwrite error: updating daily diary entry:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteRow(rowId) {
    try {
      return await this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: this.collectionId,
        rowId: rowId
      });
    } catch (error) {
      console.error("Appwrite error: deleting daily diary entry:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  // Modern entry aliases
  async createEntry(data, teamId = null) {
    return await this.createRow(data, teamId);
  }

  async updateEntry(rowId, updatedData) {
    return await this.updateRow(rowId, updatedData);
  }

  async deleteEntry(rowId) {
    return await this.deleteRow(rowId);
  }

  // Legacy method aliases for backward compatibility
  async createDocument(data, teamId = null) {
    return await this.createRow(data, teamId);
  }

  async updateDocument(documentId, updatedData) {
    return await this.updateRow(documentId, updatedData);
  }

  async deleteDocument(documentId) {
    return await this.deleteRow(documentId);
  }

  async getBatchInstructorDiary(batchId, instructorId, startDate, endDate) {
    try {
      const queries = [
        Query.equal("batchId", batchId),
        Query.limit(100),
      ];

      if (instructorId) {
        // Query.equal("instructorId", instructorId) is optional
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

      return res.rows || res.documents || [];
    } catch (error) {
      console.error("Appwrite error: fetching daily diary:", error);
      return [];
    }
  }
}

export const dailyDiaryService = new DailyDiaryService();
export default dailyDiaryService;
