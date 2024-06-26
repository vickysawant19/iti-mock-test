import { Client, Databases, ID, Query } from "appwrite";
import conf from "../config/config";
import quesdbservice from './QuesDbService';

class MockTestService {
  client = new Client();
  database;

  constructor() {
    this.client.setEndpoint(conf.appwriteUrl).setProject(conf.projectId);
    this.database = new Databases(this.client);
  }

  async createMockTest(userId, userName) {
    try {
      // Fetch 50 random questions from the database
      const questionsResponse = await quesdbservice.listQuestions();
      const allQuestions = questionsResponse.documents;
      const selectedQuestions = this.getRandomQuestions(allQuestions, 50);

      // Create mock test data
      const mockTestData = {
        userId,
        userName,
        questions: selectedQuestions,
        userAnswers: {},
        startTime: new Date().toISOString(),
        submitted: false,
        result: null,
      };

      return await this.database.createDocument(
        conf.databaseId,
        conf.mockTestCollectionId,
        ID.unique(),
        mockTestData
      );
    } catch (error) {
      throw new Error(`Error creating mock test: ${error.message}`);
    }
  }

  async getMockTest(mockTestId) {
    try {
      return await this.database.getDocument(
        conf.databaseId,
        conf.mockTestCollectionId,
        mockTestId
      );
    } catch (error) {
      console.error("Appwrite error: get Mock Test:", error);
      throw new Error(`Error:${error.message}`);
    }
  }

  async updateMockTest(mockTestId, updatedData) {
    try {
      return await this.database.updateDocument(
        conf.databaseId,
        conf.mockTestCollectionId,
        mockTestId,
        updatedData
      );
    } catch (error) {
      console.error("Appwrite error: update Mock Test:", error);
      throw new Error(`Error:${error.message}`);
    }
  }

  async deleteMockTest(mockTestId) {
    try {
      await this.database.deleteDocument(
        conf.databaseId,
        conf.mockTestCollectionId,
        mockTestId
      );
      return true;
    } catch (error) {
      console.error("Appwrite error: delete Mock Test:", error);
      throw new Error(`Error:${error.message}`);
    }
  }

  async listMockTestsByUserId(userId) {
    try {
      const response = await this.database.listDocuments(
        conf.databaseId,
        conf.mockTestCollectionId,
        [Query.equal("userId", userId)]
      );
      return response.documents;
    } catch (error) {
      console.error("Appwrite error: list Mock Tests:", error);
      throw new Error(`Error:${error.message}`);
    }
  }

  // Helper method to get random questions
  getRandomQuestions(questions, count) {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

const mockTestService = new MockTestService();

export default mockTestService;
