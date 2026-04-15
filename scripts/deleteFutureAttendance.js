import { Client, Databases, Query } from "node-appwrite";
import "dotenv/config";

// Configuration from environment variables
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest";
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const COLLECTION_ID = process.env.VITE_NEW_ATTENDANCE_COLLECTION_ID || "newAttendance";
const API_KEY = process.env.VITE_APPWRITE_API_KEY;
const ENDPOINT = process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1";

if (!API_KEY) {
  console.error("Error: VITE_APPWRITE_API_KEY is not defined in .env");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function deleteFutureAttendance() {
  const targetDate = "2026-04-16";
  console.log(`Starting deletion of attendance records from and after ${targetDate}...`);

  try {
    let deletedCount = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch batch of records to delete
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual("date", targetDate),
          Query.limit(100) // Process in chunks
        ]
      );

      if (response.documents.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Found ${response.documents.length} records to delete in this batch...`);

      // Delete each document in the batch
      for (const doc of response.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
          deletedCount++;
          if (deletedCount % 10 === 0) {
            console.log(`Deleted ${deletedCount} records so far...`);
          }
        } catch (delErr) {
          console.error(`Failed to delete document ${doc.$id}:`, delErr.message);
        }
      }

      // If we got fewer than 100 docs, we're likely done
      if (response.documents.length < 100) {
        hasMore = false;
      }
    }

    console.log("------------------------------------------");
    console.log(`Success! Total records deleted: ${deletedCount}`);
    console.log("------------------------------------------");
  } catch (err) {
    console.error("Operation failed:", err.message);
  }
}

deleteFutureAttendance();
