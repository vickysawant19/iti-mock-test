import fs from 'fs';
import { Client, Databases, Query } from 'node-appwrite';

// Read .env configuration
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const [key, ...val] = line.trim().split('=');
  if (key && val.length > 0) {
    envVars[key] = val.join('=').replace(/^"(.*)"$/, '$1');
  }
});

const endpoint = envVars.VITE_APPWRITE_ENDPOINT || 'https://auth.itimitra.in/v1';
const projectId = envVars.VITE_APPWRITE_PROJECT_ID || 'itimocktest';
const databaseId = envVars.VITE_APPWRITE_DATABASE_ID || 'itimocktest';
const collectionId = envVars.VITE_NEW_ATTENDANCE_COLLECTION_ID || 'newAttendance';
const apiKey = envVars.VITE_APPWRITE_API_KEY;

if (!apiKey) {
  console.error('❌ VITE_APPWRITE_API_KEY missing in .env');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

const TODAY_DATE = '2026-08-27';

async function migrateTodaysMarkedAt() {
  console.log(`\n🚀 Starting migration for today's (${TODAY_DATE}) attendance records...`);
  console.log(`Connecting to ${endpoint} | Database: ${databaseId} | Collection: ${collectionId}\n`);

  try {
    let offset = 0;
    const limit = 100;
    let totalExamined = 0;
    let totalUpdated = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await databases.listDocuments(
        databaseId,
        collectionId,
        [
          Query.equal('date', TODAY_DATE),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );

      const docs = response.documents || [];
      if (docs.length === 0) {
        hasMore = false;
        break;
      }

      totalExamined += docs.length;

      for (const doc of docs) {
        const createdTs = new Date(doc.$createdAt).getTime();
        const updatedTs = new Date(doc.$updatedAt).getTime();
        const currentMarkedAtTs = doc.markedAt ? new Date(doc.markedAt).getTime() : 0;

        // If $updatedAt is significantly newer than $createdAt (by at least 5 seconds)
        // and $updatedAt is newer than current markedAt, update markedAt to $updatedAt
        if (!Number.isNaN(updatedTs) && !Number.isNaN(createdTs)) {
          const isUpdatedLater = updatedTs > createdTs + 5000;
          const isNewerThanMarkedAt = updatedTs > currentMarkedAtTs + 5000;

          if (isUpdatedLater && isNewerThanMarkedAt) {
            console.log(`Updating doc ${doc.$id} (User: ${doc.userId})`);
            console.log(`   Old markedAt : ${doc.markedAt || 'NULL'}`);
            console.log(`   New markedAt : ${doc.$updatedAt}`);

            await databases.updateDocument(
              databaseId,
              collectionId,
              doc.$id,
              {
                markedAt: doc.$updatedAt,
              }
            );

            totalUpdated++;
          }
        }
      }

      offset += limit;
      if (docs.length < limit) {
        hasMore = false;
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`🎉 Migration complete for ${TODAY_DATE}!`);
    console.log(`   Total records checked : ${totalExamined}`);
    console.log(`   Total records updated : ${totalUpdated}`);
    console.log('─'.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateTodaysMarkedAt();
