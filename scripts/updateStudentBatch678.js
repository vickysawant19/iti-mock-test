import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
const UPDATE_PAYLOAD = {
    tradeId: "667e843500333017b716",
    collegeId: "66964e930035f9c415ba",
    enrolledAt: "2024-09-02T05:30:00.000+00:00", // ISO 8601 formatting since mostly appwrite datetimes need this. If it's just string, will re-try.
    role: ["Student"],
    enrolledmentStatus: "Active",
    allBatchIds: [JSON.stringify({ "batchId": "678f75a40c371210980b", "batchName": "2024-2026 V.N.Sawant" })]
};

async function updateProfiles() {
    console.log(`🚀 Starting update for batchId ${TARGET_BATCH_ID}...`);
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
                    Query.equal("batchId", TARGET_BATCH_ID),
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
                // Determine if we need to update based on missing/different fields.
                // But user requested "update their null values ... clear old fild update".
                // We'll just force update these fields.
                
                await dbService.updateDocument(
                    DATABASE_ID,
                    USER_PROFILE_COLLECTION_ID,
                    profile.$id,
                    UPDATE_PAYLOAD
                );
                console.log(`✅ Updated profile ${profile.$id} (${profile.userName || profile.phone || profile.userId})`);
                profilesFixed++;
            } catch (updateErr) {
                console.error(`❌ Failed to update profile ${profile.$id}:`, updateErr.message);
                
                // If enrolledAt fails due to format, retry with exact user string
                if (updateErr.message && updateErr.message.includes("enrolledAt")) {
                    try {
                        console.log(`Retrying profile ${profile.$id} with exact string format...`);
                        const fallbackPayload = { ...UPDATE_PAYLOAD, enrolledAt: "02-09-2024 05:30:00.000" };
                        await dbService.updateDocument(
                            DATABASE_ID,
                            USER_PROFILE_COLLECTION_ID,
                            profile.$id,
                            fallbackPayload
                        );
                        console.log(`✅ Updated profile ${profile.$id} with fallback format`);
                        profilesFixed++;
                    } catch(fallbackErr) {
                        console.error(`❌ Fallback failed for ${profile.$id}:`, fallbackErr.message);
                    }
                }
                
                // Check if enrolledmentStatus was completely wrong:
                if (updateErr.message && updateErr.message.includes("enrolledmentStatus")) {
                    try {
                        console.log(`Retrying profile ${profile.$id} with "enrollmentStatus"...`);
                        const fallbackPayload = { ...UPDATE_PAYLOAD, enrollmentStatus: "Active" };
                        delete fallbackPayload.enrolledmentStatus;
                        await dbService.updateDocument(
                            DATABASE_ID,
                            USER_PROFILE_COLLECTION_ID,
                            profile.$id,
                            fallbackPayload
                        );
                        console.log(`✅ Updated profile ${profile.$id} with enrollmentStatus`);
                        profilesFixed++;
                    } catch(fallbackErr) {
                        console.error(`❌ Fallback failed for ${profile.$id}:`, fallbackErr.message);
                    }
                }
            }
        }

        offset += limit;
        if (profiles.length < limit || offset >= response.total) {
            hasMore = false;
        }
    }

    console.log("───────────────────────────────────────────");
    console.log(`🎉 Update Complete!`);
    console.log(`✅ Total Profiles Fixed: ${profilesFixed}`);
    console.log("───────────────────────────────────────────");
}

updateProfiles().catch(console.error);
