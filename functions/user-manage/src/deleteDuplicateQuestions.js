import { config } from 'dotenv';
import { Client, Databases, ID, Query } from 'node-appwrite';
import fuzz from 'fuzzball';

config();

// ==========================================
// CONFIGURATION
// ==========================================
const client = new Client();

// 1. API Setup
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

console.log("API setup complete");

const databases = new Databases(client);
const DATABASE_ID = 'itimocktest'; 
const COLLECTION_ID = '667932c5000ff8e2d769'; 
const QUESTION_ATTR = 'question'; // Column for question text
const OPTIONS_ATTR = 'options';   // Column for options array

// 2. SAFETY SWITCH
const DRY_RUN = false; // Set to true to test first

// ==========================================
// LOGIC
// ==========================================

async function main() {
  try {
    console.log('--- STARTING ENHANCED CLEANUP JOB ---');

    // STEP 1: Fetch ALL Documents
    let allDocs = [];
    let offset = 0;
    let limit = 100;
    let keepFetching = true;

    process.stdout.write('Fetching documents... ');
    while (keepFetching) {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset)]
      );

      allDocs = allDocs.concat(response.documents);
      offset += limit;

      if (response.documents.length < limit) keepFetching = false;
    }
    console.log(`Done. Found ${allDocs.length} documents.`);

    // STEP 2: Pre-process data (Extract English from Question AND Options)
    console.log('Pre-processing text (Questions & Options)...');

    const processedDocs = allDocs.map((doc) => {
      const rawQ = doc[QUESTION_ATTR] || '';
      // Handle options: Ensure it's an array, then join into a string
      const rawOptArray = doc[OPTIONS_ATTR] || [];
      const rawOptString = Array.isArray(rawOptArray) ? rawOptArray.join(" ") : "";

      // Helper to remove Marathi and cleanup
      const cleanText = (text) => {
        return text
            .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII (Marathi)
            .toLowerCase()
            .trim();
      };

      return {
        id: doc.$id,
        originalQ: rawQ,
        cleanQ: cleanText(rawQ),        // Clean Question
        cleanOpt: cleanText(rawOptString), // Clean Options String
        shouldDelete: false,
      };
    });

    // STEP 3: Find Duplicates (Double Fuzzy Match)
    console.log('Comparing questions and options...');

    let duplicateCount = 0;
    const idsToDelete = [];

    for (let i = 0; i < processedDocs.length; i++) {
      if (processedDocs[i].shouldDelete) continue;

      for (let j = i + 1; j < processedDocs.length; j++) {
        if (processedDocs[j].shouldDelete) continue;

        const docA = processedDocs[i];
        const docB = processedDocs[j];

        // 1. Compare Questions
        const qScore = fuzz.token_set_ratio(docA.cleanQ, docB.cleanQ);

        // Optimization: Only check options if questions are already similar
        // (Saves processing time)
        if (qScore >= 90) {
            
            // 2. Compare Options
            const optScore = fuzz.token_set_ratio(docA.cleanOpt, docB.cleanOpt);

            // STRICT MATCHING: 
            // Question must be > 95% similar AND Options must be > 90% similar
            // We allow slightly lower score for options because order might vary
            if (optScore >= 90) {
                console.log(`\n[DUPLICATE FOUND]`);
                console.log(`Question Match: ${qScore}% | Options Match: ${optScore}%`);
                console.log(`KEEP:   ${docA.originalQ}`);
                console.log(`DELETE: ${docB.originalQ}`);
                
                processedDocs[j].shouldDelete = true;
                idsToDelete.push(docB.id);
                duplicateCount++;
            }
        }
      }
      if (i % 100 === 0) process.stdout.write(`${i}... `);
    }

    console.log(`\n\n--- SUMMARY ---`);
    console.log(`Total Documents: ${allDocs.length}`);
    console.log(`Duplicates Found: ${duplicateCount}`);

    // STEP 4: Delete Operations
    if (duplicateCount > 0) {
      if (DRY_RUN) {
        console.log('\n[DRY RUN MODE]: No data was deleted.');
      } else {
        console.log('\n[DELETING] Starting deletion process...');
        for (const id of idsToDelete) {
          await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
          console.log(`Deleted ID: ${id}`);
        }
        console.log('Deletion complete.');
      }
    } else {
      console.log('No duplicates found.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();