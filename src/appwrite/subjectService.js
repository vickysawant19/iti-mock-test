import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class SubjectService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async createSubject(name, $id) {
    try {
      const data = { name };

      return await this.database.createDocument(
        conf.databaseId,
        conf.subjectsCollectionId,
        "unique()",
        data
      );
    } catch (error) {
      console.error("Appwrite error: creating subject:", error);
      throw new Error(`${error.message}`);
    }
  }

  async updateSubject(subjectId, updatedData) {
    try {
      return await this.database.updateDocument(
        conf.databaseId,
        conf.subjectsCollectionId,
        subjectId,
        updatedData
      );
    } catch (error) {
      console.error("Appwrite error: updating subject:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteSubject(subjectId) {
    try {
      return await this.database.deleteDocument(
        conf.databaseId,
        conf.subjectsCollectionId,
        subjectId
      );
    } catch (error) {
      console.error("Appwrite error: deleting subject:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getSubject(subjectId) {
    try {
      return await this.database.getDocument(
        conf.databaseId,
        conf.subjectsCollectionId,
        subjectId
      );
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
        const data = await this.database.listDocuments(
          conf.databaseId,
          conf.subjectsCollectionId,
          [...queries, Query.limit(limit), Query.offset(offset)]
        );
        allDocuments = allDocuments.concat(data.documents);
        if (data.documents.length < limit) {
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
      return await this.database.listDocuments(
        conf.databaseId,
        conf.subjectsCollectionId,
        queries
      );
    } catch (error) {
      console.error("Appwrite error: fetching subjects:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }
}

const subjectService = new SubjectService();

export default subjectService;
