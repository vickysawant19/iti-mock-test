import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.APPWRITE_API_KEY || 'standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases = new Databases(client);
const DB_ID = 'itimocktest';
const COLLECTION_ID = '66964e180017101cd8aa'; // collagesTable

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
    // 1. Add 'location' attribute if not already present
    try {
        await databases.getAttribute(DB_ID, COLLECTION_ID, 'location');
        console.log("✔ Attribute 'location' already exists.");
    } catch (e) {
        if (e.code === 404) {
            console.log("→ Creating attribute 'location'...");
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'location', 100, false, null, false);

            // Wait for it to become available
            let ready = false;
            for (let i = 0; i < 20; i++) {
                await sleep(1500);
                const attr = await databases.getAttribute(DB_ID, COLLECTION_ID, 'location');
                if (attr.status === 'available') { ready = true; break; }
                console.log(`   Waiting... (status: ${attr.status})`);
            }
            if (!ready) throw new Error("Attribute 'location' never became available.");
            console.log("✔ Attribute 'location' created and ready.");
        } else {
            throw e;
        }
    }

    // 2. Insert the college document
    console.log("\n→ Inserting college document...");
    const doc = await databases.createDocument(DB_ID, COLLECTION_ID, 'unique()', {
        collageName: 'Fakkrojirao Desai Government Industrial Training Institute Dodamarg',
        location: 'Dodamarg',
    });

    console.log(`\n✅ College added! Document $id: ${doc.$id}`);
    console.log(`   collageName : ${doc.collageName}`);
    console.log(`   location    : ${doc.location}`);
}

run().catch(err => {
    console.error('\n[Fatal Error]', err.message);
    process.exit(1);
});
