import { Query } from 'node-appwrite';

const BATCH_SIZE = 50;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function migrateMonthlyStats(databases, tablesDB, log, error) {
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const newAttendanceCollection = 'newAttendance';
  const monthlyStatsCollection = 'monthlyAttendanceStats';

  let allAttendanceDocs = [];
  let hasMore = true;
  let offset = 0;
  const limit = 1000;

  log('Starting bulk migration of monthly attendance stats...');

  // 1. Fetch all raw daily attendance records
  while (hasMore) {
    const response = await databases.listDocuments(
      databaseId,
      newAttendanceCollection,
      [Query.limit(limit), Query.offset(offset)]
    );

    if (response.documents.length > 0) {
      allAttendanceDocs = allAttendanceDocs.concat(response.documents);
      offset += limit;
      log(`Fetched ${allAttendanceDocs.length} total attendance records so far...`);
    } else {
      hasMore = false;
    }
  }

  log(`Completed fetching ${allAttendanceDocs.length} attendance records. Grouping by userId, batchId, and month...`);

  // 2. Group records by key `${userId}_${batchId}_${yearMonth}`
  const statsGroupMap = new Map();

  allAttendanceDocs.forEach((doc) => {
    if (!doc.userId || !doc.batchId || !doc.date) return;
    const yearMonth = String(doc.date).substring(0, 7); // "YYYY-MM"
    const docId = `${doc.userId}_${doc.batchId}_${yearMonth}`;

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

  log(`Grouped records into ${statsGroupMap.size} unique monthly user-batch summaries.`);

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
  log(`Saving ${aggregatedStats.length} monthly attendance stats documents using atomic bulk upsertRows...`);
  let upsertedCount = 0;

  for (let i = 0; i < aggregatedStats.length; i += BATCH_SIZE) {
    const chunk = aggregatedStats.slice(i, i + BATCH_SIZE);

    try {
      if (tablesDB && typeof tablesDB.upsertRows === 'function') {
        await tablesDB.upsertRows(databaseId, monthlyStatsCollection, chunk);
        upsertedCount += chunk.length;
      } else {
        for (const doc of chunk) {
          try {
            await databases.updateDocument(databaseId, monthlyStatsCollection, doc.$id, doc);
            upsertedCount++;
          } catch (e) {
            await databases.createDocument(databaseId, monthlyStatsCollection, doc.$id, doc);
            upsertedCount++;
          }
        }
      }
    } catch (e) {
      error(`Failed to bulk upsert monthly stats chunk: ${e.message}`);
    }

    log(`Processed ${Math.min(i + BATCH_SIZE, aggregatedStats.length)} / ${aggregatedStats.length} monthly stats...`);
    if (i + BATCH_SIZE < aggregatedStats.length) {
      await sleep(200);
    }
  }

  log(`Successfully bulk migrated ${upsertedCount} monthly attendance stats records.`);
  return { success: true, count: upsertedCount, totalGroups: statsGroupMap.size };
}
