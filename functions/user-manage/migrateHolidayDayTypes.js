import { Client, TablesDB, Query } from 'node-appwrite';

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://api.itimitra.in/v1';
const projectId = 'itimocktest';
const databaseId = 'itimocktest';
const attendanceCollectionId = 'newAttendance';
const holidayCollectionId = 'holidayDays';

const apiKey = (process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY || "");

async function migrateHolidayDayTypes() {
  console.log(`[HolidayMigration] Initializing connection to Appwrite...`);
  console.log(`Endpoint: ${endpoint} | Database: ${databaseId}`);

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const tablesDB = new TablesDB(client);

  // 1. Fetch all holiday documents from holidayDays collection
  console.log(`[HolidayMigration] Step 1: Fetching all holidays from collection '${holidayCollectionId}'...`);

  const holidayMap = new Map(); // key: "batchId_YYYY-MM-DD" -> holidayDocId
  let holidayOffset = 0;
  const holidayLimit = 100;

  while (true) {
    const holidayRes = await tablesDB.listRows({
      databaseId,
      tableId: holidayCollectionId,
      queries: [Query.limit(holidayLimit), Query.offset(holidayOffset)]
    });

    const hRows = holidayRes.rows || [];
    if (hRows.length === 0) break;

    hRows.forEach((h) => {
      if (h.batchId && h.date) {
        const dateStr = String(h.date).substring(0, 10);
        const key = `${h.batchId}_${dateStr}`;
        holidayMap.set(key, h.$id);
      }
    });

    holidayOffset += hRows.length;
    if (holidayOffset >= holidayRes.total) break;
  }

  console.log(`[HolidayMigration] Loaded ${holidayMap.size} distinct batch holiday dates from database.`);

  // 2. Scan newAttendance collection using Cursor-Based Pagination
  console.log(`[HolidayMigration] Step 2: Scanning 'newAttendance' records using cursor pagination...`);

  const limit = 100;
  let lastId = null;
  let totalProcessed = 0;
  let totalHolidaysUpdated = 0;

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
      tableId: attendanceCollectionId,
      queries
    });

    const rows = response.rows || [];
    if (rows.length === 0) break;

    lastId = rows[rows.length - 1].$id;

    console.log(`[HolidayMigration] Scanning batch of ${rows.length} attendance rows (Total Scanned: ${totalProcessed + rows.length} / ${response.total})...`);

    const updatePayloads = [];

    rows.forEach((doc) => {
      totalProcessed++;

      const dateStr = String(doc.date || '').substring(0, 10);
      const batchKey = `${doc.batchId}_${dateStr}`;
      const matchedHolidayId = holidayMap.get(batchKey);

      // Determine if record belongs to a holiday date
      const isHolidayDate = Boolean(matchedHolidayId) || Boolean(doc.isHoliday) || doc.dayType === 'HOLIDAY';

      if (isHolidayDate) {
        const targetDayType = 'HOLIDAY';
        const targetHolidayId = matchedHolidayId || doc.holidayId || null;
        const targetIsHoliday = true;

        // Check if document needs updating
        const needsUpdate =
          doc.dayType !== targetDayType ||
          doc.holidayId !== targetHolidayId;

        if (needsUpdate) {
          updatePayloads.push({
            $id: doc.$id,
            userId: doc.userId,
            batchId: doc.batchId,
            date: doc.date,
            status: doc.status,
            dayType: targetDayType,
            attendanceStatus: doc.attendanceStatus || (doc.status ? doc.status.toUpperCase() : 'PRESENT'),
            leaveType: doc.leaveType || null,
            source: doc.source || 'MANUAL',
            revision: doc.revision || 1,
            syncStatus: doc.syncStatus || 'SYNCED',
            holidayId: targetHolidayId,
          });
        }
      }
    });

    // Execute Bulk Upsert using tablesDB.upsertRows
    if (updatePayloads.length > 0) {
      console.log(`[HolidayMigration] Bulk updating ${updatePayloads.length} holiday attendance records...`);
      await tablesDB.upsertRows({
        databaseId,
        tableId: attendanceCollectionId,
        rows: updatePayloads,
      });
      totalHolidaysUpdated += updatePayloads.length;
      console.log(`[HolidayMigration] ✓ Bulk updated ${updatePayloads.length} holiday attendance records.`);
    }

    if (rows.length < limit) break;
  }

  console.log(`\n======================================================`);
  console.log(`[HolidayMigration] HOLIDAY DAYTYPE MIGRATION COMPLETED! 🎉`);
  console.log(`Total Attendance Records Scanned: ${totalProcessed}`);
  console.log(`Total Batch Holidays In Database: ${holidayMap.size}`);
  console.log(`Total Attendance Records Updated to HOLIDAY dayType: ${totalHolidaysUpdated}`);
  console.log(`======================================================\n`);
}

migrateHolidayDayTypes().catch((err) => {
  console.error('[HolidayMigration] Migration failed:', err);
  process.exit(1);
});
