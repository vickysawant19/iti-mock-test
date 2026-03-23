import { Client, Databases, Query, ID } from "node-appwrite";
import "dotenv/config";

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest";
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const BATCHES_COLLECTION_ID = process.env.VITE_BATCH_COLLECTION_ID || "66936df000108d8e2364";
const DAILY_DIARY_COLLECTION_ID = "dailyDiary";
const API_KEY = process.env.APPWRITE_API_KEY || "standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125";
const ENDPOINT = process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1";

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

function extractWork(entry) {
  let theoryWork = "";
  let practicalWork = "";

  // Handle case where properties are mapped explicitly
  if (entry.theoryWork || entry.theory) {
      theoryWork = entry.theoryWork || entry.theory;
  }
  if (entry.practicalWork || entry.practical) {
      practicalWork = entry.practicalWork || entry.practical;
  }

  // Handle workDone text extraction
  if (entry.workDone && !theoryWork && !practicalWork) {
    const text = entry.workDone.toLowerCase();

    // Check for mixed keyword phrases indicating a split
    if (text.includes("theory") && (text.includes("practical") || text.includes("prac") || text.includes("lab"))) {
      const parts = entry.workDone.split(/practical|prac/i);
      theoryWork = parts[0].replace(/theory[:\-]*/i, "").trim();
      practicalWork = parts[1]?.replace(/^[\s:\-]+/, "").trim() || "";
    } else {
      // Pure fallback
      theoryWork = entry.workDone;
    }
  }

  return { theoryWork, practicalWork };
}

function extractRemarks(entryObj) {
    let remarks = entryObj.remarks || "";
    // Backwards compatibility with my previous mapping where practicalNumber was mapped separately
    if (!remarks && entryObj.practicalNumber) {
        remarks = `Prac #: ${entryObj.practicalNumber}`;
    }
    return remarks;
}

async function clearDailyDiary() {
    console.log("Cleaning dailyDiary collection...");
    let deleting = true;
    let deletedCount = 0;
    while(deleting) {
        const res = await databases.listDocuments(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, [Query.limit(100)]);
        if (res.documents.length === 0) {
            deleting = false;
            break;
        }
        const promises = res.documents.map(doc => 
            databases.deleteDocument(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, doc.$id).then(() => { deletedCount++; process.stdout.write("D"); })
        );
        await Promise.all(promises);
    }
    console.log(`\nDeleted ${deletedCount} documents.`);
}

async function migrate() {
  await clearDailyDiary();

  let totalMigrated = 0;
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  console.log("Starting unified re-migration...");

  while (hasMore) {
      const batches = await databases.listDocuments(DATABASE_ID, BATCHES_COLLECTION_ID, [
          Query.limit(limit),
          Query.offset(offset)
      ]);

      if (batches.documents.length === 0) {
          hasMore = false;
          break;
      }

      for (const batch of batches.documents) {
        const diaryEntriesStrings = batch.dailyDairy || [];

        for (const entryStr of diaryEntriesStrings) {
            try {
                let parsed;
                try {
                    parsed = JSON.parse(entryStr);
                } catch (pe) {
                    console.log(`❌ Invalid JSON skipped in batch ${batch.$id}: ${entryStr.substring(0, 30)}...`);
                    continue;
                }

                let dateKey;
                let entryObj = {};

                // Handle stringified arrays vs stringified objects
                if (Array.isArray(parsed)) {
                    dateKey = parsed[0];
                    entryObj = parsed[1] || {};
                } else if (typeof parsed === 'object' && parsed !== null) {
                    entryObj = parsed;
                    dateKey = entryObj.date;
                }

                if (!dateKey) {
                    console.log("❌ Entry missing date property, skipping:", entryObj);
                    continue;
                }

                const date = new Date(dateKey);
                if (isNaN(date)) {
                    console.log("❌ Invalid date skipped:", dateKey);
                    continue;
                }

                // If completely empty work on an old entry, we might skip it or keep it as placeholder. User says: Empty work -> skip
                const { theoryWork, practicalWork } = extractWork(entryObj);
                const extraWork = entryObj.extraWork || "";

                if (!theoryWork && !practicalWork && !extraWork) {
                    // Empty work -> skip
                    continue;
                }

                const instructorId = entryObj.instructorId || batch.teacherId || batch.instructorId;
                if (!instructorId) {
                    console.log(`⚠️ Warning: Missing instructorId for batch ${batch.$id}`);
                }

                await databases.createDocument(
                    DATABASE_ID,
                    DAILY_DIARY_COLLECTION_ID,
                    ID.unique(),
                    {
                        date: date.toISOString(),
                        theoryWork: theoryWork,
                        practicalWork: practicalWork,
                        workDone: theoryWork || practicalWork || "-", // satisfy legacy required attribute
                        extraWork: extraWork,
                        hours: entryObj.hours ? Number(entryObj.hours) : null,
                        remarks: extractRemarks(entryObj),
                        instructorId: instructorId || "unknown",
                        batchId: batch.$id
                    }
                );
                
                process.stdout.write(".");
                totalMigrated++;
            } catch (err) {
                console.error(`\n❌ Migration failed for entry in batch ${batch.$id}:`, err.message);
            }
        }
      }
      
      offset += limit;
      console.log(`\nProcessed offset ${offset}. Migrated so far: ${totalMigrated}`);
  }

  console.log("\n✅ Migration complete. Total items correctly structured and linked:", totalMigrated);
}

migrate();
