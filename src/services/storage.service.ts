import { storage } from "./appwriteClient";
import conf from "../config/config";
import { ID } from "appwrite";

export class StorageService {
  protected bucketId: string;

  constructor(bucketId: string = conf.bucketId) {
    this.bucketId = bucketId;
  }

  async createFile(file: File) {
    try {
      return await storage.createFile({ bucketId: this.bucketId, fileId: ID.unique(), file });
    } catch (error: any) {
      console.error("Storage::createFile Error", error);
      throw new Error(`Failed to upload file: ${error?.message}`);
    }
  }

  async deleteFile(fileId: string) {
    try {
      await storage.deleteFile({ bucketId: this.bucketId, fileId });
      return true;
    } catch (error: any) {
      console.error("Storage::deleteFile Error", error);
      throw new Error(`Failed to delete file: ${error?.message}`);
    }
  }

  getFilePreview(fileId: string) {
    try {
      return storage.getFilePreview({ bucketId: this.bucketId, fileId });
    } catch (error: any) {
      console.error("Storage::getFilePreview Error", error);
      return null;
    }
  }

  getFileView(fileId: string) {
    try {
      return storage.getFileView({ bucketId: this.bucketId, fileId });
    } catch (error: any) {
      console.error("Storage::getFileView Error", error);
      return null;
    }
  }

  getFileDownload(fileId: string) {
    try {
      return storage.getFileDownload({ bucketId: this.bucketId, fileId });
    } catch (error: any) {
      console.error("Storage::getFileDownload Error", error);
      return null;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
