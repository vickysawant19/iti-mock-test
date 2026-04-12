import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'userBatchStats';

async function init() {
    try {
        console.log(`Creating collection ${COLLECTION_ID}...`);
        try {
            await databases.createCollection(DB_ID, COLLECTION_ID, 'userBatchStats');
        } catch(e) {
            if (e.code === 409) {
                console.log('Collection already exists.');
            } else {
                throw e;
            }
        }

        console.log('Creating attributes...');
        // String Attributes
        await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'userId', 50, true);
        await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'batchId', 50, true);
        await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'monthlyAttendance', 5000, false);
        
        // Integer Attributes
        await databases.createIntegerAttribute(DB_ID, COLLECTION_ID, 'totalWorkingDays', false, 0, 10000, 0);
        await databases.createIntegerAttribute(DB_ID, COLLECTION_ID, 'presentDays', false, 0, 10000, 0);
        await databases.createIntegerAttribute(DB_ID, COLLECTION_ID, 'testsSubmitted', false, 0, 10000, 0);
        
        // Double Attributes
        await databases.createFloatAttribute(DB_ID, COLLECTION_ID, 'cumulativeScore', false, 0, 1000000, 0.0);
        await databases.createFloatAttribute(DB_ID, COLLECTION_ID, 'latestScore', false, 0, 100, 0.0);

        console.log('Waiting for attributes to be ready before creating indexes...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s for Appwrite async tasks

        console.log('Creating indexes...');
        try {
            await databases.createIndex(DB_ID, COLLECTION_ID, 'idx_batch_user', 'key', ['batchId', 'userId'], ['ASC', 'ASC']);
        } catch (e) {
            console.log('Index error:', e.message);
        }

        console.log('Collection setup complete.');

    } catch (err) {
        console.error('Migration error:', err);
    }
}

init();
