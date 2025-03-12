import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class ModuleServices {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async createModules(data) {
    console.log("create", data);
    try {
      const modulesData = {
        ...data,
        syllabus: data.syllabus.map((item) => JSON.stringify(item)),
      };
      const res = await this.database.createDocument(
        conf.databaseId,
        conf.modulesesCollectionId,
        "unique()",
        modulesData
      );
      return { ...res, syllabus: res.syllabus.map((item) => JSON.parse(item)) };
    } catch (error) {
      console.error("Appwrite error: creating modules:", error);
      throw new Error(`${error.message}`);
    }
  }

  async updateModules(modulesId, updatedData) {
    const { tradeId, year, subjectId, syllabus } = updatedData;
    try {
      const data = await this.database.updateDocument(
        conf.databaseId,
        conf.modulesesCollectionId,
        modulesId,
        {
          tradeId,
          subjectId,
          year,
          syllabus: syllabus.map((item) => JSON.stringify(item)),
        }
      );
      return {
        ...data,
        syllabus: data.syllabus.map((item) => JSON.parse(item)),
      };
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
        syllabus: data.syllabus((item) => JSON.parse(item)),
      };
    } catch (error) {
      console.log("Appwrite error: get modules:", error);
      return false;
    }
  }

  async listModules(queries = [Query.orderDesc("$createdAt")]) {
    try {
      const data = await this.database.listDocuments(
        conf.databaseId,
        conf.modulesesCollectionId,
        queries
      );
      if (data.total > 0) {
        return {
          ...data.documents[0],
          syllabus: data.documents[0].syllabus.map((item) => JSON.parse(item)),
        };
      } else {
        return data.documents[0];
      }
    } catch (error) {
      console.error("Appwrite error: fetching moduleses:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }
}

const moduleServices = new ModuleServices();

export default moduleServices;
