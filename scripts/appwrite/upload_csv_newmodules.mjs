import fs from 'fs';
import csv from 'csv-parser';
import { Client, Databases, Query, ID } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases = new Databases(client);
const DB_ID = 'itimocktest';
const COL_ID = 'newmodulesdata';

const FILE_PATH = process.argv[2] || "scripts/files/modules data copa practical - Syllabus to Markdown Table Conversion.csv";

const results = [];

async function uploadData() {
    console.log(`\n📔 Processing ${results.length} modules from CSV`);
    console.log(`🎯 DB: ${DB_ID} / COL: ${COL_ID}\n`);

    const moduleIds = results.map(r => r.moduleId);
    
    // Cleanup previous failed attempts for these exact modules
    if (moduleIds.length > 0) {
        console.log(`🧹 Cleaning up existing duplicate records first...`);
        try {
            // We'll query in batches of 100 since query lists shouldn't be too huge, but there are ~78 items so 1 batch is fine
            let hasMore = true;
            let offset = 0;
            while(hasMore) {
                const existing = await databases.listDocuments(DB_ID, COL_ID, [
                    Query.equal('moduleId', moduleIds),
                    Query.limit(100),
                    Query.offset(offset)
                ]);
                const isAppendMode = process.argv.includes('--append');
                if (existing && existing.documents && existing.documents.length > 0) {
                    if (!isAppendMode) {
                        console.log('\n🧹 Cleaning up existing duplicate records first...');
                        for (const doc of existing.documents) {
                            if (doc.tradeId === results[0].tradeId && doc.subjectId === results[0].subjectId) {
                                await databases.deleteDocument(DB_ID, COL_ID, doc.$id);
                                console.log(`  🗑️ Deleted old ${doc.moduleId} (${doc.$id})`);
                            }
                        }
                    } else {
                        console.log('\n⏭️ Append mode enabled: Skipping cleanup of existing records.');
                    }
                }
                if (existing.documents.length < 100) hasMore = false;
                else offset += 100;
            }
        } catch (e) {
            console.error("Cleanup error:", e.message);
        }
    }

    console.log(`\n🚀 Starting Upload...`);
    let created = 0, failed = 0;

    for (const data of results) {
        try {
            const entry = {
                tradeId: data.tradeId,
                subjectId: data.subjectId,
                year: data.year,
                moduleId: data.moduleId,
                moduleName: data.moduleName,
                moduleDuration: parseInt(data.moduleDuration, 10) || 0,
                moduleDescription: data.moduleDescription,
                learningOutcome: data.learningOutcome,
                assessmentCriteria: data.assessmentCriteria,
                evalutionsPoints: []
            };

            if (entry.moduleName && entry.moduleName.length > 200) {
                entry.moduleName = entry.moduleName.substring(0, 197) + '...';
            }

            const rawEval = data['evalutionsPoints[]'];
            if (rawEval && rawEval !== '[]') {
                try {
                    const parsed = JSON.parse(rawEval);
                    if (Array.isArray(parsed)) {
                        entry.evalutionsPoints = parsed.map(item => 
                            typeof item === 'string' ? item : JSON.stringify(item)
                        );
                    }
                } catch (e) {
                    // Fallback for heavily escaped legacy string formats
                    if (rawEval.startsWith('[') && rawEval.endsWith(']')) {
                       let stripped = rawEval.substring(2, rawEval.length - 2); 
                       let items = stripped.split(/}","{/);
                       entry.evalutionsPoints = items.map(item => {
                           let clean = item;
                           if (!clean.startsWith('{')) clean = '{' + clean;
                           if (!clean.endsWith('}')) clean = clean + '}';
                           return clean;
                       });
                    }
                }
            }

            await databases.createDocument(DB_ID, COL_ID, ID.unique(), entry);
            console.log(`  ✅ ${entry.moduleId} — ${entry.moduleName.substring(0, 30)}... uploaded`);
            created++;
        } catch (err) {
            console.error(`  ❌ ${data.moduleId} — ERROR: ${err.message}`);
            failed++;
        }
        await new Promise(r => setTimeout(r, 150));
    }

    console.log(`\n── Summary ──────────────────────────────────`);
    console.log(`  ✅ Created : ${created}`);
    console.log(`  ❌ Failed  : ${failed}`);
    console.log(`─────────────────────────────────────────────\n`);
}

fs.createReadStream(FILE_PATH)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    uploadData().catch(err => {
      console.error('\n[Fatal]', err.message);
      process.exit(1);
    });
  });
