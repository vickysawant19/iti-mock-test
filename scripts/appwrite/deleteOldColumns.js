import { Client, Databases } from "node-appwrite";
import "dotenv/config";

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest";
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const DAILY_DIARY_COLLECTION_ID = "dailyDiary";
const API_KEY = process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || "";
const ENDPOINT = process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1";

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function removeColumns() {
  try {
    console.log("Checking attributes in dailyDiary...");
    const existingAttrs = await databases.listAttributes(DATABASE_ID, DAILY_DIARY_COLLECTION_ID);
    const attrKeys = existingAttrs.attributes.map(a => a.key);

    if (attrKeys.includes("workDone")) {
      console.log("Deleting workDone attribute...");
      await databases.deleteAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "workDone");
    } else {
      console.log("workDone attribute already deleted.");
    }

    if (attrKeys.includes("workType")) {
      console.log("Deleting workType attribute...");
      await databases.deleteAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "workType");
    } else {
      console.log("workType attribute already deleted.");
    }

    console.log("Attributes deleted successfully.");
  } catch (err) {
    console.error("Failed to delete attributes:", err);
  }
}

removeColumns();
