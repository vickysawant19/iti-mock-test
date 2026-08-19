import { Query } from "./appwriteClient";
import conf from "../config/config";
import { DatabaseService } from "./database.service";
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

class QuestionService extends DatabaseService {
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

    offset += limit;
    while (offset < total) {
      const pageRes = await this.listRows<QuestionData>([
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc("$createdAt"),
      ]);

      const docs = pageRes.rows || [];
      allDocuments = allDocuments.concat(docs);

      if (onProgress) onProgress(allDocuments.length, total);
      offset += limit;
      await new Promise((r) => setTimeout(r, 50));
    }

    return { documents: allDocuments, total };
  }

  async getQuestionsByUser(userId: string) {
    const res = await this.listRows<QuestionData>([
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt")
    ]);
    return { documents: res.rows, total: res.total };
  }

  async getQuestionsByTags(tags: string) {
    const res = await this.listRows<QuestionData>([
      Query.search("tags", tags),
      Query.orderDesc("$createdAt")
    ]);
    return { documents: res.rows, total: res.total };
  }

  /**
   * Phase 11 Multilingual & Fuzzy Search using searchText and normalized fields
   */
  async searchMultilingual({
    searchTerm = "",
    tradeId,
    subjectId,
    moduleId,
    languageType,
    limit = 25,
  }: {
    searchTerm?: string;
    tradeId?: string;
    subjectId?: string;
    moduleId?: string;
    languageType?: string;
    limit?: number;
  }) {
    const queries: string[] = [Query.orderDesc("$createdAt"), Query.limit(limit)];

    if (tradeId) queries.push(Query.equal("tradeId", tradeId));
    if (subjectId) queries.push(Query.equal("subjectId", subjectId));
    if (moduleId) queries.push(Query.equal("moduleId", moduleId));
    if (languageType) queries.push(Query.equal("languageType", languageType));

    if (searchTerm && searchTerm.trim()) {
      const cleanTerm = searchTerm.trim().toLowerCase();
      try {
        queries.push(Query.search("searchText", cleanTerm));
      } catch (_) {
        queries.push(Query.search("question", cleanTerm));
      }
    }

    const res = await this.listRows<QuestionData>(queries);
    return { documents: res.rows, total: res.total };
  }

  async getSimilarQuestions({ question, tradeId = null }: { question: string; tradeId?: string | null }) {
    try {
      const STOPWORDS = new Set(["a", "an", "the", "is", "are", "was", "were", "in", "on", "at", "for", "to", "of", "and", "or", "with", "by", "from", "that", "this", "it", "as", "be", "has", "have", "had", "do", "does", "did", "but", "not", "can", "could", "would", "should", "you", "i", "we", "they", "he", "she", "which", "who", "what", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "only", "own"]);
      const normalize = (text: string) => (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      const tokenize = (text: string) => normalize(text).split(" ").filter((w) => w && !STOPWORDS.has(w));

      const queryWords = tokenize(question);
      if (queryWords.length === 0) return [];

      const query = [
        Query.contains("question", queryWords),
        Query.limit(5),
        Query.select(["question", "options", "correctAnswer", "userId", "userName", "tags", "moduleId"])
      ];
      if (tradeId) query.push(Query.equal("tradeId", tradeId));

      const response = await this.listRows<QuestionData>(query);
      const candidates = response.rows || [];
      if (candidates.length === 0) return [];

      const ranked = candidates.map((doc) => {
        const docWords = new Set(tokenize(doc.question || ""));
        const commonWords = queryWords.filter((w) => docWords.has(w));
        return { doc, matchCount: commonWords.length, matchedWords: commonWords };
      });

      const filtered = ranked.filter((r) => r.matchCount >= 3).sort((a, b) => b.matchCount - a.matchCount);
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

  async getAllTags(tag?: string) {
    try {
      const queryList = [
        Query.orderDesc("$createdAt"),
        tag ? Query.contains("tags", tag) : Query.notEqual("tags", ""),
        Query.limit(20)
      ];

      const response = await this.listRows<any>(queryList, ["tags"]);
      const uniqueTags = new Set<string>();

      response.rows.forEach((row) => {
        if (row.tags && typeof row.tags === "string") {
          row.tags.split(",").map((t: string) => t.trim()).filter(Boolean).forEach((t: string) => uniqueTags.add(t));
        }
      });
      return Array.from(uniqueTags).sort();
    } catch (error) {
      console.error("Error getting all tags", error);
      return [];
    }
  }

  async deleteQuestion(id: string) {
    return await questionFunctionService.deleteQuestion(id);
  }
}

export const questionService = new QuestionService();
export default questionService;
