import { ID, Query } from 'node-appwrite';
import { RollbackStack } from '../helpers/rollbackHelper.js';

export class BatchDomain {
  constructor(batchRepo, teamRepo, batchMemberRepo, permissionPolicy, log) {
    this.batchRepo = batchRepo;
    this.teamRepo = teamRepo;
    this.batchMemberRepo = batchMemberRepo;
    this.permissionPolicy = permissionPolicy;
    this.log = log || console.log;
  }

  generateTeamName(batchData) {
    const collegeCode = (batchData.collegeId || 'COLLEGE').substring(0, 8).toUpperCase();
    const tradeCode = (batchData.tradeId || 'TRADE').substring(0, 8).toUpperCase();
    const year = new Date().getFullYear();
    const batchName = (batchData.BatchName || 'BATCH').replace(/\s+/g, '-').toUpperCase();
    const shortHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${collegeCode}-${tradeCode}-${year}-${batchName}-${shortHash}`;
  }

  async createBatch(data, actorId) {
    const rollback = new RollbackStack(this.log);
    const batchId = data.$id || ID.unique();
    const teamId = batchId;
    const formattedTeamName = this.generateTeamName(data);

    try {
      this.log(`[BatchDomain] Creating Appwrite Team: ${formattedTeamName} (${teamId})...`);
      await this.teamRepo.create(ID.custom(teamId), formattedTeamName, ['owner', 'teacher', 'assistant', 'monitor', 'student']);
      rollback.add(() => this.teamRepo.delete(teamId), `Delete Team ${teamId}`);

      // Add teacher to team
      if (data.teacherId) {
        this.log(`[BatchDomain] Adding Teacher (${data.teacherId}) to Team ${teamId}...`);
        await this.teamRepo.addMember(teamId, data.teacherId, ['owner', 'teacher']);
      }

      // Prepare batch document payload
      const batchPayload = {
        ...data,
        teamId,
        status: 'active',
        memberCount: 1,
        version: 1,
      };

      const permissions = this.permissionPolicy.batch(batchId, data.teacherId);

      this.log(`[BatchDomain] Persisting batch row to database...`);
      const createdBatch = await this.batchRepo.create(batchPayload, permissions, batchId);

      // Register batch member record for teacher
      if (data.teacherId) {
        await this.batchMemberRepo.addMember(createdBatch.$id, data.teacherId, {
          role: 'teacher',
          status: 'active',
          joinedBy: actorId,
          teamId,
        });
      }

      return createdBatch;
    } catch (err) {
      this.log(`[BatchDomain] Error in createBatch: ${err.message}. Initiating rollback...`);
      await rollback.execute();
      throw err;
    }
  }

  async updateBatch(batchId, updatedData, actorId) {
    const existing = await this.batchRepo.get(batchId);
    if (!existing) throw new Error('Batch not found');

    if (updatedData.BatchName && existing.teamId) {
      const formattedTeamName = this.generateTeamName({ ...existing, ...updatedData });
      await this.teamRepo.rename(existing.teamId, formattedTeamName);
    }

    const payload = {
      ...updatedData,
      version: (existing.version || 1) + 1,
    };

    return await this.batchRepo.update(batchId, payload);
  }

  async softDeleteBatch(batchId, actorId) {
    const existing = await this.batchRepo.get(batchId);
    if (!existing) throw new Error('Batch not found');

    // 1. Mark status = 'deleted'
    await this.batchRepo.update(batchId, {
      status: 'deleted',
    });

    // 2. Soft delete / archive team
    if (existing.teamId) {
      try {
        await this.teamRepo.delete(existing.teamId);
      } catch (err) {
        this.log(`[BatchDomain] Non-critical error deleting Appwrite Team ${existing.teamId}: ${err.message}`);
      }
    }

    return { success: true, batchId };
  }

  async repairMemberCount(batchId) {
    const count = await this.batchMemberRepo.countActiveMembers(batchId);
    return await this.batchRepo.update(batchId, { memberCount: count });
  }

  async fetchAllDocuments(listFn, baseQueries = []) {
    const allDocs = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const queries = [...baseQueries, Query.limit(limit), Query.offset(offset)];
      const response = await listFn(queries);
      const docs = response.rows || response.documents || [];
      allDocs.push(...docs);
      if (docs.length < limit) break;
      offset += limit;
    }

    return allDocs;
  }

  async migrateBatches() {
    this.log(`[BatchDomain] Starting Phase 1 batch & team migration...`);
    const batches = await this.fetchAllDocuments((q) => this.batchRepo.list(q));
    const results = [];

    for (const batch of batches) {
      const teamId = batch.$id;
      const formattedTeamName = this.generateTeamName(batch);
      this.log(`[BatchDomain] Processing batch: ${batch.BatchName} (${batch.$id})...`);

      try {
        // 1. Create Team with ID = batch.$id using ID.custom
        try {
          await this.teamRepo.create(ID.custom(teamId), formattedTeamName, ['owner', 'teacher', 'Teacher', 'assistant', 'monitor', 'student']);
          this.log(`[BatchDomain] Created Appwrite Team: ${teamId}`);
        } catch (e) {
          if (e.code === 409 || e.message?.includes('already exists')) {
            this.log(`[BatchDomain] Team ${teamId} already exists, proceeding with membership sync.`);
          } else {
            throw e;
          }
        }

        // 2. Add teacher if present
        if (batch.teacherId) {
          try {
            await this.teamRepo.addMember(teamId, batch.teacherId, ['owner', 'teacher', 'Teacher']);
          } catch (e) {
            this.log(`[BatchDomain] Info/Warning adding teacher ${batch.teacherId} to team ${teamId}: ${e.message}`);
          }
        }

        // 3. Add existing enrolled active students
        const membersList = await this.fetchAllDocuments((q) => this.batchMemberRepo.listMembers(q), [Query.equal('batchId', batch.$id)]);
        let activeCount = batch.teacherId ? 1 : 0;

        for (const memberDoc of membersList) {
          const studentId = memberDoc.studentId || memberDoc.userId;
          if (studentId && studentId !== batch.teacherId) {
            try {
              await this.teamRepo.addMember(teamId, studentId, ['student']);
              activeCount++;
            } catch (e) {
              this.log(`[BatchDomain] Info/Warning adding student ${studentId} to team ${teamId}: ${e.message}`);
            }
          }
        }

        // 4. Update batch record and document permissions
        const permissions = this.permissionPolicy.batch(batch.$id, batch.teacherId);
        await this.batchRepo.update(batch.$id, {
          teamId: batch.$id,
          status: 'active',
          memberCount: activeCount,
          version: (batch.version || 1) + 1,
        }, permissions);

        results.push({ batchId: batch.$id, batchName: batch.BatchName, status: 'migrated', teamId, memberCount: activeCount });
      } catch (err) {
        this.log(`[BatchDomain] Failed migrating batch ${batch.$id}: ${err.message}`);
        results.push({ batchId: batch.$id, batchName: batch.BatchName, status: 'failed', error: err.message });
      }
    }

    return results;
  }

  async migrateBatchStudents() {
    this.log(`[BatchDomain] Starting Phase 2 batchStudents permissions migration...`);
    const allMembers = await this.fetchAllDocuments((q) => this.batchMemberRepo.listMembers(q));
    let updatedCount = 0;

    for (const memberDoc of allMembers) {
      if (!memberDoc.batchId) continue;
      const studentPerms = this.permissionPolicy.batchStudent(memberDoc.batchId);
      try {
        await this.batchMemberRepo.updateMember(memberDoc.$id, {}, studentPerms);
        updatedCount++;
      } catch (e) {
        this.log(`[BatchDomain] Warning updating perms on batchStudent ${memberDoc.$id}: ${e.message}`);
      }
    }

    this.log(`[BatchDomain] Completed batchStudents permissions migration. Updated ${updatedCount} records.`);
    return { updatedCount, total: allMembers.length };
  }

  async migrateBatchRequests(batchRequestRepo) {
    if (!batchRequestRepo) return { updatedCount: 0 };
    this.log(`[BatchDomain] Starting Phase 2 batchRequests permissions migration...`);
    const allRequests = await this.fetchAllDocuments((q) => batchRequestRepo.list(q));
    let updatedCount = 0;

    for (const reqDoc of allRequests) {
      if (!reqDoc.batchId) continue;
      const requestPerms = this.permissionPolicy.batchRequest(reqDoc.batchId, reqDoc.studentId);
      try {
        await batchRequestRepo.update(reqDoc.$id, {}, requestPerms);
        updatedCount++;
      } catch (e) {
        this.log(`[BatchDomain] Warning updating perms on batchRequest ${reqDoc.$id}: ${e.message}`);
      }
    }

    this.log(`[BatchDomain] Completed batchRequests permissions migration. Updated ${updatedCount} records.`);
    return { updatedCount, total: allRequests.length };
  }

  async migrateQuestionPapers(questionPaperRepo) {
    if (!questionPaperRepo) return { updatedCount: 0 };
    this.log(`[BatchDomain] Starting Phase 3 questionPaperData permissions migration...`);
    const allPapers = await this.fetchAllDocuments((q) => questionPaperRepo.list(q));
    let updatedCount = 0;

    for (const paperDoc of allPapers) {
      const batchId = paperDoc.batchId || paperDoc.teamId;
      const paperPerms = this.permissionPolicy.paper(batchId, paperDoc.userId);
      try {
        await questionPaperRepo.update(paperDoc.$id, {}, paperPerms);
        updatedCount++;
      } catch (e) {
        this.log(`[BatchDomain] Warning updating perms on questionPaperData ${paperDoc.$id}: ${e.message}`);
      }
    }

    this.log(`[BatchDomain] Completed questionPaperData permissions migration. Updated ${updatedCount} records.`);
    return { updatedCount, total: allPapers.length };
  }

  async migrateUserStats(userStatsRepo) {
    if (!userStatsRepo) return { userStatsUpdated: 0, userBatchStatsUpdated: 0 };
    this.log(`[BatchDomain] Starting Phase 4 userStats & userBatchStats permissions migration...`);

    // 1. userStats collection
    const allUserStats = await this.fetchAllDocuments((q) => userStatsRepo.listUserStats(q));
    let userStatsUpdated = 0;
    for (const doc of allUserStats) {
      const batchId = doc.batchId || doc.teamId;
      const perms = this.permissionPolicy.userStats(batchId, doc.userId);
      try {
        await userStatsRepo.updateUserStats(doc.$id, {}, perms);
        userStatsUpdated++;
      } catch (e) {
        this.log(`[BatchDomain] Warning updating perms on userStats ${doc.$id}: ${e.message}`);
      }
    }

    // 2. userBatchStats collection
    const allUserBatchStats = await this.fetchAllDocuments((q) => userStatsRepo.listUserBatchStats(q));
    let userBatchStatsUpdated = 0;
    for (const doc of allUserBatchStats) {
      const batchId = doc.batchId || doc.teamId;
      const perms = this.permissionPolicy.userStats(batchId, doc.userId);
      try {
        await userStatsRepo.updateUserBatchStats(doc.$id, {}, perms);
        userBatchStatsUpdated++;
      } catch (e) {
        this.log(`[BatchDomain] Warning updating perms on userBatchStats ${doc.$id}: ${e.message}`);
      }
    }

    this.log(`[BatchDomain] Completed stats permissions migration. userStats: ${userStatsUpdated}/${allUserStats.length}, userBatchStats: ${userBatchStatsUpdated}/${allUserBatchStats.length}.`);
    return { userStatsUpdated, userBatchStatsUpdated };
  }

  async migrateAttendanceAndDiary(attendanceRepo) {
    if (!attendanceRepo) return { attendanceUpdated: 0, diaryUpdated: 0 };
    this.log(`[BatchDomain] Starting Phase 5 newAttendance & dailyDiary permissions migration...`);

    // 1. newAttendance collection
    const allAttendance = await this.fetchAllDocuments((q) => attendanceRepo.listAttendance(q));
    let attendanceUpdated = 0;
    for (const doc of allAttendance) {
      const batchId = doc.batchId || doc.teamId;
      const studentId = doc.userId || doc.studentId;
      const perms = this.permissionPolicy.attendance(batchId, studentId);
      try {
        await attendanceRepo.updateAttendance(doc.$id, {}, perms);
        attendanceUpdated++;
      } catch (e) {
        this.log(`[BatchDomain] Warning updating perms on newAttendance ${doc.$id}: ${e.message}`);
      }
    }

    // 2. dailyDiary collection
    const allDiary = await this.fetchAllDocuments((q) => attendanceRepo.listDailyDiary(q));
    let diaryUpdated = 0;
    for (const doc of allDiary) {
      const batchId = doc.batchId || doc.teamId;
      const teacherId = doc.instructorId || doc.userId || doc.teacherId;
      const perms = this.permissionPolicy.dailyDiary(batchId, teacherId);
      try {
        await attendanceRepo.updateDailyDiary(doc.$id, {}, perms);
        diaryUpdated++;
      } catch (e) {
        this.log(`[BatchDomain] Warning updating perms on dailyDiary ${doc.$id}: ${e.message}`);
      }
    }

    this.log(`[BatchDomain] Completed Phase 5 migration. newAttendance: ${attendanceUpdated}/${allAttendance.length}, dailyDiary: ${diaryUpdated}/${allDiary.length}.`);
    return { attendanceUpdated, diaryUpdated };
  }

  async migrateGameArena(gameRepo) {
    if (!gameRepo) return { results: {} };
    this.log(`[BatchDomain] Starting Phase 6 Game Arena & Challenges permissions migration...`);

    const collections = [
      { name: 'batch_challenges', tableId: gameRepo.batchChallengesId },
      { name: 'student_game_stats', tableId: gameRepo.studentGameStatsId },
      { name: 'student_achievements', tableId: gameRepo.studentAchievementsId },
      { name: 'batch_game_settings', tableId: gameRepo.batchGameSettingsId },
      { name: 'daily_missions', tableId: gameRepo.dailyMissionsId },
      { name: 'batch_challenge_progress', tableId: gameRepo.batchChallengeProgressId },
    ];

    const results = {};

    for (const { name, tableId } of collections) {
      try {
        const docs = await this.fetchAllDocuments((q) => gameRepo.listCollection(tableId, q));
        let updatedCount = 0;
        for (const doc of docs) {
          const batchId = doc.batchId || doc.teamId;
          const studentId = doc.studentId || doc.userId;
          const teacherId = doc.teacherId || doc.instructorId;
          const perms = this.permissionPolicy.game(batchId, studentId, teacherId);
          try {
            await gameRepo.updateCollection(tableId, doc.$id, {}, perms);
            updatedCount++;
          } catch (e) {
            this.log(`[BatchDomain] Warning updating perms on ${name} ${doc.$id}: ${e.message}`);
          }
        }
        results[name] = { updatedCount, total: docs.length };
        this.log(`[BatchDomain] ${name} permissions updated: ${updatedCount}/${docs.length}`);
      } catch (err) {
        this.log(`[BatchDomain] Error migrating ${name}: ${err.message}`);
        results[name] = { updatedCount: 0, total: 0, error: err.message };
      }
    }

    this.log(`[BatchDomain] Completed Phase 6 Game Arena migration.`);
    return results;
  }
}

export default BatchDomain;
