import { ID, Query } from 'node-appwrite';

const BATCH_SIZE = 50;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function migrateAttendance(tablesDB, log, error) {
  const userAttendanceCollection = '6693f8300003b08374b2';
  const newAttendanceCollection = 'newAttendance';
  const databaseId = 'itimocktest';
  const logger = typeof log === 'function' ? log : console.log;
  const errLog = typeof error === 'function' ? error : console.error;

  let allUserAttendanceDocs = [];
  let hasMore = true;
  let offset = 0;
  const limit = 100;

  logger('Starting to fetch user attendance documents...');

  while (hasMore) {
    const response = await tablesDB.listRows({
      databaseId,
      tableId: userAttendanceCollection,
      queries: [Query.limit(limit), Query.offset(offset)]
    });

    const rows = response.rows || response.documents || [];
    if (rows.length > 0) {
      allUserAttendanceDocs = allUserAttendanceDocs.concat(rows);
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  logger(`Fetched ${allUserAttendanceDocs.length} user attendance documents.`);

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
          errLog(`Failed to parse record: ${recordStr} for user ${doc.userId} - ${e.message}`);
        }
      }
    }
  }

  logger(`Created ${newAttendanceDocs.length} new attendance documents to be saved.`);

  let migratedCount = 0;
  for (let i = 0; i < newAttendanceDocs.length; i += BATCH_SIZE) {
    const batch = newAttendanceDocs.slice(i, i + BATCH_SIZE);
    
    const documentsToCreate = batch.map(doc => ({
        $id: ID.unique(),
        ...doc
    }));

    try {
        if (typeof tablesDB.upsertRows === 'function') {
          await tablesDB.upsertRows({
            databaseId,
            tableId: newAttendanceCollection,
            rows: documentsToCreate
          });
        } else {
          await Promise.all(
            documentsToCreate.map(d => tablesDB.createRow({
              databaseId,
              tableId: newAttendanceCollection,
              rowId: d.$id,
              data: d
            }))
          );
        }
        migratedCount += batch.length;
        logger(`Successfully processed batch of ${batch.length} documents.`);
    } catch (e) {
        errLog(`Failed to migrate batch: ${e.message}`);
        throw e;
    }
    
    if (i + BATCH_SIZE < newAttendanceDocs.length) {
        await sleep(1000); // 1-second pause between batches
    }
  }

  return { message: `Migrated ${migratedCount} attendance records.` };
}
