import { Query } from "appwrite";
import conf from "../../config/config";
import { appwriteClientService as appwriteService } from "../core/appwriteClient";

export class ModuleServices {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  async getModule(moduleId) {
    try {
      return await this.database.getRow({
        databaseId: conf.databaseId,
        tableId: conf.newModulesDataCollectionId,
        rowId: moduleId,
      });
    } catch (error) {
      console.error("Error getting module", error);
      throw new Error(error);
    }
  }

  async getModuleByLogicalId(tradeId, subjectId, year, moduleIdString) {
    try {
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.newModulesDataCollectionId,
        queries: [
          Query.equal("tradeId", tradeId),
          Query.equal("subjectId", subjectId),
          Query.equal("year", year),
          Query.equal("moduleId", moduleIdString),
          Query.limit(1),
        ],
      });
      return (response.rows || response.documents)?.[0] || null;
    } catch (error) {
      console.error("Error getting module by logical ID", error);
      return null;
    }
  }

  async getNewModulesData(tradeId, subjectId, year) {
    if (!tradeId || !subjectId || !year) {
      console.warn(
        "[ModuleServices] Skipping fetch: missing required parameters",
        { tradeId, subjectId, year },
      );
      return [];
    }
    try {
      let allDocuments = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const response = await this.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.newModulesDataCollectionId,
          queries: [
            Query.equal("tradeId", tradeId),
            Query.equal("subjectId", subjectId),
            Query.equal("year", year),
            Query.limit(limit),
            Query.offset(offset),
          ],
        });

        const rows = response.rows || response.documents || [];
        allDocuments = allDocuments.concat(rows);

        if (rows.length < limit) {
          break;
        }
        offset += limit;
      }
      return allDocuments.map((doc) => ({
        ...doc,
        evalutionsPoints: doc.evalutionsPoints
          ? doc.evalutionsPoints.map((item) => typeof item === "string" ? JSON.parse(item) : item)
          : [],
        images: doc.images ? doc.images.map((item) => typeof item === "string" ? JSON.parse(item) : item) : [],
        topics: doc.topics ? doc.topics.map((item) => typeof item === "string" ? JSON.parse(item) : item) : [],
      }));
    } catch (error) {
      console.error("Error getting newModules", error);
      throw new Error(error);
    }
  }

  async createNewModulesData(newModulesData) {
    try {
      const { subjectName, ...cleanData } = newModulesData;
      const response = await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.newModulesDataCollectionId,
        rowId: "unique()",
        data: {
          ...cleanData,
          evalutionsPoints: (cleanData.evalutionsPoints || []).map((item) =>
            typeof item === "string" ? item : JSON.stringify(item),
          ),
          images: (cleanData.images || []).map((item) => typeof item === "string" ? item : JSON.stringify(item)),
          topics: (cleanData.topics || []).map((item) => typeof item === "string" ? item : JSON.stringify(item)),
        },
      });
      return {
        ...response,
        evalutionsPoints: (response.evalutionsPoints || []).map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        ),
        images: (response.images || []).map((item) => typeof item === "string" ? JSON.parse(item) : item),
        topics: (response.topics || []).map((item) => typeof item === "string" ? JSON.parse(item) : item),
      };
    } catch (error) {
      console.error("Appwrite error:  add new Data:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async updateNewModulesData(newModulesData) {
    try {
      const {
        subjectName,
        $id,
        $collectionId,
        $databaseId,
        $createdAt,
        $updatedAt,
        $permissions,
        ...cleanData
      } = newModulesData;
      const response = await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.newModulesDataCollectionId,
        rowId: newModulesData.$id,
        data: {
          ...cleanData,
          evalutionsPoints: (cleanData.evalutionsPoints || []).map((item) =>
            typeof item === "string" ? item : JSON.stringify(item),
          ),
          images: (cleanData.images || []).map((item) => typeof item === "string" ? item : JSON.stringify(item)),
          topics: (cleanData.topics || []).map((item) => typeof item === "string" ? item : JSON.stringify(item)),
        },
      });

      return {
        ...response,
        evalutionsPoints: (response.evalutionsPoints || []).map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        ),
        images: (response.images || []).map((item) => typeof item === "string" ? JSON.parse(item) : item),
        topics: (response.topics || []).map((item) => typeof item === "string" ? JSON.parse(item) : item),
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
        module.year,
      );

      const existingModuleIds = new Set(
        existingModules.map((doc) => doc.moduleId),
      );
      const modulesToAdd = [];
      const modulesToUpdate = [];

      for (const newModuleData of modulesDataArray) {
        const moduleExists = existingModuleIds.has(newModuleData.moduleId);
        if (moduleExists) {
          modulesToUpdate.push(
            existingModules.find(
              (itm) => itm.moduleId === newModuleData.moduleId,
            ),
          );
        } else {
          modulesToAdd.push(newModuleData);
        }
      }

      const addPromises = modulesToAdd.map((newModuleData) =>
        this.createNewModulesData(newModuleData),
      );
      const finalResponses = await Promise.all([...addPromises]);

      return finalResponses;
    } catch (error) {
      console.error("Appwrite error: add multiple new Data", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteNewModulesData(moduleId) {
    try {
      return await this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: conf.newModulesDataCollectionId,
        rowId: moduleId,
      });
    } catch (error) {
      console.error("Appwrite error: delete new Data", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }
}

export const moduleServices = new ModuleServices();
export default moduleServices;
