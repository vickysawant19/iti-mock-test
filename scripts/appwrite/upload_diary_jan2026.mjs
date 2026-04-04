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
        date: '2026-01-01T00:00:00.000Z',
        theoryWork: 'Role and scope of IOT in present and future marketplace.',
        practicalWork: 'Circuit and program to Interface light sensor – LDR with Microcontroller to switch ON/OFF LED based',
        practicalNumbers: ['198'],
    },
    {
        date: '2026-01-02T00:00:00.000Z',
        theoryWork: 'Smart objects, Wired – Cables, hubs etc. Wireless – RFID, WiFi, Bluetooth etc. Different functional building blocks of IOT architecture.',
        practicalWork: 'Set up & test circuit to interface potentiometer with Microcontroller and map to digital values for e.g. 0-1023.',
        practicalNumbers: ['199'],
    },
    {
        date: '2026-01-03T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'Set up & test circuit to interface potentiometer with Microcontroller and map to digital values for e.g. 0-1023.',
        practicalNumbers: ['199'],
    },
    {
        date: '2026-01-05T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-06T00:00:00.000Z',
        theoryWork: 'Discussion on the identified projects with respect to data of the concerned ICs. Components used in the project.',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-07T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-08T00:00:00.000Z',
        theoryWork: 'Discussion on the identified projects with respect to data of the concerned ICs. Components used in the project.',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-09T00:00:00.000Z',
        theoryWork: 'Discussion on the identified projects with respect to data of the concerned ICs. Components used in the project.',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-12T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-13T00:00:00.000Z',
        theoryWork: 'Discussion on the identified projects with respect to data of the concerned ICs. Components used in the project',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-14T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-15T00:00:00.000Z',
        theoryWork: 'Discussion on the identified projects with respect to data of the concerned ICs. Components used in the project',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-16T00:00:00.000Z',
        theoryWork: 'Discussion on the identified projects with respect to data of the concerned ICs. Components used in the project',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-17T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'Make simple projects/ Applications using ICs 741, 723, 555, 7106, 7107',
        practicalNumbers: [],
    },
    {
        date: '2026-01-19T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Make simple projects/ Applications using various digital ICs (digital display, event counter, stepper motor driver etc.)',
        practicalNumbers: [],
    },
    {
        date: '2026-01-20T00:00:00.000Z',
        theoryWork: 'Discussion on the identified projects with respect to data of the concerned ICs. Components used in the project.',
        practicalWork: 'Make simple projects/ Applications using various digital ICs (digital display, event counter, stepper motor driver etc.)',
        practicalNumbers: [],
    },
    {
        date: '2026-01-21T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Make simple projects/ Applications using various digital ICs (digital display, event counter, stepper motor driver etc.)',
        practicalNumbers: [],
    },
    {
        date: '2026-01-22T00:00:00.000Z',
        theoryWork: 'Discussion on the identified projects with respect to data of the concerned ICs. Components used in the project.',
        practicalWork: 'Make simple projects/ Applications using various digital ICs (digital display, event counter, stepper motor driver etc.)',
        practicalNumbers: [],
    },
    {
        date: '2026-01-23T00:00:00.000Z',
        theoryWork: 'Discussion on the identified projects with respect to data of the concerned ICs. Components used in the project.',
        practicalWork: 'Make simple projects/ Applications using various digital ICs (digital display, event counter, stepper motor driver etc.)',
        practicalNumbers: [],
    },
    {
        date: '2026-01-27T00:00:00.000Z',
        theoryWork: 'Introduction to optical fiber, optical connection and various types optical amplifier',
        practicalWork: 'Identify the resources and their need on the given fiber optic trainer kit. (02 Hrs.)',
        practicalNumbers: ['200'],
    },
    {
        date: '2026-01-28T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Make optical fiber setup to transmit and receive analog and digital data.',
        practicalNumbers: ['201'],
    },
    {
        date: '2026-01-29T00:00:00.000Z',
        theoryWork: 'OFC advantages, properties of optic fiber, testing, losses, types of fiber optic cables and specifications.',
        practicalWork: 'Set up the OFC trainer kit to study AM, FM, PWM modulation and demodulation.',
        practicalNumbers: ['202'],
    },
    {
        date: '2026-01-30T00:00:00.000Z',
        theoryWork: 'Encoding of light.',
        practicalWork: 'Perform FM modulation and demodulation using OFC trainer kit using audio signal and voice link',
        practicalNumbers: ['203'],
    },
    {
        date: '2026-01-31T00:00:00.000Z',
        theoryWork: 'Fiber optic joints, splicing,',
        practicalWork: 'Perform PWM modulation and demodulation using OFC trainer kit using audio signal and voice link',
        practicalNumbers: ['204'],
    },
];

async function main() {
    console.log(`\n📔 Uploading ${entries.length} diary entries (January 2026)`);
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
