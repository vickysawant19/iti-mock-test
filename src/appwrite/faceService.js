import { Client, Databases, ID } from "appwrite";
import { appwriteService } from "./appwriteConfig";
import conf from "../config/config";

class FaceService {
  constructor() {
    this.database = appwriteService.getDatabases()
  }

  async getFaces() {
    try {
      return this.database.listDocuments(conf.databaseId, conf.faceAttendanceCollectionId);
    } catch (error) {
      throw Error("get faces:", error);
    }
  }

  async getMatches(queries = []) {
    try {
      return this.database.listDocuments(conf.databaseId, conf.faceAttendanceCollectionId, queries);
    } catch (error) {
      throw Error("get match", error);
    }
  }

  async storeFaces(data) {
    try {
      return this.database.createDocument(
        conf.databaseId,
        conf.faceAttendanceCollectionId,
        ID.unique(),
        data
      );
    } catch (error) {
      throw Error("get match", error);
    }
  }
}

export const faceService = new FaceService();
