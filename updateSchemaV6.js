import { Client, Databases, Query } from "node-appwrite";
import "dotenv/config";

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "itimocktest";
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "itimocktest";
const DAILY_DIARY_COLLECTION_ID = "dailyDiary";
const API_KEY = process.env.APPWRITE_API_KEY || "standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125";
const ENDPOINT = process.env.VITE_APPWRITE_URL || "https://cloud.appwrite.io/v1";

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function updateSchema() {
    try {
        console.log("Checking for practicalNumbers attribute...");
        const attrs = await databases.listAttributes(DATABASE_ID, DAILY_DIARY_COLLECTION_ID);
        const hasAttr = attrs.attributes.find(a => a.key === "practicalNumbers");
        
        if (!hasAttr) {
            console.log("Creating practicalNumbers string array attribute...");
            await databases.createStringAttribute(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, "practicalNumbers", 50, false, undefined, true);
            console.log("Attribute created. Waiting 5 seconds for Appwrite to sync...");
            await sleep(5000);
        } else {
            console.log("Attribute already exists.");
        }
    } catch (e) {
        console.error("Schema update failed:", e);
    }
}

function extractPracticalNumbers(text) {
    if (!text) return [];
    
    // As per user request: extract raw numbers safely and flexibly
    const matches = text.match(/\d+/g);
    return matches || [];
}

function extractNumbers(entry) {
    let numbers = [];
    
    // 1. User recommended extraction from practicalWork or workDone
    const practicalText = entry.practicalWork || entry.workDone || "";
    if (practicalText) {
        numbers.push(...extractPracticalNumbers(practicalText));
    }

    // 2. Extract from explicit Legacy remarks (previous migration step) -> "Prac #: 82"
    if (entry.remarks && entry.remarks.includes("Prac #:")) {
        const match = entry.remarks.match(/Prac #:\s*([\d,\.\s]+)/i);
        if (match && match[1]) {
            const parsed = match[1].split(/[, ]+/).map(n => n.trim()).filter(Boolean);
            numbers.push(...parsed);
        }
    }

    // Return unique strings
    return [...new Set(numbers)];
}

async function migrateData() {
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    let migratedCount = 0;

    console.log("Starting data migration for practical numbers...");

    while (hasMore) {
        const res = await databases.listDocuments(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, [
            Query.limit(limit),
            Query.offset(offset)
        ]);

        if (res.documents.length === 0) {
            hasMore = false;
            break;
        }

        const promises = [];
        for (const doc of res.documents) {
            if (!doc.practicalNumbers || doc.practicalNumbers.length === 0) {
                const numbers = extractNumbers(doc);
                
                if (numbers.length > 0) {
                    let newRemarks = doc.remarks;
                    if (newRemarks && newRemarks.includes("Prac #:")) {
                        newRemarks = newRemarks.replace(/Prac #:\s*[\d,\.\s]+/i, "").trim();
                        if (!newRemarks) newRemarks = "-";
                    }

                    promises.push(
                        databases.updateDocument(DATABASE_ID, DAILY_DIARY_COLLECTION_ID, doc.$id, {
                            practicalNumbers: numbers,
                            remarks: newRemarks
                        }).then(() => { process.stdout.write("."); migratedCount++; })
                          .catch(e => console.error(`Failed on doc ${doc.$id}:`, e.message))
                    );
                }
            }
        }

        await Promise.all(promises);
        offset += limit;
    }

    console.log(`\nMigration completed. Updated ${migratedCount} documents.`);
}

async function run() {
    await updateSchema();
    await migrateData();
}

run();
