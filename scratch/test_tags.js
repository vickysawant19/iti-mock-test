import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://api.itimitra.in/v1') // let's try the active .env endpoint first
    .setProject('itimocktest')
    .setKey('standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125');

const databases = new Databases(client);

const DB_ID = 'itimocktest';
const Q_COL = '667932c5000ff8e2d769';

async function testTags() {
    try {
        console.log("--- Fetching a few documents to check 'tags' structure ---");
        const sampleRes = await databases.listDocuments(DB_ID, Q_COL, [Query.limit(5)]);
        console.log(`Successfully fetched ${sampleRes.documents.length} sample docs.`);
        for (const doc of sampleRes.documents) {
            console.log(`ID: ${doc.$id}, Tags: "${doc.tags}" (type: ${typeof doc.tags})`);
        }

        // Get a specific tag from a sample document to search for
        let sampleTag = "";
        for (const doc of sampleRes.documents) {
            if (doc.tags && typeof doc.tags === 'string') {
                const tags = doc.tags.split(',').map(t => t.trim()).filter(Boolean);
                if (tags.length > 0) {
                    sampleTag = tags[0];
                    break;
                }
            }
        }

        if (!sampleTag) {
            console.log("No sample tags found in the first 5 documents. Searching all docs for any tags...");
            const allRes = await databases.listDocuments(DB_ID, Q_COL, [Query.limit(100)]);
            for (const doc of allRes.documents) {
                if (doc.tags && typeof doc.tags === 'string') {
                    const tags = doc.tags.split(',').map(t => t.trim()).filter(Boolean);
                    if (tags.length > 0) {
                        sampleTag = tags[0];
                        break;
                    }
                }
            }
        }

        if (!sampleTag) {
            console.log("Absolutely no tags found in database.");
            return;
        }

        console.log(`\nUsing sample tag for testing: "${sampleTag}"`);

        // Test 1: Query.search("tags", sampleTag)
        try {
            console.log(`\nTesting Query.search("tags", "${sampleTag}")...`);
            const resSearch = await databases.listDocuments(DB_ID, Q_COL, [
                Query.search("tags", sampleTag),
                Query.limit(5)
            ]);
            console.log(`Query.search returned ${resSearch.total} documents.`);
            resSearch.documents.forEach(d => console.log(` - ID: ${d.$id}, Tags: "${d.tags}"`));
        } catch (e) {
            console.error(`Query.search failed:`, e.message);
        }

        // Test 2: Query.contains("tags", sampleTag)
        try {
            console.log(`\nTesting Query.contains("tags", "${sampleTag}")...`);
            const resContains = await databases.listDocuments(DB_ID, Q_COL, [
                Query.contains("tags", [sampleTag]), // contains takes an array or string
                Query.limit(5)
            ]);
            console.log(`Query.contains returned ${resContains.total} documents.`);
            resContains.documents.forEach(d => console.log(` - ID: ${d.$id}, Tags: "${d.tags}"`));
        } catch (e) {
            console.error(`Query.contains failed:`, e.message);
        }

        // Test 3: Query.equal("tags", sampleTag)
        try {
            console.log(`\nTesting Query.equal("tags", "${sampleTag}")...`);
            const resEqual = await databases.listDocuments(DB_ID, Q_COL, [
                Query.equal("tags", sampleTag),
                Query.limit(5)
            ]);
            console.log(`Query.equal returned ${resEqual.total} documents.`);
            resEqual.documents.forEach(d => console.log(` - ID: ${d.$id}, Tags: "${d.tags}"`));
        } catch (e) {
            console.error(`Query.equal failed:`, e.message);
        }

    } catch (err) {
        console.error("Test failed globally:", err);
    }
}

testTags();
