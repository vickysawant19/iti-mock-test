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
    // May
    { date: '2025-05-02T00:00:00.000Z', theoryWork: 'W/Cul', practicalWork: 'Extra lab work: troubleshooting & optimization (2 hrs)', practicalNumbers: [], remarks: '-' },
    { date: '2025-05-03T00:00:00.000Z', theoryWork: 'ECA / LIB', practicalWork: 'Extra lab work: troubleshooting & optimization (2 hrs)', practicalNumbers: [], remarks: '-' },
    { date: '2025-05-05T00:00:00.000Z', theoryWork: 'Introduction to digital electronics, difference between analog and digital signals', practicalWork: 'Verify truth table of basic logic circuits using switches and LEDs (6 hrs)', practicalNumbers: ['107'], remarks: '-' },
    { date: '2025-05-06T00:00:00.000Z', theoryWork: 'EMP', practicalWork: 'Construct and verify truth table of AND, OR, NAND, NOR gates using ICs (6 hrs)', practicalNumbers: ['108'], remarks: '-' },
    { date: '2025-05-07T00:00:00.000Z', theoryWork: 'Number systems: binary, octal, hexadecimal, BCD code, ASCII code and conversions', practicalWork: 'Use digital IC trainer to verify TTL logic circuits (5 hrs)', practicalNumbers: ['109'], remarks: '-' },
    { date: '2025-05-08T00:00:00.000Z', theoryWork: 'Various logic gates and their truth tables', practicalWork: 'Use digital IC trainer to test various digital ICs (TTL/CMOS) (5 hrs)', practicalNumbers: ['104'], remarks: '-' },
    { date: '2025-05-13T00:00:00.000Z', theoryWork: 'EMP', practicalWork: 'Construct half adder & full adder circuits using ICs and verify truth table (6 hrs)', practicalNumbers: ['110'], remarks: '-' },
    { date: '2025-05-14T00:00:00.000Z', theoryWork: 'Combinational logic circuits – adders & comparators', practicalWork: 'Construct half adder circuit using IC and verify truth table (6 hrs)', practicalNumbers: ['111'], remarks: '-' },
    { date: '2025-05-15T00:00:00.000Z', theoryWork: 'Encoders, decoders, multiplexers and demultiplexers', practicalWork: 'Construct encoder and multiplexer circuits and verify results (6 hrs)', practicalNumbers: ['112'], remarks: '-' },
    { date: '2025-05-16T00:00:00.000Z', theoryWork: 'W.C.S', practicalWork: 'Construct and test 02 to 04 decoder', practicalNumbers: [], remarks: '-' },
    
    // May OJT
    { date: '2025-05-17T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 1: Introduction to the shop and safety guidelines', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-19T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 1: Assisted in soldering components on PCB', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-20T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 2: Observed senior technician repairing mobile phone', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-21T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 3: Learned to use multimeter for basic testing', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-22T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 4: Assisted in replacing mobile phone battery', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-23T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 5: Cleaned and inspected circuit boards', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-24T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 6: Observed repair of LED TV', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-26T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 8: Practiced soldering technique on setup board', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-27T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 9: Learned to identify resistors, capacitors and diodes', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-28T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 10: Helped in assembling repaired devices', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-29T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 11: Observed power supply troubleshooting', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-30T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 12: Assisted in testing repaired devices', practicalNumbers: [], remarks: 'OJT' },
    { date: '2025-05-31T00:00:00.000Z', theoryWork: 'OJT', practicalWork: 'Day 13: Learned to read basic circuit diagrams', practicalNumbers: [], remarks: 'OJT' },

    // June
    { date: '2025-06-09T00:00:00.000Z', theoryWork: 'Combinational logic circuits – adder, magnitude comparator', practicalWork: 'Construct and test a 4-to-2 encoder', practicalNumbers: ['114'], remarks: '-' },
    { date: '2025-06-10T00:00:00.000Z', theoryWork: 'EMP', practicalWork: 'Construct and test a 4-to-1 multiplexer', practicalNumbers: ['115'], remarks: '-' },
    { date: '2025-06-11T00:00:00.000Z', theoryWork: 'Encoders, decoders, multiplexers, demultiplexers', practicalWork: 'Construct and test a 1-to-4 demultiplexer', practicalNumbers: ['116'], remarks: '-' },
    { date: '2025-06-16T00:00:00.000Z', theoryWork: 'Library components and resources of simulation tools', practicalWork: 'Construct RS flip-flop using IC and verify truth table', practicalNumbers: ['119'], remarks: '-' },
    { date: '2025-06-17T00:00:00.000Z', theoryWork: 'EMP', practicalWork: 'Construct RS flip-flop, D flip-flop and JK flip-flop and verify truth tables', practicalNumbers: ['120'], remarks: '-' },
    { date: '2025-06-18T00:00:00.000Z', theoryWork: 'Library components and resources of simulation tools', practicalWork: 'Prepare simple digital & analog circuits using software', practicalNumbers: ['121'], remarks: '-' },
    { date: '2025-06-19T00:00:00.000Z', theoryWork: 'Thevenin’s Theorem', practicalWork: 'Simulate and test prepared digital and analog circuits', practicalNumbers: ['122'], remarks: '-' },
    { date: '2025-06-20T00:00:00.000Z', theoryWork: 'W/CW', practicalWork: 'Convert prepared circuit into layout diagram', practicalNumbers: ['123'], remarks: '-' },
    { date: '2025-06-21T00:00:00.000Z', theoryWork: 'ECA / LAB', practicalWork: 'Prepare power supply circuit and simulate using software', practicalNumbers: ['124'], remarks: '-' },
    { date: '2025-06-23T00:00:00.000Z', theoryWork: 'OP-AMP: Block diagram, ideal characteristics & applications', practicalWork: 'Construct inverting, non-inverting and summing amplifier', practicalNumbers: ['125'], remarks: '-' },
    { date: '2025-06-24T00:00:00.000Z', theoryWork: 'EMP', practicalWork: 'Construct inverting, non-inverting and summing amplifier using analog IC trainer', practicalNumbers: ['126'], remarks: '-' },
    { date: '2025-06-25T00:00:00.000Z', theoryWork: 'OP-AMP applications: comparators, integrators', practicalWork: 'Construct differentiator and integrator circuits', practicalNumbers: ['127'], remarks: '-' },
    { date: '2025-06-26T00:00:00.000Z', theoryWork: 'Zero crossing detector, instrumentation amplifier', practicalWork: 'Construct and test zero crossing detector and instrumentation amplifier', practicalNumbers: ['128'], remarks: '-' },
    { date: '2025-06-27T00:00:00.000Z', theoryWork: '-', practicalWork: 'Construct and test zero crossing detector and instrumentation amplifier', practicalNumbers: ['129'], remarks: '-' },
    
    // July
    { date: '2025-07-01T00:00:00.000Z', theoryWork: 'Applications of IC 555 in modulation', practicalWork: 'Construct astable timer using IC 555', practicalNumbers: ['131'], remarks: '-' },
    { date: '2025-07-02T00:00:00.000Z', theoryWork: 'Pulse width modulation using IC 555', practicalWork: 'Construct and test monostable timer using 555', practicalNumbers: ['132'], remarks: '-' },
    { date: '2025-07-03T00:00:00.000Z', theoryWork: '-', practicalWork: 'Construct and test VCO (Voltage Controlled Oscillator) using IC 555', practicalNumbers: ['133'], remarks: '-' },
    { date: '2025-07-04T00:00:00.000Z', theoryWork: '-', practicalWork: 'Construct 555 IC pulse width modulator', practicalNumbers: ['134'], remarks: '-' }
];

async function main() {
    console.log(`\n📔 Upserting ${entries.length} diary entries (May-July 2025)`);
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
