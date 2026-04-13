import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";

export class UserStatsService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  async getAllStats(queries = [Query.orderDesc("$updatedAt")]) {
    try {
      return await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.userStatsCollectionId,
        queries: queries
      });
    } catch (error) {
      console.error("Appwrite error: fetching all user stats:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getUserStats(userId) {
    try {
      const userStats = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.userStatsCollectionId,
        queries: [Query.equal("userId", userId)]
      });

      if (userStats.total === 0) {
        throw new Error("User stats not found.");
      }

      return userStats.rows[0]; // Assuming user stats are unique per userId
    } catch (error) {
      console.log("Appwrite error: get user stats:", error);
      return false;
    }
  }
}

const userStatsService = new UserStatsService();

export default userStatsService;
