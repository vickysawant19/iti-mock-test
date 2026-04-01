import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

async function inspect(collectionId) {
    console.log(`Inspecting collection: ${collectionId}`);
    try {
        const res = await databases.listAttributes('itimocktest', collectionId);
        console.log(JSON.stringify(res.attributes.map(a => ({ key: a.key, type: a.type, array: a.array })), null, 2));
    } catch (e) {
        console.error(e);
    }
}

async function main() {
    await inspect('667e7755002efc107f60'); // trades
    await inspect('66964e180017101cd8aa'); // colleges
}

main();
