import { Query, functions } from "./appwriteClient";
import conf from "../config/config";
import { DatabaseService } from "./database.service";
import { questionService } from "./question.service";

export interface MockTestPaper {
  $id?: string;
  paperId: string;
  tradeId: string;
  tradeName: string;
  year?: string;
  userId: string;
  userName?: string;
  score?: number | null;
  submitted: boolean;
  questions: string[]; // JSON string arrays
  endTime?: string;
  startTime?: string;
  isOriginal?: boolean;
  quesCount?: number;
  batchId?: string;
  totalMinutes?: number;
}

class MockTestService extends DatabaseService {
  constructor() {
    super(conf.questionPapersCollectionId);
  }

  async createPaper(paperData: MockTestPaper) {
    const formattedData = {
      ...paperData,
      questions: paperData.questions.map((item: any) => 
        typeof item === "string" ? item : JSON.stringify(item)
      )
    };
    
    const response = await this.createRow<MockTestPaper>(formattedData);
    
    return {
      ...response,
      questions: response.questions.map((item: string) => JSON.parse(item))
    };
  }

  async fetchPaperById(paperId: string) {
    const response = await this.listRows<MockTestPaper>([
      Query.equal("paperId", paperId),
      Query.limit(1)
    ]);
    
    if (response.total > 0) {
      return response.rows[0];
    }
    throw new Error("Paper not found");
  }

  async createNewPaperDocument(paperId: string, userId: string, userName: string | null = null) {
    try {
      const paper = await this.fetchPaperById(paperId);
      if (!paper) {
        throw new Error("No paper available for selected ID or Test is ended");
      }

      const { tradeId, tradeName, year, questions } = paper;

      const processedQuestions = questions.map((question: string) => {
        const parsedQuestion = JSON.parse(question);
        parsedQuestion.response = null;
        return JSON.stringify(parsedQuestion);
      });

      const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      const shuffledQuestions = shuffleArray(processedQuestions);

      const generateRandomSuffix = (length: number) => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let result = "";
        for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      };

      const newPaperId = paperId.slice(0, -2) + generateRandomSuffix(2);

      const newPaperData: MockTestPaper = {
        tradeId,
        tradeName: tradeName || "",
        year: year || "",
        paperId: newPaperId,
        questions: shuffledQuestions,
        userId,
        userName: userName || "Unknown",
        score: null,
        submitted: false,
      };

      const response = await this.createRow<MockTestPaper>(newPaperData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  getRandomQuestions(questions: any[], count: number) {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async getQuestionPaper($Id: string) {
    try {
      return await this.getRow<MockTestPaper>($Id);
    } catch (error) {
      console.error("Error getting question paper:", error);
      throw error;
    }
  }

  async updateResponse(paperId: string, questionId: string, selectedAnswer: string) {
    try {
      const paper = await this.getQuestionPaper(paperId);
      if (paper.submitted) {
        throw new Error("Cannot update responses for a submitted paper");
      }

      const updatedQuestions = paper.questions.map((question: string) => {
        const parsedQuestion = JSON.parse(question);
        if (parsedQuestion.$id === questionId) {
          parsedQuestion.response = selectedAnswer;
        }
        return JSON.stringify(parsedQuestion);
      });

      // Update the whole questions array
      const response = await this.updateRow(paperId, { questions: updatedQuestions });
      return response;
    } catch (error) {
      console.error("Error updating response:", error);
      throw error;
    }
  }

  async updateAllResponses(paperId: string, data: { responses: Array<{ questionId: string; selectedAnswer: string }>; endTime: string }) {
    const paper = await this.getRow<MockTestPaper>(paperId);
    
    if (paper.submitted) {
      throw new Error("Cannot update responses for a submitted paper");
    }

    let score = 0;
    const responseMap = new Map(data.responses.map((res) => [res.questionId, res.selectedAnswer]));

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
        : JSON.stringify({ $id: parsedQuestion.$id, response: parsedQuestion.response });
    });

    const result = await this.updateRow<MockTestPaper>(paperId, {
      questions: updatedQuestions,
      score,
      submitted: true,
      endTime: data.endTime
    });

    try {
      const payload = JSON.stringify({
        action: "updateBatchStatsFromTest",
        userId: paper.userId,
        batchId: paper.batchId,
        score: score,
        quesCount: paper.quesCount
      });
      functions.createExecution("678e7277002e1d5c9b9b", payload, false);
    } catch (err) {
      console.error("Failed to trigger updateBatchStatsFromTest", err);
    }

    return result;
  }

  async updateTime(paperId: string, timeData: any) {
    try {
      return await this.updateRow<MockTestPaper>(paperId, timeData);
    } catch (error) {
      console.error("Error updating Time:", error);
      throw error;
    }
  }

  async listQuestions(queries: string[] = []) {
    let limit = 100;
    let offset = 0;
    let allDocuments: any[] = [];
    try {
      while (true) {
        const response = await this.listRows<MockTestPaper>([
          ...queries,
          Query.limit(limit),
          Query.offset(offset)
        ]);
        allDocuments = allDocuments.concat(response.rows);
        if (response.rows.length < limit) break;
        offset += limit;
      }
      return allDocuments;
    } catch (error) {
      console.error("Error getting Questions", error);
      return [];
    }
  }

  async updateQuestion(id: string, data: any) {
    try {
      return await this.updateRow<MockTestPaper>(id, data);
    } catch (error) {
      console.error("Error getting Questions", error);
      throw error;
    }
  }

  async getUserResults(paperId: string) {
    const response = await this.listRows<MockTestPaper>(
      [Query.equal("paperId", paperId)],
      [
        "score",
        "$updatedAt",
        "userName",
        "quesCount",
        "userId",
        "startTime",
        "endTime",
        "isOriginal",
        "submitted",
        "totalMinutes"
      ]
    );
    return response.rows || [];
  }

  async getQuestionPaperByUserId(userId: string, queries: string[] = []) {
    queries.push(Query.equal("userId", userId));
    queries.push(Query.orderDesc("$createdAt"));
    try {
      const response = await this.listRows<MockTestPaper>(queries);
      // Legacy wrapper returning { documents: [...] }
      return { documents: response.rows, total: response.total };
    } catch (error) {
      console.error("Error getting question paper by user ID:", error);
      throw error;
    }
  }

  async deleteQuestionPaper(paperId: string) {
    try {
      return await this.deleteRow(paperId);
    } catch (error) {
      throw error;
    }
  }
}

export const mockTestService = new MockTestService();
export default mockTestService;
