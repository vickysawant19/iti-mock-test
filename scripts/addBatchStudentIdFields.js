import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID         = process.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.VITE_BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';

async function createAttr(fn, name, ...args) {
    try {
        await fn(DB_ID, COLLECTION_ID, name, ...args);
        console.log(`  ✅  Created: ${name}`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`  ⚠️   Already exists (skipping): ${name}`);
        } else {
            console.error(`  ❌  Failed to create ${name}:`, e.message);
            throw e;
        }
    }
}

async function run() {
    console.log(`\n📦  Target collection: ${COLLECTION_ID}  (DB: ${DB_ID})\n`);
    console.log('Adding identity attributes...\n');

    // rollNumber — string 50, optional (representing the Student ID / Roll Number)
    // We cannot name it `studentId` because `studentId` is already the required user ID string (36).
    await createAttr(
        databases.createStringAttribute.bind(databases),
        'rollNumber',
        50,    // size
        false, // required
        null,  // default
        false  // array
    );

    // registerId — string 50, optional
    await createAttr(
        databases.createStringAttribute.bind(databases),
        'registerId',
        50,    // size
        false, // required
        null,  // default
        false  // array
    );

    console.log('\nWaiting 3 s for Appwrite to index new attributes...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n✅  Migration complete.\n');
}

run().catch(err => {
    console.error('\n❌  Migration failed:', err);
    process.exit(1);
});
