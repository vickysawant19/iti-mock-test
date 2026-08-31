// functions/user-manage/src/migrateAttendanceScript.js

import { Client, TablesDB, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

// This script migrates data from userAttaindance to newAttendance collection.
// Make sure to set up your environment variables before running this script.
// APPWRITE_ENDPOINT
// APPWRITE_PROJECT_ID
// APPWRITE_API_KEY

async function migrate() {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const tablesDB = new TablesDB(client);

    const DB_ID = 'itimocktest';
    const USER_ATTENDANCE_COLLECTION_ID = '6693f8300003b08374b2';
    const NEW_ATTENDANCE_COLLECTION_ID = 'newAttendance';
    const USER_PROFILE_COLLECTION_ID = '66937340001047368f32';

    try {
        console.log('Starting migration...');

        // 1. Fetch all user attendance documents
        console.log('Fetching user attendance data...');
        let userAttendanceDocs = [];
        let offset = 0;
        let response;
        do {
            response = await tablesDB.listRows({
                databaseId: DB_ID,
                tableId: USER_ATTENDANCE_COLLECTION_ID,
                queries: [
                    Query.limit(100), 
                    Query.offset(offset)
                ]
            });
            const rows = response.rows || response.documents || [];
            userAttendanceDocs.push(...rows);
            offset += rows.length;
            if (rows.length < 100) break;
        } while (true);
        console.log(`Found ${userAttendanceDocs.length} user attendance documents.`);

        // 2. Fetch all user profiles to map userId to tradeId
        console.log('Fetching user profiles...');
        let userProfiles = [];
        offset = 0;
        do {
            response = await tablesDB.listRows({
                databaseId: DB_ID,
                tableId: USER_PROFILE_COLLECTION_ID,
                queries: [
                    Query.limit(100), 
                    Query.offset(offset)
                ]
            });
            const rows = response.rows || response.documents || [];
            userProfiles.push(...rows);
            offset += rows.length;
            if (rows.length < 100) break;
        } while (true);
        
        const userIdToTradeId = userProfiles.reduce((map, profile) => {
            map[profile.userId] = profile.tradeId;
            return map;
        }, {});
        console.log('User profiles fetched and mapped.');

        // 3. Fetch existing attendance records to check for duplicates
        console.log('Fetching existing attendance records...');
        let existingAttendance = [];
        offset = 0;
        do {
            response = await tablesDB.listRows({
                databaseId: DB_ID,
                tableId: NEW_ATTENDANCE_COLLECTION_ID,
                queries: [
                    Query.limit(100), 
                    Query.offset(offset)
                ]
            });
            const rows = response.rows || response.documents || [];
            existingAttendance.push(...rows);
            offset += rows.length;
            if (rows.length < 100) break;
        } while (true);
        
        // Create a Set for fast duplicate checking (userId-date combination)
        const existingRecordsSet = new Set(
            existingAttendance.map(doc => `${doc.userId}-${doc.date}`)
        );
        console.log(`Found ${existingAttendance.length} existing attendance records.`);

        let newAttendanceDocs = [];

        // 4. Transform data
        console.log('Transforming data...');
        for (const userDoc of userAttendanceDocs) {
            const { userId, batchId, attendanceRecords } = userDoc;
            const tradeId = userIdToTradeId[userId];

            if (!attendanceRecords || attendanceRecords.length === 0) {
                continue;
            }

            for (const recordStr of attendanceRecords) {
                try {
                    const record = JSON.parse(recordStr);
                    
                    if (!record.date) {
                        console.warn(`Skipping record without date for user ${userId}: ${recordStr}`);
                        continue;
                    }

                    // Check if record already exists
                    const recordKey = `${userId}-${record.date}`;
                    if (existingRecordsSet.has(recordKey)) {
                        continue; // Skip duplicates
                    }

                    let status = 'absent'; // default
                    if (record.isHoliday) {
                        status = 'holiday';
                    } else if (record.attendanceStatus === 'Present') {
                        status = 'present';
                    } else if (record.attendanceStatus === 'Late') {
                        status = 'late';
                    }

                    const newDoc = {
                        $id: ID.unique(),
                        userId,
                        batchId,
                        tradeId: tradeId || null,
                        date: record.date,
                        status: status,
                        remarks: record.reason || record.holidayText || null,
                    };
                    newAttendanceDocs.push(newDoc);
                } catch (e) {
                    console.error(`Error parsing record for user ${userId}: ${recordStr}`, e);
                }
            }
        }
        console.log(`Transformed ${newAttendanceDocs.length} new attendance records (duplicates filtered).`);

        if (newAttendanceDocs.length === 0) {
            console.log('No new records to migrate. Migration completed.');
            return;
        }

        // 5. Batch insert using bulk operations (100 documents per batch)
        console.log('Inserting new attendance documents using bulk operations...');
        let createdCount = 0;
        let failedCount = 0;
        const batchSize = 100;
        
        for (let i = 0; i < newAttendanceDocs.length; i += batchSize) {
            const chunk = newAttendanceDocs.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(newAttendanceDocs.length / batchSize);
            
            console.log(`Processing batch ${batchNumber}/${totalBatches} (${chunk.length} documents)...`);
            
            try {
                if (typeof tablesDB.upsertRows === 'function') {
                    await tablesDB.upsertRows({
                        databaseId: DB_ID,
                        tableId: NEW_ATTENDANCE_COLLECTION_ID,
                        rows: chunk
                    });
                } else {
                    await Promise.all(
                        chunk.map((doc) => tablesDB.createRow({
                            databaseId: DB_ID,
                            tableId: NEW_ATTENDANCE_COLLECTION_ID,
                            rowId: doc.$id,
                            data: doc
                        }))
                    );
                }
                createdCount += chunk.length;
                console.log(`✓ Batch ${batchNumber} completed successfully. Total created: ${createdCount}`);
            } catch (e) {
                failedCount += chunk.length;
                console.error(`✗ Batch ${batchNumber} failed:`, e.message);
                
                console.log(`Attempting individual inserts for batch ${batchNumber}...`);
                let individualSuccess = 0;
                let individualFailed = 0;
                
                for (const doc of chunk) {
                    try {
                        await tablesDB.createRow({
                            databaseId: DB_ID,
                            tableId: NEW_ATTENDANCE_COLLECTION_ID,
                            rowId: doc.$id,
                            data: doc
                        });
                        individualSuccess++;
                        createdCount++;
                    } catch (individualError) {
                        individualFailed++;
                        if (individualError.code !== 409) {
                            console.error(`Failed to create document for user ${doc.userId} on ${doc.date}:`, individualError.message);
                        }
                    }
                }
                
                failedCount -= individualSuccess;
                console.log(`Individual inserts: ${individualSuccess} succeeded, ${individualFailed} failed`);
            }
            
            if (i + batchSize < newAttendanceDocs.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log('\n=== Migration completed ===');
        console.log(`Total records to migrate: ${newAttendanceDocs.length}`);
        console.log(`Successfully created: ${createdCount}`);
        console.log(`Failed: ${failedCount}`);
        console.log(`Already existed (skipped during transformation): ${existingAttendance.length}`);

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

migrate().catch(console.error);