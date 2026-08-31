import { Client, Databases, Query, ID } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey((process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || ""));

const databases  = new Databases(client);
const DB_ID      = 'itimocktest';
const COL_ID     = 'dailyDiary';
const BATCH_ID   = '69cbe6067b5b4cd6313d';
const INSTR_ID   = '667913410027f95c3a71';

const entries = [
    { date: '2025-06-02T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 14: Assisted in replacing connectors and ports', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-06-03T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 15: Helped in preparing repair reports', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-06-04T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 16: Observed home appliance repair (mixer, iron, etc.)', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-06-05T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 17: Practiced soldering on new circuits', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-06-06T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 18: Tested continuity and voltage on devices', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-06-07T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 19: Reviewed work and received feedback from supervisor', practicalNumbers: [], remarks: 'OJT' }
];

async function main() {
    console.log(`\n📔 Upserting ${entries.length} OJT diary entries (June 2025)`);
    console.log(`🎯 ${DB_ID} / ${COL_ID}  |  batch: ${BATCH_ID}\n`);

    let updated = 0, created = 0, failed = 0;

    for (const entry of entries) {
        const label = entry.date.slice(0, 10);
        const docData = {
            batchId:          BATCH_ID,
            instructorId:     INSTR_ID,
            date:             entry.date,
            theoryWork:       entry.theoryWork,
            practicalWork:    entry.practicalWork,
            extraWork:        'NO',
            hours:            8,
            remarks:          entry.remarks,
            practicalNumbers: entry.practicalNumbers,
        };

        try {
            const result = await databases.listDocuments(DB_ID, COL_ID, [
                Query.equal('batchId', BATCH_ID),
                Query.equal('date', entry.date)
            ]);

            if (result.documents.length > 0) {
                await databases.updateDocument(DB_ID, COL_ID, result.documents[0].$id, docData);
                console.log(`  ✅ ${label} — updated`);
                updated++;
            } else {
                await databases.createDocument(DB_ID, COL_ID, ID.unique(), docData);
                console.log(`  ✨ ${label} — created new`);
                created++;
            }
        } catch (err) {
            console.error(`  ❌ ${label} — ERROR: ${err.message}`);
            failed++;
        }

        await new Promise(r => setTimeout(r, 150));
    }

    console.log(`\n── Summary ──────────────────────────────────`);
    console.log(`  🔄 Updated : ${updated}`);
    console.log(`  ✨ Created : ${created}`);
    console.log(`  ❌ Failed  : ${failed}`);
    console.log(`─────────────────────────────────────────────\n`);
}

main().catch(err => {
    console.error('\n[Fatal]', err.message);
    process.exit(1);
});
