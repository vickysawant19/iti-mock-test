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
        date: '2025-10-01T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Make the necessary settings on SMD soldering station to solder various ICs of different packages (at least four) by choosing proper crimping tools',
        practicalNumbers: ['163'],
    },
    {
        date: '2025-10-03T00:00:00.000Z',
        theoryWork: 'Specification of various tracks, calculation of track width for different current ratings.',
        practicalWork: 'Make the necessary setting rework of defective surface mount component used soldering / de-soldering method.',
        practicalNumbers: ['164'],
    },
    {
        date: '2025-10-04T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'eca',
        practicalNumbers: [],
    },
    {
        date: '2025-10-05T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Checked and Repair Printed Circuit Boards single, Double layer and important tests for PCBs.',
        practicalNumbers: [],
    },
    {
        date: '2025-10-06T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Checked and Repair Printed Circuit Boards single, Double layer and important tests for PCBs.',
        practicalNumbers: ['165'],
    },
    {
        date: '2025-10-07T00:00:00.000Z',
        theoryWork: 'Cold/ Continuity check of PCBs. Identification of lose / dry solders, broken tracks on printed wiring assemblies. Introduction to Pick place Machine.',
        practicalWork: 'Checked and Repair Printed Circuit Boards single, Double layer and important tests for PCBs.',
        practicalNumbers: ['165'],
    },
    {
        date: '2025-10-08T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Inspect soldered joints, detect the defects and test the PCB for rework.',
        practicalNumbers: ['166'],
    },
    {
        date: '2025-10-09T00:00:00.000Z',
        theoryWork: 'Introduction to Static charges, prevention, handling of static sensitive devices, various standards for ESD.',
        practicalWork: 'Inspect soldered joints, detect the defects and test the PCB for rework.',
        practicalNumbers: ['166'],
    },
    {
        date: '2025-10-10T00:00:00.000Z',
        theoryWork: 'Introduction to non-soldering interconnections.',
        practicalWork: 'Identify different types of fuses along with fuse holders, overload (no volt coil), current adjust (Biometric strips to set the current).',
        practicalNumbers: ['167'],
    },
    {
        date: '2025-10-13T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Test the given MCBs.',
        practicalNumbers: ['168'],
    },
    {
        date: '2025-10-14T00:00:00.000Z',
        theoryWork: 'Construction of Printed Circuit Boards (single, Double, multilayer), Important tests for PCBs.',
        practicalWork: 'Test the given MCBs.',
        practicalNumbers: ['168'],
    },
    {
        date: '2025-10-15T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Connect an ELCB and test the leakage of an electrical motor control circuit.',
        practicalNumbers: ['169'],
    },
    {
        date: '2025-10-16T00:00:00.000Z',
        theoryWork: 'Introduction to rework and repair concepts. Repair of damaged track.',
        practicalWork: 'Connect an ELCB and test the leakage of an electrical motor control circuit.',
        practicalNumbers: ['169'],
    },
    {
        date: '2025-10-17T00:00:00.000Z',
        theoryWork: 'Repair of damaged pad and plated through hole. Repair of solder mask',
        practicalWork: 'Test DC motor and its operating voltage.',
        practicalNumbers: ['170'],
    },
    {
        date: '2025-10-27T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Test DC motor control signal.',
        practicalNumbers: ['171'],
    },
    {
        date: '2025-10-28T00:00:00.000Z',
        theoryWork: 'Necessity of fuse, fuse ratings, types of fuses, fuse bases. Single/ three phase MCBs, single phase ELCBs.',
        practicalWork: 'Test various Low potential motors.',
        practicalNumbers: ['172'],
    },
    {
        date: '2025-10-29T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Test various Low potential motors.',
        practicalNumbers: ['172'],
    },
    {
        date: '2025-10-30T00:00:00.000Z',
        theoryWork: 'Types of contactors, relays and working voltages',
        practicalWork: 'Test stepper motor.',
        practicalNumbers: ['173'],
    },
    {
        date: '2025-10-31T00:00:00.000Z',
        theoryWork: 'Contact currents, protection to contactors and high current applications.',
        practicalWork: 'Demonstrate working process of stepper motor in various Equipment.',
        practicalNumbers: ['174'],
    },
];

async function main() {
    console.log(`\n📔 Uploading ${entries.length} diary entries (October 2025)`);
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
