import { Client, Databases, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1")
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest")
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const collectionId = process.env.VITE_TRADE_COLLECTION_ID || "667e7755002efc107f60";

async function populateBulkTrades() {
    try {
        const rawData = fs.readFileSync('all_trades_dataset.json', 'utf8');
        const tradesData = JSON.parse(rawData);
        
        console.log(`Starting bulk population for ${tradesData.length} total potential trades...`);
        
        // 1. Fetch all existing trades to optimize duplicate checking
        console.log("Fetching existing trades from Appwrite...");
        const existingDocs = await databases.listDocuments(databaseId, collectionId, [Query.limit(5000)]);
        const existingNames = new Set(existingDocs.documents.map(d => d.tradeName.toLowerCase().trim()));
        const existingCodes = new Set(existingDocs.documents.map(d => d.tradeCode.trim()));

        console.log(`Found ${existingDocs.total} existing records. Filtering new ones...`);

        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const trade of tradesData) {
            const normalizedName = trade.tradeName.toLowerCase().trim();
            const normalizedCode = trade.tradeCode.trim();

            if (existingNames.has(normalizedName) || existingCodes.has(normalizedCode)) {
                skippedCount++;
                continue;
            }

            try {
                await databases.createDocument(
                    databaseId,
                    collectionId,
                    ID.unique(),
                    {
                        tradeName: trade.tradeName.trim(),
                        tradeCode: trade.tradeCode.trim(),
                        duration: trade.duration,
                        description: trade.description,
                        isActive: true
                    }
                );
                
                // Add to our local set to prevent internal duplicates in the batch if any
                existingNames.add(normalizedName);
                existingCodes.add(normalizedCode);
                
                createdCount++;
                if (createdCount % 10 === 0) {
                    console.log(`Progress: ${createdCount} trades added...`);
                }
            } catch (error) {
                console.error(`! Error creating trade "${trade.tradeName}":`, error.message);
                errorCount++;
            }
        }

        console.log('\n--- BULK POPULATION SUMMARY ---');
        console.log(`Total Scanned: ${tradesData.length}`);
        console.log(`Newly Created: ${createdCount}`);
        console.log(`Skipped (Duplicates): ${skippedCount}`);
        console.log(`Failed (Errors): ${errorCount}`);
        console.log('------------------------------');

    } catch (err) {
        console.error("Migration fatal error:", err.message);
    }
}

populateBulkTrades();
