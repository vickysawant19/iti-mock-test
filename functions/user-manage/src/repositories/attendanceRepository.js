import { TablesDB, Query, ID } from 'node-appwrite';
import { withRetry } from '../helpers/retryHelper.js';

export class AttendanceRepository {
  constructor(client, databaseId) {
    this.tablesDB = new TablesDB(client);
    this.databaseId = databaseId || process.env.DATABASE_ID || 'itimocktest';
    this.attendanceCollectionId = process.env.NEW_ATTENDANCE_COLLECTION_ID || 'newAttendance';
    this.dailyDiaryCollectionId = process.env.DAILY_DIARY_COLLECTION_ID || 'dailyDiary';
  }

  async listAttendance(queries = []) {
    return await withRetry(() =>
      this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.attendanceCollectionId,
        queries: queries,
      })
    );
  }

  async updateAttendance(docId, updatedData = {}, permissions = undefined) {
    return await withRetry(() =>
      this.tablesDB.updateRow({
        databaseId: this.databaseId,
        tableId: this.attendanceCollectionId,
        rowId: docId,
        data: updatedData,
        permissions: permissions,
      })
    );
  }

  async listDailyDiary(queries = []) {
    return await withRetry(() =>
      this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: this.dailyDiaryCollectionId,
        queries: queries,
      })
    );
  }

  async updateDailyDiary(docId, updatedData = {}, permissions = undefined) {
    return await withRetry(() =>
      this.tablesDB.updateRow({
        databaseId: this.databaseId,
        tableId: this.dailyDiaryCollectionId,
        rowId: docId,
        data: updatedData,
        permissions: permissions,
      })
    );
  }
}

export default AttendanceRepository;
