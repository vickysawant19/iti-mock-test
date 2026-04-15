/**
 * Migration: Add enrollment fields to the batchStudents collection
 *
 * New columns:
 *   - enrollmentDate  (datetime, optional)  — set by teacher when approving
 *   - status          (string 20, required)  — active | inactive | dropped | graduated | on_leave
 *   - approvedBy      (string 36, optional)  — teacher userId who approved
 *   - remarks         (string 500, optional) — free-text notes
 *
 * Run with:
 *   node scripts/addBatchStudentEnrollmentFields.js
 */

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

    console.log('Adding attributes...\n');

    // enrollmentDate — datetime, optional
    await createAttr(
        databases.createDatetimeAttribute.bind(databases),
        'enrollmentDate',
        false,   // required
        null,    // default
        false    // array
    );

    // status — string 20, NOT required, default "active"
    await createAttr(
        databases.createStringAttribute.bind(databases),
        'status',
        20,        // size
        false,     // required
        'active',  // default
        false      // array
    );

    // approvedBy — string 36, optional
    await createAttr(
        databases.createStringAttribute.bind(databases),
        'approvedBy',
        36,    // size
        false, // required
        null,  // default
        false  // array
    );

    // remarks — string 500, optional
    await createAttr(
        databases.createStringAttribute.bind(databases),
        'remarks',
        500,   // size
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
