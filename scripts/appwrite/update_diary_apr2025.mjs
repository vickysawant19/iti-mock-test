import { Client, Databases, Query, ID } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases  = new Databases(client);
const DB_ID      = 'itimocktest';
const COL_ID     = 'dailyDiary';
const BATCH_ID   = '69cbe6067b5b4cd6313d';
const INSTR_ID   = '667913410027f95c3a71';

const entries = [
    {
        date: '2025-04-01T00:00:00.000Z',
        theoryWork: 'EMP',
        practicalWork: 'Construct simple dimmer circuit using DIAC (4 hrs)',
        practicalNumbers: ['97'],
    },
    {
        date: '2025-04-02T00:00:00.000Z',
        theoryWork: 'Working of different power electronic components (SCR, TRIAC, DIAC, UJT) – Part 2 (2 hrs)',
        practicalWork: 'Construct UJT-based firing circuit and study frequency change (5 hrs)',
        practicalNumbers: ['98'],
    },
    {
        date: '2025-04-03T00:00:00.000Z',
        theoryWork: 'Working of different power electronic components (SCR, TRIAC, DIAC, UJT) – Part 3 (2 hrs)',
        practicalWork: 'Construct UJT-based firing oscillator and study frequency (5 hrs)',
        practicalNumbers: ['98'],
    },
    {
        date: '2025-04-04T00:00:00.000Z',
        theoryWork: 'W/Cul Science',
        practicalWork: 'Construct UJT-based triggering oscillator and study frequency (5 hrs)',
        practicalNumbers: ['98'],
    },
    {
        date: '2025-04-05T00:00:00.000Z',
        theoryWork: 'ECA / LIB / Unit Project',
        practicalWork: 'Construct UJT-based triggering oscillator and study frequency (2 hrs)',
        practicalNumbers: ['98'],
    },
    {
        date: '2025-04-07T00:00:00.000Z',
        theoryWork: 'Overview of MOSFET power, MOSFET and IGBT characteristics',
        practicalWork: 'Identify various power MOSFET by part number (multimeter test)',
        practicalNumbers: ['99'],
    },
    {
        date: '2025-04-08T00:00:00.000Z',
        theoryWork: 'EMP',
        practicalWork: 'Identify various MOSFET by number – Part 2',
        practicalNumbers: ['99'],
    },
    {
        date: '2025-04-09T00:00:00.000Z',
        theoryWork: 'Characteristics, switching speed & power rating',
        practicalWork: 'Construct MOSFET test circuit with load – Part 1',
        practicalNumbers: ['100'],
    },
    {
        date: '2025-04-15T00:00:00.000Z',
        theoryWork: 'EMP',
        practicalWork: 'Construct IGBT test circuit with small load – Part 1 (2 hrs)',
        practicalNumbers: ['102'],
    },
    {
        date: '2025-04-16T00:00:00.000Z',
        theoryWork: 'Characteristics of MOSFET, differentiation from IGBT',
        practicalWork: 'Construct IGBT test circuit without small load – Part 2 (3 hrs) and observe working (2 hrs)',
        practicalNumbers: ['102'],
    },
    {
        date: '2025-04-17T00:00:00.000Z',
        theoryWork: 'Protection, switching speed, power ratings in power devices',
        practicalWork: 'Test LEDs with DC supply – Part 1 (5 hrs)',
        practicalNumbers: ['103'],
    },
    {
        date: '2025-04-19T00:00:00.000Z',
        theoryWork: 'ECA / LIB / Unit Project',
        practicalWork: 'Test LEDs with DC supply',
        practicalNumbers: ['103'],
    },
    {
        date: '2025-04-21T00:00:00.000Z',
        theoryWork: 'Introduction to LED and IR LED characteristics and applications (2 hrs)',
        practicalWork: 'Construct circuit to test photovoltaic cell – Part 1 (5 hrs)',
        practicalNumbers: ['104'],
    },
    {
        date: '2025-04-22T00:00:00.000Z',
        theoryWork: 'EMP',
        practicalWork: 'Construct circuit to test photovoltaic cell – Part 2 (2 hrs)',
        practicalNumbers: ['104'],
    },
    {
        date: '2025-04-23T00:00:00.000Z',
        theoryWork: 'Working & application of photodiode and phototransistor, characteristics and uses (2 hrs)',
        practicalWork: 'Construct circuit to test photovoltaic cell – Part 3 (5 hrs)',
        practicalNumbers: ['104'],
    },
    {
        date: '2025-04-24T00:00:00.000Z',
        theoryWork: 'Detailed knowledge of opto-electronic components and their applications (2 hrs)',
        practicalWork: 'Construct circuit to switch a lamp load using photodiode – Part 1 (4 hrs)',
        practicalNumbers: ['105'],
    },
    {
        date: '2025-04-25T00:00:00.000Z',
        theoryWork: 'W/Cul Science',
        practicalWork: 'Construct circuit to switch a lamp load using photodiode – Part 2 (2 hrs)',
        practicalNumbers: ['105'],
    },
    {
        date: '2025-04-28T00:00:00.000Z',
        theoryWork: 'Optical sensors & opto-couplers – introduction (2 hrs)',
        practicalWork: 'Construct circuit to switch a lamp load using phototransistor – Part 1',
        practicalNumbers: ['106'],
    },
    {
        date: '2025-04-29T00:00:00.000Z',
        theoryWork: 'EMP',
        practicalWork: 'Construct circuit to switch a lamp load using phototransistor – Part 2',
        practicalNumbers: ['106'],
    },
    {
        date: '2025-04-30T00:00:00.000Z',
        theoryWork: 'Circuit with opto-isolators & applications (2 hrs)',
        practicalWork: 'Lab work: analysis & documentation (5 hrs)',
        practicalNumbers: ['106'],
    }
];

async function main() {
    console.log(`\n📔 Updating ${entries.length} diary entries (April 2025)`);
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
            remarks:          '-',
            practicalNumbers: entry.practicalNumbers,
        };

        try {
            // First search for existing document using date and batchId
            const result = await databases.listDocuments(DB_ID, COL_ID, [
                Query.equal('batchId', BATCH_ID),
                Query.equal('date', entry.date)
            ]);

            if (result.documents.length > 0) {
                // Update the first matching document
                await databases.updateDocument(DB_ID, COL_ID, result.documents[0].$id, docData);
                console.log(`  ✅ ${label} — updated`);
                updated++;
            } else {
                // Create if not exists snippet just in case
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
