import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const collectionId = process.env.VITE_TRADE_COLLECTION_ID || "667e7755002efc107f60";

async function updateTradeSchema() {
    try {
        console.log("Adding 'tradeCode' attribute to 'tradesTable'...");
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            "tradeCode",
            20,
            true // required
        );
        console.log("Successfully added 'tradeCode' attribute.");
        
        console.log("Waiting for attribute to be ready...");
        await new Promise(resolve => setTimeout(resolve, 5000)); // Sleep for 5s

    } catch (err) {
        if (err.message.includes("already exists")) {
            console.log("'tradeCode' attribute already exists, skipping...");
        } else {
            console.error("Error updating schema:", err.message);
        }
    }
}

updateTradeSchema();
