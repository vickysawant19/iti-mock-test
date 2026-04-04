import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.APPWRITE_API_KEY || 'standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

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
