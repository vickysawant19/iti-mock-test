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
    const teamId = ID.unique();
    const formattedTeamName = this.generateTeamName(data);

    try {
      this.log(`[BatchDomain] Creating Appwrite Team: ${formattedTeamName} (${teamId})...`);
      await this.teamRepo.create(teamId, formattedTeamName, ['owner', 'teacher', 'assistant', 'monitor', 'student']);
      rollback.add(() => this.teamRepo.delete(teamId), `Delete Team ${teamId}`);

      // Add teacher to team
      this.log(`[BatchDomain] Adding Teacher (${data.teacherId}) to Team ${teamId}...`);
      await this.teamRepo.addMember(teamId, data.teacherId, ['owner', 'teacher']);

      // Prepare batch document payload
      const batchPayload = {
        ...data,
        teamId,
        status: 'active',
        memberCount: 1,
        version: 1,
      };

      const permissions = this.permissionPolicy.batch(data.teacherId);

      this.log(`[BatchDomain] Persisting batch row to database...`);
      const createdBatch = await this.batchRepo.create(batchPayload, permissions);

      // Register batch member record for teacher
      await this.batchMemberRepo.addMember(createdBatch.$id, data.teacherId, {
        role: 'teacher',
        status: 'active',
        joinedBy: actorId,
        teamId,
      });

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

    // 1. Mark status = 'deleting' / 'deleted'
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

  async migrateBatches() {
    this.log(`[BatchDomain] Starting batch migration...`);
    const batchesResponse = await this.batchRepo.list();
    const batches = batchesResponse.rows || [];
    const results = [];

    for (const batch of batches) {
      if (batch.teamId) {
        results.push({ batchId: batch.$id, batchName: batch.BatchName, status: 'already_migrated', teamId: batch.teamId });
        continue;
      }

      this.log(`[BatchDomain] Migrating batch: ${batch.BatchName} (${batch.$id})...`);
      const teamId = ID.unique();
      const formattedTeamName = this.generateTeamName(batch);

      try {
        // Create Team
        await this.teamRepo.create(teamId, formattedTeamName, ['owner', 'teacher', 'assistant', 'monitor', 'student']);

        // Add teacher
        if (batch.teacherId) {
          try {
            await this.teamRepo.addMember(teamId, batch.teacherId, ['owner', 'teacher']);
          } catch (e) {
            this.log(`[BatchDomain] Warning adding teacher ${batch.teacherId} to team ${teamId}: ${e.message}`);
          }
        }

        // Add existing enrolled students
        const membersList = await this.batchMemberRepo.listMembers([Query.equal('batchId', batch.$id)]);
        let activeCount = 1;

        for (const memberDoc of membersList.rows || []) {
          const studentId = memberDoc.studentId || memberDoc.userId;
          if (studentId && studentId !== batch.teacherId) {
            try {
              await this.teamRepo.addMember(teamId, studentId, ['student']);
              activeCount++;
            } catch (e) {
              this.log(`[BatchDomain] Warning adding student ${studentId} to team ${teamId}: ${e.message}`);
            }
          }
        }

        // Update batch record
        await this.batchRepo.update(batch.$id, {
          teamId,
          status: 'active',
          memberCount: activeCount,
          version: (batch.version || 1) + 1,
        });

        results.push({ batchId: batch.$id, batchName: batch.BatchName, status: 'migrated', teamId, memberCount: activeCount });
      } catch (err) {
        this.log(`[BatchDomain] Failed migrating batch ${batch.$id}: ${err.message}`);
        results.push({ batchId: batch.$id, batchName: batch.BatchName, status: 'failed', error: err.message });
      }
    }

    return results;
  }
}

export default BatchDomain;
