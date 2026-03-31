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

async function fixBatchIds() {
    console.log("🚀 Starting Batch ID Fix Migration...");
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
                    Query.equal('approvedBy', '667913410027f95c3a71'),
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
            try {
                const currentBatchIds = profile.allBatchIds || [];
                const batchStr = JSON.stringify({"batchId":"678f75a40c371210980b", "batchName":"2024-2026 V.N.Sawant"});
                
                // Avoid duplicates
                if (!currentBatchIds.includes(batchStr)) {
                    currentBatchIds.push(batchStr);
                    await dbService.updateDocument(
                        DATABASE_ID,
                        USER_PROFILE_COLLECTION_ID,
                        profile.$id,
                        { allBatchIds: currentBatchIds }
                    );
                    console.log(`✅ Fixed: ${profile.$id} (userId: ${profile.userId})`);
                    profilesFixed++;
                } else {
                    console.log(`⏭️ Skipped (already has batch): ${profile.$id}`);
                }
            } catch (err) {
                console.error(`❌ Failed to update profile ${profile.$id}:`, err);
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
