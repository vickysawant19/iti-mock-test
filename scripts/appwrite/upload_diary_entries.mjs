import { Client, Databases, ID } from 'node-appwrite';

// ── Appwrite config ───────────────────────────────────────────────────────────
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases = new Databases(client);
const DB_ID  = 'itimocktest';
const COL_ID = 'dailyDiary';

// ── Diary entries (parsed from the data provided) ─────────────────────────────
const entries = [
    { date: '2026-02-02T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Identify LED Displaymodule and itsde',                                    extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['206'] },
    { date: '2026-02-03T00:00:00.000Z', theoryWork: 'splicing,testing and the relatedequipi',                        practicalWork: 'Display a word on a two line LED',                                        extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['207'] },
    { date: '2026-02-04T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Display a word on a two line LED',                                        extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['207'] },
    { date: '2026-02-05T00:00:00.000Z', theoryWork: 'Precautions and safety aspectswhile l',                         practicalWork: 'Measure/current flowingthrough a res',                                      extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['208'] },
    { date: '2026-02-06T00:00:00.000Z', theoryWork: 'Different types of sevensegment displ',                         practicalWork: 'Measure/current flowingthrough a res',                                      extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['208'] },
    { date: '2026-02-09T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Measure/current flowingthrough a ser',                                      extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['209'] },
    { date: '2026-02-10T00:00:00.000Z', theoryWork: 'Concept of multiplexing and its advan',                         practicalWork: 'Identify LCD Displaymodule and itsde',                                    extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['210'] },
    { date: '2026-02-11T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Measure/current flowingthrough a res',                                      extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['211'] },
    { date: '2026-02-12T00:00:00.000Z', theoryWork: 'Block diagrams of 7106 and7107 and',                            practicalWork: 'Measure/current flowingthrough a res',                                      extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['211'] },
    { date: '2026-02-13T00:00:00.000Z', theoryWork: 'Use of DPM with sevensegment displ',                            practicalWork: 'Identify thecomponents/devices andd',                                    extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['212'] },
    { date: '2026-02-16T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Dismantle the givenstabilizer and find',                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['213'] },
    { date: '2026-02-17T00:00:00.000Z', theoryWork: 'Use of DPM with LCD to displaydiffere',                         practicalWork: 'List the defect andsymptom in the fau',                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['214'] },
    { date: '2026-02-18T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'List the defect andsymptom in the fau',                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['214'] },
    { date: '2026-02-20T00:00:00.000Z', theoryWork: 'Concept and block diagram ofmanual,',                           practicalWork: 'Measure / Monitor majortest points o',                                      extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['215'] },
    { date: '2026-02-21T00:00:00.000Z', theoryWork: 'eca',                                                           practicalWork: 'Measure / Monitor majortest points o',                                      extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['215'] },
    { date: '2026-02-23T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Troubleshoot the fault inthe given SM',                                    extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['216'] },
    { date: '2026-02-24T00:00:00.000Z', theoryWork: 'Voltage cut-off systems, relaysused in',                        practicalWork: 'Troubleshoot the fault inthe given SM',                                    extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['216'] },
    { date: '2026-02-25T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Use SMPS used in TVs andPCs for Pra',                                    extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['217'] },
    { date: '2026-02-26T00:00:00.000Z', theoryWork: 'Block Diagram of differenttypes of Sw',                         practicalWork: 'Use SMPS used in TVs andPCs for Pra',                                    extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['217'] },
    { date: '2026-02-27T00:00:00.000Z', theoryWork: 'Inverter; principle of operation,block c',                      practicalWork: 'Install and test the SMPSin PC.',                                          extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['218'] },
    { date: '2026-03-02T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Install and test aninverter.',                                              extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['219'] },
    { date: '2026-03-04T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Troubleshoot the fault inthe given inverter unit.Rectify the defect',      extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['220'] },
    { date: '2026-03-05T00:00:00.000Z', theoryWork: 'Installation of inverters,protection circuits used ininverters', practicalWork: '. Cons',                                                                extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['221'] },
    { date: '2026-03-06T00:00:00.000Z', theoryWork: 'Battery level, overload, overcharging etc.Various faults and itsrectification', practicalWork: '',                                                    extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['222'] },
    { date: '2026-03-07T00:00:00.000Z', theoryWork: 'eca',                                                           practicalWork: 'revision-self-study',                                                      extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['223'] },
    { date: '2026-03-09T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'revision',                                                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: [] },
    { date: '2026-03-10T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'revision',                                                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: [] },
    { date: '2026-03-11T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'revision',                                                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: [] },
    { date: '2026-03-12T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'revision',                                                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: [] },
    { date: '2026-03-13T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'revision',                                                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: [] },
    { date: '2026-03-16T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'revision',                                                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: [] },
    { date: '2026-03-17T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'revision',                                                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: [] },
    { date: '2026-03-18T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'revision',                                                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: [] },
    { date: '2026-03-20T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'revision',                                                                  extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: [] },
    { date: '2026-03-23T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Connect battery stack tothe UPS.',                                          extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['224'] },
    { date: '2026-03-24T00:00:00.000Z', theoryWork: 'Concept of Uninterruptedpower supply.Difference between Invertersand UF', practicalWork: '',                                                            extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['225'] },
    { date: '2026-03-25T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Connect Battery & load toUPS & test on batterymode.',                        extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['226'] },
    { date: '2026-03-27T00:00:00.000Z', theoryWork: 'Basic block diagram of UPS &operating principle.Types of UPS : Off line UP', practicalWork: '',                                                        extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['227'] },
    { date: '2026-03-30T00:00:00.000Z', theoryWork: '',                                                              practicalWork: 'Identify the various testpoint and verify thevoltages on these',              extraWork: 'NO', hours: 8, remarks: '-', practicalNumbers: ['228'] },
];

const BATCH_ID      = '69cbe6067b5b4cd6313d';
const INSTRUCTOR_ID = '667913410027f95c3a71';

async function main() {
    console.log(`\n📔 Uploading ${entries.length} diary entries`);
    console.log(`🎯 Collection: ${DB_ID} / ${COL_ID}`);
    console.log(`   batchId: ${BATCH_ID}  |  instructorId: ${INSTRUCTOR_ID}\n`);

    let created = 0, skipped = 0, failed = 0;

    for (const entry of entries) {
        const label = entry.date.slice(0, 10);
        const doc = {
            batchId:          BATCH_ID,
            instructorId:     INSTRUCTOR_ID,
            date:             entry.date,
            theoryWork:       entry.theoryWork,
            practicalWork:    entry.practicalWork,
            extraWork:        entry.extraWork,
            hours:            entry.hours,
            remarks:          entry.remarks,
            practicalNumbers: entry.practicalNumbers,   // array of strings
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
