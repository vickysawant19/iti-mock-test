import { Query } from 'node-appwrite';
import { generateShortStatId } from './statsHelper.js';

const BATCH_SIZE = 50;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function migrateMonthlyStats(tablesDB, maybeTablesDB, log, error) {
  const tables = tablesDB || maybeTablesDB;
  const logger = typeof log === 'function' ? log : console.log;
  const errLog = typeof error === 'function' ? error : console.error;

  const databaseId = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const newAttendanceCollection = 'newAttendance';
  const monthlyStatsCollection = 'monthlyAttendanceStats';

  let allAttendanceDocs = [];
  let hasMore = true;
  let offset = 0;
  const limit = 1000;

  logger('Starting bulk migration of monthly attendance stats...');

  // 0. Clean up any old invalid documents in monthlyAttendanceStats collection
  try {
    const existingOldDocs = await tables.listRows({
      databaseId,
      tableId: monthlyStatsCollection,
      queries: [Query.limit(500)]
    }).catch(() => ({ rows: [], documents: [] }));

    const rows = existingOldDocs.rows || existingOldDocs.documents || [];
    if (rows.length > 0) {
      logger(`Clearing ${rows.length} existing monthly stats records...`);
      await Promise.all(
        rows.map((d) =>
          tables.deleteRow({
            databaseId,
            tableId: monthlyStatsCollection,
            rowId: d.$id
          }).catch(() => null)
        )
      );
    }
  } catch (e) {
    logger(`Note on clearing existing monthly stats: ${e.message}`);
  }

  // 1. Fetch all raw daily attendance records
  while (hasMore) {
    const response = await tables.listRows({
      databaseId,
      tableId: newAttendanceCollection,
      queries: [Query.limit(limit), Query.offset(offset)]
    });

    const rows = response.rows || response.documents || [];
    if (rows.length > 0) {
      allAttendanceDocs = allAttendanceDocs.concat(rows);
      offset += limit;
      logger(`Fetched ${allAttendanceDocs.length} total attendance records so far...`);
    } else {
      hasMore = false;
    }
  }

  logger(`Completed fetching ${allAttendanceDocs.length} attendance records. Grouping by userId, batchId, and month...`);

  // 2. Group records by key `${userId}_${batchId}_${yearMonth}`
  const statsGroupMap = new Map();

  allAttendanceDocs.forEach((doc) => {
    if (!doc.userId || !doc.batchId || !doc.date) return;
    const yearMonth = String(doc.date).substring(0, 7); // "YYYY-MM"
    const docId = generateShortStatId(doc.userId, doc.batchId, yearMonth);

    if (!statsGroupMap.has(docId)) {
      statsGroupMap.set(docId, {
        docId,
        userId: doc.userId,
        batchId: doc.batchId,
        yearMonth,
        rows: [],
      });
    }
    statsGroupMap.get(docId).rows.push(doc);
  });

  logger(`Grouped records into ${statsGroupMap.size} unique monthly user-batch summaries.`);

  // 3. Compute aggregated payload for each group
  const aggregatedStats = [];

  for (const group of statsGroupMap.values()) {
    let presentDays = 0, absentDays = 0, casualLeaves = 0;
    let sickLeaves = 0, specialLeaves = 0, onDutyLeaves = 0, halfDays = 0, lateDays = 0;

    group.rows.forEach((r) => {
      const s = String(r.status || r.attendanceStatus || '').toLowerCase();
      if (s === 'present' || s === 'p') presentDays++;
      else if (s === 'absent' || s === 'a') absentDays++;
      else if (s === 'casual' || s === 'cl') casualLeaves++;
      else if (s === 'sick' || s === 'sl') sickLeaves++;
      else if (s === 'special' || s === 'spl') specialLeaves++;
      else if (s === 'on_duty' || s === 'od') onDutyLeaves++;
      else if (s === 'half_day' || s === 'hd') halfDays++;
      else if (s === 'late' || s === 'l') lateDays++;
    });

    const totalPresent = presentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves;
    const workingDays = presentDays + absentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves + halfDays + lateDays;
    const attendancePercentage = workingDays > 0 ? parseFloat(((totalPresent / workingDays) * 100).toFixed(1)) : 0;

    aggregatedStats.push({
      $id: group.docId,
      userId: group.userId,
      batchId: group.batchId,
      yearMonth: group.yearMonth,
      workingDays,
      presentDays,
      absentDays,
      casualLeaves,
      sickLeaves,
      specialLeaves,
      onDutyLeaves,
      halfDays,
      lateDays,
      totalPresent,
      attendancePercentage,
      updatedAt: new Date().toISOString(),
    });
  }

  // 4. Atomic Bulk Upsert into monthlyAttendanceStats collection using Server SDK tablesDB.upsertRows
  logger(`Saving ${aggregatedStats.length} monthly attendance stats documents using atomic bulk upsertRows...`);
  let upsertedCount = 0;

  for (let i = 0; i < aggregatedStats.length; i += BATCH_SIZE) {
    const chunk = aggregatedStats.slice(i, i + BATCH_SIZE);

    try {
      if (tables && typeof tables.upsertRows === 'function') {
        await tables.upsertRows({
          databaseId,
          tableId: monthlyStatsCollection,
          rows: chunk,
        });
        upsertedCount += chunk.length;
      } else {
        throw new Error('Native upsertRows not available');
      }
    } catch (e) {
      logger(`upsertRows chunk failed (${e.message}); using fallback upsert for ${chunk.length} items...`);
      for (const doc of chunk) {
        try {
          await tables.updateRow({
            databaseId,
            tableId: monthlyStatsCollection,
            rowId: doc.$id,
            data: doc
          });
          upsertedCount++;
        } catch (err) {
          try {
            await tables.createRow({
              databaseId,
              tableId: monthlyStatsCollection,
              rowId: doc.$id,
              data: doc
            });
            upsertedCount++;
          } catch (createErr) {
            errLog(`Failed creating stat document ${doc.$id}: ${createErr.message}`);
          }
        }
      }
    }

    logger(`Processed ${Math.min(i + BATCH_SIZE, aggregatedStats.length)} / ${aggregatedStats.length} monthly stats...`);
    if (i + BATCH_SIZE < aggregatedStats.length) {
      await sleep(200);
    }
  }

  logger(`Successfully completed monthly stats migration. Saved/updated ${upsertedCount} documents.`);
  return {
    success: true,
    totalRecordsProcessed: allAttendanceDocs.length,
    monthlySummariesGenerated: aggregatedStats.length,
    upsertedCount,
  };
}
