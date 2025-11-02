import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";
import { retry } from "@reduxjs/toolkit/query";

export class ModuleServices {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async createModules(data) {
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

  async getNewModulesData(tradeId, subjectId, year) {
    try {
      let allDocuments = [];
      let offset = 0;
      const limit = 100; // Max documents per request

      while (true) {
        const response = await this.database.listDocuments(
          conf.databaseId,
          "newmodulesdata",
          [
            Query.equal("tradeId", tradeId),
            Query.equal("subjectId", subjectId),
            Query.equal("year", year),
            Query.limit(limit),
            Query.offset(offset),
          ]
        );

        allDocuments = allDocuments.concat(response.documents);

        if (response.documents.length < limit) {
          // No more documents to fetch
          break;
        }
        offset += limit;
      }
      return allDocuments.map((doc) => ({
        ...doc,
        evalutionsPoints: doc.evalutionsPoints
          ? doc.evalutionsPoints.map((item) => JSON.parse(item))
          : [],
        images: doc.images ? doc.images.map((item) => JSON.parse(item)) : [],
        topics: doc.topics ? doc.topics.map((item) => JSON.parse(item)) : [],
      }));
    } catch (error) {
      console.error("Error getting newModules", error);
      throw new Error(error);
    }
  }

  async createNewModulesData(newModulesData) {
    try {
      const response = await this.database.createDocument(
        conf.databaseId,
        "newmodulesdata",
        "unique()",
        {
          ...newModulesData,
          evalutionsPoints: newModulesData.evalutionsPoints.map((item) =>
            JSON.stringify(item)
          ),
          images: newModulesData.images.map((item) => JSON.stringify(item)),
          topics: newModulesData.topics.map((item) => JSON.stringify(item)),
        }
      );
      return {
        ...response,
        evalutionsPoints: response.evalutionsPoints.map((item) =>
          JSON.parse(item)
        ),
        images: response.images.map((item) => JSON.parse(item)),
        topics: response.topics.map((item) => JSON.parse(item)),
      };
    } catch (error) {
      console.error("Appwrite error:  add new Data:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async updateNewModulesData(newModulesData) {
    try {
      const response = await this.database.updateDocument(
        conf.databaseId,
        "newmodulesdata",
        newModulesData.$id,
        {
          ...newModulesData,
          evalutionsPoints: newModulesData.evalutionsPoints.map((item) =>
            JSON.stringify(item)
          ),
          images: newModulesData.images.map((item) => JSON.stringify(item)),
          topics: newModulesData.topics.map((item) => JSON.stringify(item)),
        }
      );

      return {
        ...response,
        evalutionsPoints: response.evalutionsPoints.map((item) =>
          JSON.parse(item)
        ),
        images: response.images.map((item) => JSON.parse(item)),
        topics: response.topics.map((item) => JSON.parse(item)),
      };
    } catch (error) {
      console.error("Appwrite error: update new Data", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async addMultipleModulesData(modulesDataArray) {
    try {
      const module = modulesDataArray[0];
      const existingModules = await this.getNewModulesData(
        module.tradeId,
        module.subjectId,
        module.year
      );
      console.log("Existing Modules:", existingModules);

      const existingModuleIds = new Set(
        existingModules.map((doc) => doc.moduleId)
      );
      const modulesToAdd = [];
      const modulesToUpdate = [];

      for (const newModuleData of modulesDataArray) {
        const moduleExists = existingModuleIds.has(newModuleData.moduleId);
        if (moduleExists) {
          modulesToUpdate.push(
            existingModules.find(
              (itm) => itm.moduleId === newModuleData.moduleId
            )
          );
        } else {
          modulesToAdd.push(newModuleData);
        }
      }
      // const updatePromises = modulesToUpdate.map((newModuleData) =>
      //   this.updateNewModulesData(newModuleData)
      // );

      const addPromises = modulesToAdd.map((newModuleData) =>
        this.createNewModulesData(newModuleData)
      );
      const finalResponses = await Promise.all([
        // ...updatePromises,
        ...addPromises,
      ]);
      console.log("Responses: add multiple modules", finalResponses);
      return finalResponses;
    } catch (error) {
      console.error("Appwrite error: add multiple new Data", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteNewModulesData(moduleId) {
    try {
      return await this.database.deleteDocument(
        conf.databaseId,
        "newmodulesdata",
        moduleId
      );
    } catch (error) {
      console.error("Appwrite error: delete new Data", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async updateModules(modulesId, updatedData) {
    const { tradeId, year, subjectId, syllabus, subjectName } = updatedData;
    try {
      const data = await this.database.updateDocument(
        conf.databaseId,
        conf.modulesesCollectionId,
        modulesId,
        {
          tradeId,
          subjectId,
          year,
          subjectName,
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
