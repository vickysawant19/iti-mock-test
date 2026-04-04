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
        date: '2025-12-01T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Perform the use of a Timer as an Event counter to count external events',
        practicalNumbers: ['188'],
    },
    {
        date: '2025-12-02T00:00:00.000Z',
        theoryWork: 'Internal hardware resources of microcontroller',
        practicalWork: 'Perform the use of a Timer as an Event counter to count external events',
        practicalNumbers: ['188'],
    },
    {
        date: '2025-12-03T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Demonstrate entering of simple programs, execute & monitor the results.',
        practicalNumbers: ['189'],
    },
    {
        date: '2025-12-04T00:00:00.000Z',
        theoryWork: 'I/O port pin configuration. Different variants of 8051 & their resources. Register banks & their functioning. SFRs & their configuration for different',
        practicalWork: 'Demonstrate entering of simple programs, execute & monitor the results.',
        practicalNumbers: ['188'],
    },
    {
        date: '2025-12-05T00:00:00.000Z',
        theoryWork: 'Comparative study of 8051 with 8052. Introduction to PIC Architecture.',
        practicalWork: 'Identify sensors used in process industries such as RTDs, Temperature ICs, Thermocouples, proximity switches (inductive,',
        practicalNumbers: ['190'],
    },
    {
        date: '2025-12-06T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'Identify sensors used in process industries such as RTDs, Temperature ICs, Thermocouples, proximity switches (inductive,',
        practicalNumbers: ['190'],
    },
    {
        date: '2025-12-08T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'capacitive and photo electric), load cells, strain gauge. LVDT PT 100 (platinum resistance sensor), water level sensor, thermostat float switch, float valve by',
        practicalNumbers: ['190'],
    },
    {
        date: '2025-12-09T00:00:00.000Z',
        theoryWork: 'Basics of passive and active transducers. Role, selection and characteristics.',
        practicalWork: 'capacitive and photo electric), load cells, strain gauge. LVDT PT 100 (platinum resistance sensor), water level sensor, thermostat float switch, float valve by',
        practicalNumbers: ['190'],
    },
    {
        date: '2025-12-10T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Measure temperature of a lit fire using a Thermocouple and record the readings referring to data chart.',
        practicalNumbers: ['191'],
    },
    {
        date: '2025-12-11T00:00:00.000Z',
        theoryWork: 'Sensor voltage and current formats.',
        practicalWork: 'Measure temperature of a lit fire using a Thermocouple and record the readings referring to data chart.',
        practicalNumbers: ['191'],
    },
    {
        date: '2025-12-12T00:00:00.000Z',
        theoryWork: 'Thermistors/ Thermocouples - Basic principle, salient features, operating range, composition, advantages and disadvantages. Strain gauges/ Load cell',
        practicalWork: 'Measure temperature of a lit fire using RTD and record the readings referring to data.',
        practicalNumbers: ['192'],
    },
    {
        date: '2025-12-15T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Measure temperature of a lit fire using a Thermocouple and record the readings referring to data chart.',
        practicalNumbers: ['191'],
    },
    {
        date: '2025-12-16T00:00:00.000Z',
        theoryWork: 'Inductive/ capacitive transducers - Principle of operation, advantages and disadvantages.',
        practicalWork: 'Measure temperature of a lit fire using RTD and record the readings referring to data.',
        practicalNumbers: ['192'],
    },
    {
        date: '2025-12-17T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Measure temperature of a lit fire using RTD and record the readings referring to data.',
        practicalNumbers: ['192'],
    },
    {
        date: '2025-12-18T00:00:00.000Z',
        theoryWork: 'Principle of operation of LVDT, advantages and disadvantages. Proximity sensors -',
        practicalWork: 'Measure the DC voltage of a LVDT.',
        practicalNumbers: ['193'],
    },
    {
        date: '2025-12-19T00:00:00.000Z',
        theoryWork: 'applications, working principles of eddy current, capacitive and inductive proximity sensors.',
        practicalWork: 'Measure the DC voltage of a LVDT.',
        practicalNumbers: ['193'],
    },
    {
        date: '2025-12-20T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'Detect different objectives using capacitive, inductive and photoelectric proximity sensors.',
        practicalNumbers: ['194'],
    },
    {
        date: '2025-12-22T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Detect different objectives using capacitive, inductive and photoelectric proximity sensors.',
        practicalNumbers: ['194'],
    },
    {
        date: '2025-12-23T00:00:00.000Z',
        theoryWork: 'Introduction to Internet of Things applications environment, smart street light and smart water & waste management',
        practicalWork: 'Connect and test microcontroller to computer and execute sample program',
        practicalNumbers: ['195'],
    },
    {
        date: '2025-12-24T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Upload computer code to the physical board (Microcontroller) to blink a simple LED.',
        practicalNumbers: ['196'],
    },
    {
        date: '2025-12-26T00:00:00.000Z',
        theoryWork: 'What is an IOT? What makes embedded system an IOT?',
        practicalWork: 'Upload computer code to the physical board (Microcontroller) to blink a simple LED.',
        practicalNumbers: ['196'],
    },
    {
        date: '2025-12-29T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Write and upload computer code to the physical Micro controller to sound buzzer.',
        practicalNumbers: ['197'],
    },
    {
        date: '2025-12-30T00:00:00.000Z',
        theoryWork: 'Role and scope of IOT in present and future marketplace.',
        practicalWork: 'Write and upload computer code to the physical Micro controller to sound buzzer.',
        practicalNumbers: ['197'],
    },
    {
        date: '2025-12-31T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Circuit and program to Interface light sensor – LDR with Microcontroller to switch ON/OFF LED based',
        practicalNumbers: ['198'],
    },
];

async function main() {
    console.log(`\n📔 Uploading ${entries.length} diary entries (December 2025)`);
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
