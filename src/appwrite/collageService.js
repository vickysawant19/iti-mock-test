import { ID, Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class CollegeService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
  }

  async createCollege(collegeName) {
    try {
      const data = { name: collegeName };
      return await this.database.createDocument(
        conf.databaseId,
        conf.collegesCollectionId,
        ID.unique(),
        data
      );
    } catch (error) {
      console.error("Appwrite error: creating college:", error);
      throw new Error(error.message);
    }
  }

  async updateCollege(collegeId, updatedData) {
    try {
      return await this.database.updateDocument(
        conf.databaseId,
        conf.collegesCollectionId,
        collegeId,
        updatedData
      );
    } catch (error) {
      console.error("Appwrite error: updating college:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async deleteCollege(collegeId) {
    try {
      return await this.database.deleteDocument(
        conf.databaseId,
        conf.collegesCollectionId,
        collegeId
      );
    } catch (error) {
      console.error("Appwrite error: deleting college:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getCollege(collegeId) {
    try {
      const res =  await this.database.getDocument(
        conf.databaseId,
        conf.collegesCollectionId,
        collegeId
      );
  
      return res
    } catch (error) {
      console.error("Appwrite error: get college:", error);
      return false;
    }
  }

  async listColleges(queries = [Query.orderDesc("$createdAt")]) {
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.collegesCollectionId,
        queries
      );
    } catch (error) {
      console.error("Appwrite error: fetching colleges:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  static async customCollegeBaseQuery({ method, data }) {
    const collegeService = new CollegeService();
    try {
      // Ensure method is uppercase
      const reqMethod = method.toUpperCase();

      const methodMap = {
        GET: () => collegeService.getCollege(data.collegeId),
        POST: () => collegeService.createCollege(data.collegeName),
        UPDATE: () =>
          collegeService.updateCollege(data.collegeId, data.updatedData),
        DELETE: () => collegeService.deleteCollege(data.collegeId),
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

const collegeService = new CollegeService();

export default collegeService;
