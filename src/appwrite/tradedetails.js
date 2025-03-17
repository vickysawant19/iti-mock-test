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
        id
      );
    } catch (error) {
      console.log("Appwrite error: get Trade:", error);
      return false;
    }
  }

  async createTrade(tradeData) {
    const { tradeName, year } = tradeData;
    try {
      // Check if the trade already exists
      const existingTrades = await this.database.listDocuments(
        conf.databaseId,
        conf.tradeCollectionId,
        [Query.equal("tradeName", tradeName), Query.equal("year", year)]
      );

      if (existingTrades.total > 0) {
        throw new Error(
          "The trade with the specified name and year already exists."
        );
      }

      const documentData = {
        tradeName,
        year,
      };

      return await this.database.createDocument(
        conf.databaseId,
        conf.tradeCollectionId,
        ID.unique(),
        documentData
      );
    } catch (error) {
      throw new Error(`${error.message}`);
    }
  }

  async updateTrade(id, { tradeName, year }) {
    try {
      const documentData = { tradeName, year };
      return await this.database.updateDocument(
        conf.databaseId,
        conf.tradeCollectionId,
        id,
        documentData
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
        id
      );
      return true;
    } catch (error) {
      console.log("Appwrite error: delete Trade:", error);
      return false;
    }
  }

  async listTrades(
    queries = [Query.orderDesc("$createdAt"), Query.limit(100)]
  ) {
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.tradeCollectionId,
        queries
      );
    } catch (error) {
      console.error("Appwrite error: fetching trades:", error);
      throw new Error(`Error:${error.message.split(".")[0]}`);
    }
  }

  static async customTradeBaseQuery({ method, data, url }) {
    const tradeService = new TradeService();
    try {
      // Ensure method is uppercase
      const reqMethod = method.toUpperCase();

      // If the request is GET and the URL is "/trades", list all trades with query params if provided
      if (reqMethod === "GET" && url === "/trades") {
        const queries =
          data && data.queries ? data.queries : [Query.orderDesc("$createdAt")];
        const result = await tradeService.listTrades(queries);
        return { data: result };
      }

      // Otherwise, handle other methods as before
      const methodMap = {
        GET: () => tradeService.getTrade(data.tradeId),
        POST: () => tradeService.createTrade(data),
        UPDATE: () => tradeService.updateTrade(data.tradeId, data.updatedData),
        DELETE: () => tradeService.deleteTrade(data.tradeId),
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

const tradeservice = new TradeService();

export default tradeservice;
