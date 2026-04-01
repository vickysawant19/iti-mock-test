import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = 'itimocktest';

async function addIsActive(collectionId) {
    console.log(`Adding isActive to ${collectionId}...`);
    try {
        // key, required, default
        await databases.createBooleanAttribute(databaseId, collectionId, 'isActive', false, true);
        console.log(`  [+] Success for ${collectionId}`);
    } catch (e) {
        console.error(`  [FAILED] for ${collectionId}:`, e.message);
    }
}

async function main() {
    await addIsActive('667e7755002efc107f60'); // trades
    await addIsActive('66964e180017101cd8aa'); // colleges
}
main();
