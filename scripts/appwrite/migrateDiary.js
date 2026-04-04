import { Client, Databases, Query, ID, Permission, Role } from "node-appwrite";
import "dotenv/config";

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest";
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const BATCHES_COLLECTION_ID = process.env.VITE_BATCH_COLLECTION_ID || "66936df000108d8e2364";
const DAILY_DIARY_COLLECTION_ID = "dailyDiary";
// Retrieve the API key from environment, or use hardcoded one from mcp session if it's missing in .env
// You can also pass it when running: APPWRITE_API_KEY="..." node migrateDiary.js
const API_KEY = process.env.APPWRITE_API_KEY || "standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125";
const ENDPOINT = process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1";

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createCollectionAndAttributes() {
  try {
    console.log("Checking if collection exists...");
    await databases.getCollection(DATABASE_ID, DAILY_DIARY_COLLECTION_ID);
    console.log("Collection 'dailyDiary' already exists.");
  } catch (err) {
    if (err.code === 404) {
      console.log("Collection 'dailyDiary' not found. Creating...");
      await databases.createCollection(
        DATABASE_ID,
        DAILY_DIARY_COLLECTION_ID,
        "Daily Diary",
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log("Collection created.");

      console.log("Creating attributes...");
      await databases.createDatetimeAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "date", true);
      await databases.createStringAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "workDone", 1000, true);
      await databases.createStringAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "extraWork", 1000, false);
      await databases.createStringAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "workType", 50, false, "theory"); // Enum workaround
      await databases.createFloatAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "hours", false);
      await databases.createStringAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "remarks", 1000, false);
      await databases.createStringAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "instructorId", 255, true);
      await databases.createStringAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "batchId", 255, true);

      console.log("Waiting for attributes to be ready (10 seconds)...");
      await sleep(10000); // 10s wait for attributes
      
      console.log("Creating indexes...");
      await databases.createIndex(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "idx_batchId", "key", ["batchId"]);
      await databases.createIndex(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "idx_instructorId", "key", ["instructorId"]);
      await databases.createIndex(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "idx_date", "key", ["date"]);
      
      console.log("Waiting for indexes to be ready (3 seconds)...");
      await sleep(3000);
      console.log("Indexes check complete.");
    } else {
      throw err;
    }
  }
}

async function migrateData() {
  let hasMore = true;
  let offset = 0;
  const limit = 50;
  let successCount = 0;
  let failCount = 0;

  console.log("Starting migration process...");

  while (hasMore) {
    console.log(`Fetching batches offset: ${offset}`);
    const res = await databases.listDocuments(DATABASE_ID, BATCHES_COLLECTION_ID, [
      Query.limit(limit),
      Query.offset(offset)
    ]);

    const batches = res.documents;
    if (batches.length === 0) {
      hasMore = false;
      break;
    }

    const promises = [];
    for (const batch of batches) {
      if (batch.dailyDairy && batch.dailyDairy.length > 0) {
        const batchId = batch.$id;
        const instructorId = batch.teacherId || "unknown"; // Fallback

        for (const entryStr of batch.dailyDairy) {
          try {
            const parsed = JSON.parse(entryStr);
            const dateKey = parsed[0];
            const entryObj = parsed[1] || {};

            let dateISO;
            try { dateISO = new Date(dateKey).toISOString(); } catch (dtErr) {
              console.error(`Invalid dateKey ${dateKey} in batch ${batchId}`);
              continue;
            }

            if (entryObj.theory && entryObj.theory.trim() !== "") {
              const theoryId = `${batchId.slice(0, 18)}-${dateKey.replace(/-/g, '')}-th`;
              promises.push(
                databases.createDocument(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, theoryId, {
                  date: dateISO, workDone: entryObj.theory, extraWork: "-", workType: "theory", remarks: "-",
                  instructorId, batchId
                }).then(() => { successCount++; process.stdout.write('.'); })
                .catch(e => {
                  if (e.code === 409) { successCount++; process.stdout.write('S'); } // skip existing
                  else { failCount++; console.error(`Failed ${theoryId}: ${e.message}`); }
                })
              );
            }

            if (entryObj.practical && entryObj.practical.trim() !== "") {
              const pracId = `${batchId.slice(0, 18)}-${dateKey.replace(/-/g, '')}-pr`;
              promises.push(
                databases.createDocument(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, pracId, {
                  date: dateISO, workDone: entryObj.practical, extraWork: "-", workType: "practical",
                  remarks: entryObj.practicalNumber ? `Prac #: ${entryObj.practicalNumber}` : "-",
                  instructorId, batchId
                }).then(() => { successCount++; process.stdout.write('.'); })
                .catch(e => {
                  if (e.code === 409) { successCount++; process.stdout.write('S'); } // skip existing
                  else { failCount++; console.error(`Failed ${pracId}: ${e.message}`); }
                })
              );
            }
          } catch (err) {
            console.error(`Parse failed batch ${batch.$id}: ${err.message}`);
          }
        }
      }
    }
    await Promise.all(promises);
    console.log(`\nBatch ${offset}-${offset+limit} processed. Success total: ${successCount}, Fail total: ${failCount}`);

    offset += limit;
  }

  console.log(`Migration completed. Success: ${successCount}. Failed: ${failCount}`);
}

async function run() {
  try {
    await createCollectionAndAttributes();
    await migrateData();
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

run();
