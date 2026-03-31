import * as sdk from 'node-appwrite';
import 'dotenv/config';

const client = new sdk.Client();
client
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function checkAttribute() {
    try {
        const attribute = await databases.getAttribute(
            process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest",
            process.env.VITE_USER_PROFILE_COLLECTION_ID || "66937340001047368f32",
            "allBatchIds"
        );
        console.log("allBatchIds exact configuration:");
        console.log(attribute);
    } catch (err) {
        console.error("Error fetching attribute:", err);
    }
}

checkAttribute();
