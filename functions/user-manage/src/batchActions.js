import TeamRepository from './repositories/teamRepository.js';
import BatchRepository from './repositories/batchRepository.js';
import BatchMemberRepository from './repositories/batchMemberRepository.js';
import AuditRepository from './repositories/auditRepository.js';

import BatchDomain from './domains/batchDomain.js';
import MembershipDomain from './domains/membershipDomain.js';
import AuditDomain from './domains/auditDomain.js';
import PermissionPolicy from './policies/permissionPolicy.js';

export const handleBatchAction = async (action, req, res, client, log, trace) => {
  const teamRepo = new TeamRepository(client);
  const batchRepo = new BatchRepository(client);
  const batchMemberRepo = new BatchMemberRepository(client);
  const auditRepo = new AuditRepository(client);

  const auditDomain = new AuditDomain(auditRepo);
  const batchDomain = new BatchDomain(batchRepo, teamRepo, batchMemberRepo, PermissionPolicy, trace);
  const membershipDomain = new MembershipDomain(batchRepo, teamRepo, batchMemberRepo, trace);

  const payload = req.bodyJson || {};
  const actorId = payload.actorId || payload.teacherId || payload.userId || 'system';

  switch (action) {
    case 'createBatch': {
      trace(`[handleBatchAction] Triggering createBatch for teacher: ${payload.teacherId}`);
      return await auditDomain.executeWithAudit('createBatch', actorId, payload.teacherId, null, null, () =>
        batchDomain.createBatch(payload, actorId)
      );
    }
    case 'updateBatch': {
      trace(`[handleBatchAction] Triggering updateBatch for batchId: ${payload.batchId}`);
      return await auditDomain.executeWithAudit('updateBatch', actorId, null, payload.batchId, payload.teamId, () =>
        batchDomain.updateBatch(payload.batchId, payload.batchData || payload, actorId)
      );
    }
    case 'deleteBatch': {
      trace(`[handleBatchAction] Triggering softDeleteBatch for batchId: ${payload.batchId}`);
      return await auditDomain.executeWithAudit('deleteBatch', actorId, null, payload.batchId, payload.teamId, () =>
        batchDomain.softDeleteBatch(payload.batchId, actorId)
      );
    }
    case 'approveStudent': {
      trace(`[handleBatchAction] Triggering approveStudent: studentId=${payload.studentId}, batchId=${payload.batchId}`);
      return await auditDomain.executeWithAudit(
        'approveStudent',
        actorId,
        payload.studentId,
        payload.batchId,
        payload.teamId,
        () => membershipDomain.approveStudent(payload.batchId, payload.studentId, payload.details, actorId)
      );
    }
    case 'removeStudent': {
      trace(`[handleBatchAction] Triggering removeStudent: studentId=${payload.studentId}, batchId=${payload.batchId}`);
      return await auditDomain.executeWithAudit(
        'removeStudent',
        actorId,
        payload.studentId,
        payload.batchId,
        payload.teamId,
        () => membershipDomain.removeStudent(payload.batchId, payload.studentId, actorId)
      );
    }
    case 'repairMemberCount': {
      trace(`[handleBatchAction] Triggering repairMemberCount for batchId: ${payload.batchId}`);
      return await batchDomain.repairMemberCount(payload.batchId);
    }
    case 'migrateBatches': {
      trace(`[handleBatchAction] Triggering migrateBatches`);
      return await auditDomain.executeWithAudit('migrateBatches', actorId, null, null, null, () =>
        batchDomain.migrateBatches()
      );
    }
    default:
      return null;
  }
};
