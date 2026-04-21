import { Client, Databases, Query } from 'node-appwrite';
import fs from 'fs';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');
const databases = new Databases(client);

const DB_ID = 'itimocktest';
const Q_COL = '667932c5000ff8e2d769';
const OLD_MOD_COL = '67a470d40039eacbd794';
const NEW_MOD_COL = 'newmodulesdata';

async function check() {
    let allQs = await databases.listDocuments(DB_ID, Q_COL, [Query.limit(5000)]);
    let uniqueModuleIds = [...new Set(allQs.documents.map(q => q.moduleId))];
    console.log('Total questions:', allQs.total);
    console.log('Unique moduleIds pointing from questions:', uniqueModuleIds.length);
    
    let mappingSourceRecords = [];

    for (let id of uniqueModuleIds) {
        if (!id) continue;
        try {
            // Check if already in NEW modules
            await databases.getDocument(DB_ID, NEW_MOD_COL, id);
        } catch (eNew) {
            try {
                // If not, it assumes it points to old module! Find old doc:
                let mOld = await databases.getDocument(DB_ID, OLD_MOD_COL, id);
                mappingSourceRecords.push({
                    wrongAppwriteId: id,
                    correctProperties: {
                        tradeId: mOld.tradeId,
                        subjectId: mOld.subjectId,
                        year: mOld.year,
                        targetModuleId: mOld.moduleId
                    }
                });
            } catch (eOld) {
                // Not in old either?
            }
        }
    }

    if (mappingSourceRecords.length > 0) {
        console.log(`\nFound ${mappingSourceRecords.length} old mapping sources needing fix.`);
        let fixes = {};
        for (let rec of mappingSourceRecords) {
            let matches = await databases.listDocuments(DB_ID, NEW_MOD_COL, [
                Query.equal('tradeId', rec.correctProperties.tradeId),
                Query.equal('subjectId', rec.correctProperties.subjectId),
                Query.equal('year', rec.correctProperties.year),
                Query.equal('moduleId', rec.correctProperties.targetModuleId)
            ]);
            if (matches.documents.length > 0) {
                fixes[rec.wrongAppwriteId] = matches.documents[0].$id;
            } else {
                console.log(`Warning: Equivalency missing for ${rec.correctProperties.targetModuleId}`);
            }
        }

        console.log('Generated fixes:', Object.keys(fixes).length);
        fs.writeFileSync('scripts/files/question_fixes.json', JSON.stringify(fixes, null, 2));
        
        console.log('Applying fixes to questions in DB directly...');
        let updatedCount = 0;
        for (let q of allQs.documents) {
            if (fixes[q.moduleId]) {
                await databases.updateDocument(DB_ID, Q_COL, q.$id, { moduleId: fixes[q.moduleId] });
                updatedCount++;
            }
        }
        console.log(`Updated ${updatedCount} questions to point to the new newmodulesdata collection!`);
    } else {
        console.log('No fixes needed or unable to find the old mapped modules!');
    }
}
check().catch(console.error);
