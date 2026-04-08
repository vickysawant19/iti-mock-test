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
        date: '2025-03-01T00:00:00.000Z',
        theoryWork: 'ECA / LIB / Unit Project',
        practicalWork: 'Practical work on amplifier circuits',
        practicalNumbers: ['85'],
    },
    {
        date: '2025-03-03T00:00:00.000Z',
        theoryWork: 'Positive feedback & oscillator basics',
        practicalWork: 'Demonstration of Colpitts & Hartley oscillator',
        practicalNumbers: ['86'],
    },
    {
        date: '2025-03-04T00:00:00.000Z',
        theoryWork: 'EMP – Time Management',
        practicalWork: 'RC phase shift oscillator',
        practicalNumbers: ['87'],
    },
    {
        date: '2025-03-05T00:00:00.000Z',
        theoryWork: 'Study of oscillators (Colpitts, Hartley, Crystal, RC)',
        practicalWork: 'Construct oscillator circuits',
        practicalNumbers: ['88'],
    },
    {
        date: '2025-03-06T00:00:00.000Z',
        theoryWork: 'Multivibrators (astable, monostable, bistable)',
        practicalWork: 'Demonstration using transistors',
        practicalNumbers: ['84'],
    },
    {
        date: '2025-03-11T00:00:00.000Z',
        theoryWork: 'EMP – Entrepreneurs',
        practicalWork: 'Clipper circuits (series & shunt)',
        practicalNumbers: ['91'],
    },
    {
        date: '2025-03-12T00:00:00.000Z',
        theoryWork: 'Diode clipper, clamper & limiting circuits',
        practicalWork: 'Construct clipping circuits',
        practicalNumbers: ['92'],
    },
    {
        date: '2025-03-13T00:00:00.000Z',
        theoryWork: 'Applications of clipper & clamper',
        practicalWork: 'Clamping circuits with Zener diode',
        practicalNumbers: ['93'],
    },
    {
        date: '2025-03-17T00:00:00.000Z',
        theoryWork: 'FET & JFET construction & comparison with BJT',
        practicalWork: 'Identify power electronic components',
        practicalNumbers: ['94'],
    },
    {
        date: '2025-03-18T00:00:00.000Z',
        theoryWork: 'EMP – Drawing Instruments',
        practicalWork: 'Construct FET amplifier',
        practicalNumbers: ['95'],
    },
    {
        date: '2025-03-19T00:00:00.000Z',
        theoryWork: 'Voltage/current relations & impedance in FET',
        practicalWork: 'Test FET amplifier',
        practicalNumbers: ['95'],
    },
    {
        date: '2025-03-20T00:00:00.000Z',
        theoryWork: 'Terminal characteristics of FET',
        practicalWork: 'FET amplifier testing',
        practicalNumbers: ['95'],
    },
    {
        date: '2025-03-21T00:00:00.000Z',
        theoryWork: 'W/Cul Science',
        practicalWork: 'SCR circuit using UJT triggering',
        practicalNumbers: ['96'],
    },
    {
        date: '2025-03-24T00:00:00.000Z',
        theoryWork: 'Heat sink – uses & purpose',
        practicalWork: 'SCR circuit using UJT triggering',
        practicalNumbers: ['96'],
    },
    {
        date: '2025-03-25T00:00:00.000Z',
        theoryWork: 'EMP – Stock lettering',
        practicalWork: 'SCR circuit testing',
        practicalNumbers: ['96'],
    },
    {
        date: '2025-03-26T00:00:00.000Z',
        theoryWork: 'Heat sink applications',
        practicalWork: 'UJT triggering circuit with TRIAC',
        practicalNumbers: ['96'],
    },
    {
        date: '2025-03-27T00:00:00.000Z',
        theoryWork: 'FET in measuring instruments',
        practicalWork: 'Dimmer circuit using DIAC',
        practicalNumbers: ['97'],
    },
    {
        date: '2025-03-28T00:00:00.000Z',
        theoryWork: 'W/Cul Science',
        practicalWork: 'Dimmer circuit using TRIAC',
        practicalNumbers: ['97'],
    },
    {
        date: '2025-03-29T00:00:00.000Z',
        theoryWork: 'ECA / LIB / Project',
        practicalWork: 'Dimmer circuit using DIAC',
        practicalNumbers: ['97'],
    }
];

async function main() {
    console.log(`\n📔 Uploading ${entries.length} diary entries (March 2025)`);
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
