import { Client, Databases } from "node-appwrite";
import "dotenv/config";

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest";
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const DAILY_DIARY_COLLECTION_ID = "dailyDiary";
const API_KEY = process.env.APPWRITE_API_KEY || "standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125";
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
