import { Client, Databases, ID } from "appwrite";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";
import conf from "../config/config";

class FaceService {
  constructor() {
    this.database = appwriteService.getTablesDB();
  }

  async getFaces() {
    try {
      return this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.faceAttendanceCollectionId
      });
    } catch (error) {
      throw Error("get faces:", error);
    }
  }

  async getMatches(queries = []) {
    try {
      return this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.faceAttendanceCollectionId,
        queries: queries
      });
    } catch (error) {
      throw Error("get match", error);
    }
  }

  async storeFaces(data) {
    try {
      return this.database.createRow({
        databaseId: conf.databaseId,
        tableId: conf.faceAttendanceCollectionId,
        rowId: ID.unique(),
        data: data
      });
    } catch (error) {
      throw Error("get match", error);
    }
  }

  async updateFaceData(documentId, newFaceData) {
    try {
      return this.database.updateRow({
        databaseId: conf.databaseId,
        tableId: conf.faceAttendanceCollectionId,
        rowId: documentId,
        data: newFaceData
      });
    } catch (error) {
      throw Error("Delete Error", error);
    }
  }

  async deleteFaceData(documentId) {
    try {
      return this.database.deleteRow({
        databaseId: conf.databaseId,
        tableId: conf.faceAttendanceCollectionId,
        rowId: documentId
      });
    } catch (error) {
      throw Error("Delete Error", error);
    }
  }
}

export const faceService = new FaceService();
