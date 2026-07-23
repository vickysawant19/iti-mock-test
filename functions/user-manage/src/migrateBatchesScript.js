import { Client, TablesDB, Teams, Query, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import { TeamRepository } from './repositories/teamRepository.js';
import { BatchRepository } from './repositories/batchRepository.js';
import { BatchMemberRepository } from './repositories/batchMemberRepository.js';
import { BatchDomain } from './domains/batchDomain.js';
import { PermissionPolicy } from './policies/permissionPolicy.js';

dotenv.config();

const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://api.itimitra.in/v1';
const project = process.env.APPWRITE_FUNCTION_PROJECT_ID || 'itimocktest';
const apiKey = process.env.APPWRITE_API_KEY || process.env.X_APPWRITE_KEY;

if (!apiKey) {
  console.log('[MigrationScript] Info: APPWRITE_API_KEY env not provided for standalone run.');
}

export async function runMigration(client) {
  const teamRepo = new TeamRepository(client);
  const batchRepo = new BatchRepository(client);
  const batchMemberRepo = new BatchMemberRepository(client);
  const batchDomain = new BatchDomain(batchRepo, teamRepo, batchMemberRepo, PermissionPolicy, console.log);

  console.log('[MigrationScript] Starting batch migration...');
  const results = await batchDomain.migrateBatches();
  console.log('[MigrationScript] Migration results:', JSON.stringify(results, null, 2));
  return results;
}
