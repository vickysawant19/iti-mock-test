import { ID, Query } from 'node-appwrite';

const BATCH_SIZE = 50;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function migrateAttendance(database, log, error) {
  const userAttendanceCollection = '6693f8300003b08374b2';
  const newAttendanceCollection = 'newAttendance';
  const databaseId = 'itimocktest';

  let allUserAttendanceDocs = [];
  let hasMore = true;
  let offset = 0;
  const limit = 100;

  log('Starting to fetch user attendance documents...');

  while (hasMore) {
    const response = await database.listDocuments(
      databaseId,
      userAttendanceCollection,
      [Query.limit(limit), Query.offset(offset)]
    );

    if (response.documents.length > 0) {
      allUserAttendanceDocs = allUserAttendanceDocs.concat(response.documents);
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  log(`Fetched ${allUserAttendanceDocs.length} user attendance documents.`);

  const newAttendanceDocs = [];
  for (const doc of allUserAttendanceDocs) {
    if (doc.attendanceRecords && Array.isArray(doc.attendanceRecords)) {
      for (const recordStr of doc.attendanceRecords) {
        try {
          const record = JSON.parse(recordStr);
          if (record.date && record.attendanceStatus) {
            const newDoc = {
              userId: doc.userId,
              batchId: doc.batchId,
              tradeId: doc.tradeId || null,
              date: record.date,
              status: record.attendanceStatus,
              markedBy: 'migration',
              markedAt: new Date().toISOString(),
              remarks: record.reason || '',
            };
            newAttendanceDocs.push(newDoc);
          }
        } catch (e) {
          error(`Failed to parse record: ${recordStr} for user ${doc.userId} - ${e.message}`);
        }
      }
    }
  }

  log(`Created ${newAttendanceDocs.length} new attendance documents to be saved.`);

  let migratedCount = 0;
  for (let i = 0; i < newAttendanceDocs.length; i += BATCH_SIZE) {
    const batch = newAttendanceDocs.slice(i, i + BATCH_SIZE);
    
    const documentsToCreate = batch.map(doc => ({
        '$id': ID.unique(),
        ...doc
    }));

    try {
        await database.createDocuments(
            databaseId,
            newAttendanceCollection,
            documentsToCreate
        );
        migratedCount += batch.length;
        log(`Successfully processed batch of ${batch.length} documents.`);
    } catch (e) {
        error(`Failed to migrate batch using createDocuments: ${e.message}`);
        // If bulk creation fails, you might want to handle it, 
        // for now, we'll stop the process.
        throw e;
    }
    
    if (i + BATCH_SIZE < newAttendanceDocs.length) {
        await sleep(1000); // 1-second pause between batches
    }
  }

  return { message: `Migrated ${migratedCount} attendance records.` };
}
