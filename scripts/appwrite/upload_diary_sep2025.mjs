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
        date: '2025-09-01T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Boot the system from Different options.',
        practicalNumbers: ['147'],
    },
    {
        date: '2025-09-03T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Install a Printer driver software and test for print outs.',
        practicalNumbers: ['149'],
    },
    {
        date: '2025-09-04T00:00:00.000Z',
        theoryWork: 'Network features - Network medias Network topologies',
        practicalWork: 'Install antivirus software, scan the system and explore the options in the antivirus software.',
        practicalNumbers: ['150'],
    },
    {
        date: '2025-09-06T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'eca',
        practicalNumbers: [],
    },
    {
        date: '2025-09-08T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Install MS office software.',
        practicalNumbers: ['151'],
    },
    {
        date: '2025-09-09T00:00:00.000Z',
        theoryWork: 'protocols- TCP/IP, UDP, FTP, models and types. Specification and standards, types of cables.',
        practicalWork: 'Browse search engines, create email accounts, practice sending and',
        practicalNumbers: ['152'],
    },
    {
        date: '2025-09-10T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Prepare terminations, make UTP and STP cable connectors and test.',
        practicalNumbers: ['153'],
    },
    {
        date: '2025-09-11T00:00:00.000Z',
        theoryWork: 'UTP, STP, Coaxial cables. Network components like hub, Ethernet switch, router, NIC Cards, connectors, media and firewall.',
        practicalWork: 'Configure a wireless Wi-Fi network.',
        practicalNumbers: ['154'],
    },
    {
        date: '2025-09-12T00:00:00.000Z',
        theoryWork: 'Difference between PC & Server.',
        practicalWork: 'Identification of 2, 3, 4 terminal SMD components.',
        practicalNumbers: ['155'],
    },
    {
        date: '2025-09-15T00:00:00.000Z',
        theoryWork: 'ES',
        practicalWork: 'De-solder the SMD components from the given PCB.',
        practicalNumbers: ['156'],
    },
    {
        date: '2025-09-16T00:00:00.000Z',
        theoryWork: 'Introduction to SMD technology Identification of 2, 3, 4 terminal SMD components.',
        practicalWork: 'Solder the SMD components in the same PCB.',
        practicalNumbers: ['157'],
    },
    {
        date: '2025-09-17T00:00:00.000Z',
        theoryWork: 'WCS /ED',
        practicalWork: 'Solder the SMD components in the same PCB.',
        practicalNumbers: ['157'],
    },
    {
        date: '2025-09-18T00:00:00.000Z',
        theoryWork: 'Advantages of SMD components over conventional lead components',
        practicalWork: 'Check for cold continuity of PCB.',
        practicalNumbers: ['158'],
    },
    {
        date: '2025-09-19T00:00:00.000Z',
        theoryWork: 'Soldering of SM assemblies - Reflow soldering. Tips for selection of hardware, Inspection of SM.',
        practicalWork: 'Identification of loose /dry solder, broken tracks on printed wired assemblies',
        practicalNumbers: ['159'],
    },
    {
        date: '2025-09-20T00:00:00.000Z',
        theoryWork: 'ECA',
        practicalWork: 'ECA',
        practicalNumbers: [],
    },
    {
        date: '2025-09-22T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Identify various connections and setup required for SMD Soldering station',
        practicalNumbers: ['160'],
    },
    {
        date: '2025-09-23T00:00:00.000Z',
        theoryWork: 'Introduction to Surface Mount Technology (SMT).',
        practicalWork: 'Identify various connections and setup required for SMD Soldering station',
        practicalNumbers: ['160'],
    },
    {
        date: '2025-09-24T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Identify crimping tools for various IC packages.',
        practicalNumbers: ['161'],
    },
    {
        date: '2025-09-25T00:00:00.000Z',
        theoryWork: 'Advantages, Surface Mount components and packages. Introduction to solder paste (flux).',
        practicalWork: 'Make the necessary settings on SMD soldering station to de-solder various ICs of different packages (at least four) by choosing proper crimping tools.',
        practicalNumbers: ['162'],
    },
    {
        date: '2025-09-26T00:00:00.000Z',
        theoryWork: 'Soldering of SM assemblies, reflow soldering.',
        practicalWork: 'Make the necessary settings on SMD soldering station to de-solder various ICs of different packages (at least four) by choosing proper crimping tools.',
        practicalNumbers: ['162'],
    },
    {
        date: '2025-09-28T00:00:00.000Z',
        theoryWork: 'Soldering of SM assemblies, reflow soldering.',
        practicalWork: 'Make the necessary settings on SMD soldering station to de-solder various ICs of different packages (at least four) by choosing proper crimping tools.',
        practicalNumbers: ['162'],
    },
    {
        date: '2025-09-29T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Make the necessary settings on SMD soldering station to solder various ICs of different packages (at least four) by choosing proper crimping tools',
        practicalNumbers: ['163'],
    },
    {
        date: '2025-09-30T00:00:00.000Z',
        theoryWork: 'Tips for selection of hardware, Inspection of SM. Identification of Programmable Gate array (PGA) packages.',
        practicalWork: 'Make the necessary settings on SMD soldering station to solder various ICs of different packages (at least four) by choosing proper crimping tools',
        practicalNumbers: ['163'],
    },
];

async function main() {
    console.log(`\n📔 Uploading ${entries.length} diary entries (September 2025)`);
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
