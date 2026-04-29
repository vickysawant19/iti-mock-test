
import { Client, Databases, Query } from 'node-appwrite';

const client = new Client();
client
    .setEndpoint('https://api.itimitra.in/v1')
    .setProject('itimocktest')
    .setKey('standard_95dec26d9fc1b965daba5add865d10732fec160a64cc0cce9e58ced724ec220f9f278c7c2d66fdca3b6b8f5ea5e7598afe69f8593851cb8bbe5071482bcf4a34f5998c4f16e7d3aa679a5d879a4e0fe42cfb02b26f5e35b572922dfc4f3bcc4fe04cd255165a1b3e69b19f52022084d48557f6de1236d80ce9be245c71fb87de');

const databases = new Databases(client);
const DATABASE_ID = 'itimocktest';
const QUESTIONS_COLLECTION_ID = '667932c5000ff8e2d769';
const MODULES_COLLECTION_ID = 'newmodulesdata';

async function deleteOrphanedQuestions() {
    try {
        console.log("Fetching all current module IDs...");
        let moduleDocIds = new Set();
        let offset = 0;
        let limit = 100;
        while (true) {
            const res = await databases.listDocuments(DATABASE_ID, MODULES_COLLECTION_ID, [Query.limit(limit), Query.offset(offset)]);
            res.documents.forEach(doc => moduleDocIds.add(doc.$id));
            if (res.documents.length < limit) break;
            offset += limit;
        }
        console.log(`Found ${moduleDocIds.size} valid module documents.`);

        console.log("Fetching all questions...");
        let questions = [];
        offset = 0;
        while (true) {
            const res = await databases.listDocuments(DATABASE_ID, QUESTIONS_COLLECTION_ID, [Query.limit(limit), Query.offset(offset)]);
            questions = questions.concat(res.documents);
            if (res.documents.length < limit) break;
            offset += limit;
        }
        console.log(`Found ${questions.length} total questions.`);

        let deletedCount = 0;
        for (const q of questions) {
            // An orphaned question is one that:
            // 1. Has a moduleId that is NOT in our set of current module document IDs
            // 2. AND is missing the new 'tradeId' field (meaning it's a legacy question)
            
            const isLegacy = !q.tradeId;
            const moduleExists = moduleDocIds.has(q.moduleId);

            if (isLegacy && !moduleExists) {
                console.log(`Deleting orphaned question: ${q.$id} (Module: ${q.moduleId})`);
                await databases.deleteDocument(DATABASE_ID, QUESTIONS_COLLECTION_ID, q.$id);
                deletedCount++;
            }
        }

        console.log(`\nCleanup complete! Deleted ${deletedCount} orphaned questions.`);
    } catch (error) {
        console.error("Error during cleanup:", error.message);
    }
}

deleteOrphanedQuestions();
