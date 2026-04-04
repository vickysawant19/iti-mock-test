import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.APPWRITE_API_KEY || 'standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases = new Databases(client);
const DB_ID = 'itimocktest';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const waitForAttr = async (colId, key) => {
    for (let i = 0; i < 30; i++) {
        try {
            const a = await databases.getAttribute(DB_ID, colId, key);
            if (a.status === 'available') return;
        } catch (_) {}
        await sleep(1500);
    }
    throw new Error(`Attribute '${key}' in '${colId}' never became available`);
};

const createAttr = async (colId, key, fn) => {
    try {
        await databases.getAttribute(DB_ID, colId, key);
        console.log(`   ✔ attr '${key}' already exists`);
    } catch (e) {
        if (e.code !== 404) throw e;
        console.log(`   → creating attr '${key}'`);
        await fn();
        await waitForAttr(colId, key);
    }
};

const createIndex = async (colId, key, type, attrs, orders) => {
    try {
        await databases.getIndex(DB_ID, colId, key);
        console.log(`   ✔ index '${key}' already exists`);
    } catch (e) {
        if (e.code !== 404) throw e;
        console.log(`   → creating index '${key}'`);
        await databases.createIndex(DB_ID, colId, key, type, attrs, orders);
        await sleep(2000);
    }
};

// ─── Collection definitions ───────────────────────────────────────────────────

const collections = [
    {
        id: 'newAttendance',
        name: 'newAttendance',
        permissions: [
            'create("users")', 'read("users")', 'update("users")', 'delete("users")',
            'create("any")', 'read("any")'
        ],
        documentSecurity: false,
        attrs: async (colId) => {
            await createAttr(colId, 'userId',   () => databases.createStringAttribute(DB_ID, colId, 'userId', 50, true));
            await createAttr(colId, 'batchId',  () => databases.createStringAttribute(DB_ID, colId, 'batchId', 50, true));
            await createAttr(colId, 'tradeId',  () => databases.createStringAttribute(DB_ID, colId, 'tradeId', 50, false));
            await createAttr(colId, 'date',     () => databases.createStringAttribute(DB_ID, colId, 'date', 10, true));   // YYYY-MM-DD
            await createAttr(colId, 'status',   () => databases.createStringAttribute(DB_ID, colId, 'status', 20, true));
            await createAttr(colId, 'remarks',  () => databases.createStringAttribute(DB_ID, colId, 'remarks', 500, false, null));
            await createAttr(colId, 'markedAt', () => databases.createDatetimeAttribute(DB_ID, colId, 'markedAt', false, null));
            await createAttr(colId, 'markedBy', () => databases.createStringAttribute(DB_ID, colId, 'markedBy', 50, false, null));
        },
        indexes: async (colId) => {
            // Primary query pattern: userId + batchId + date
            await createIndex(colId, 'idx_user_batch',      'key',    ['userId', 'batchId'], ['ASC', 'ASC']);
            await createIndex(colId, 'idx_batch_date',      'key',    ['batchId', 'date'],   ['ASC', 'ASC']);
            await createIndex(colId, 'idx_user_batch_date', 'unique', ['userId', 'batchId', 'date'], ['ASC', 'ASC', 'ASC']);
        }
    },
    {
        id: 'dailyDiary',
        name: 'dailyDiary',
        permissions: [
            'create("users")', 'read("users")', 'update("users")', 'delete("users")',
            'read("any")'
        ],
        documentSecurity: false,
        attrs: async (colId) => {
            await createAttr(colId, 'batchId',        () => databases.createStringAttribute(DB_ID, colId, 'batchId', 50, true));
            await createAttr(colId, 'instructorId',   () => databases.createStringAttribute(DB_ID, colId, 'instructorId', 50, false, null));
            await createAttr(colId, 'date',           () => databases.createDatetimeAttribute(DB_ID, colId, 'date', true));
            await createAttr(colId, 'theoryWork',     () => databases.createStringAttribute(DB_ID, colId, 'theoryWork', 2000, false, null));
            await createAttr(colId, 'practicalWork',  () => databases.createStringAttribute(DB_ID, colId, 'practicalWork', 2000, false, null));
            await createAttr(colId, 'extraWork',      () => databases.createStringAttribute(DB_ID, colId, 'extraWork', 1000, false, null));
            await createAttr(colId, 'hours',          () => databases.createIntegerAttribute(DB_ID, colId, 'hours', false, 0, 24, null));
            await createAttr(colId, 'remarks',        () => databases.createStringAttribute(DB_ID, colId, 'remarks', 1000, false, null));
            await createAttr(colId, 'practicalNumbers', () => databases.createStringAttribute(DB_ID, colId, 'practicalNumbers', 10, false, null, true)); // array
        },
        indexes: async (colId) => {
            await createIndex(colId, 'idx_batch_date', 'key', ['batchId', 'date'], ['ASC', 'DESC']);
        }
    }
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    console.log('\n--- 🚀 Creating missing collections ---\n');

    for (const col of collections) {
        console.log(`\n▶ Collection: ${col.name}`);

        // Create collection if missing
        try {
            await databases.getCollection(DB_ID, col.id);
            console.log(`  ✔ Collection '${col.name}' already exists`);
        } catch (e) {
            if (e.code !== 404) throw e;
            console.log(`  → Creating collection '${col.name}'`);
            await databases.createCollection(DB_ID, col.id, col.name, col.permissions, col.documentSecurity, true);
            await sleep(500);
        }

        // Attributes
        console.log('  Attributes:');
        await col.attrs(col.id);

        // Wait before indexes so all attrs are available
        await sleep(3000);

        // Indexes
        console.log('  Indexes:');
        await col.indexes(col.id);
    }

    console.log('\n✅ Done! Both collections are ready.\n');
}

run().catch(err => {
    console.error('\n[Fatal Error]', err.message);
    process.exit(1);
});
