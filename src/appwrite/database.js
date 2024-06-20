import conf from "../config/conf";
import { Client, Databases, Storage, ID, Query } from "appwrite";

export class dbService {
  client = new Client();
  database;
  bucket;

  constructor() {
    this.client.setEndpoint(conf.appwriteUrl).setProject(conf.projectId);
    this.database = new Databases(this.client);
    this.bucket = new Storage(this.client);
  }

  async createDocument({
    title,
    slug,
    content,
    featuredImage,
    status,
    userId,
    userName,
  }) {
    try {
      return await this.database.createDocument(
        conf.databaseId,
        conf.collectionId,
        slug,
        {
          title,
          content,
          featuredImage,
          status,
          userId,
          userName,
        }
      );
    } catch (error) {
      this.bucket.deleteFile(conf.bucketId, featuredImage);
      throw new Error(`${error.message.split(".")[0]}`);
    }
  }

  async updateDocument(slug, { title, content, featuredImage, status }) {
    try {
      return await this.database.updateDocument(
        conf.databaseId,
        conf.collectionId,
        slug,
        { title, content, featuredImage, status }
      );
    } catch (error) {
      console.log("appwrite error: update Document :", error);
      return false;
    }
  }

  async deleteDocument(slug) {
    try {
      await this.database.deleteDocument(
        conf.databaseId,
        conf.collectionId,
        slug
      );
      return true;
    } catch (error) {
      console.log("appwrite error: update Document :", error);
      return false;
    }
  }

  async getPosts(
    queries = [Query.equal("status", "active"), Query.orderDesc("$createdAt")]
  ) {
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.collectionId,
        queries
      );
    } catch (error) {
      console.error("Appwrite error :: fetching posts:", error);
      throw new Error(`Error:${error.message.split(".")[0]}`);
    }
  }

  async getPost(slug) {
    try {
      return await this.database.getDocument(
        conf.databaseId,
        conf.collectionId,
        slug
      );
    } catch (error) {
      console.log("appwrite error: update Document :", error);
      return false;
    }
  }

  async uploadFile(file) {
    try {
      return await this.bucket.createFile(conf.bucketId, ID.unique(), file);
    } catch (error) {
      console.log(error);
      throw new Error(`Error:${error.message}`);
    }
  }

  async deleteFile(fileId) {
    try {
      await this.bucket.deleteFile(conf.bucketId, fileId);
      return true;
    } catch (error) {
      console.log("appwrite error :: deleteFile ", error);
      return false;
    }
  }

  async getFilePreview(fileId) {
    try {
      return await this.bucket.getFilePreview(conf.bucketId, fileId);
    } catch (error) {
      console.log("appwrite error :: filepreview", error);
    }
  }
}

const dbservice = new dbService();

export default dbservice;