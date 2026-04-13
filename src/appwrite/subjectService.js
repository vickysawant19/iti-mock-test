import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";

export class SubjectService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  async createSubject(name, $id) {
    try {
      const data = { name };

      return await this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.subjectsCollectionId,
        rowId: "unique()",
        data: data
      });
    } catch (error) {
      console.error("Appwrite error: creating subject:", error);
      throw new Error(`${error.message}`);
    }
  }

  async updateSubject(subjectId, updatedData) {
    try {
      return await this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.subjectsCollectionId,
        rowId: subjectId,
        data: updatedData
      });
    } catch (error) {
      console.error("Appwrite error: updating subject:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteSubject(subjectId) {
    try {
      return await this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: conf.subjectsCollectionId,
        rowId: subjectId
      });
    } catch (error) {
      console.error("Appwrite error: deleting subject:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getSubject(subjectId) {
    try {
      return await this.database.getRow({
        databaseId: conf.databaseId,
        tableId: conf.subjectsCollectionId,
        rowId: subjectId
      });
    } catch (error) {
      console.log("Appwrite error: get subject:", error);
      return false;
    }
  }

  async listAllSubjects(queries = []) {
    let limit = 100;
    let offset = 0;
    let allDocuments = [];
    try {
      while (true) {
        const data = await this.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.subjectsCollectionId,
          queries: [...queries, Query.limit(limit), Query.offset(offset)]
        });
        allDocuments = allDocuments.concat(data.rows);
        if (data.rows.length < limit) {
          break;
        }
        offset += limit;
      }
      return allDocuments;
    } catch (error) {
      console.error("Appwrite error: fetching subjects", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async listSubjects(queries = [Query.orderAsc("$createdAt")]) {
    try {
      return await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.subjectsCollectionId,
        queries: queries
      });
    } catch (error) {
      console.error("Appwrite error: fetching subjects:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }
}

const subjectService = new SubjectService();

export default subjectService;
