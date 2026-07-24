import { RollbackStack } from '../helpers/rollbackHelper.js';

export class MembershipDomain {
  constructor(batchRepo, teamRepo, batchMemberRepo, permissionPolicy, log) {
    this.batchRepo = batchRepo;
    this.teamRepo = teamRepo;
    this.batchMemberRepo = batchMemberRepo;
    this.permissionPolicy = permissionPolicy;
    this.log = log || console.log;
  }

  async approveStudent(batchId, studentId, details = {}, actorId) {
    const rollback = new RollbackStack(this.log);
    const batch = await this.batchRepo.get(batchId);
    if (!batch) throw new Error('Batch not found');
    if (!batch.teamId) throw new Error('Batch has no associated teamId');

    const role = details.role || 'student';

    try {
      this.log(`[MembershipDomain] Adding student (${studentId}) to Appwrite Team (${batch.teamId})...`);
      const membership = await this.teamRepo.addMember(batch.teamId, studentId, [role]);

      if (membership?.$id) {
        rollback.add(() => this.teamRepo.removeMember(batch.teamId, membership.$id), `Remove membership ${membership.$id}`);
      }

      this.log(`[MembershipDomain] Creating/updating BatchMember database record...`);
      const permissions = this.permissionPolicy?.batchStudent ? this.permissionPolicy.batchStudent(batchId) : undefined;
      await this.batchMemberRepo.addMember(batchId, studentId, {
        role,
        status: 'active',
        joinedBy: actorId,
        teamId: batch.teamId,
        ...details,
      }, permissions);

      this.log(`[MembershipDomain] Incrementing memberCount for batch ${batchId}...`);
      await this.batchRepo.incrementMemberCount(batchId, 1);

      return { success: true, batchId, studentId, role };
    } catch (err) {
      this.log(`[MembershipDomain] Error approving student: ${err.message}. Initiating rollback...`);
      await rollback.execute();
      throw err;
    }
  }

  async removeStudent(batchId, studentId, actorId) {
    const batch = await this.batchRepo.get(batchId);
    if (!batch) throw new Error('Batch not found');

    if (batch.teamId) {
      try {
        const teamMembers = await this.teamRepo.listMembers(batch.teamId);
        const match = teamMembers.memberships.find((m) => m.userId === studentId);
        if (match) {
          this.log(`[MembershipDomain] Deleting team membership ${match.$id} for user ${studentId}...`);
          await this.teamRepo.removeMember(batch.teamId, match.$id);
        }
      } catch (err) {
        this.log(`[MembershipDomain] Non-critical error removing team member: ${err.message}`);
      }
    }

    this.log(`[MembershipDomain] Removing BatchMember record for user ${studentId}...`);
    await this.batchMemberRepo.removeMember(batchId, studentId);

    this.log(`[MembershipDomain] Decrementing memberCount for batch ${batchId}...`);
    await this.batchRepo.incrementMemberCount(batchId, -1);

    return { success: true, batchId, studentId };
  }
}

export default MembershipDomain;
