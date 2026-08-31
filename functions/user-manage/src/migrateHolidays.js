// functions/user-manage/src/migrateHolidays.js

import { Client, TablesDB, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

function formatDate(dateString) {
  if (!dateString) return null;

  // Check for yyyy-MM-dd format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Check for dd-MM-yyyy format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }

  return null; // Return null for invalid formats
}

async function migrateHolidays() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const tablesDB = new TablesDB(client);

  const DB_ID = 'itimocktest';
  const BATCHES_COLLECTION_ID = '66936df000108d8e2364';
  const HOLIDAY_DAYS_COLLECTION_ID = 'holidayDays';

  try {
    console.log('Starting holiday migration...');

    // 1. Fetch all batch documents
    console.log('Fetching batch data...');
    let batchDocs = [];
    let offset = 0;
    let response;
    do {
      response = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: BATCHES_COLLECTION_ID,
        queries: [
          Query.limit(100),
          Query.offset(offset),
        ]
      });
      const rows = response.rows || response.documents || [];
      batchDocs.push(...rows);
      offset += rows.length;
      if (rows.length < 100) break;
    } while (true);
    console.log(`Found ${batchDocs.length} batch documents.`);

    // 2. Fetch existing holiday days to check for duplicates
    console.log('Fetching existing holiday days...');
    let existingHolidays = [];
    offset = 0;
    do {
      response = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: HOLIDAY_DAYS_COLLECTION_ID,
        queries: [Query.limit(100), Query.offset(offset)]
      });
      const rows = response.rows || response.documents || [];
      existingHolidays.push(...rows);
      offset += rows.length;
      if (rows.length < 100) break;
    } while (true);

    // Create a Set for fast duplicate checking (batchId-date combination)
    const existingRecordsSet = new Set(
      existingHolidays.map((doc) => `${doc.batchId}-${doc.date}`)
    );
    console.log(`Found ${existingHolidays.length} existing holiday days.`);

    let newHolidayDocs = [];

    // 3. Transform data
    console.log('Transforming data...');
    for (const batchDoc of batchDocs) {
      const { $id: batchId, attendanceHolidays } = batchDoc;

      if (!attendanceHolidays || attendanceHolidays.length === 0) {
        continue;
      }

      for (const holidayStr of attendanceHolidays) {
        try {
          const holiday = JSON.parse(holidayStr);

          if (!holiday.date) {
            console.warn(
              `Skipping holiday without date for batch ${batchId}: ${holidayStr}`
            );
            continue;
          }

          const formattedDate = formatDate(holiday.date);

          if (!formattedDate) {
            console.warn(
              `Skipping holiday with invalid date format for batch ${batchId}: ${holiday.date}`
            );
            continue;
          }

          // Check if record already exists
          const recordKey = `${batchId}-${formattedDate}`;
          if (existingRecordsSet.has(recordKey)) {
            continue; // Skip duplicates
          }

          const newDoc = {
            $id: ID.unique(),
            batchId,
            date: formattedDate,
            holidayText: holiday.holidayText || 'Holiday',
          };
          newHolidayDocs.push(newDoc);
        } catch (e) {
          console.error(
            `Error parsing holiday for batch ${batchId}: ${holidayStr}`,
            e
          );
        }
      }
    }
    console.log(
      `Transformed ${newHolidayDocs.length} new holiday records (duplicates filtered).`
    );

    if (newHolidayDocs.length === 0) {
      console.log('No new records to migrate. Migration completed.');
      return;
    }

    // 4. Batch insert using bulk operations (100 documents per batch)
    console.log('Inserting new holiday documents using bulk operations...');
    let createdCount = 0;
    let failedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < newHolidayDocs.length; i += batchSize) {
      const chunk = newHolidayDocs.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(newHolidayDocs.length / batchSize);

      console.log(
        `Processing batch ${batchNumber}/${totalBatches} (${chunk.length} documents)...`
      );

      try {
        if (typeof tablesDB.upsertRows === 'function') {
          await tablesDB.upsertRows({
            databaseId: DB_ID,
            tableId: HOLIDAY_DAYS_COLLECTION_ID,
            rows: chunk
          });
        } else {
          await Promise.all(
            chunk.map((doc) => tablesDB.createRow({
              databaseId: DB_ID,
              tableId: HOLIDAY_DAYS_COLLECTION_ID,
              rowId: doc.$id,
              data: doc
            }))
          );
        }
        createdCount += chunk.length;
        console.log(
          `✓ Batch ${batchNumber} completed successfully. Total created: ${createdCount}`
        );
      } catch (e) {
        failedCount += chunk.length;
        console.error(`✗ Batch ${batchNumber} failed:`, e.message);

        console.log(
          `Attempting individual inserts for batch ${batchNumber}...`
        );
        let individualSuccess = 0;
        let individualFailed = 0;

        for (const doc of chunk) {
          try {
            await tablesDB.createRow({
              databaseId: DB_ID,
              tableId: HOLIDAY_DAYS_COLLECTION_ID,
              rowId: doc.$id,
              data: doc
            });
            individualSuccess++;
            createdCount++;
          } catch (individualError) {
            individualFailed++;
            if (individualError.code !== 409) {
              console.error(
                `Failed to create document for batch ${doc.batchId} on ${doc.date}:`,
                individualError.message
              );
            }
          }
        }

        failedCount -= individualSuccess;
        console.log(
          `Individual inserts: ${individualSuccess} succeeded, ${individualFailed} failed`
        );
      }

      if (i + batchSize < newHolidayDocs.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log('\n=== Migration completed ===');
    console.log(`Total records to migrate: ${newHolidayDocs.length}`);
    console.log(`Successfully created: ${createdCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(
      `Already existed (skipped during transformation): ${existingHolidays.length}`
    );
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrateHolidays().catch(console.error);
