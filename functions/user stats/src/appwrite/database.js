import { ID, Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class QuesDbService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
    this.bucket = appwriteService.getStorage();
  }

  async createQuestion({
    question,
    options,
    correctAnswer,
    imageId = null,
    userId,
    userName,
    tradeId,
    year,
    subjectId,
  }) {
    try {
      // Check if the question already exists
      const existingQuestions = await this.database.listDocuments(
        conf.databaseId,
        conf.quesCollectionId,
        [Query.equal("question", question)]
      );

      if (existingQuestions.total > 0) {
        throw new Error("The question already exists in the database.");
      }

      const documentData = {
        question,
        options,
        correctAnswer,
        imageId,
        userId,
        userName,
        tradeId,
        year,
        subjectId,
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

  async updateQuestion(
    id,
    {
      question,
      options,
      correctAnswer,
      imageId = null,
      tradeId,
      year,
      subjectId,
    }
  ) {
    try {
      const documentData = {
        question,
        options,
        correctAnswer,
        imageId,
        tradeId,
        year,
        subjectId,
      };
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
      await this.database.deleteDocument(
        conf.databaseId,
        conf.quesCollectionId,
        id
      );
      return true;
    } catch (error) {
      console.log("Appwrite error: delete Question:", error);
      return false;
    }
  }

  async listQuestions(queries = [Query.orderDesc("$createdAt")]) {
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

  async getQuestionsByUser(userId) {
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.quesCollectionId,
        [Query.equal("userId", userId), Query.orderDesc("$createdAt")]
      );
    } catch (error) {
      console.log("Appwrite error: get user Question:", error);
      return false;
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
