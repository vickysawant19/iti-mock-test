
import { Client, Databases, Storage, ID, Query } from "appwrite";
import conf from "../config/config";

export class QuesDbService {
  client = new Client();
  database;
  bucket;

  constructor() {
    this.client.setEndpoint(conf.appwriteUrl).setProject(conf.projectId);
    this.database = new Databases(this.client);
    this.bucket = new Storage(this.client);
  }

  async createQuestion({
    question,
    options,
    correctAnswer,
    imageId = null,
    userId,
    userName,
  }) {
    try {
      const documentData = {
        question,
        options,
        correctAnswer,
        imageId,
        userId,
        userName,
      };

      return await this.database.createDocument(
        conf.databaseId,
        conf.quesCollectionId,
        ID.unique(),
        documentData
      );
    } catch (error) {
      if (imageId) {
        this.bucket.deleteFile(conf.bucketId, imageId);
      }
      throw new Error(`${error.message}`);
      
    }
  }

  async updateQuestion(id, { question, options, correctAnswer, imageId = null }) {
    try {
      const documentData = { question, options, correctAnswer, imageId };
      return await this.database.updateDocument(
        conf.databaseId,
        conf.quesCollectionId,
        id,
        documentData
      );
    } catch (error) {
      console.log("Appwrite error: update Question:", error);
      return false;
    }
  }

  async deleteQuestion(id) {
    try {
      await this.database.deleteDocument(conf.databaseId, conf.quesCollectionId, id);
      return true;
    } catch (error) {
      console.log("Appwrite error: delete Question:", error);
      return false;
    }
  }

  async listQuestions(
    queries = [Query.orderDesc("$createdAt")]
  ) {
    console.log(conf.quesCollectionId);
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.quesCollectionId,
        queries
      );
    } catch (error) {
      console.error("Appwrite error: fetching questions:", error);
      throw new Error(`Error:${error.message.split(".")[0]}`);
    }
  }

  async getQuestion(id) {
    try {
      return await this.database.getDocument(
        conf.databaseId,
        conf.quesCollectionId,
        id
      );
    } catch (error) {
      console.log("Appwrite error: get Question:", error);
      return false;
    }
  }

  async createFile(file) {
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
      console.log("Appwrite error: delete File:", error);
      return false;
    }
  }

  async getFilePreview(fileId) {
    try {
      return await this.bucket.getFilePreview(conf.bucketId, fileId);
    } catch (error) {
      console.log("Appwrite error: get File Preview:", error);
    }
  }
}

const quesdbservice = new QuesDbService();

export default quesdbservice;


