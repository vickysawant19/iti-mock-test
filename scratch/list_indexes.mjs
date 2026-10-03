
import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const client = new Client();
client
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://auth.itimitra.in/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.VITE_APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = 'itimocktest';
const QUESTIONS_COLLECTION_ID = '667932c5000ff8e2d769';

async function listIndexes() {
    try {
        const response = await databases.listIndexes(DATABASE_ID, QUESTIONS_COLLECTION_ID);
        console.log("Current Indexes:", response.indexes.map(idx => idx.key));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listIndexes();
