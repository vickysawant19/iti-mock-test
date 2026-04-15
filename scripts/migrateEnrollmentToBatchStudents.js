/**
 * Migration: Copy enrolledAt & status from userProfiles → batchStudents
 *
 * For every userProfile that has enrolledAt or status set,
 * find the matching batchStudents record(s) via studentId = userId
 * and write enrollmentDate + status there.
 *
 * Run with:
 *   node scripts/migrateEnrollmentToBatchStudents.js
 */

import { Client, Databases, Query } from 'node-appwrite';
import 'dotenv/config';

const trimValue = (val) => (val ? val.trim().replace(/^["'](.+)["']$/, '$1') : val);

const client = new Client()
    .setEndpoint(trimValue(process.env.VITE_APPWRITE_URL))
    .setProject(trimValue(process.env.VITE_APPWRITE_PROJECT_ID))
    .setKey(trimValue(process.env.VITE_APPWRITE_API_KEY));

const databases = new Databases(client);

const DB_ID              = trimValue(process.env.VITE_APPWRITE_DATABASE_ID);
const PROFILES_COL       = trimValue(process.env.VITE_USER_PROFILE_COLLECTION_ID);
const BATCH_STUDENTS_COL = trimValue(process.env.VITE_BATCH_STUDENTS_COLLECTION_ID) || 'batchStudents';

async function fetchAllProfiles() {
    const results = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        const res = await databases.listDocuments(DB_ID, PROFILES_COL, [
            Query.limit(limit),
            Query.offset(offset),
        ]);
        results.push(...res.documents);
        if (res.documents.length < limit) break;
        offset += limit;
    }
    return results;
}

async function getBatchStudentRecords(userId) {
    const res = await databases.listDocuments(DB_ID, BATCH_STUDENTS_COL, [
        Query.equal('studentId', userId),
        Query.limit(20),
    ]);
    return res.documents;
}

async function run() {
    console.log(`\n📦  DB: ${DB_ID}`);
    console.log(`📂  userProfiles: ${PROFILES_COL}`);
    console.log(`📂  batchStudents: ${BATCH_STUDENTS_COL}\n`);

    const profiles = await fetchAllProfiles();
    console.log(`Found ${profiles.length} userProfile records.\n`);

    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const profile of profiles) {
        const userId      = profile.userId;
        const enrolledAt  = profile.enrolledAt;
        const status      = profile.status;

        // Skip if nothing to migrate
        if (!enrolledAt && !status) {
            skipped++;
            continue;
        }

        const batchRecords = await getBatchStudentRecords(userId);

        if (batchRecords.length === 0) {
            notFound++;
            console.log(`  ⚠️   No batchStudents record for userId=${userId} (${profile.userName || 'unknown'})`);
            continue;
        }

        for (const record of batchRecords) {
            const payload = {};

            // Only write if batchStudents record doesn't already have a value
            if (enrolledAt && !record.enrollmentDate) {
                payload.enrollmentDate = enrolledAt;
            }
            if (status && !record.status) {
                payload.status = status.toLowerCase(); // normalize to lowercase
            }

            if (Object.keys(payload).length === 0) {
                console.log(`  ⏭️   Already migrated: userId=${userId}, batchId=${record.batchId}`);
                skipped++;
                continue;
            }

            await databases.updateDocument(DB_ID, BATCH_STUDENTS_COL, record.$id, payload);
            console.log(`  ✅  Updated batchId=${record.batchId} for userId=${userId} →`, payload);
            updated++;
        }
    }

    console.log(`\n─────────────────────────────────────────`);
    console.log(`✅  Migrated  : ${updated} batchStudents records`);
    console.log(`⏭️   Skipped   : ${skipped} (no data or already migrated)`);
    console.log(`⚠️   Not found : ${notFound} profiles with no matching batchStudents`);
    console.log(`─────────────────────────────────────────\n`);
}

run().catch(err => {
    console.error('\n❌  Migration failed:', err.message);
    process.exit(1);
});
