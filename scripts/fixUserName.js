import { Client, Users, Databases, Query } from 'node-appwrite';
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

const usersService = new Users(client);
const dbService = new Databases(client);

async function fixUserNames() {
    console.log("🚀 Starting User Name Fix Migration...");
    let offset = 0;
    const limit = 100;
    let profilesFixed = 0;
    let unfixable = 0;

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
            // Check if userName is null or empty string
            if (!profile.userName || profile.userName.trim() === '') {
                // We need to fetch the user from Auth to get the correct name
                try {
                    const authUser = await usersService.get(profile.userId);
                    
                    if (authUser && authUser.name) {
                        // Patch the profile
                        await dbService.updateDocument(
                            DATABASE_ID,
                            USER_PROFILE_COLLECTION_ID,
                            profile.$id,
                            { userName: authUser.name }
                        );
                        console.log(`✅ Fixed: ${profile.$id} (userId: ${profile.userId}) -> ${authUser.name}`);
                        profilesFixed++;
                    } else {
                        console.log(`⚠️ Warning: Auth user found for ${profile.userId} but has no name.`);
                        unfixable++;
                    }
                } catch (authErr) {
                    console.log(`❌ Failed to retrieve auth user for ${profile.userId} (Profile: ${profile.$id}). It might be deleted.`);
                    unfixable++;
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
    console.log(`⚠️ Unfixable Profiles (deleted or missing name): ${unfixable}`);
    console.log("───────────────────────────────────────────");
}

fixUserNames().catch(console.error);
