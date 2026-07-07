import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://auth.itimitra.in/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const colId = process.env.VITE_NEW_MODULES_DATA_COLLECTION_ID || "newmodulesdata";

async function run() {
    try {
        console.log("Fetching a few modules from database...");
        const response = await databases.listDocuments(databaseId, colId, [
            Query.limit(5)
        ]);
        console.log(JSON.stringify(response.documents, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
