import { TablesDB, Query, ID } from 'node-appwrite';
import { withRetry } from '../helpers/retryHelper.js';

export class UserStatsRepository {
  constructor(client, databaseId) {
    this.tablesDB = new TablesDB(client);
    this.databaseId = databaseId || process.env.DATABASE_ID || 'itimocktest';
    this.userStatsCollectionId = process.env.USER_STATS_COLLECTION_ID || '668fa985001e955e54f5';
    this.userBatchStatsCollectionId = process.env.USER_BATCH_STATS_COLLECTION_ID || 'userBatchStats';
  }

  async listUserStats(queries = []) {
    return await withRetry(() =>
      this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.userStatsCollectionId,
        queries: queries,
      })
    );
  }

  async updateUserStats(docId, updatedData = {}, permissions = undefined) {
    return await withRetry(() =>
      this.tablesDB.updateRow({
        databaseId: this.databaseId,
        tableId: this.userStatsCollectionId,
        rowId: docId,
        data: updatedData,
        permissions: permissions,
      })
    );
  }

  async listUserBatchStats(queries = []) {
    return await withRetry(() =>
      this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.userBatchStatsCollectionId,
        queries: queries,
      })
    );
  }

  async updateUserBatchStats(docId, updatedData = {}, permissions = undefined) {
    return await withRetry(() =>
      this.tablesDB.updateRow({
        databaseId: this.databaseId,
        tableId: this.userBatchStatsCollectionId,
        rowId: docId,
        data: updatedData,
        permissions: permissions,
      })
    );
  }
}

export default UserStatsRepository;
