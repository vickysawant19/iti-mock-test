import { Client, Databases, Query } from "node-appwrite";
import "dotenv/config";

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest";
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const BATCHES_COLLECTION_ID = process.env.VITE_BATCH_COLLECTION_ID || "66936df000108d8e2364";
const ENDPOINT = process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1";
const API_KEY = process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || "";

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function inspect() {
  try {
    const res = await databases.listDocuments(DATABASE_ID, BATCHES_COLLECTION_ID, [Query.limit(5)]);
    for (const batch of res.documents) {
        if (batch.dailyDairy && batch.dailyDairy.length > 0) {
           console.log("DailyDairy field on batch", batch.$id);
           console.log(batch.dailyDairy[0]);
           try {
             console.log("Parsed:", JSON.parse(batch.dailyDairy[0]));
           } catch(e) {
               console.log("Not JSON stringified?");
           }
           break;
        }
    }
  } catch (err) {
    console.error("Inspect failed:", err);
  }
}

inspect();
