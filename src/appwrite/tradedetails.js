import { ID, Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class TradeService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async getTrade(id) {
    try {
      return await this.database.getDocument(
        conf.databaseId,
        conf.tradeCollectionId,
        id,
      );
    } catch (error) {
      console.log("Appwrite error: get Trade:", error);
      return false;
    }
  }

  async createTrade(tradeData) {
    const { tradeName, duration, description, isActive } = tradeData;
    try {
      // Check if the trade already exists
      const existingTrades = await this.database.listDocuments(
        conf.databaseId,
        conf.tradeCollectionId,
        [Query.equal("tradeName", tradeName)],
      );

      if (existingTrades.total > 0) {
        throw new Error(
          "The trade with the specified name already exists.",
        );
      }

      const documentData = {
        tradeName,
        duration: parseInt(duration) || 1,
        description: description || "",
        isActive: isActive ?? true,
      };

      return await this.database.createDocument(
        conf.databaseId,
        conf.tradeCollectionId,
        ID.unique(),
        documentData,
      );
    } catch (error) {
      throw new Error(`${error.message}`);
    }
  }

  async updateTrade(id, updatedData) {
    try {
      const documentData = { ...updatedData };
      if (documentData.duration) {
        documentData.duration = parseInt(documentData.duration);
      }
      return await this.database.updateDocument(
        conf.databaseId,
        conf.tradeCollectionId,
        id,
        documentData,
      );
    } catch (error) {
      console.log("Appwrite error: update Trade:", error);
      return false;
    }
  }

  async deleteTrade(id) {
    try {
      await this.database.deleteDocument(
        conf.databaseId,
        conf.tradeCollectionId,
        id,
      );
      return true;
    } catch (error) {
      console.log("Appwrite error: delete Trade:", error);
      return false;
    }
  }

  async listTrades(
    queries = [Query.orderDesc("$createdAt"), Query.limit(100)],
  ) {
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.tradeCollectionId,
        queries,
      );
    } catch (error) {
      console.error("Appwrite error: fetching trades:", error);
      throw new Error(`Error:${error.message.split(".")[0]}`);
    }
  }
}

const tradeservice = new TradeService();

export default tradeservice;
