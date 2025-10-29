import { ID, Query } from "appwrite";
import conf from "../config/config";
import { appwriteService } from "./appwriteConfig";

export class QuesDbService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
    this.bucket = appwriteService.getStorage();
    this.functions = appwriteService.getFunctions();
  }

  async bulkaddQuestions(payload) {
    try {
      const response = await this.functions.createExecution(
        "67a88715003234e3617a",
        payload
      );
      const result = JSON.parse(response.responseBody);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    } catch (err) {
      throw new Error(`${err.message}`);
    }
  }

  async createQuestion({
    question,
    options,
    correctAnswer,
    userId,
    userName,
    tradeId,
    year,
    tags,
    subjectId,
    moduleId,
    images,
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
        userId,
        userName,
        tradeId,
        year,
        tags,
        subjectId,
        moduleId,
        images,
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
      tradeId,
      year,
      subjectId,
      moduleId,
      images,
      tags,
    }
  ) {
    try {
      const documentData = {
        question,
        options,
        correctAnswer,
        tradeId,
        year,
        subjectId,
        moduleId,
        images,
        tags,
      };
      return await this.database.updateDocument(
        conf.databaseId,
        conf.quesCollectionId,
        id,
        documentData
      );
    } catch (error) {
      console.log("Appwrite error: update Question:", error);
      throw new Error(error);
    }
  }

  async getSimilarQuestions({ question, tradeId = null }) {
    try {
      const STOPWORDS = new Set([
        "a",
        "an",
        "the",
        "is",
        "are",
        "was",
        "were",
        "in",
        "on",
        "at",
        "for",
        "to",
        "of",
        "and",
        "or",
        "with",
        "by",
        "from",
        "that",
        "this",
        "it",
        "as",
        "be",
        "has",
        "have",
        "had",
        "do",
        "does",
        "did",
        "but",
        "not",
        "can",
        "could",
        "would",
        "should",
        "you",
        "i",
        "we",
        "they",
        "he",
        "she",
        "which",
        "who",
        "what",
        "when",
        "where",
        "why",
        "how",
        "all",
        "any",
        "both",
        "each",
        "few",
        "more",
        "most",
        "other",
        "some",
        "such",
        "no",
        "nor",
        "not",
        "only",
        "own",
      ]);

      const normalize = (text) =>
        (text || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const tokenize = (text) =>
        normalize(text)
          .split(" ")
          .filter((w) => w && !STOPWORDS.has(w));

      const queryWords = tokenize(question);
      if (queryWords.length === 0) return [];
      console.log(queryWords);

      const query = [
        // Query.search("question", question),
        Query.contains("question", queryWords),
        Query.limit(5),
        Query.select("question"),
      ];

      tradeId && query.push(Query.equal("tradeId", tradeId));

      // ---- Appwrite search ----
      const response = await this.database.listDocuments(
        conf.databaseId,
        conf.quesCollectionId,
        query
      );
      console.log(response);
      const candidates = response.documents || [];
      if (candidates.length === 0) return [];

      // ---- Local ranking by matched words ----
      const ranked = candidates.map((doc) => {
        const docWords = new Set(tokenize(doc.question || ""));
        const commonWords = queryWords.filter((w) => docWords.has(w));
        return {
          doc,
          matchCount: commonWords.length,
          matchedWords: commonWords,
        };
      });

      const filtered = ranked
        .filter((r) => r.matchCount >= 3)
        .sort((a, b) => b.matchCount - a.matchCount);

      return filtered.slice(0, 5).map((r) => ({
        ...r.doc,
        _matchedWordCount: r.matchCount,
        _matchedWords: r.matchedWords,
      }));
    } catch (error) {
      console.error("Error getting similar questions:", error);
      throw error;
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
      throw new Error(error);
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
  async getQuestionsByTags(tags) {
    try {
      return await this.database.listDocuments(
        conf.databaseId,
        conf.quesCollectionId,
        [Query.search("tags", tags), Query.orderDesc("$createdAt")]
      );
    } catch (error) {
      console.log("Appwrite error: get questions by tags:", error);
      return false;
    }
  }
  async getAllTags(tag) {
    try {
      const questions = await this.database.listDocuments(
        conf.databaseId,
        conf.quesCollectionId,
        [
          Query.orderDesc("$createdAt"),
          tag ? Query.contains("tags", tag) : Query.notEqual("tags", ""),
          Query.select("tags"),
          Query.limit(20), // Add limit to prevent performance issues
        ]
      );

      // Extract unique tags from all questions
      const uniqueTags = new Set();
      questions.documents.forEach((question) => {
        if (question.tags && typeof question.tags === "string") {
          question.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
            .forEach((tag) => uniqueTags.add(tag));
        }
      });
      return Array.from(uniqueTags).sort();
    } catch (error) {
      console.log("Appwrite error: get all tags:", error);
      return []; // Return empty array instead of false for consistency
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
