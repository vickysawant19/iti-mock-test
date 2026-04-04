import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();
client
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkTradeAttributes() {
    try {
        const response = await databases.listAttributes(
            process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest",
            process.env.VITE_TRADE_COLLECTION_ID || "667e7755002efc107f60"
        );
        console.log("Attributes for tradesTable:");
        console.log(response.attributes.map(a => a.key));
    } catch (err) {
        console.error("Error fetching attributes:", err);
    }
}

checkTradeAttributes();
