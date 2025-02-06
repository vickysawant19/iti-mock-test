import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class moduleServices {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async createModules(data) {
    try {
      const modulesData = {
        ...data,
      };
      return await this.database.createDocument(
        conf.databaseId,
        conf.modulesesCollectionId,
        "unique()",
        modulesData
      );
    } catch (error) {
      console.error("Appwrite error: creating modules:", error);
      throw new Error(`${error.message}`);
    }
  }

  async updateModules(modulesId, updatedData) {
    try {
      return await this.database.updateDocument(
        conf.databaseId,
        conf.modulesesCollectionId,
        modulesId,
        updatedData
      );
    } catch (error) {
      console.error("Appwrite error: updating modules:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteModules(modulesId) {
    try {
      return await this.database.deleteDocument(
        conf.databaseId,
        conf.modulesesCollectionId,
        modulesId
      );
    } catch (error) {
      console.error("Appwrite error: deleting modules:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getModules(modulesId) {
    try {
      const data = await this.database.getDocument(
        conf.databaseId,
        conf.modulesesCollectionId,
        modulesId
      );

      return {
        ...data,
      };
    } catch (error) {
      console.log("Appwrite error: get modules:", error);
      return false;
    }
  }

  async listModules(queries = [Query.orderDesc("$createdAt")]) {
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.modulesesCollectionId,
        queries
      );
    } catch (error) {
      console.error("Appwrite error: fetching moduleses:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }
}

const moduleServices = new moduleServices();

export default moduleServices;
