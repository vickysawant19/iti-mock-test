import fs from 'fs';
import { Client, Databases, Storage, Teams } from 'node-appwrite';
import path from 'path';

// Usage: node rebuild_schema.js
// Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY as env vars (or hardcode below).

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: strip null defaults → undefined
const getDefValue = (val) => (val === null ? undefined : val);

// --- Retry wrapper: handles ETIMEDOUT / network blips ---
const withRetry = async (fn, label = '', maxAttempts = 5, baseDelayMs = 2000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const isNetworkError =
                err?.cause?.code === 'ETIMEDOUT' ||
                err?.cause?.code === 'ECONNRESET' ||
                err?.cause?.code === 'ECONNREFUSED' ||
                err?.message?.includes('fetch failed');

            if (isNetworkError && attempt < maxAttempts) {
                const delay = baseDelayMs * attempt;
                console.warn(`     [Retry ${attempt}/${maxAttempts}] Network error on "${label}". Retrying in ${delay}ms...`);
                await sleep(delay);
            } else {
                throw err;
            }
        }
    }
};

// Helper: poll until attribute is 'available'
const waitForAttribute = async (databases, dbId, colId, attrKey, timeoutMs = 30000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const attr = await withRetry(
                () => databases.getAttribute(dbId, colId, attrKey),
                `poll attr ${attrKey}`
            );
            if (attr.status === 'available') return true;
        } catch (_) { /* not yet available */ }
        await sleep(1500);
    }
    console.warn(`     [Timeout] Attribute '${attrKey}' did not become available in time.`);
    return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const createCollectionIfNotExists = async (databases, targetDatabaseId, colData, stats) => {
    try {
        await withRetry(
            () => databases.getCollection(targetDatabaseId, colData.$id),
            `getCollection ${colData.name}`
        );
        console.log(`- Collection '${colData.name}' already exists.`);
    } catch (error) {
        if (error.code === 404) {
            console.log(`- Creating collection: '${colData.name}'`);
            await withRetry(
                () => databases.createCollection(
                    targetDatabaseId,
                    colData.$id,
                    colData.name,
                    colData.$permissions || undefined,
                    colData.documentSecurity || false,
                    colData.enabled ?? true
                ),
                `createCollection ${colData.name}`
            );
            stats.collections++;
        } else {
            throw error;
        }
    }
};

const createAttributeSafe = async (databases, targetDatabaseId, colId, attr, stats) => {
    try {
        await withRetry(
            () => databases.getAttribute(targetDatabaseId, colId, attr.key),
            `getAttribute ${attr.key}`
        );
        console.log(`   - Attribute '${attr.key}' already exists.`);
        return;
    } catch (error) {
        if (error.code !== 404) throw error;
    }

    console.log(`   - Creating attribute: '${attr.key}' (${attr.type})`);

    // Required attrs cannot have a default in Appwrite
    let def = attr.required ? undefined : getDefValue(attr.default);

    // JS loses precision on Appwrite's 64-bit boundary values — strip them
    let min = (attr.min != null && Math.abs(attr.min) >= 9e18) ? undefined : attr.min;
    let max = (attr.max != null && Math.abs(attr.max) >= 9e18) ? undefined : attr.max;

    try {
        switch (attr.type) {
            case 'string':
                await withRetry(() =>
                    databases.createStringAttribute(targetDatabaseId, colId, attr.key, attr.size || 255, attr.required, def, attr.array || false),
                    `createString ${attr.key}`
                );
                break;
            case 'integer':
                await withRetry(() =>
                    databases.createIntegerAttribute(targetDatabaseId, colId, attr.key, attr.required, min, max, def, attr.array || false),
                    `createInteger ${attr.key}`
                );
                break;
            case 'boolean':
                await withRetry(() =>
                    databases.createBooleanAttribute(targetDatabaseId, colId, attr.key, attr.required, def, attr.array || false),
                    `createBoolean ${attr.key}`
                );
                break;
            case 'datetime':
                await withRetry(() =>
                    databases.createDatetimeAttribute(targetDatabaseId, colId, attr.key, attr.required, def, attr.array || false),
                    `createDatetime ${attr.key}`
                );
                break;
            case 'double':
                await withRetry(() =>
                    databases.createFloatAttribute(targetDatabaseId, colId, attr.key, attr.required, min, max, def, attr.array || false),
                    `createFloat ${attr.key}`
                );
                break;
            default:
                console.warn(`     [Warning] Unsupported attribute type: ${attr.type}`);
                return;
        }

        stats.attributes++;
        // Wait until Appwrite says this attribute is ready before proceeding
        await waitForAttribute(databases, targetDatabaseId, colId, attr.key);

    } catch (e) {
        if (e.code === 409) {
            console.log(`   - Attribute '${attr.key}' already exists (409).`);
        } else {
            console.error(`     ❌ Error creating attribute '${attr.key}': ${e.message}`);
        }
    }
};

const createIndexSafe = async (databases, targetDatabaseId, colId, idx, stats) => {
    try {
        await withRetry(
            () => databases.getIndex(targetDatabaseId, colId, idx.key),
            `getIndex ${idx.key}`
        );
        console.log(`   - Index '${idx.key}' already exists.`);
        return;
    } catch (error) {
        if (error.code !== 404) throw error;
    }

    console.log(`   - Creating index: '${idx.key}' (${idx.type})`);
    try {
        await withRetry(() =>
            databases.createIndex(
                targetDatabaseId,
                colId,
                idx.key,
                idx.type,
                idx.attributes,
                idx.orders || []
            ),
            `createIndex ${idx.key}`
        );
        stats.indexes++;
        await sleep(2000);
    } catch (e) {
        if (e.code === 409) {
            console.log(`   - Index '${idx.key}' already exists (409).`);
        } else {
            console.error(`     ❌ Error creating index '${idx.key}': ${e.message}`);
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function rebuildSchema() {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_PROJECT_ID || 'itimocktest')
        .setKey(process.env.APPWRITE_API_KEY || 'standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

    const databases = new Databases(client);
    const storage = new Storage(client);
    const teams = new Teams(client);

    const schemaPath = path.resolve('./appwrite.json');
    if (!fs.existsSync(schemaPath)) throw new Error(`Cannot find appwrite.json at ${schemaPath}`);
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    const stats = { collections: 0, attributes: 0, indexes: 0, buckets: 0, teams: 0 };
    const targetDatabaseId = 'itimocktest';

    console.log('\n--- 🚀 STARTING APPWRITE SCHEMA REBUILD ---');

    // ── STEP 2: Database ──────────────────────────────────────────────────────
    try {
        await withRetry(() => databases.get(targetDatabaseId), 'getDatabase');
        console.log(`✔ Database '${targetDatabaseId}' already exists, skipping.`);
    } catch (error) {
        if (error.code === 404) {
            console.log(`Creating database: ${targetDatabaseId}`);
            await withRetry(() => databases.create(targetDatabaseId, 'iti mock test', true), 'createDatabase');
            console.log(`✔ Database '${targetDatabaseId}' created.`);
        } else {
            throw error;
        }
    }

    // ── STEP 3–5: Collections → Attributes → Indexes ─────────────────────────
    const collectionOrder = [
        'tradesTable', 'tradeSubjects', 'modulesData', 'collagesTable',
        'userProfile', 'batchesTable', 'batchRequests', 'batchStudents',
        'questionData', 'questionPaperData', 'userStats', 'userAttaindance'
    ];

    for (const colName of collectionOrder) {
        const colData = schema.collections.find(c => c.name === colName);
        if (!colData) {
            console.warn(`\n[Warning] Collection '${colName}' not found in appwrite.json! Skipping.`);
            continue;
        }

        console.log(`\n> Collection: ${colData.name}`);
        await createCollectionIfNotExists(databases, targetDatabaseId, colData, stats);
        await sleep(300);

        // Attributes
        for (const attr of (colData.attributes || [])) {
            await createAttributeSafe(databases, targetDatabaseId, colData.$id, attr, stats);
        }

        // Extra buffer before index creation so all attrs are 'available'
        await sleep(3000);

        // Indexes
        for (const idx of (colData.indexes || [])) {
            await createIndexSafe(databases, targetDatabaseId, colData.$id, idx, stats);
        }
    }

    // ── STEP 6: Storage Bucket ────────────────────────────────────────────────
    console.log('\n> Processing Storage');
    try {
        await withRetry(() => storage.getBucket('mocktestimages'), 'getBucket');
        console.log('- Bucket mocktestimages already exists.');
    } catch (error) {
        if (error.code === 404) {
            console.log('- Creating bucket mocktestimages');
            await withRetry(() => storage.createBucket(
                'mocktestimages', 'images',
                undefined, false, true,
                5 * 1024 * 1024, // 5 MB
                undefined, 'none', true, true
            ), 'createBucket');
            stats.buckets++;
        } else {
            console.error('Error fetching bucket:', error.message);
        }
    }

    // ── STEP 7: Teams ─────────────────────────────────────────────────────────
    console.log('\n> Processing Teams');
    try {
        const teamsList = await withRetry(() => teams.list(), 'listTeams');
        const existingNames = teamsList.teams.map(t => t.name);
        for (const tName of ['instructor', 'student']) {
            if (!existingNames.includes(tName)) {
                console.log(`- Creating team: ${tName}`);
                await withRetry(() => teams.create('unique()', tName), `createTeam ${tName}`);
                stats.teams++;
            } else {
                console.log(`- Team '${tName}' already exists.`);
            }
        }
    } catch (error) {
        console.error('Error processing teams:', error.message);
    }

    // ── STEP 8: Validation ────────────────────────────────────────────────────
    console.log('\n> Commencing Validation...');
    const allCollections = await withRetry(() => databases.listCollections(targetDatabaseId), 'listCollections');
    let allMatch = true;
    for (const remoteCol of allCollections.collections) {
        const localCol = schema.collections.find(c => c.$id === remoteCol.$id);
        if (!localCol) continue;
        if (remoteCol.attributes.length !== localCol.attributes.length) {
            console.log(`  ❌ [Mismatch] '${localCol.name}': Expected ${localCol.attributes.length} attributes, found ${remoteCol.attributes.length}`);
            allMatch = false;
        }
        if (remoteCol.indexes.length !== localCol.indexes.length) {
            console.log(`  ❌ [Mismatch] '${localCol.name}': Expected ${localCol.indexes.length} indexes, found ${remoteCol.indexes.length}`);
            allMatch = false;
        }
    }
    if (allMatch) console.log('  ✅ All collections validated successfully!');

    // ── Output ─────────────────────────────────────────────────────────────────
    console.log('\n--- EXECUTION COMPLETE ---');
    console.log(`✔ Database created / verified`);
    console.log(`✔ Collections created: ${stats.collections}`);
    console.log(`✔ Attributes created: ${stats.attributes}`);
    console.log(`✔ Indexes created: ${stats.indexes}`);
    console.log(`✔ Bucket created: ${stats.buckets}`);
    console.log(`✔ Teams created: ${stats.teams}`);
}

rebuildSchema().catch((err) => {
    console.error('\n[Fatal Error]', err);
    process.exit(1);
});
