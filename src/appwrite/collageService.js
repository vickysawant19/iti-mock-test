import { ID, Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";

export class CollegeService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  async createCollege(collegeData) {
    const { collageName, location, tradeIds, isActive } = collegeData;
    try {
      const data = {
        collageName,
        location: location || "",
        tradeIds: tradeIds || [],
        isActive: isActive ?? true,
      };
      return await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.collegesCollectionId,
        rowId: ID.unique(),
        data: data
      });
    } catch (error) {
      console.error("Appwrite error: creating college:", error);
      throw new Error(error.message);
    }
  }

  async updateCollege(collegeId, updatedData) {
    try {
      return await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.collegesCollectionId,
        rowId: collegeId,
        data: updatedData
      });
    } catch (error) {
      console.error("Appwrite error: updating college:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteCollege(collegeId) {
    try {
      return await this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: conf.collegesCollectionId,
        rowId: collegeId
      });
    } catch (error) {
      console.error("Appwrite error: deleting college:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getCollege(collegeId) {
    try {
      const res = await this.database.getRow({
        databaseId: conf.databaseId,
        tableId: conf.collegesCollectionId,
        rowId: collegeId
      });

      return res;
    } catch (error) {
      console.error("Appwrite error: get college:", error);
      return false;
    }
  }

  async listColleges(
    queries = [Query.orderDesc("$createdAt"), Query.limit(100)],
  ) {
    try {
      return await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.collegesCollectionId,
        queries: queries
      });
    } catch (error) {
      console.error("Appwrite error: fetching colleges:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }
}

const collegeService = new CollegeService();

export default collegeService;
