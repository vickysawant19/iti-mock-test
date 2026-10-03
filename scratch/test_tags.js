import 'dotenv/config';
import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://auth.itimitra.in/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || 'itimocktest')
    .setKey(process.env.VITE_APPWRITE_API_KEY || '');

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
