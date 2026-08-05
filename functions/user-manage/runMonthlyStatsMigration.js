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
const apiKey = process.env.VITE_APPWRITE_API_KEY || 'standard_95dec26d9fc1b965daba5add865d10732fec160a64cc0cce9e58ced724ec220f9f278c7c2d66fdca3b6b8f5ea5e7598afe69f8593851cb8bbe5071482bcf4a34f5998c4f16e7d3aa679a5d879a4e0fe42cfb02b26f5e35b572922dfc4f3bcc4fe04cd255165a1b3e69b19f52022084d48557f6de1236d80ce9be245c71fb87de';

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
