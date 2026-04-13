import { Query, functions } from "./appwriteClient";
import conf from "../config/config";
import { DatabaseService } from "./database.service";

export interface QuestionData {
  $id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userId: string;
  userName: string;
  tags?: string;
  moduleId?: string;
}

class QuestionService extends DatabaseService {
  constructor() {
    super(conf.quesCollectionId);
  }

  async bulkaddQuestions(payload: any) {
    try {
      const response = await functions.createExecution({
        functionId: "67a88715003234e3617a",
        body: JSON.stringify(payload)
      });

      const result = JSON.parse(response.responseBody);
      if (result.error) throw new Error(result.error);
      return result;
    } catch (err: any) {
      throw new Error(`${err.message}`);
    }
  }

  async createQuestion(data: QuestionData) {
    const existing = await this.listRows(
      [Query.equal("question", data.question), Query.limit(1)],
      ["$id"]
    );

    if (existing.total > 0) {
      throw new Error("The question already exists in the database.");
    }
    return await this.createRow<QuestionData>(data);
  }

  async updateQuestion(id: string, data: Partial<QuestionData>) {
    return await this.updateRow<QuestionData>(id, data);
  }

  async deleteQuestion(id: string) {
    return await this.deleteRow(id);
  }

  async getQuestion(id: string) {
    return await this.getRow<QuestionData>(id);
  }

  async listQuestions(queries: string[] = [Query.orderDesc("$createdAt")]) {
    // Legacy mapping uses 'documents', we ensure it returns list formats smoothly
    const res = await this.listRows<QuestionData>(queries);
    return { documents: res.rows, total: res.total };
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
}

export const questionService = new QuestionService();
export default questionService;
