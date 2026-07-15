import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://api.itimitra.in/v1')
    .setProject('itimocktest')
    .setKey('standard_95dec26d9fc1b965daba5add865d10732fec160a64cc0cce9e58ced724ec220f9f278c7c2d66fdca3b6b8f5ea5e7598afe69f8593851cb8bbe5071482bcf4a34f5998c4f16e7d3aa679a5d879a4e0fe42cfb02b26f5e35b572922dfc4f3bcc4fe04cd255165a1b3e69b19f52022084d48557f6de1236d80ce9be245c71fb87de');

const databases = new Databases(client);

const DB_ID = 'itimocktest';
const Q_COL = '667932c5000ff8e2d769';

async function testFix() {
    try {
        console.log("--- Fetching a sample question to get valid IDs ---");
        const res = await databases.listDocuments(DB_ID, Q_COL, [
            Query.notEqual("tags", ""),
            Query.limit(1)
        ]);
        
        if (res.documents.length === 0) {
            console.log("No questions with tags found.");
            return;
        }

        const doc = res.documents[0];
        const tradeId = doc.tradeId;
        const subjectId = doc.subjectId;
        const moduleId = doc.moduleId;
        const tagsList = doc.tags.split(',').map(t => t.trim()).filter(Boolean);

        console.log(`Using sample document for test:`);
        console.log(`- tradeId: ${tradeId}`);
        console.log(`- subjectId: ${subjectId}`);
        console.log(`- moduleId: ${moduleId}`);
        console.log(`- tagsList:`, tagsList);

        console.log("\n--- Testing FIX for tagsList ---");
        const baseQueriesTags = [
            Query.equal("tradeId", tradeId),
            Query.equal("subjectId", subjectId)
        ];

        if (tagsList.length === 1) {
            baseQueriesTags.push(Query.contains("tags", tagsList[0]));
        } else if (tagsList.length > 1) {
            baseQueriesTags.push(Query.or(tagsList.map(t => Query.contains("tags", t))));
        }

        try {
            const resFixTags = await databases.listDocuments(DB_ID, Q_COL, baseQueriesTags);
            console.log(`Success! Total tag matches: ${resFixTags.total}`);
        } catch (e) {
            console.error("Tag fix query failed:", e.message);
        }

        console.log("\n--- Testing FIX for modulesList ---");
        const baseQueriesModules = [
            Query.equal("tradeId", tradeId),
            Query.equal("subjectId", subjectId)
        ];

        const modulesList = [moduleId]; // simulate single module configured
        if (modulesList.length === 1) {
            baseQueriesModules.push(Query.equal("moduleId", modulesList[0]));
        } else if (modulesList.length > 1) {
            baseQueriesModules.push(Query.or(modulesList.map(m => Query.equal("moduleId", m))));
        }

        try {
            const resFixModules = await databases.listDocuments(DB_ID, Q_COL, baseQueriesModules);
            console.log(`Success! Total module matches: ${resFixModules.total}`);
        } catch (e) {
            console.error("Module fix query failed:", e.message);
        }

    } catch (err) {
        console.error("Test failed globally:", err);
    }
}

testFix();
