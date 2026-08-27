import fs from 'fs';
import { Client, Databases, Query } from 'node-appwrite';

// Load .env variables
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
  console.error('❌ VITE_APPWRITE_API_KEY not found in .env');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function checkLatestAttendance() {
  console.log(`\n🔍 Connecting to Appwrite Endpoint: ${endpoint}`);
  console.log(`📦 Database: ${databaseId} | Collection: ${collectionId}`);

  try {
    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(10)
      ]
    );

    console.log(`\n✅ Total documents in collection: ${response.total}`);
    console.log(`📋 Showing latest ${response.documents.length} attendance records:\n`);
    console.log('─'.repeat(70));

    response.documents.forEach((doc, idx) => {
      console.log(`Record #${idx + 1}`);
      console.log(`  ID               : ${doc.$id}`);
      console.log(`  User ID          : ${doc.userId}`);
      console.log(`  Batch ID         : ${doc.batchId}`);
      console.log(`  Date             : ${doc.date}`);
      console.log(`  Status           : ${doc.status} (AttendanceStatus: ${doc.attendanceStatus || 'N/A'})`);
      console.log(`  Source           : ${doc.source || 'N/A'}`);
      console.log(`  markedAt         : ${doc.markedAt || 'NULL / MISSING'}`);
      console.log(`  $createdAt       : ${doc.$createdAt}`);
      console.log(`  $updatedAt       : ${doc.$updatedAt}`);
      console.log(`  Remarks          : ${doc.remarks || 'None'}`);
      console.log('─'.repeat(70));
    });
  } catch (error) {
    console.error('❌ Error querying attendance records:', error.message);
  }
}

checkLatestAttendance();
