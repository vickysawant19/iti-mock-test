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
    await inspect(process.env.VITE_TRADE_COLLECTION_ID || 'trades');
    await inspect(process.env.VITE_COLLEGE_COLLECTION_ID || 'colleges');
    await inspect(process.env.VITE_SUBJECTS_COLLECTION_ID || 'subjects');
    await inspect('newmodulesdata');
}

main();
