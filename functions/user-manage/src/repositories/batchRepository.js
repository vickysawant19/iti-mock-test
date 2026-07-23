import { TablesDB, Query, ID } from 'node-appwrite';
import { withRetry } from '../helpers/retryHelper.js';

export class BatchRepository {
  constructor(client, databaseId, batchesCollectionId) {
    this.tablesDB = new TablesDB(client);
    this.databaseId = databaseId || process.env.DATABASE_ID || 'itimocktest';
    this.collectionId = batchesCollectionId || process.env.BATCH_COLLECTION_ID || '66936df000108d8e2364';
  }

  async create(batchData, permissions = [], rowId = ID.unique()) {
    return await withRetry(() =>
      this.tablesDB.createRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: rowId,
        data: batchData,
        permissions: permissions,
      })
    );
  }

  async update(batchId, updatedData, permissions = undefined) {
    return await withRetry(() =>
      this.tablesDB.updateRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: batchId,
        data: updatedData,
        permissions: permissions,
      })
    );
  }

  async get(batchId) {
    return await withRetry(() =>
      this.tablesDB.getRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: batchId,
      })
    );
  }

  async delete(batchId) {
    return await withRetry(() =>
      this.tablesDB.deleteRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: batchId,
      })
    );
  }

  async list(queries = [Query.orderDesc('$createdAt')]) {
    return await withRetry(() =>
      this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        queries: queries,
      })
    );
  }

  async incrementMemberCount(batchId, delta = 1) {
    const current = await this.get(batchId);
    const newCount = Math.max(0, (current.memberCount || 0) + delta);
    return await this.update(batchId, { memberCount: newCount });
  }
}

export default BatchRepository;
