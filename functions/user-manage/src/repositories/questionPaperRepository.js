import { TablesDB, Query, ID } from 'node-appwrite';
import { withRetry } from '../helpers/retryHelper.js';

export class QuestionPaperRepository {
  constructor(client, databaseId, questionPaperCollectionId) {
    this.tablesDB = new TablesDB(client);
    this.databaseId = databaseId || process.env.DATABASE_ID || 'itimocktest';
    this.collectionId = questionPaperCollectionId || process.env.QUESTION_PAPER_COLLECTION_ID || '667e8b800015a7ece741';
  }

  async list(queries = []) {
    return await withRetry(() =>
      this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        queries: queries,
      })
    );
  }

  async update(paperId, updatedData = {}, permissions = undefined) {
    return await withRetry(() =>
      this.tablesDB.updateRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: paperId,
        data: updatedData,
        permissions: permissions,
      })
    );
  }
}

export default QuestionPaperRepository;
