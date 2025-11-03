import { Query } from "appwrite";
import quesdbservice from "./database";
import { appwriteService } from "./appwriteConfig";
import conf from "../config/config";
import { format } from "date-fns";

class QuestionPaperService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getDatabases();
    this.bucket = appwriteService.getStorage();
    this.databaseId = conf.databaseId;
    this.questionsCollectionId = conf.quesCollectionId;
    this.questionPapersCollectionId = conf.questionPapersCollectionId;
  }

  async createPaper(paperData) {
   
    try {
      // Create a new document in the new collection
      const response = await this.database.createDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        "unique()",
        {
          ...paperData,
          questions: paperData.questions.map((item) => JSON.stringify(item)),
        }
      );

      return {
        ...response,
        questions: response.questions.map((item) => JSON.parse(item)),
      };
    } catch (error) {
      console.log("paper error:", error);
      throw new Error("Paper create error", error);
    }
  }

  async fetchPaperById(paperId) {
    try {
      const response = await this.database.listDocuments(
        this.databaseId,
        this.questionPapersCollectionId,
        [Query.equal("paperId", paperId), Query.limit(1)]
      );

      if (response.documents.length > 0) {
        return response.documents[0];
      } else {
        throw new Error("Paper not found");
      }
    } catch (error) {
      throw error;
    }
  }

  async createNewPaperDocument(paperId, userId, userName = null) {
    try {
      const paper = await this.fetchPaperById(paperId);
      if (!paper) {
        throw new Error("No paper available for selected ID or Test is ended");
      }

      const { tradeId, tradeName, year, questions } = paper;

      const processedQuestions = questions.map((question) => {
        const parsedQuestion = JSON.parse(question);
        parsedQuestion.response = null;
        return JSON.stringify(parsedQuestion);
      });

      const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      const shuffledQuestions = shuffleArray(processedQuestions);

      const generateRandomSuffix = (length) => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let result = "";
        for (let i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return result;
      };

      // Generate a new paperId with a different suffix
      const newPaperId = paperId.slice(0, -2) + generateRandomSuffix(2);

      // Prepare the new paper data
      const newPaperData = {
        tradeId,
        tradeName,
        year,
        paperId: newPaperId,
        questions: shuffledQuestions,
        userId,
        userName,
        score: null,
        submitted: false,
      };

      // Create a new document in the new collection
      const response = await this.database.createDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        "unique()",
        newPaperData
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  getRandomQuestions(questions, count) {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async getQuestionPaper($Id) {
    try {
      const response = await this.database.getDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        $Id
      );
      return response;
    } catch (error) {
      console.error("Error getting question paper:", error);
    }
  }

  async updateResponse(paperId, questionId, selectedAnswer) {
    try {
      const paper = await this.getQuestionPaper(paperId);
      if (paper.submitted) {
        throw new Error("Cannot update responses for a submitted paper");
      }

      const updatedQuestions = paper.questions.map((question) => {
        const parsedQuestion = JSON.parse(question);
        if (parsedQuestion.$id === questionId) {
          parsedQuestion.response = selectedAnswer;
        }
        return JSON.stringify(parsedQuestion);
      });

      const response = await quesdbservice.updateDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        paperId,
        { questions: updatedQuestions }
      );

      return response;
    } catch (error) {
      console.error("Error updating response:", error);
      throw error;
    }
  }

  async updateAllResponses(paperId, data) {
    try {
      const paper = await this.getQuestionPaper(paperId);
      if (paper.submitted) {
        throw new Error("Cannot update responses for a submitted paper");
      }

      let score = 0;
      const responseMap = new Map(
        data.responses.map((res) => [res.questionId, res.selectedAnswer])
      );

      const updatedQuestions = paper.questions.map((q) => {
        const parsedQuestion = JSON.parse(q);
        const response = responseMap.get(parsedQuestion.$id);

        if (response) {
          parsedQuestion.response = response;
          const isCorrect = response === parsedQuestion.correctAnswer;
          parsedQuestion.result = isCorrect;
          if (isCorrect) score += 1;
        }

        return paper.isOriginal
          ? JSON.stringify(parsedQuestion)
          : JSON.stringify({
              $id: parsedQuestion.$id,
              response: parsedQuestion.response,
            });
      });

      return await this.database.updateDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        paperId,
        {
          questions: updatedQuestions,
          score,
          submitted: true,
          endTime: data.endTime,
        }
      );
    } catch (error) {
      console.error("Error updating all responses:", error);
      throw error;
    }
  }

  async updateTime(paperId, time) {
    try {
      const response = await this.database.updateDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        paperId,
        time
      );
      return response;
    } catch (error) {
      console.error("Error updating Time:", error);
      throw error;
    }
  }

  async listQuestions(queries = []) {
    let limit = 100;
    let offset = 0;
    let allDocuments = [];
    try {
      while (true) {
      const response = await this.database.listDocuments(
        this.databaseId,
        this.questionPapersCollectionId,
        [...queries, Query.limit(limit), Query.offset(offset)]
      );
      allDocuments = allDocuments.concat(response.documents);
      if (response.documents.length < limit) {
        break;
      }
      offset += limit;
    }
      return allDocuments;
    } catch (error) {
      console.error("Error getting Questions", error);
    }
  }

  async updateQuestion(id, data) {
    console.log(id);
    try {
      const response = await this.database.updateDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        id,
        data
      );

      return response;
    } catch (error) {
      console.error("Error getting Questions", error);
    }
  }

  async getUserResults(paperId) {
    try {
      const response = await this.database.listDocuments(
        this.databaseId,
        this.questionPapersCollectionId,
        [
          Query.equal("paperId", paperId),
          Query.select([
            "score",
            "$updatedAt",
            "userName",
            "quesCount",
            "userId",
            "startTime",
            "endTime",
            "isOriginal",
            "submitted",
            "totalMinutes",
          ]),
        ]
      );
      return response?.documents || [];
    } catch (error) {
      console.error("Error getting user results:", error);
    }
  }

  async getQuestionPaperByUserId(userId, queries = []) {
    queries.push(Query.equal("userId", userId));
    queries.push(Query.orderDesc("$createdAt"));
    try {
      const response = await this.database.listDocuments(
        this.databaseId,
        this.questionPapersCollectionId,
        queries
      );
      return response;
    } catch (error) {
      console.error("Error getting question paper by user ID:", error);
      throw error;
    }
  }

  async deleteQuestionPaper(paperId) {
    try {
      const res = await this.database.deleteDocument(
        this.databaseId,
        this.questionPapersCollectionId,
        paperId
      );
      return res;
    } catch (error) {
      throw error;
    }
  }
}

const questionpaperservice = new QuestionPaperService();

export default questionpaperservice;
