import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

async function verifyTrades() {
    try {
        const res = await databases.listDocuments(
            process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest",
            process.env.VITE_TRADE_COLLECTION_ID || "667e7755002efc107f60"
        );
        console.log(`--- TRADES IN COLLECTION (${res.total}) ---`);
        res.documents.forEach(t => {
            console.log(`- ${t.tradeName} | Duration: ${t.duration}Y | Active: ${t.isActive}`);
        });
        console.log('------------------------------------------');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

verifyTrades();
