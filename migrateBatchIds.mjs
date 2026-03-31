import * as sdk from 'node-appwrite';
import fs from 'fs';
import 'dotenv/config';

const client = new sdk.Client();
client
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const COLL_ID = process.env.VITE_APPWRITE_USER_PROFILE_COLLECTION_ID || "66937340001047368f32";

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMigration() {
    try {
        console.log("1. Fetching all user profiles...");
        let allProfiles = [];
        let hasMore = true;
        let lastId = null;

        while (hasMore) {
            const queries = [sdk.Query.limit(100)];
            if (lastId) queries.push(sdk.Query.cursorAfter(lastId));

            const response = await databases.listDocuments(DB_ID, COLL_ID, queries);
            allProfiles = allProfiles.concat(response.documents);

            if (response.documents.length < 100) {
                hasMore = false;
            } else {
                lastId = response.documents[response.documents.length - 1].$id;
            }
        }

        console.log(`Found ${allProfiles.length} profiles. Saving backup...`);
        // We save exactly what they had so in case of failure we can parse it manually.
        const backupData = allProfiles.map(p => ({
            $id: p.$id,
            allBatchIds: p.allBatchIds, 
        }));
        fs.writeFileSync("userProfile_backup_batches.json", JSON.stringify(backupData, null, 2));
        console.log("Backup complete.");

        // Clean memory by extracting ONLY what we need for the migration list
        // allBatchIds originally was an array of JSON strings, e.g. ['{"batchId": "..."}']
        const migrationList = backupData.map(p => {
            let newlyFormatted = "[]";
            if (p.allBatchIds && Array.isArray(p.allBatchIds) && p.allBatchIds.length > 0) {
                // parse the internal strings into a pure array of objects
                const parsedArray = p.allBatchIds.map(item => {
                    try {
                        return typeof item === "string" ? JSON.parse(item) : item;
                    } catch (e) {
                        return item; // fallback if it cannot be parsed
                    }
                });
                newlyFormatted = JSON.stringify(parsedArray);
            }
            return {
                id: p.$id,
                newVal: newlyFormatted
            };
        });

        console.log("2. Deleting old `allBatchIds` attribute...");
        await databases.deleteAttribute(DB_ID, COLL_ID, "allBatchIds");
        
        console.log("Waiting for deletion to complete on Appwrite backend (max 15s)...");
        await sleep(10000); // give appwrite time to flush the deletion

        console.log("3. Recreating `allBatchIds` as a string of max 5000 characters...");
        let created = false;
        let createRetries = 0;
        while (!created && createRetries < 20) {
            try {
                await databases.createStringAttribute(DB_ID, COLL_ID, "allBatchIds", 5000, false);
                created = true;
                console.log("Successfully queued attribute creation.");
            } catch(e) {
                if (e.message.includes("Attribute already exists")) {
                     console.log("Deletion still pending... waiting 5s.");
                     await sleep(5000);
                     createRetries++;
                } else if (e.message.includes("not available")) {
                     console.log("Collection locked or processing... waiting 5s.");
                     await sleep(5000);
                     createRetries++;
                } else {
                     throw e;
                }
            }
        }
        
        if (!created) {
           console.error("Failed to create attribute after many retries.");
           return;
        }

        console.log("Waiting for new attribute to become available (max 15s)...");
        let isAvailable = false;
        let retries = 0;
        while (!isAvailable && retries < 15) {
            try {
                const attr = await databases.getAttribute(DB_ID, COLL_ID, "allBatchIds");
                if (attr.status === 'available') {
                    isAvailable = true;
                } else {
                    await sleep(2000);
                }
            } catch (err) {
                await sleep(2000); // Not found yet, keep waiting
            }
            retries++;
        }

        if (!isAvailable) {
            console.error("Critical: Could not verify new attribute became available. Run script manually to restore.");
            return;
        }

        console.log("4. Restoring data to all affected profiles...");
        let successCount = 0;
        for (const target of migrationList) {
            try {
                // If it is '[]', it's safe to push.
                await databases.updateDocument(DB_ID, COLL_ID, target.id, {
                    allBatchIds: target.newVal
                });
                successCount++;
            } catch(e) {
                console.error(`Failed patching profile: ${target.id}`, e.message);
            }
        }

        console.log(`Migration complete! Successfully patched ${successCount} out of ${migrationList.length} user profiles.`);

    } catch (err) {
        console.error("Migration failed fatally:", err);
    }
}

runMigration();
