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
        date: '2025-11-01T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'eca',
        practicalNumbers: [],
    },
    {
        date: '2025-11-03T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Modulate and Demodulate various signals using AM and FM on the trainer kit and observe waveforms.',
        practicalNumbers: ['175'],
    },
    {
        date: '2025-11-04T00:00:00.000Z',
        theoryWork: '1.LOW VOLTAGE DC MOTOR (Low Potential motor) Introduction of DC motor. Types of DC motor .Types of DC motor controller. DC Motor power.',
        practicalWork: 'Modulate and Demodulate various signals using AM and FM on the trainer kit and observe waveforms.',
        practicalNumbers: ['175'],
    },
    {
        date: '2025-11-06T00:00:00.000Z',
        theoryWork: 'Types of DC Motor power regulation. Application area of DC motor controller.',
        practicalWork: 'Test IC based AM Receiver',
        practicalNumbers: ['176'],
    },
    {
        date: '2025-11-07T00:00:00.000Z',
        theoryWork: '2.What is a Stepper motor and its types. Stepper Motor working Principal.',
        practicalWork: 'Test IC based FM transmitter.',
        practicalNumbers: ['177'],
    },
    {
        date: '2025-11-10T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Test IC based AM transmitter and test the transmitter power. Calculate the modulation index.',
        practicalNumbers: ['178'],
    },
    {
        date: '2025-11-11T00:00:00.000Z',
        theoryWork: 'How to select a stepper motor Types of wiring of stepper motor. Stepper motor control by varying clock pulses.',
        practicalWork: 'Test IC based AM transmitter and test the transmitter power. Calculate the modulation index.',
        practicalNumbers: ['178'],
    },
    {
        date: '2025-11-12T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Dismantle the given FM receiver set and identify different stages (AM section, audio amplifier section etc).',
        practicalNumbers: ['179'],
    },
    {
        date: '2025-11-13T00:00:00.000Z',
        theoryWork: 'Advantage of stepper motor. Radio Wave Propagation - principle, fading. Need for Modulation, types of modulation and demodulation. Fundamentals of',
        practicalWork: 'Dismantle the given FM receiver set and identify different stages (AM section, audio amplifier section etc).',
        practicalNumbers: ['179'],
    },
    {
        date: '2025-11-14T00:00:00.000Z',
        theoryWork: 'Introduction to AM, FM & PM, SSB-SC & DSB-SC. Block diagram of AM and FM transmitter. FM Generation & Detection. Digital modulation and demodulation',
        practicalWork: 'Modulate two signals using AM kit draw the way from and calculate percent (%) of modulation',
        practicalNumbers: ['179'],
    },
    {
        date: '2025-11-15T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'eac',
        practicalNumbers: [],
    },
    {
        date: '2025-11-17T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Modulate two signals using AM kit draw the wayfrom and calculate percent (%) of modulation.',
        practicalNumbers: ['180'],
    },
    {
        date: '2025-11-18T00:00:00.000Z',
        theoryWork: 'FM Generation & Detection. Digital modulation and demodulation techniques, sampling, quantization & encoding.',
        practicalWork: 'Modulate and Demodulate a signal using PAM, PPM, PWM Techniques.',
        practicalNumbers: ['181'],
    },
    {
        date: '2025-11-19T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Modulate and Demodulate a signal using PAM, PPM, PWM Techniques.',
        practicalNumbers: ['181'],
    },
    {
        date: '2025-11-20T00:00:00.000Z',
        theoryWork: 'Concept of multiplexing and de multiplexing of AM/ FM/ PAM/ PPM /PWM signals.',
        practicalWork: 'Identify various ICs & their functions on the given Microcontroller Kit',
        practicalNumbers: ['182'],
    },
    {
        date: '2025-11-21T00:00:00.000Z',
        theoryWork: 'A simple block diagram approach to be adopted for explaining the above mod/demod techniques.',
        practicalWork: 'Identify various ICs & their functions on the given Microcontroller Kit',
        practicalNumbers: ['182'],
    },
    {
        date: '2025-11-24T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Mesure crystal Frequency',
        practicalNumbers: ['184'],
    },
    {
        date: '2025-11-25T00:00:00.000Z',
        theoryWork: 'Function of diffrent ics in microcontroller',
        practicalWork: 'measure crystal frequency',
        practicalNumbers: ['184'],
    },
    {
        date: '2025-11-26T00:00:00.000Z',
        theoryWork: '-',
        practicalWork: 'Identify the port pins',
        practicalNumbers: ['185'],
    },
    {
        date: '2025-11-27T00:00:00.000Z',
        theoryWork: 'architecture, pin details & the bus system.',
        practicalWork: 'Identify the port pins',
        practicalNumbers: ['185'],
    },
    {
        date: '2025-11-28T00:00:00.000Z',
        theoryWork: 'Interfacing memory to microcontroller',
        practicalWork: 'Use 8051 microcontroller, connect 8 LED to the port, blink the LED with a switch.',
        practicalNumbers: ['186'],
    },
    {
        date: '2025-11-29T00:00:00.000Z',
        theoryWork: 'eca',
        practicalWork: 'Perform the initialization, load & turn on a LED with delay using Timer.',
        practicalNumbers: ['187'],
    },
];

async function main() {
    console.log(`\n📔 Uploading ${entries.length} diary entries (November 2025)`);
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
