import { Query } from "../core/appwriteClient";
import conf from "../../config/config";
import { DatabaseService } from "../core/database.service";
import questionFunctionService from "./questionFunction.service";

export interface QuestionData {
  $id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userId: string;
  userName: string;
  tags?: string;
  moduleId?: string;
  tradeId?: string;
  subjectId?: string;
  year?: string;
  difficulty?: string;
  imageId?: string;
  
  // Phase 2 Multilingual & Migration attributes
  questionEnglish?: string;
  questionMarathi?: string;
  optionsEnglish?: string[];
  optionsMarathi?: string[];
  questionImageUrl?: string;
  optionImageUrls?: string[];
  explanationEnglish?: string;
  explanationMarathi?: string;
  languageType?: "english" | "marathi" | "bilingual" | "unknown";
  normalizedHash?: string;
  exactDuplicateHash?: string;
  partialDuplicateHash?: string;
  normalizedQuestion?: string;
  searchText?: string;
  schemaVersion?: number;
  migrationStatus?: "pending" | "completed" | "failed";
  migrationDate?: string;
}

export class QuestionService extends DatabaseService {
  constructor() {
    super(conf.quesCollectionId);
  }

  async getQuestion(id: string) {
    return await this.getRow<QuestionData>(id);
  }

  async getQuestionsByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    
    let allDocuments: any[] = [];
    const chunkSize = 100;
    
    try {
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const response = await this.listRows<QuestionData>([
          Query.equal("$id", chunk),
          Query.limit(chunk.length)
        ]);
        allDocuments = allDocuments.concat(response.rows);
      }
      return allDocuments;
    } catch (error) {
      console.error("Error getting questions by IDs:", error);
      return [];
    }
  }

  async listQuestions(queries: string[] = []) {
    try {
      const res = await this.listRows<QuestionData>(queries);
      const docs = res.rows || (res as any).documents || [];
      const total = typeof res.total === "number" ? res.total : docs.length;
      return { documents: docs, rows: docs, total };
    } catch (error) {
      console.error("Error in listQuestions:", error);
      return { documents: [], rows: [], total: 0 };
    }
  }

  /**
   * Paginates through all documents using res.total to fetch 100% of questions in the collection
   */
  async fetchAllQuestions(onProgress?: (fetched: number, total: number) => void) {
    let allDocuments: QuestionData[] = [];
    const limit = 100;
    let offset = 0;

    const initialRes = await this.listRows<QuestionData>([
      Query.limit(limit),
      Query.offset(0),
      Query.orderDesc("$createdAt"),
    ]);

    const total = initialRes.total || 0;
    allDocuments = allDocuments.concat(initialRes.rows || []);
    
    if (onProgress) onProgress(allDocuments.length, total);

    const remainingPages = Math.ceil((total - limit) / limit);

    for (let i = 1; i <= remainingPages; i++) {
      offset = i * limit;
      const res = await this.listRows<QuestionData>([
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc("$createdAt"),
      ]);
      const docs = res.rows || [];
      allDocuments = allDocuments.concat(docs);
      
      if (onProgress) onProgress(allDocuments.length, total);
      if (docs.length < limit) break;
    }

    return { documents: allDocuments, total };
  }

  async getQuestionsBySubject(subjectId: string, limit = 20) {
    const res = await this.listRows<QuestionData>([
      Query.equal("subjectId", subjectId),
      Query.limit(limit),
    ]);
    return { documents: res.rows, total: res.total };
  }

  async getQuestionsByModule(moduleId: string, limit = 20) {
    const res = await this.listRows<QuestionData>([
      Query.equal("moduleId", moduleId),
      Query.limit(limit),
    ]);
    return { documents: res.rows, total: res.total };
  }

  async createQuestion(data: QuestionData) {
    return await questionFunctionService.createQuestion(data);
  }

  async updateQuestion(id: string, data: Partial<QuestionData>) {
    return await questionFunctionService.updateQuestion(id, data);
  }

  async deleteQuestion(id: string) {
    return await questionFunctionService.deleteQuestion(id);
  }

  async bulkCreateQuestions(questions: QuestionData[]) {
    return await questionFunctionService.bulkCreateQuestions(questions);
  }

  async searchQuestions(searchTerm: string, filters?: { tradeId?: string; subjectId?: string; year?: string }, limit = 25) {
    const queries = [Query.limit(limit)];
    
    if (searchTerm && searchTerm.trim()) {
      queries.push(Query.search("searchText", searchTerm.trim()));
    }
    
    if (filters?.tradeId) queries.push(Query.equal("tradeId", filters.tradeId));
    if (filters?.subjectId) queries.push(Query.equal("subjectId", filters.subjectId));
    if (filters?.year) queries.push(Query.equal("year", filters.year));

    const res = await this.listRows<QuestionData>(queries);
    return { documents: res.rows, total: res.total };
  }

  async checkDuplicate(exactHash: string, normalizedHash?: string): Promise<{ isDuplicate: boolean; duplicateId?: string }> {
    if (!exactHash) return { isDuplicate: false };
    
    const res = await this.listRows<QuestionData>([
      Query.equal("exactDuplicateHash", exactHash),
      Query.limit(1),
    ]);

    if (res.total > 0 && res.rows[0]?.$id) {
      return { isDuplicate: true, duplicateId: res.rows[0].$id };
    }

    if (normalizedHash) {
      const normRes = await this.listRows<QuestionData>([
        Query.equal("normalizedHash", normalizedHash),
        Query.limit(1),
      ]);
      if (normRes.total > 0 && normRes.rows[0]?.$id) {
        return { isDuplicate: true, duplicateId: normRes.rows[0].$id };
      }
    }

    return { isDuplicate: false };
  }

  private cachedTags: string[] | null = null;
  private tagsCacheTimestamp = 0;

  async getAllTags(searchQuery?: string): Promise<string[]> {
    try {
      const now = Date.now();
      if (!this.cachedTags || now - this.tagsCacheTimestamp > 60000) {
        const response = await this.listRows<QuestionData>(
          [Query.limit(100), Query.orderDesc("$createdAt")],
          ["tags"]
        );
        const tagSet = new Set<string>();
        (response.rows || []).forEach((row: any) => {
          if (row.tags && typeof row.tags === "string") {
            row.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
              .forEach((t: string) => tagSet.add(t));
          }
        });
        this.cachedTags = Array.from(tagSet);
        this.tagsCacheTimestamp = now;
      }

      if (!searchQuery || !searchQuery.trim()) {
        return this.cachedTags;
      }

      const q = searchQuery.toLowerCase().trim();
      return this.cachedTags.filter((t) => t.toLowerCase().includes(q));
    } catch (error) {
      console.warn("Error getting all tags:", error);
      return [];
    }
  }
}

export const questionService = new QuestionService();
export default questionService;
