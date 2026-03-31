import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const ENDPOINT = process.env.VITE_APPWRITE_URL;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.VITE_APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const USER_PROFILE_COLLECTION_ID = process.env.VITE_USER_PROFILE_COLLECTION_ID;

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !USER_PROFILE_COLLECTION_ID) {
    console.error("Missing required environment variables in .env");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const dbService = new Databases(client);

const TARGET_BATCH_ID = "678f75a40c371210980b";
const NEW_BATCH_OBJ = {
    batchId: "678f75a40c371210980b",
    batchName: "2024-2026 V.N.Sawant"
};
const NEW_BATCH_STR = JSON.stringify(NEW_BATCH_OBJ);

async function fixBatchIds() {
    console.log(`🚀 Starting Batch ID Migration for ${TARGET_BATCH_ID}...`);
    let offset = 0;
    const limit = 100;
    let profilesFixed = 0;

    let hasMore = true;
    while (hasMore) {
        console.log(`Fetching user profiles offset ${offset}...`);
        
        let response;
        try {
            response = await dbService.listDocuments(
                DATABASE_ID,
                USER_PROFILE_COLLECTION_ID,
                [
                    Query.limit(limit),
                    Query.offset(offset)
                ]
            );
        } catch (err) {
            console.error("Error fetching profiles:", err);
            break;
        }

        const profiles = response.documents;
        if (profiles.length === 0) break;

        for (const profile of profiles) {
            if (!profile.allBatchIds || !Array.isArray(profile.allBatchIds)) continue;

            let needsUpdate = false;
            const updatedAllBatchIds = profile.allBatchIds.map(item => {
                let parsed;
                let isMatch = false;

                // Check if it's already a JSON string
                try {
                    parsed = JSON.parse(item);
                } catch (e) {
                    // Not valid JSON, might just be the raw ID string
                }

                if (parsed && typeof parsed === 'object') {
                    if (parsed.batchId === TARGET_BATCH_ID || parsed.$id === TARGET_BATCH_ID) {
                        isMatch = true;
                        // Avoid unnecessary update if it's already correct
                        if (parsed.batchName === NEW_BATCH_OBJ.batchName) {
                            isMatch = false; 
                        }
                    }
                } else if (item === TARGET_BATCH_ID) {
                    // Raw string match
                    isMatch = true;
                }

                if (isMatch) {
                    needsUpdate = true;
                    return NEW_BATCH_STR;
                }
                
                // Return original item if no changes needed
                return item;
            });

            if (needsUpdate) {
                try {
                    await dbService.updateDocument(
                        DATABASE_ID,
                        USER_PROFILE_COLLECTION_ID,
                        profile.$id,
                        { allBatchIds: updatedAllBatchIds }
                    );
                    console.log(`✅ Updated profile ${profile.$id} (${profile.userName || profile.userId})`);
                    profilesFixed++;
                } catch (updateErr) {
                    console.error(`❌ Failed to update profile ${profile.$id}:`, updateErr.message);
                }
            }
        }

        offset += limit;
        if (profiles.length < limit || offset >= response.total) {
            hasMore = false;
        }
    }

    console.log("───────────────────────────────────────────");
    console.log(`🎉 Migration Complete!`);
    console.log(`✅ Total Profiles Fixed: ${profilesFixed}`);
    console.log("───────────────────────────────────────────");
}

fixBatchIds().catch(console.error);
