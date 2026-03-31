import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.APPWRITE_API_KEY || 'standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases = new Databases(client);
const DB_ID = 'itimocktest';
const COL_ID = 'newmodulesdata';

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

async function run() {
    console.log(`\n▶ Creating collection: ${COL_ID}`);

    try {
        await databases.getCollection(DB_ID, COL_ID);
        console.log(`  ✔ Collection '${COL_ID}' already exists`);
    } catch (e) {
        if (e.code !== 404) throw e;
        console.log(`  → Creating collection '${COL_ID}'`);
        await databases.createCollection(
            DB_ID, 
            COL_ID, 
            COL_ID, 
            ['create("users")', 'read("users")', 'update("users")', 'delete("users")', 'read("any")'], 
            false, 
            true
        );
        await sleep(1000);
    }

    const attrs = [
        { key: 'moduleId',           fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'moduleId', 50, true) },
        { key: 'moduleName',         fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'moduleName', 200, true) },
        { key: 'moduleDuration',     fn: () => databases.createIntegerAttribute(DB_ID, COL_ID, 'moduleDuration', true) },
        { key: 'moduleDescription',  fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'moduleDescription', 2000, true) },
        { key: 'learningOutcome',    fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'learningOutcome', 2000, true) },
        { key: 'assessmentCriteria', fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'assessmentCriteria', 2000, true) },
        { key: 'assessmentPaperId',  fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'assessmentPaperId', 50, false, null) },
        { key: 'evalutionsPoints',   fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'evalutionsPoints', 2000, false, null, true) },
        { key: 'images',             fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'images', 2000, false, null, true) },
        { key: 'hours',              fn: () => databases.createIntegerAttribute(DB_ID, COL_ID, 'hours', false, 0, null, null) },
        { key: 'topics',             fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'topics', 2000, false, null, true) },
        { key: 'tradeId',            fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'tradeId', 50, true) },
        { key: 'subjectId',          fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'subjectId', 50, true) },
        { key: 'year',               fn: () => databases.createStringAttribute(DB_ID, COL_ID, 'year', 20, true) },
    ];

    for (const attr of attrs) {
        try {
            await databases.getAttribute(DB_ID, COL_ID, attr.key);
            console.log(`  ✔ Attribute '${attr.key}' already exists`);
        } catch (e) {
            if (e.code !== 404) throw e;
            console.log(`  → Creating attribute '${attr.key}'`);
            await attr.fn();
            await waitForAttr(COL_ID, attr.key);
        }
    }

    const indexes = [
        { key: 'idx_trade_subject_year', type: 'key', attrs: ['tradeId', 'subjectId', 'year'], orders: ['ASC', 'ASC', 'ASC'] },
        { key: 'idx_module_id', type: 'key', attrs: ['moduleId'], orders: ['ASC'] }
    ];

    for (const idx of indexes) {
        try {
            await databases.getIndex(DB_ID, COL_ID, idx.key);
            console.log(`  ✔ Index '${idx.key}' already exists`);
        } catch (e) {
            if (e.code !== 404) throw e;
            console.log(`  → Creating index '${idx.key}'`);
            await databases.createIndex(DB_ID, COL_ID, idx.key, idx.type, idx.attrs, idx.orders);
            await sleep(2000);
        }
    }

    console.log('\n✅ Collection newmodulesdata is ready.');
}

run().catch(err => {
    console.error('\n[Fatal Error]', err.message);
    process.exit(1);
});
