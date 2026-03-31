import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const ENDPOINT = process.env.VITE_APPWRITE_URL;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.VITE_APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const USER_PROFILE_COLLECTION_ID = process.env.VITE_USER_PROFILE_COLLECTION_ID;

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const dbService = new Databases(client);

async function check() {
    const res = await dbService.listDocuments(
        DATABASE_ID,
        USER_PROFILE_COLLECTION_ID,
        [
            Query.equal("batchId", "678f75a40c371210980b"),
            Query.limit(1)
        ]
    );
    console.log(JSON.stringify(res.documents[0], null, 2));
}

check().catch(console.error);
