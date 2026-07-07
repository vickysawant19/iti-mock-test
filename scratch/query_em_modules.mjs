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

const TRADE_ID = "69cbe4ec1adc9d43e4e3"; // EM
const SUBJ_ID = "69cbec4e0009538fadd1";  // Trade Practical

async function run() {
    try {
        console.log(`Checking modules for Trade: ${TRADE_ID}, Subject: ${SUBJ_ID}...`);
        
        const responseFirst = await databases.listDocuments(databaseId, colId, [
            Query.equal("tradeId", TRADE_ID),
            Query.equal("subjectId", SUBJ_ID),
            Query.equal("year", "FIRST"),
            Query.limit(100)
        ]);

        console.log(`\n--- FIRST YEAR EM MODULES (${responseFirst.total}) ---`);
        for (const doc of responseFirst.documents) {
            console.log(`- ${doc.moduleId}: ${doc.moduleName} (${doc.moduleDuration} hrs)`);
        }

        const responseSecond = await databases.listDocuments(databaseId, colId, [
            Query.equal("tradeId", TRADE_ID),
            Query.equal("subjectId", SUBJ_ID),
            Query.equal("year", "SECOND"),
            Query.limit(100)
        ]);

        console.log(`\n--- SECOND YEAR EM MODULES (${responseSecond.total}) ---`);
        for (const doc of responseSecond.documents) {
            console.log(`- ${doc.moduleId}: ${doc.moduleName} (${doc.moduleDuration} hrs)`);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
