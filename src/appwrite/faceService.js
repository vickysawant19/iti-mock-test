import { Client, Databases, ID } from "appwrite";
import { appwriteService } from "./appwriteConfig";
import conf from "../config/config";

class FaceService {
  constructor() {
    this.database = appwriteService.getDatabases();
  }

  async getFaces() {
    try {
      return this.database.listDocuments(
        conf.databaseId,
        conf.faceAttendanceCollectionId
      );
    } catch (error) {
      throw Error("get faces:", error);
    }
  }

  async getMatches(queries = []) {
    try {
      return this.database.listDocuments(
        conf.databaseId,
        conf.faceAttendanceCollectionId,
        queries
      );
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

  async updateFaceData(documentId, newFaceData) {
    try {
      return this.database.updateDocument(
        conf.databaseId,
        conf.faceAttendanceCollectionId,
        documentId, newFaceData
      );
    } catch (error) {
      throw Error("Delete Error", error);
    }
  }

  async deleteFaceData(documentId) {
    try {
      return this.database.deleteDocument(
        conf.databaseId,
        conf.faceAttendanceCollectionId,
        documentId
      );
    } catch (error) {
      throw Error("Delete Error", error);
    }
  }
}

export const faceService = new FaceService();
