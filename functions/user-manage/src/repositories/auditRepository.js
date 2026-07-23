import { TablesDB, ID } from 'node-appwrite';

export class AuditRepository {
  constructor(client, databaseId, auditCollectionId) {
    this.tablesDB = new TablesDB(client);
    this.databaseId = databaseId || process.env.DATABASE_ID || 'itimocktest';
    this.collectionId = auditCollectionId || process.env.AUDIT_COLLECTION_ID || 'auditLogs';
  }

  async log(payload) {
    const entry = {
      action: payload.action,
      actorId: payload.actorId || 'system',
      targetId: payload.targetId || null,
      batchId: payload.batchId || null,
      teamId: payload.teamId || null,
      status: payload.status || 'success',
      duration: payload.duration || 0,
      error: payload.error ? String(payload.error) : null,
      createdAt: new Date().toISOString(),
    };

    try {
      return await this.tablesDB.createRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: ID.unique(),
        data: entry,
      });
    } catch (err) {
      // If audit table doesn't exist yet, fallback cleanly to structured console logging
      console.log(`[AuditLog Fallback] ${JSON.stringify(entry)}`);
      return entry;
    }
  }
}

export default AuditRepository;
