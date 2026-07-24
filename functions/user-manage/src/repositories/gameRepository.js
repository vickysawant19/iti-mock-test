import { TablesDB, Query, ID } from 'node-appwrite';
import { withRetry } from '../helpers/retryHelper.js';

export class GameRepository {
  constructor(client, databaseId) {
    this.tablesDB = new TablesDB(client);
    this.databaseId = databaseId || process.env.DATABASE_ID || 'itimocktest';
    this.batchChallengesId = 'batch_challenges';
    this.studentGameStatsId = 'student_game_stats';
    this.studentAchievementsId = 'student_achievements';
    this.batchGameSettingsId = 'batch_game_settings';
    this.dailyMissionsId = 'daily_missions';
    this.batchChallengeProgressId = 'batch_challenge_progress';
  }

  async listCollection(tableId, queries = []) {
    return await withRetry(() =>
      this.tablesDB.listRows({
        databaseId: this.databaseId,
        tableId: tableId,
        queries: queries,
      })
    );
  }

  async updateCollection(tableId, docId, updatedData = {}, permissions = undefined) {
    return await withRetry(() =>
      this.tablesDB.updateRow({
        databaseId: this.databaseId,
        tableId: tableId,
        rowId: docId,
        data: updatedData,
        permissions: permissions,
      })
    );
  }
}

export default GameRepository;
