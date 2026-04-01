import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = 'itimocktest';
const tradesId = '667e7755002efc107f60';
const collegesId = '66964e180017101cd8aa';

async function migrate() {
    console.log('--- Starting Admin Schema Migration ---');

    // 1. Update Trades
    console.log(`Updating Trades collection (${tradesId})...`);
    try {
        await databases.createStringAttribute(databaseId, tradesId, 'description', 500, false);
        console.log('  [+] Created description attribute');
    } catch (e) {
        console.log(`  [!] description: ${e.message}`);
    }

    try {
        await databases.createBooleanAttribute(databaseId, tradesId, 'isActive', true, true);
        console.log('  [+] Created isActive attribute');
    } catch (e) {
        console.log(`  [!] isActive: ${e.message}`);
    }

    // 2. Update Colleges
    console.log(`Updating Colleges collection (${collegesId})...`);
    try {
        await databases.createBooleanAttribute(databaseId, collegesId, 'isActive', true, true);
        console.log('  [+] Created isActive attribute');
    } catch (e) {
        console.log(`  [!] isActive: ${e.message}`);
    }

    console.log('--- Migration Finished ---');
    console.log('Note: It may take a minute for Appwrite to mark attributes as "available".');
}

migrate();
