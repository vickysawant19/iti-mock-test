import { Client, Databases, Query } from "node-appwrite";
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  try {
    console.log("Checking and creating new attributes...");
    const existingAttrs = await databases.listAttributes(DATABASE_ID, DAILY_DIARY_COLLECTION_ID);
    const attrKeys = existingAttrs.attributes.map(a => a.key);

    if (!attrKeys.includes("theoryWork")) {
      console.log("Creating theoryWork attribute...");
      await databases.createStringAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "theoryWork", 1000, false);
    }
    if (!attrKeys.includes("practicalWork")) {
      console.log("Creating practicalWork attribute...");
      await databases.createStringAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "practicalWork", 1000, false);
    }

    console.log("Waiting 10s for attributes to sync...");
    await sleep(10000); // 10s wait

    let hasMore = true;
    let offset = 0;
    const limit = 50;
    const groupedByDateAndBatch = {};
    const deleteIds = [];

    console.log("Fetching and mapping existing documents...");
    while (hasMore) {
      const res = await databases.listDocuments(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, [
        Query.limit(limit),
        Query.offset(offset)
      ]);
      const docs = res.documents;
      if (docs.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const doc of docs) {
         // Create a composite key for merging docs with same batchId and date
         const key = `${doc.batchId}_${doc.date}`;
         if (!groupedByDateAndBatch[key]) {
             groupedByDateAndBatch[key] = {
                 keepId: doc.$id,
                 data: { ...doc },
                 hasUpdates: false
             };
         }

         const primaryGroup = groupedByDateAndBatch[key];

         if (primaryGroup.keepId !== doc.$id) {
             console.log(`Merging ${doc.$id} into ${primaryGroup.keepId}`);
             deleteIds.push(doc.$id);
             
             // Merge fields into primary Group
             if (doc.workType === "theory") {
                 primaryGroup.data.theoryWork = doc.workDone || primaryGroup.data.theoryWork;
                 primaryGroup.hasUpdates = true;
             } else if (doc.workType === "practical") {
                 primaryGroup.data.practicalWork = doc.workDone || primaryGroup.data.practicalWork;
                 if (doc.remarks && doc.remarks !== "-") {
                     primaryGroup.data.remarks = doc.remarks;
                 }
                 primaryGroup.hasUpdates = true;
             }
         } else {
             // Map existing fields to new schema if not mapped
             if (!primaryGroup.data.theoryWork && primaryGroup.data.workType === "theory" && primaryGroup.data.workDone) {
                 primaryGroup.data.theoryWork = primaryGroup.data.workDone;
                 primaryGroup.hasUpdates = true;
             }
             if (!primaryGroup.data.practicalWork && primaryGroup.data.workType === "practical" && primaryGroup.data.workDone) {
                 primaryGroup.data.practicalWork = primaryGroup.data.workDone;
                 primaryGroup.hasUpdates = true;
             }
         }
      }
      offset += limit;
    }

    console.log("Running updates...");
    
    // Process updates
    for (const key in groupedByDateAndBatch) {
        const group = groupedByDateAndBatch[key];
        if (group.hasUpdates) {
            try {
                await databases.updateDocument(
                    DATABASE_ID,
                    DAILY_DIARY_COLLECTION_ID,
                    group.keepId,
                    {
                        theoryWork: group.data.theoryWork || "",
                        practicalWork: group.data.practicalWork || "",
                        remarks: group.data.remarks || "-",
                    }
                );
                process.stdout.write("U");
            } catch (err) {
                console.error(`\nFailed to update ${group.keepId}:`, err.message);
            }
        }
    }

    console.log("\nDeleting merged duplicates...");
    // Process deletes
    for (const delId of deleteIds) {
        try {
            await databases.deleteDocument(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, delId);
            process.stdout.write("D");
        } catch (err) {
            console.error(`\nFailed to delete ${delId}:`, err.message);
        }
    }

    console.log("\nSchema update and mapping completed.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

run();
