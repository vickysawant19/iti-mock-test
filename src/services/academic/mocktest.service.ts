import { Query } from "../core/appwriteClient";
import conf from "../../config/config";
import { DatabaseService } from "../core/database.service";
import PermissionBuilder from "../../utils/permissionBuilder";

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
  questions: string[];
  endTime?: string;
  startTime?: string;
  isOriginal?: boolean;
  quesCount?: number;
  batchId?: string;
  teamId?: string;
  totalMinutes?: number;
}

export class MockTestService extends DatabaseService {
  constructor() {
    super(conf.questionPapersCollectionId);
  }

  async createPaper(paperData: MockTestPaper, teamId: string | null = null) {
    const formattedData = {
      ...paperData,
      questions: paperData.questions.map((item: any) => 
        typeof item === "string" ? item : JSON.stringify(item)
      )
    };
    
    const activeTeamId = teamId || paperData.teamId;
    const permissions = activeTeamId ? PermissionBuilder.test(activeTeamId) : undefined;

    const response = await this.createRow<MockTestPaper>(formattedData, permissions);
    
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

      const { tradeId, tradeName, year, questions, totalMinutes, quesCount, batchId } = paper;

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
        tradeName,
        year,
        paperId: newPaperId,
        userId,
        userName: userName || undefined,
        score: null,
        submitted: false,
        questions: shuffledQuestions,
        isOriginal: false,
        quesCount: quesCount || shuffledQuestions.length,
        batchId: batchId || undefined,
        totalMinutes: totalMinutes || 60,
      };

      return await this.createPaper(newPaperData);
    } catch (error) {
      console.error("Error creating new paper document:", error);
      throw error;
    }
  }

  async getPaperByPaperId(paperId: string) {
    try {
      const response = await this.listRows<MockTestPaper>([
        Query.equal("paperId", paperId),
        Query.limit(1)
      ]);
      return response.rows[0];
    } catch (error) {
      console.error("Error getting paper by paper ID:", error);
      throw error;
    }
  }

  async getAllResults(paperId: string) {
    try {
      const response = await this.listRows<MockTestPaper>([
        Query.equal("paperId", paperId),
        Query.equal("submitted", true)
      ]);
      return response.rows;
    } catch (error) {
      console.error("Error getting all results:", error);
      throw error;
    }
  }

  async updateAllResponses(paperId: string, questions: any[], customScore: number | null = null) {
    let score = customScore;
    let answeredCount = 0;

    if (score === null) {
      score = 0;
      questions.forEach((q) => {
        if (q.response !== null && q.response !== undefined) {
          answeredCount++;
          if (q.response === q.correctAnswer) {
            score = (score ?? 0) + 1;
          }
        }
      });
    } else {
      questions.forEach((q) => {
        if (q.response !== null && q.response !== undefined) {
          answeredCount++;
        }
      });
    }

    const serializedQuestions = questions.map((item) =>
      typeof item === "string" ? item : JSON.stringify(item)
    );

    const updatedData = {
      questions: serializedQuestions,
      score: score,
      answeredCount: answeredCount,
      submitted: true,
      endTime: new Date().toISOString()
    };

    try {
      return await this.updateRow<MockTestPaper>(paperId, updatedData);
    } catch (error) {
      console.error("Error updating all responses:", error);
      throw error;
    }
  }

  async saveProgress(paperId: string, questions: any[]) {
    let score = 0;
    let answeredCount = 0;

    const serialized = questions.map((q) => {
      const response = q.response ?? null;
      if (response !== null) answeredCount += 1;
      if (response && response === q.correctAnswer) score += 1;
      return JSON.stringify({ $id: q.$id, response });
    });

    return await this.updateRow<MockTestPaper>(paperId, {
      questions: serialized,
      score,
      answeredCount,
    });
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

  async updateQuestionPaper(id: string, data: any) {
    try {
      return await this.updateRow<MockTestPaper>(id, data);
    } catch (error) {
      console.error("Error updating Mock Test Paper", error);
      throw error;
    }
  }

  async getUserResults(paperId: string) {
    const response = await this.listRows<MockTestPaper>(
      [Query.equal("paperId", paperId)],
      [
        "$id",
        "score",
        "answeredCount",
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
