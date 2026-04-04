import { Client, Databases, ID } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.APPWRITE_API_KEY || 'standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

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
