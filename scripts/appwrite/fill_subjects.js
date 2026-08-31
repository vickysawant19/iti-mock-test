import { Client, Databases, ID } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || "");

const databases = new Databases(client);
const DB_ID = 'itimocktest';
const COL_ID = '66ac5fcd002dc106c5bb'; // tradeSubjects

const subjects = [
    "Trade Theory",
    "Trade Practical",
    "Engineering Drawing",
    "Workshop Calculation",
    "Employability Skills"
];

async function fillSubjects() {
    console.log('→ Filling subjects into tradeSubjects collection...\n');

    for (const subject of subjects) {
        try {
            const res = await databases.createDocument(DB_ID, COL_ID, ID.unique(), {
                subjectName: subject
            });
            console.log(`✅ Added: "${res.subjectName}" [$id: ${res.$id}]`);
        } catch (error) {
            console.error(`❌ Failed to add "${subject}": ${error.message}`);
        }
    }

    console.log('\nDone.');
}

fillSubjects();
