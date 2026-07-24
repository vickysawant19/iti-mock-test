import { Client } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { TeamRepository } from './src/repositories/teamRepository.js';
import { BatchRepository } from './src/repositories/batchRepository.js';
import { BatchMemberRepository } from './src/repositories/batchMemberRepository.js';
import { BatchRequestRepository } from './src/repositories/batchRequestRepository.js';
import { QuestionPaperRepository } from './src/repositories/questionPaperRepository.js';
import { UserStatsRepository } from './src/repositories/userStatsRepository.js';
import { AttendanceRepository } from './src/repositories/attendanceRepository.js';
import { GameRepository } from './src/repositories/gameRepository.js';
import { BatchDomain } from './src/domains/batchDomain.js';
import { PermissionPolicy } from './src/policies/permissionPolicy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const endpoint = process.env.VITE_APPWRITE_URL || process.env.VITE_APPWRITE_ENDPOINT || 'https://auth.itimitra.in/v1';
const project = process.env.VITE_APPWRITE_PROJECT_ID || 'itimocktest';
const apiKey = process.env.VITE_APPWRITE_API_KEY || 'standard_95dec26d9fc1b965daba5add865d10732fec160a64cc0cce9e58ced724ec220f9f278c7c2d66fdca3b6b8f5ea5e7598afe69f8593851cb8bbe5071482bcf4a34f5998c4f16e7d3aa679a5d879a4e0fe42cfb02b26f5e35b572922dfc4f3bcc4fe04cd255165a1b3e69b19f52022084d48557f6de1236d80ce9be245c71fb87de';

async function main() {
  console.log(`[DirectMigration] Connecting to Appwrite at ${endpoint} (Project: ${project})...`);
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(apiKey);

  const teamRepo = new TeamRepository(client);
  const batchRepo = new BatchRepository(client);
  const batchMemberRepo = new BatchMemberRepository(client);
  const batchRequestRepo = new BatchRequestRepository(client);
  const questionPaperRepo = new QuestionPaperRepository(client);
  const userStatsRepo = new UserStatsRepository(client);
  const attendanceRepo = new AttendanceRepository(client);
  const gameRepo = new GameRepository(client);
  const batchDomain = new BatchDomain(batchRepo, teamRepo, batchMemberRepo, PermissionPolicy, console.log);

  // Phase 1 to 5 already completed:
  // const batchResults = await batchDomain.migrateBatches();
  // const studentResults = await batchDomain.migrateBatchStudents();
  // const requestResults = await batchDomain.migrateBatchRequests(batchRequestRepo);
  // const paperResults = await batchDomain.migrateQuestionPapers(questionPaperRepo);
  // const statsResults = await batchDomain.migrateUserStats(userStatsRepo);
  // const attendanceResults = await batchDomain.migrateAttendanceAndDiary(attendanceRepo);

  console.log('[DirectMigration] Executing Phase 6: migrateGameArena()...');
  const gameResults = await batchDomain.migrateGameArena(gameRepo);

  console.log('[DirectMigration] Phase 6 Migration Completed Successfully!');
  console.log('Game Arena Results:', JSON.stringify(gameResults, null, 2));
}

main().catch((err) => {
  console.error('[DirectMigration] Failed:', err);
  process.exit(1);
});
