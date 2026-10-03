
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

async function createIndexes() {
    try {
        console.log("Creating index for 'tradeId'...");
        await databases.createIndex(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'idx_tradeId', 'key', ['tradeId']);
        
        console.log("Creating index for 'subjectId'...");
        await databases.createIndex(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'idx_subjectId', 'key', ['subjectId']);
        
        console.log("Creating index for 'year'...");
        await databases.createIndex(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'idx_year', 'key', ['year']);

        console.log("Creating index for 'moduleId'...");
        await databases.createIndex(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'idx_moduleId', 'key', ['moduleId']);

        console.log("Indexes creation initiated successfully.");
    } catch (error) {
        console.error("Error:", error.message);
    }
}

createIndexes();
