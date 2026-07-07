import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://auth.itimitra.in/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";

async function run() {
    try {
        console.log("Endpoint:", process.env.VITE_APPWRITE_URL || "https://auth.itimitra.in/v1");
        console.log("Project ID:", process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest");
        console.log("Database ID:", databaseId);

        // Fetch trade for Refrigeration and Air Conditioning Technician
        const tradeColId = process.env.VITE_TRADE_COLLECTION_ID || "667e7755002efc107f60";
        console.log("\n--- TRADES ---");
        const tradeRes = await databases.listDocuments(databaseId, tradeColId, [
            Query.limit(100)
        ]);
        let racTrade = null;
        for (const doc of tradeRes.documents) {
            console.log(`ID: ${doc.$id} | Code: ${doc.tradeCode} | Name: ${doc.tradeName}`);
            if (doc.tradeCode === '998' || doc.tradeName.toLowerCase().includes('refrigeration')) {
                racTrade = doc;
            }
        }

        if (racTrade) {
            console.log(`\nFound RAC Trade: ID = ${racTrade.$id}, Name = ${racTrade.tradeName}`);
        } else {
            console.log("\nRAC Trade not found in list.");
        }

        // Fetch subjects
        const subjectColId = process.env.VITE_SUBJECTS_COLLECTION_ID || "66ac5fcd002dc106c5bb";
        console.log("\n--- SUBJECTS ---");
        const subjRes = await databases.listDocuments(databaseId, subjectColId, [
            Query.limit(100)
        ]);
        for (const doc of subjRes.documents) {
            console.log(`ID: ${doc.$id} | Code: ${doc.subjectCode || 'N/A'} | Name: ${doc.subjectName}`);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
