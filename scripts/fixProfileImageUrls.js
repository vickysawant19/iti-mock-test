import { Client, TablesDB, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_URL || process.env.VITE_APPWRITE_ENDPOINT || 'https://auth.itimitra.in/v1';
const project = process.env.VITE_APPWRITE_PROJECT_ID || 'itimocktest';
const apiKey = process.env.VITE_APPWRITE_API_KEY || (process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || "");

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'itimocktest';
const userProfileColId = process.env.VITE_USER_PROFILE_COLLECTION_ID || '66937340001047368f32';

async function fixProfileImageUrls() {
  console.log(`[FixProfileUrls] Connecting to Appwrite at ${endpoint}...`);
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(apiKey);

  const tablesDb = new TablesDB(client);

  console.log(`[FixProfileUrls] Listing all user profiles...`);
  const response = await tablesDb.listRows(databaseId, userProfileColId, [
    Query.limit(500)
  ]);

  const profiles = response.rows || response.documents || [];
  console.log(`Found ${profiles.length} user profiles.`);

  let updatedCount = 0;
  const targetBaseUrl = 'https://auth.itimitra.in/v1';

  for (const profile of profiles) {
    if (profile.profileImage && typeof profile.profileImage === 'string') {
      const originalUrl = profile.profileImage;

      if (
        originalUrl.includes('cloud.appwrite.io') ||
        originalUrl.includes('fra.cloud.appwrite.io') ||
        originalUrl.includes('api.itimitra.in')
      ) {
        const fixedUrl = originalUrl
          .replace(/https?:\/\/cloud\.appwrite\.io\/v1/g, targetBaseUrl)
          .replace(/https?:\/\/fra\.cloud\.appwrite\.io\/v1/g, targetBaseUrl)
          .replace(/https?:\/\/api\.itimitra\.in\/v1/g, targetBaseUrl)
          .replace(/https?:\/\/cloud\.appwrite\.io/g, targetBaseUrl.replace(/\/v1$/, ''))
          .replace(/https?:\/\/fra\.cloud\.appwrite\.io/g, targetBaseUrl.replace(/\/v1$/, ''))
          .replace(/https?:\/\/api\.itimitra\.in/g, targetBaseUrl.replace(/\/v1$/, ''));

        console.log(`Updating profile ${profile.$id} (${profile.userName}):`);
        console.log(`  OLD: ${originalUrl}`);
        console.log(`  NEW: ${fixedUrl}`);

        await tablesDb.updateRow(databaseId, userProfileColId, profile.$id, {
          profileImage: fixedUrl
        });

        updatedCount++;
      }
    }
  }

  console.log(`[FixProfileUrls] Completed! Fixed ${updatedCount} profile image URLs.`);
}

fixProfileImageUrls().catch((err) => {
  console.error('[FixProfileUrls] Failed:', err);
  process.exit(1);
});
