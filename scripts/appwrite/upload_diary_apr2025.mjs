import { Client, Databases, ID } from 'node-appwrite';

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
        practicalWork: 'Dimmer circuit',
        practicalNumbers: ['97'],
    },
    {
        date: '2025-04-02T00:00:00.000Z',
        theoryWork: 'Power electronics',
        practicalWork: 'UJT circuit',
        practicalNumbers: ['98'],
    },
    {
        date: '2025-04-03T00:00:00.000Z',
        theoryWork: 'Power electronics',
        practicalWork: 'Oscillator',
        practicalNumbers: ['98'],
    },
    {
        date: '2025-04-04T00:00:00.000Z',
        theoryWork: 'W/C Science',
        practicalWork: 'Oscillator',
        practicalNumbers: ['98'],
    },
    {
        date: '2025-04-05T00:00:00.000Z',
        theoryWork: 'ECA',
        practicalWork: 'Oscillator',
        practicalNumbers: ['98'],
    },
    {
        date: '2025-04-07T00:00:00.000Z',
        theoryWork: 'MOSFET & IGBT',
        practicalWork: 'MOSFET testing',
        practicalNumbers: ['99'],
    },
    {
        date: '2025-04-08T00:00:00.000Z',
        theoryWork: 'EMP',
        practicalWork: 'MOSFET identification',
        practicalNumbers: ['99'],
    },
    {
        date: '2025-04-09T00:00:00.000Z',
        theoryWork: 'Switching',
        practicalWork: 'MOSFET circuit',
        practicalNumbers: ['100'],
    },
    {
        date: '2025-04-15T00:00:00.000Z',
        theoryWork: 'EMP',
        practicalWork: 'IGBT circuit',
        practicalNumbers: ['102'],
    },
    {
        date: '2025-04-16T00:00:00.000Z',
        theoryWork: 'MOSFET vs IGBT',
        practicalWork: 'IGBT test',
        practicalNumbers: ['102'],
    },
    {
        date: '2025-04-17T00:00:00.000Z',
        theoryWork: 'Power devices',
        practicalWork: 'LED testing',
        practicalNumbers: ['103'],
    },
    {
        date: '2025-04-19T00:00:00.000Z',
        theoryWork: 'ECA',
        practicalWork: 'LED testing',
        practicalNumbers: ['103'],
    },
    {
        date: '2025-04-21T00:00:00.000Z',
        theoryWork: 'LED & IR LED',
        practicalWork: 'Photovoltaic',
        practicalNumbers: ['104'],
    },
    {
        date: '2025-04-22T00:00:00.000Z',
        theoryWork: 'EMP',
        practicalWork: 'Photovoltaic',
        practicalNumbers: ['104'],
    },
    {
        date: '2025-04-23T00:00:00.000Z',
        theoryWork: 'Photodiode',
        practicalWork: 'Circuit',
        practicalNumbers: ['104'],
    },
    {
        date: '2025-04-24T00:00:00.000Z',
        theoryWork: 'Opto electronics',
        practicalWork: 'Lamp circuit',
        practicalNumbers: ['105'],
    },
    {
        date: '2025-04-25T00:00:00.000Z',
        theoryWork: 'W/C Science',
        practicalWork: 'Lamp circuit',
        practicalNumbers: ['105'],
    },
    {
        date: '2025-04-28T00:00:00.000Z',
        theoryWork: 'Optical sensors',
        practicalWork: 'Phototransistor',
        practicalNumbers: ['106'],
    },
    {
        date: '2025-04-29T00:00:00.000Z',
        theoryWork: 'EMP',
        practicalWork: 'Phototransistor',
        practicalNumbers: ['106'],
    },
    {
        date: '2025-04-30T00:00:00.000Z',
        theoryWork: 'Opto isolators',
        practicalWork: 'Lab work',
        practicalNumbers: ['106'],
    }
];

async function main() {
    console.log(`\n📔 Uploading ${entries.length} diary entries (April 2025)`);
    console.log(`🎯 ${DB_ID} / ${COL_ID}  |  batch: ${BATCH_ID}\n`);

    let created = 0, skipped = 0, failed = 0;

    for (const entry of entries) {
        const label = entry.date.slice(0, 10);
        const doc = {
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
            await databases.createDocument(DB_ID, COL_ID, ID.unique(), doc);
            console.log(`  ✅ ${label} — uploaded`);
            created++;
        } catch (err) {
            if (err.code === 409) {
                console.log(`  ⏩ ${label} — already exists (skipped)`);
                skipped++;
            } else {
                console.error(`  ❌ ${label} — ERROR: ${err.message}`);
                failed++;
            }
        }

        await new Promise(r => setTimeout(r, 150));
    }

    console.log(`\n── Summary ──────────────────────────────────`);
    console.log(`  ✅ Created : ${created}`);
    console.log(`  ⏩ Skipped : ${skipped}`);
    console.log(`  ❌ Failed  : ${failed}`);
    console.log(`─────────────────────────────────────────────\n`);
}

main().catch(err => {
    console.error('\n[Fatal]', err.message);
    process.exit(1);
});
