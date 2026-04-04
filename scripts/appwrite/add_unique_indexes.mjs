import { Client, Databases, Query } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const client = new Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_URL)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || ""); // Make sure API key is available

const databases = new Databases(client);

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const batchRequestsCollectionId = process.env.VITE_BATCH_REQUESTS_COLLECTION_ID || "batchRequests";
const batchStudentsCollectionId = process.env.VITE_BATCH_STUDENTS_COLLECTION_ID || "batchStudents";

async function cleanupDuplicates(collectionId) {
  console.log(`[${collectionId}] Fetching documents to find duplicates...`);
  let hasNext = true;
  let queries = [Query.limit(100)];
  let documents = [];

  try {
    while (hasNext) {
      const resp = await databases.listDocuments(databaseId, collectionId, queries);
      documents.push(...resp.documents);
      if (resp.documents.length < 100) {
        hasNext = false;
      } else {
        queries = [
          Query.limit(100),
          Query.cursorAfter(resp.documents[resp.documents.length - 1].$id)
        ];
      }
    }

    // Group by batchId + studentId
    const groups = {};
    for (const doc of documents) {
      const key = `${doc.batchId}_${doc.studentId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }

    for (const [key, docs] of Object.entries(groups)) {
      if (docs.length > 1) {
        console.log(`[${collectionId}] Found duplicate for ${key} (count: ${docs.length})`);
        
        // sort by createdAt desc (newest first)
        docs.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));

        // keep the first, delete the rest
        for (let i = 1; i < docs.length; i++) {
          const docToDelete = docs[i];
          console.log(`[${collectionId}] Deleting duplicate doc: ${docToDelete.$id}`);
          await databases.deleteDocument(databaseId, collectionId, docToDelete.$id);
        }
      }
    }

    console.log(`[${collectionId}] Cleanup complete.`);
  } catch (err) {
    if (err.code === 404) {
      console.log(`[${collectionId}] Collection not found. Skipping.`);
    } else {
      console.error(`[${collectionId}] Error cleaning duplicates:`, err);
    }
  }
}

async function createIndexCheck(collectionId) {
  try {
    console.log(`[${collectionId}] Attempting to create unique index...`);
    const indexKey = "unique_batch_student";
    
    // Check if index exists by fetching it
    try {
        const indexes = await databases.listIndexes(databaseId, collectionId);
        if (indexes.indexes.find(idx => idx.key === indexKey)) {
             console.log(`[${collectionId}] Index ${indexKey} already exists. Skipping.`);
             return;
        }
    } catch (e) {
        // Appwrite older version SDKs might not have listIndexes on client level sometimes, 
        // passing through to catch if API throws 404.
    }

    await databases.createIndex(
      databaseId,
      collectionId,
      indexKey,
      "unique",
      ["batchId", "studentId"],
      ["ASC", "ASC"]
    );
    console.log(`[${collectionId}] Successfully created unique index: ${indexKey}`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`[${collectionId}] Index likely already exists or is building.`);
    } else {
      console.error(`[${collectionId}] Error creating index:`, err.message);
    }
  }
}

async function run() {
  if (!process.env.VITE_APPWRITE_PROJECT_ID) {
    console.error("Missing Appwrite Env Vars. Check .env file.");
    return;
  }
  
  // 1. Cleanup Duplicates
  await cleanupDuplicates(batchRequestsCollectionId);
  await cleanupDuplicates(batchStudentsCollectionId);

  // 2. Create Indexes
  await createIndexCheck(batchRequestsCollectionId);
  await createIndexCheck(batchStudentsCollectionId);
}

run();
