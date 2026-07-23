import { TablesDB, Query, ID } from 'node-appwrite';
import { withRetry } from '../helpers/retryHelper.js';

export class BatchMemberRepository {
  constructor(client, databaseId, batchStudentsCollectionId) {
    this.tablesDB = new TablesDB(client);
    this.databaseId = databaseId || process.env.DATABASE_ID || 'itimocktest';
    this.collectionId = batchStudentsCollectionId || process.env.BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';
  }

  async addMember(batchId, userId, details = {}) {
    const {
      role = 'student',
      status = 'active',
      joinedBy = null,
      teamId = null,
      enrollmentDate = new Date().toISOString(),
      remarks = null,
      rollNumber = null,
      registerId = null,
    } = details;

    // Check for existing membership record
    const existing = await this.listMembers([
      Query.equal('batchId', batchId),
      Query.equal('studentId', userId),
    ]);

    if (existing.total > 0) {
      const doc = existing.rows[0];
      return await this.updateMember(doc.$id, {
        status: 'active',
        role,
        teamId,
      });
    }

    return await withRetry(() =>
      this.tablesDB.createRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: ID.unique(),
        data: {
          batchId,
          studentId: userId,
          joinedAt: new Date().toISOString(),
          enrollmentDate,
          status,
          remarks,
          rollNumber,
          registerId,
        },
      })
    );
  }

  async updateMember(memberDocId, fields = {}) {
    return await withRetry(() =>
      this.tablesDB.updateRow({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        rowId: memberDocId,
        data: fields,
      })
    );
  }

  async removeMember(batchId, userId) {
    const existing = await this.listMembers([
      Query.equal('batchId', batchId),
      Query.equal('studentId', userId),
    ]);

    if (existing.total > 0) {
      for (const row of existing.rows) {
        await withRetry(() =>
          this.tablesDB.deleteRow({
            databaseId: this.databaseId,
            tableId: this.collectionId,
            rowId: row.$id,
          })
        );
      }
    }
    return true;
  }

  async listMembers(queries = []) {
    return await withRetry(() =>
      this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.collectionId,
        queries: queries,
      })
    );
  }

  async countActiveMembers(batchId) {
    const response = await this.listMembers([
      Query.equal('batchId', batchId),
      Query.limit(1000),
    ]);
    return response.total;
  }
}

export default BatchMemberRepository;
