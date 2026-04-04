import { Client, Databases, ID } from 'node-appwrite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Appwrite config ───────────────────────────────────────────────────────────
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases = new Databases(client);
const DB_ID  = 'itimocktest';
const COL_ID = 'newmodulesdata';

// ── Hardcoded values for this batch ──────────────────────────────────────────
const YEAR     = 'SECOND';
const TRADE_ID = '69cbe4ec1adc9d43e4e3';
const SUBJ_ID  = '69cbec4e0009538fadd1';

// ── Minimal CSV parser (handles quoted fields with inner commas/quotes) ───────
function parseCSV(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const headers = parseLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseLine(line);
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
        rows.push(row);
    }
    return rows;
}

function parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current);
    return fields;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const csvPath = join(__dirname, '..', '..', 'modulesFiles', 'secondYearEM.csv');
    const text = readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(text);

    console.log(`\n📄 Parsed ${rows.length} rows from secondYearEM.csv`);
    console.log(`🎯 Target: ${DB_ID} / ${COL_ID}  |  year = ${YEAR}\n`);

    let created = 0;
    let skipped = 0;
    let failed  = 0;

    for (const row of rows) {
        const moduleId = row['moduleId']?.trim();
        if (!moduleId) continue;

        // Parse evalutionsPoints — array attribute in Appwrite
        let evalPoints = null;
        const rawEval = row['evalutionsPoints']?.trim();
        if (rawEval) {
            try {
                const parsed = JSON.parse(rawEval);
                if (Array.isArray(parsed)) {
                    evalPoints = parsed.map(item =>
                        typeof item === 'string' ? item : JSON.stringify(item)
                    );
                }
            } catch (_) {
                evalPoints = [rawEval];
            }
        }

        const doc = {
            moduleId:           moduleId,
            moduleName:         row['moduleName']?.trim()         || '',
            moduleDuration:     parseInt(row['moduleDuration'])   || 0,
            moduleDescription:  row['moduleDescription']?.trim()  || '',
            learningOutcome:    row['learningOutcome']?.trim()    || '',
            assessmentCriteria: row['assessmentCriteria']?.trim() || '',
            assessmentPaperId:  '',
            hours:              0,
            images:             [],
            topics:             [],
            tradeId:            TRADE_ID,
            subjectId:          SUBJ_ID,
            year:               YEAR,
        };

        if (evalPoints && evalPoints.length > 0) {
            doc.evalutionsPoints = evalPoints;
        }

        try {
            await databases.createDocument(DB_ID, COL_ID, ID.unique(), doc);
            console.log(`  ✅ ${moduleId} — uploaded`);
            created++;
        } catch (err) {
            if (err.code === 409) {
                console.log(`  ⏩ ${moduleId} — already exists (skipped)`);
                skipped++;
            } else {
                console.error(`  ❌ ${moduleId} — ERROR: ${err.message}`);
                failed++;
            }
        }

        // Small delay to avoid rate limiting
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
