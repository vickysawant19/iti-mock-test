
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

async function addMissingAttributes() {
    try {
        console.log("Adding 'tradeId' attribute...");
        await databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'tradeId', 255, false);
        
        console.log("Adding 'subjectId' attribute...");
        await databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'subjectId', 255, false);
        
        console.log("Adding 'year' attribute...");
        await databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'year', 50, false);

        console.log("Attributes creation initiated successfully.");
    } catch (error) {
        console.error("Error:", error.message);
    }
}

addMissingAttributes();
