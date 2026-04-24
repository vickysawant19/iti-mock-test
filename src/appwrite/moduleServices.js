import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";

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
      const limit = 100; // Max documents per request

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

        allDocuments = allDocuments.concat(response.rows);

        if (response.rows.length < limit) {
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
      const { subjectName, ...cleanData } = newModulesData;
      const response = await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.newModulesDataCollectionId,
        rowId: "unique()",

        data: {
          ...cleanData,
          evalutionsPoints: (cleanData.evalutionsPoints || []).map((item) =>
            JSON.stringify(item),
          ),
          images: (cleanData.images || []).map((item) => JSON.stringify(item)),
          topics: (cleanData.topics || []).map((item) => JSON.stringify(item)),
        },
      });
      return {
        ...response,
        evalutionsPoints: (response.evalutionsPoints || []).map((item) =>
          JSON.parse(item),
        ),
        images: (response.images || []).map((item) => JSON.parse(item)),
        topics: (response.topics || []).map((item) => JSON.parse(item)),
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
            JSON.stringify(item),
          ),
          images: (cleanData.images || []).map((item) => JSON.stringify(item)),
          topics: (cleanData.topics || []).map((item) => JSON.stringify(item)),
        },
      });

      return {
        ...response,
        evalutionsPoints: (response.evalutionsPoints || []).map((item) =>
          JSON.parse(item),
        ),
        images: (response.images || []).map((item) => JSON.parse(item)),
        topics: (response.topics || []).map((item) => JSON.parse(item)),
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
      console.log("Existing Modules:", existingModules);

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

const moduleServices = new ModuleServices();

export default moduleServices;
