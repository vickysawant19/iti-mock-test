import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || "");

const databases = new Databases(client);
const DB_ID = 'itimocktest';
const COLLECTION_ID = '667e7755002efc107f60'; // tradesTable

const trades = [
    { tradeName: 'Computer Operator and Programming Assistant', duration: 1 },
    { tradeName: 'Electronics Mechanic',                        duration: 2 },
    { tradeName: 'Refrigeration and Air Conditioner Technician', duration: 2 },
    { tradeName: 'Mechanic Electric Vehicle',                   duration: 2 },
];

async function run() {
    console.log('→ Inserting trades into tradesTable...\n');

    for (const trade of trades) {
        try {
            const doc = await databases.createDocument(DB_ID, COLLECTION_ID, 'unique()', trade);
            console.log(`✅ Added: "${doc.tradeName}" (${doc.duration} year${doc.duration > 1 ? 's' : ''})  [$id: ${doc.$id}]`);
        } catch (err) {
            console.error(`❌ Failed to add "${trade.tradeName}": ${err.message}`);
        }
    }

    console.log('\nDone.');
}

run().catch(err => {
    console.error('\n[Fatal Error]', err.message);
    process.exit(1);
});
