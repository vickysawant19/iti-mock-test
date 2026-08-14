import { ID, Query } from 'node-appwrite';

export const updateBatchStatsHelper = async (
  databases,
  userId,
  batchId,
  status,
  date
) => {
  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const STATS_COLLECTION_ID = 'userBatchStats';
  const monthKey = date.substring(0, 7); // YYYY-MM

  // Fetch existing stats
  const existingDocs = await databases.listDocuments(
    DB_ID,
    STATS_COLLECTION_ID,
    [Query.equal('userId', userId), Query.equal('batchId', batchId)]
  );

  const getIsPresent = (recordOrStatus, dayTypeParam, isHolidayParam) => {
    let dayType = dayTypeParam;
    let status = typeof recordOrStatus === 'string' ? recordOrStatus : recordOrStatus?.attendanceStatus || recordOrStatus?.status;
    let isHoliday = isHolidayParam;

    if (typeof recordOrStatus === 'object' && recordOrStatus !== null) {
      dayType = recordOrStatus.dayType || (recordOrStatus.isHoliday ? 'HOLIDAY' : 'WORKING');
      isHoliday = recordOrStatus.isHoliday;
    } else {
      dayType = dayType || (isHoliday ? 'HOLIDAY' : 'WORKING');
    }

    if (dayType !== 'WORKING') return 0;

    const normalizedStatus = String(status || '').trim().toUpperCase();
    return normalizedStatus === 'PRESENT' ? 1 : 0;
  };

  let isPresent = getIsPresent(status, null, false);

  if (existingDocs.total > 0) {
    const existing = existingDocs.documents[0];

    let monthlyData = {};
    try {
      monthlyData = JSON.parse(existing.monthlyAttendance || '{}');
    } catch (e) { }

    if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
    monthlyData[monthKey] += isPresent;

    await databases.updateDocument(DB_ID, STATS_COLLECTION_ID, existing.$id, {
      presentDays: existing.presentDays + isPresent,
      monthlyAttendance: JSON.stringify(monthlyData),
    });
  } else {
    let monthlyData = {};
    monthlyData[monthKey] = isPresent;

    await databases.createDocument(DB_ID, STATS_COLLECTION_ID, ID.unique(), {
      userId,
      batchId,
      totalWorkingDays: 0,
      presentDays: isPresent,
      monthlyAttendance: JSON.stringify(monthlyData),
      testsSubmitted: 0,
      cumulativeScore: 0,
      latestScore: 0,
    });
  }
};

export const bulkUpdateBatchStats = async (
  databases,
  tablesDB,
  batchId,
  date,
  statsDataList
) => {
  if (!statsDataList || statsDataList.length === 0) return;

  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const STATS_COLLECTION_ID = 'userBatchStats';
  const monthKey = date.substring(0, 7); // YYYY-MM

  // Fetch all existing stats for this batch
  const existingDocs = await databases.listDocuments(
    DB_ID,
    STATS_COLLECTION_ID,
    [Query.equal('batchId', batchId), Query.limit(500)]
  );

  const existingStatsMap = new Map(
    existingDocs.documents.map((doc) => [doc.userId, doc])
  );

  const statsToCreate = [];
  const statsToUpdate = [];

  const getIsPresent = (record) => {
    const dayType = record.dayType || (record.isHoliday ? 'HOLIDAY' : 'WORKING');
    if (dayType !== 'WORKING') return 0;
    const status = String(record.attendanceStatus || record.status || '').trim().toUpperCase();
    return status === 'PRESENT' ? 1 : 0;
  };

  statsDataList.forEach((record) => {
    let isPresent = getIsPresent(record);
    const existing = existingStatsMap.get(record.userId);

    if (existing) {
      let monthlyData = {};
      try {
        monthlyData = JSON.parse(existing.monthlyAttendance || '{}');
      } catch (e) { }

      if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
      monthlyData[monthKey] += isPresent;

      statsToUpdate.push({
        $id: existing.$id,
        userId: existing.userId,
        batchId: existing.batchId,
        totalWorkingDays: existing.totalWorkingDays,
        presentDays: existing.presentDays + isPresent,
        monthlyAttendance: JSON.stringify(monthlyData),
        testsSubmitted: existing.testsSubmitted,
        cumulativeScore: existing.cumulativeScore,
        latestScore: existing.latestScore,
      });
    } else {
      let monthlyData = {};
      monthlyData[monthKey] = isPresent;

      statsToCreate.push({
        $id: ID.unique(),
        userId: record.userId,
        batchId: batchId,
        totalWorkingDays: 0,
        presentDays: isPresent,
        monthlyAttendance: JSON.stringify(monthlyData),
        testsSubmitted: 0,
        cumulativeScore: 0,
        latestScore: 0,
      });
    }
  });

  if (statsToCreate.length > 0) {
    await tablesDB.createRows(DB_ID, STATS_COLLECTION_ID, statsToCreate);
  }
  if (statsToUpdate.length > 0) {
    await tablesDB.upsertRows(DB_ID, STATS_COLLECTION_ID, statsToUpdate);
  }
};

export const bulkUpdateMonthlyAttendanceStats = async (
  tablesDB,
  databases,
  batchId,
  yearMonth,
  affectedUserIds = null
) => {
  if (!batchId || !yearMonth) return;
  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const MONTHLY_STATS_COL = 'monthlyAttendanceStats';
  const NEW_ATTENDANCE_COL = 'newAttendance';
  const BATCH_STUDENTS_COL = process.env.BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';

  try {
    const userFilterSet = affectedUserIds && affectedUserIds.length > 0 ? new Set(affectedUserIds) : null;

    // 1. Fetch enrollment dates for batch
    const bsRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: BATCH_STUDENTS_COL,
      queries: [Query.equal('batchId', batchId), Query.limit(500)],
    }).catch(() => ({ rows: [] }));

    const enrollmentMap = new Map();
    (bsRes.rows || []).forEach((row) => {
      if (row.studentId && row.enrollmentDate) {
        enrollmentMap.set(row.studentId, String(row.enrollmentDate).substring(0, 10));
      }
    });

    // 2. Fetch daily attendance records for this batch and month
    const attendanceRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: NEW_ATTENDANCE_COL,
      queries: [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(5000),
      ],
    }).catch(() => ({ rows: [] }));

    // 3. Group by userId
    const userRecordsMap = new Map();

    (attendanceRes.rows || []).forEach((doc) => {
      if (!doc.userId) return;
      if (userFilterSet && !userFilterSet.has(doc.userId)) return;

      const enrollStr = enrollmentMap.get(doc.userId);
      if (enrollStr && doc.date < enrollStr) return;

      if (!userRecordsMap.has(doc.userId)) {
        userRecordsMap.set(doc.userId, []);
      }
      userRecordsMap.get(doc.userId).push({ ...doc });
    });

    if (userFilterSet) {
      userFilterSet.forEach((uid) => {
        if (!userRecordsMap.has(uid)) {
          userRecordsMap.set(uid, []);
        }
      });
    }

    // Merge latest in-memory records (in case listRows didn't return newly inserted/upserted rows yet)
    if (Array.isArray(latestRecords) && latestRecords.length > 0) {
      latestRecords.forEach((rec) => {
        if (!rec.userId || !rec.date || !rec.date.startsWith(yearMonth)) return;
        if (userFilterSet && !userFilterSet.has(rec.userId)) return;

        const enrollStr = enrollmentMap.get(rec.userId);
        if (enrollStr && rec.date < enrollStr) return;

        const userRows = userRecordsMap.get(rec.userId) || [];
        const existingIdx = userRows.findIndex((r) => r.date === rec.date);

        const mergedRecord = {
          userId: rec.userId,
          batchId: rec.batchId || batchId,
          date: rec.date,
          status: rec.status || (rec.attendanceStatus ? rec.attendanceStatus.toLowerCase() : 'present'),
          attendanceStatus: rec.attendanceStatus || (rec.status ? rec.status.toUpperCase() : 'PRESENT'),
          dayType: rec.dayType || (rec.isHoliday ? 'HOLIDAY' : 'WORKING'),
          leaveType: rec.leaveType || null,
        };

        if (existingIdx >= 0) {
          userRows[existingIdx] = { ...userRows[existingIdx], ...mergedRecord };
        } else {
          userRows.push(mergedRecord);
        }
        userRecordsMap.set(rec.userId, userRows);
      });
    }

    // 4. Build monthly stats objects
    const statsObjects = [];
    userRecordsMap.forEach((rows, userId) => {
      let presentDays = 0, absentDays = 0, casualLeaves = 0;
      let sickLeaves = 0, specialLeaves = 0, onDutyLeaves = 0, halfDays = 0, lateDays = 0;

      rows.forEach((r) => {
        const dt = String(r.dayType || (r.isHoliday ? 'HOLIDAY' : 'WORKING')).toUpperCase();
        if (dt === 'HOLIDAY') return;

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

      statsObjects.push({
        $id: `${userId}_${batchId}_${yearMonth}`,
        userId,
        batchId,
        yearMonth,
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
    });

    if (statsObjects.length === 0) return;

    // 5. Atomic Bulk Upsert using tablesDB.upsertRows
    if (tablesDB && typeof tablesDB.upsertRows === 'function') {
      await tablesDB.upsertRows(DB_ID, MONTHLY_STATS_COL, statsObjects);
    } else if (databases) {
      for (const item of statsObjects) {
        try {
          await databases.updateDocument(DB_ID, MONTHLY_STATS_COL, item.$id, item);
        } catch (e) {
          await databases.createDocument(DB_ID, MONTHLY_STATS_COL, item.$id, item);
        }
      }
    }
  } catch (err) {
    console.error('Failed in bulkUpdateMonthlyAttendanceStats:', err);
  }
};

export const updateMonthlyAttendanceStatsHelper = async (
  databases,
  userId,
  batchId,
  date,
  tablesDB = null
) => {
  if (!userId || !batchId || !date) return;
  const yearMonth = String(date).substring(0, 7);
  await bulkUpdateMonthlyAttendanceStats(tablesDB, databases, batchId, yearMonth, [userId]);
};
