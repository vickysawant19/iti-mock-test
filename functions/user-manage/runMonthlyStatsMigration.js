import { Client, Databases, TablesDB } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import migrateMonthlyStats from './src/migrateMonthlyStats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const endpoint = process.env.VITE_APPWRITE_URL || process.env.VITE_APPWRITE_ENDPOINT || 'https://auth.itimitra.in/v1';
const project = process.env.VITE_APPWRITE_PROJECT_ID || 'itimocktest';
const apiKey = process.env.VITE_APPWRITE_API_KEY || (process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || "");

async function main() {
  console.log(`[MonthlyStatsMigration] Connecting to Appwrite at ${endpoint} (Project: ${project})...`);
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(apiKey);

  const databases = new Databases(client);
  const tablesDB = new TablesDB(client);

  console.log('[MonthlyStatsMigration] Executing bulk migration of monthly attendance stats using tablesDB.upsertRows...');
  const result = await migrateMonthlyStats(databases, tablesDB, console.log, console.error);

  console.log('[MonthlyStatsMigration] Migration Finished Successfully!');
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('[MonthlyStatsMigration] Migration Failed:', err);
  process.exit(1);
});
