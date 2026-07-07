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

const SUBJ_ID = "69cbec4d002dbcf7a5c4";  // Trade Theory

async function run() {
    try {
        console.log(`Checking modules for Trade Theory (Subject: ${SUBJ_ID})...`);
        const response = await databases.listDocuments(databaseId, colId, [
            Query.equal("subjectId", SUBJ_ID),
            Query.limit(10)
        ]);

        console.log(`Found ${response.total} existing Trade Theory modules.`);
        for (const doc of response.documents) {
            console.log(`- Trade: ${doc.tradeId} | Year: ${doc.year} | ${doc.moduleId}: ${doc.moduleName}`);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
