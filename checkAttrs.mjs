import * as sdk from 'node-appwrite';
import 'dotenv/config';

const client = new sdk.Client();
client
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function checkAttributes() {
    try {
        const response = await databases.listAttributes(
            process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest",
            process.env.VITE_USER_PROFILE_COLLECTION_ID || "66937340001047368f32"
        );
        console.log("Attributes:");
        response.attributes.forEach(attr => {
            console.log(`- ${attr.key} (${attr.type}, required: ${attr.required})`);
        });
    } catch (err) {
        console.error("Error fetching attributes:", err);
    }
}

checkAttributes();
