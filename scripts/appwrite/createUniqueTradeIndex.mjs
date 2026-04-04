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

async function createUniqueIndexes() {
    console.log("Enforcing uniqueness for tradeName and tradeCode...");
    try {
        // Create index for tradeName
        console.log("Creating unique index for 'tradeName'...");
        await databases.createIndex(
            databaseId,
            collectionId,
            "unique_tradeName",
            "unique", // type is unique
            ["tradeName"],
            ["asc"]
        );
        console.log("Success: Unique index 'unique_tradeName' created.");

        // Create index for tradeCode
        console.log("Creating unique index for 'tradeCode'...");
        await databases.createIndex(
            databaseId,
            collectionId,
            "unique_tradeCode",
            "unique",
            ["tradeCode"],
            ["asc"]
        );
        console.log("Success: Unique index 'unique_tradeCode' created.");

    } catch (err) {
        if (err.message.includes("already exists")) {
            console.log("Indexes already exist or are being created.");
        } else {
            console.error("Error creating indexes:", err.message);
        }
    }
}

createUniqueIndexes();
