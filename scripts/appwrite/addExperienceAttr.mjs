import * as sdk from 'node-appwrite';
import 'dotenv/config';

const client = new sdk.Client();
client
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function addAttribute() {
    try {
        console.log("Adding experience attribute...");
        await databases.createStringAttribute(
            process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest",
            process.env.VITE_USER_PROFILE_COLLECTION_ID || "66937340001047368f32",
            "experience", // key
            255, // size
            false // required
        );
        console.log("Successfully created experience attribute");
    } catch (err) {
        console.error("Error creating attribute:", err);
    }
}

addAttribute();
