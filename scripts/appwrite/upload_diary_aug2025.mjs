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
        date: '2025-08-01T00:00:00.000Z',
        theoryWork: 'Cable signal diagram conventions Classification of electronic cables as per the application w.r.t. insulation, gauge, current capacity, flexibility etc.',
        practicalWork: 'Identify various types of cables viz. RF coaxial feeder, screened cable, ribbon cable, RCA connector cable, digital optical audio, video cable.',
        practicalNumbers: ['135'],
    },
    {
        date: '2025-08-02T00:00:00.000Z',
        theoryWork: 'Eca',
        practicalWork: 'Eca',
        practicalNumbers: [],
    },
    {
        date: '2025-08-04T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Identify various types of cables viz. RF coaxial feeder, screened cable, ribbon cable, RCA connector cable, digital optical audio, video cable, RJ45, RJ11.',
        practicalNumbers: ['135'],
    },
    {
        date: '2025-08-05T00:00:00.000Z',
        theoryWork: 'Exam',
        practicalWork: '',
        practicalNumbers: [],
    },
    {
        date: '2025-08-06T00:00:00.000Z',
        theoryWork: 'Cable signal diagram conventions Classification of electronic cables as per the application w.r.t. insulation, gauge, current capacity, flexibility etc.',
        practicalWork: 'Identify suitable connectors, solder/crimp /terminate & test the cable sets.',
        practicalNumbers: ['136'],
    },
    {
        date: '2025-08-07T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Identify suitable connectors, solder/crimp /terminate & test the cable sets.',
        practicalNumbers: ['136'],
    },
    {
        date: '2025-08-08T00:00:00.000Z',
        theoryWork: 'Different types of connector & their terminations to the cables. Male / Female type DB connectors.',
        practicalWork: 'Check the continuity as per the marking on the connector for preparing the cable set.',
        practicalNumbers: ['137'],
    },
    {
        date: '2025-08-11T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Identify and select various connectors and cables inside the CPU cabinet of PC.',
        practicalNumbers: ['138'],
    },
    {
        date: '2025-08-12T00:00:00.000Z',
        theoryWork: 'Ethernet 10 Base cross over cables and pin out assignments, UTP and STP, SCTP, TPC, coaxial, types of fibre optical Cables and Cable trays.',
        practicalWork: 'Identify the suitable connector and cable to connect a computer with a network switch and prepare a cross over cable to connect two network',
        practicalNumbers: ['139'],
    },
    {
        date: '2025-08-13T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Identify the suitable connector and cable to connect a computer with a network switch and prepare a cross over cable to connect two network',
        practicalNumbers: ['139'],
    },
    {
        date: '2025-08-14T00:00:00.000Z',
        theoryWork: 'Different types of connectors Servo 0.1" connectors, FTP, RCA, BNC, HDMI Audio/video connectors like XLR, RCA (phono), 6.3 mm PHONO, 3.5 / 2.5 mm',
        practicalWork: 'Demonstrate various parts of the system unit and motherboard components.',
        practicalNumbers: ['140'],
    },
    {
        date: '2025-08-16T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'eca',
        practicalNumbers: [],
    },
    {
        date: '2025-08-18T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Identify various computer peripherals and connect it to the system.',
        practicalNumbers: ['141'],
    },
    {
        date: '2025-08-21T00:00:00.000Z',
        theoryWork: 'Basic blocks of a computer, Components of desktop and motherboard.',
        practicalWork: 'Disable certain functionality by disconnecting the concerned cables SATA/ PATA.',
        practicalNumbers: ['142'],
    },
    {
        date: '2025-08-22T00:00:00.000Z',
        theoryWork: 'Hardware and software, I/O devices, and their working. Different types of printers, HDD, DVD.',
        practicalWork: 'Replace the CMOS battery and extend a memory module.',
        practicalNumbers: ['143'],
    },
    {
        date: '2025-08-25T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Test and Replace the SMPS.',
        practicalNumbers: ['144'],
    },
    {
        date: '2025-08-28T00:00:00.000Z',
        theoryWork: 'Various ports in the computer. Windows OS MS widows: Starting windows and its operation, file management using explorer, Display & sound properties,',
        practicalWork: 'Replace the given DVD and HDD on the system.',
        practicalNumbers: ['145'],
    },
    {
        date: '2025-08-29T00:00:00.000Z',
        theoryWork: 'screen savers, font management, installation of program, setting and using of control panel, application of accessories, various IT tools and',
        practicalWork: 'Dismantle and assemble the desktop computer system.',
        practicalNumbers: ['146'],
    },
    {
        date: '2025-08-30T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'eca',
        practicalNumbers: [],
    },
];

async function main() {
    console.log(`\n📔 Uploading ${entries.length} diary entries (August 2025)`);
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
