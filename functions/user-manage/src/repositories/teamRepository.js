import { Teams, Query } from 'node-appwrite';
import { withRetry } from '../helpers/retryHelper.js';

export class TeamRepository {
  constructor(client) {
    this.teams = new Teams(client);
  }

  async create(teamId, name, roles = ['owner', 'teacher', 'Teacher', 'assistant', 'monitor', 'student']) {
    return await withRetry(() => this.teams.create(teamId, name, roles));
  }

  async rename(teamId, newName) {
    return await withRetry(() => this.teams.updateName(teamId, newName));
  }

  async delete(teamId) {
    return await withRetry(() => this.teams.delete(teamId));
  }

  async addMember(teamId, userId, roles = ['student'], email = undefined) {
    return await withRetry(() =>
      this.teams.createMembership(
        teamId,
        roles,
        email || undefined,
        userId || undefined,
        undefined, // phone
        undefined, // url
        undefined  // name
      )
    );
  }

  async removeMember(teamId, membershipId) {
    return await withRetry(() => this.teams.deleteMembership(teamId, membershipId));
  }

  async listMembers(teamId, queries = []) {
    return await withRetry(() => this.teams.listMemberships(teamId, queries));
  }

  async getMember(teamId, membershipId) {
    return await withRetry(() => this.teams.getMembership(teamId, membershipId));
  }

  async hasMember(teamId, userId) {
    try {
      const response = await this.listMembers(teamId, [Query.limit(100)]);
      return response.memberships.some((m) => m.userId === userId);
    } catch (err) {
      return false;
    }
  }
}

export default TeamRepository;
