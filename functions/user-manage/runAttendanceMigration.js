import { Client, TablesDB, Query } from 'node-appwrite';

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://api.itimitra.in/v1';
const projectId = 'itimocktest';
const databaseId = 'itimocktest';
const collectionId = 'newAttendance';

const apiKey = (process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || "");

async function runBulkMigration() {
  console.log(`[BulkMigration] Initializing connection to Appwrite...`);
  console.log(`Endpoint: ${endpoint} | Database: ${databaseId} | Collection: ${collectionId}`);

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const tablesDB = new TablesDB(client);

  const limit = 100;
  let lastId = null;
  let totalProcessed = 0;
  let totalUpdated = 0;

  console.log(`[BulkMigration] Fetching documents from collection '${collectionId}' using CURSOR-BASED pagination (bypassing 5,000 offset limit)...`);

  while (true) {
    const queries = [
      Query.limit(limit),
      Query.orderAsc('$id')
    ];
    if (lastId) {
      queries.push(Query.cursorAfter(lastId));
    }

    const response = await tablesDB.listRows({
      databaseId,
      tableId: collectionId,
      queries
    });

    const rows = response.rows || [];
    if (rows.length === 0) break;

    lastId = rows[rows.length - 1].$id;

    console.log(`[BulkMigration] Processed batch of ${rows.length} rows (Last ID: ${lastId} | Total Processed So Far: ${totalProcessed + rows.length} / Total in Collection: ${response.total})...`);

    const updatePayloads = [];

    rows.forEach((doc) => {
      totalProcessed++;

      const isHoliday = Boolean(doc.isHoliday);
      const dayType = doc.dayType || (isHoliday ? 'HOLIDAY' : 'WORKING');

      const rawStatus = String(doc.attendanceStatus || doc.status || '').trim().toLowerCase();
      let attendanceStatus = 'PRESENT';
      if (['present', 'p'].includes(rawStatus)) attendanceStatus = 'PRESENT';
      else if (['absent', 'a'].includes(rawStatus)) attendanceStatus = 'ABSENT';
      else if (['late'].includes(rawStatus)) attendanceStatus = 'LATE';
      else if (['half_day', 'halfday'].includes(rawStatus)) attendanceStatus = 'HALF_DAY';
      else if (['leave', 'l'].includes(rawStatus)) attendanceStatus = 'LEAVE';

      const leaveType = doc.leaveType || (attendanceStatus === 'LEAVE' ? 'CASUAL' : null);
      const source = doc.source || 'MANUAL';
      const revision = doc.revision || 1;
      const syncStatus = doc.syncStatus || 'SYNCED';
      const holidayId = doc.holidayId || null;

      // Check if update is needed
      const needsUpdate =
        doc.dayType !== dayType ||
        doc.attendanceStatus !== attendanceStatus ||
        doc.leaveType !== leaveType ||
        doc.source !== source ||
        doc.revision !== revision ||
        doc.syncStatus !== syncStatus;

      if (needsUpdate) {
        updatePayloads.push({
          $id: doc.$id,
          userId: doc.userId,
          batchId: doc.batchId,
          date: doc.date,
          status: doc.status,
          dayType,
          attendanceStatus,
          leaveType,
          source,
          revision,
          syncStatus,
          holidayId,
        });
      }
    });

    // Execute Bulk Upsert using tablesDB.upsertRows
    if (updatePayloads.length > 0) {
      console.log(`[BulkMigration] Bulk upserting ${updatePayloads.length} updated rows to Appwrite...`);
      await tablesDB.upsertRows({
        databaseId,
        tableId: collectionId,
        rows: updatePayloads,
      });
      totalUpdated += updatePayloads.length;
      console.log(`[BulkMigration] ✓ Bulk upserted ${updatePayloads.length} rows successfully.`);
    } else {
      console.log(`[BulkMigration] All ${rows.length} rows in this chunk already have valid attributes.`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`[BulkMigration] ALL RECORDS MIGRATED SUCCESSFULLY! 🎉`);
  console.log(`Total Rows Processed: ${totalProcessed}`);
  console.log(`Total Rows Updated via Bulk Upsert: ${totalUpdated}`);
  console.log(`======================================================\n`);
}

runBulkMigration().catch((err) => {
  console.error('[BulkMigration] Migration failed with error:', err);
  process.exit(1);
});
