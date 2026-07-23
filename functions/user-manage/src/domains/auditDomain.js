export class AuditDomain {
  constructor(auditRepository) {
    this.auditRepo = auditRepository;
  }

  async executeWithAudit(actionName, actorId, targetId, batchId, teamId, fn) {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      await this.auditRepo.log({
        action: actionName,
        actorId,
        targetId,
        batchId,
        teamId,
        status: 'success',
        duration,
      });
      return result;
    } catch (err) {
      const duration = Date.now() - startTime;
      await this.auditRepo.log({
        action: actionName,
        actorId,
        targetId,
        batchId,
        teamId,
        status: 'failure',
        duration,
        error: err.message,
      });
      throw err;
    }
  }
}

export default AuditDomain;
