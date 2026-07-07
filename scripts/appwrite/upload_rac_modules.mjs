import { Client, Databases, ID, Query } from 'node-appwrite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Appwrite Config ──────────────────────────────────────────────────────────
const endpoint = process.env.VITE_APPWRITE_URL || 'https://auth.itimitra.in/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || 'itimocktest';
const apiKey = process.env.VITE_APPWRITE_API_KEY;
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'itimocktest';
const COL_ID = process.env.VITE_NEW_MODULES_DATA_COLLECTION_ID || 'newmodulesdata';

if (!apiKey) {
    console.error("❌ ERROR: VITE_APPWRITE_API_KEY is not defined in your .env file.");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

// ── Target Parameters ────────────────────────────────────────────────────────
const TRADE_ID = '69cbe4ec74f6c8fe120e'; // Refrigeration and Air Conditioner Technician
const SUBJ_ID  = '69cbec4d002dbcf7a5c4'; // Trade Theory

async function uploadYear(yearName, jsonFilePath) {
    console.log(`\n📂 Loading ${yearName} year modules from: ${jsonFilePath}`);
    const rawData = readFileSync(jsonFilePath, 'utf8');
    const modules = JSON.parse(rawData);
    console.log(`💡 Found ${modules.length} modules to process.`);

    // 1. Fetch all existing modules for this trade, subject, and year
    console.log(`🔍 Fetching existing ${yearName} modules from Appwrite...`);
    let existingDocs = [];
    try {
        const response = await databases.listDocuments(DB_ID, COL_ID, [
            Query.equal("tradeId", TRADE_ID),
            Query.equal("subjectId", SUBJ_ID),
            Query.equal("year", yearName),
            Query.limit(100)
        ]);
        existingDocs = response.documents;
        console.log(`Found ${existingDocs.length} existing documents in Appwrite.`);
    } catch (e) {
        console.error(`⚠️ Failed to list existing documents: ${e.message}. Proceeding to create mode.`);
    }

    const existingMap = new Map(existingDocs.map(doc => [doc.moduleId, doc]));

    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    for (const mod of modules) {
        const moduleId = mod.moduleId;
        const evalPoints = (mod.evalutionsPoints || []).map(p => JSON.stringify(p));

        const docData = {
            moduleId:           moduleId,
            moduleName:         mod.moduleName,
            moduleDuration:     mod.moduleDuration,
            moduleDescription:  mod.moduleDescription,
            learningOutcome:    mod.learningOutcome,
            assessmentCriteria: mod.assessmentCriteria || mod.learningOutcome,
            assessmentPaperId:  '',
            hours:              0,
            images:             [],
            topics:             [],
            tradeId:            TRADE_ID,
            subjectId:          SUBJ_ID,
            year:               yearName,
            evalutionsPoints:   evalPoints
        };

        const existingDoc = existingMap.get(moduleId);
        if (existingDoc) {
            // Update existing
            try {
                await databases.updateDocument(DB_ID, COL_ID, existingDoc.$id, docData);
                console.log(`  🔄 [Updated] ${moduleId} — ${mod.moduleName}`);
                updatedCount++;
            } catch (err) {
                console.error(`  ❌ [Update Failed] ${moduleId} — ${err.message}`);
                failedCount++;
            }
        } else {
            // Create new
            try {
                await databases.createDocument(DB_ID, COL_ID, ID.unique(), docData);
                console.log(`  ✅ [Created] ${moduleId} — ${mod.moduleName}`);
                createdCount++;
            } catch (err) {
                console.error(`  ❌ [Creation Failed] ${moduleId} — ${err.message}`);
                failedCount++;
            }
        }

        // Small delay to prevent rate-limiting
        await new Promise(r => setTimeout(r, 150));
    }

    console.log(`\n📊 ${yearName} Year Summary:`);
    console.log(`  Created: ${createdCount}`);
    console.log(`  Updated: ${updatedCount}`);
    console.log(`  Failed : ${failedCount}`);
}

async function main() {
    console.log("🚀 Starting RAC Trade Theory Modules Import...");
    console.log(`Endpoint : ${endpoint}`);
    console.log(`Project  : ${projectId}`);
    console.log(`Database : ${DB_ID}`);
    console.log(`Collection: ${COL_ID}`);
    console.log(`Trade ID  : ${TRADE_ID}`);
    console.log(`Subject ID: ${SUBJ_ID}`);

    const firstYearPath = join(__dirname, 'rac_modules_first_year.json');
    const secondYearPath = join(__dirname, 'rac_modules_second_year.json');

    await uploadYear('FIRST', firstYearPath);
    await uploadYear('SECOND', secondYearPath);

    console.log("\n🏁 Done importing RAC modules.");
}

main().catch(err => {
    console.error("\n❌ Fatal Error:", err.message);
    process.exit(1);
});
