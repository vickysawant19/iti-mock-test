import { TablesDB, Query, ID } from 'node-appwrite';
import { withRetry } from '../helpers/retryHelper.js';

export class BatchRequestRepository {
  constructor(client, databaseId, batchRequestsCollectionId) {
    this.tablesDB = new TablesDB(client);
    this.databaseId = databaseId || process.env.DATABASE_ID || 'itimocktest';
    this.collectionId = batchRequestsCollectionId || process.env.BATCH_REQUESTS_COLLECTION_ID || 'batchRequests';
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

  async update(requestId, updatedData = {}, permissions = undefined) {
    return await withRetry(() =>
      this.tablesDB.updateRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: requestId,
        data: updatedData,
        permissions: permissions,
      })
    );
  }
}

export default BatchRequestRepository;
