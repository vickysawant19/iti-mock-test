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

export const updateMonthlyAttendanceStatsHelper = async (
  databases,
  userId,
  batchId,
  date
) => {
  if (!userId || !batchId || !date) return;
  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const MONTHLY_STATS_COL = 'monthlyAttendanceStats';
  const NEW_ATTENDANCE_COL = 'newAttendance';
  const yearMonth = String(date).substring(0, 7);
  const docId = `${userId}_${batchId}_${yearMonth}`;

  try {
    const monthDocs = await databases.listDocuments(
      DB_ID,
      NEW_ATTENDANCE_COL,
      [
        Query.equal('userId', userId),
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(35),
      ]
    );

    let presentDays = 0, absentDays = 0, casualLeaves = 0;
    let sickLeaves = 0, specialLeaves = 0, onDutyLeaves = 0, halfDays = 0, lateDays = 0;

    (monthDocs.documents || []).forEach((row) => {
      const s = String(row.status || row.attendanceStatus || '').toLowerCase();
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

    const payload = {
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
    };

    try {
      await databases.updateDocument(DB_ID, MONTHLY_STATS_COL, docId, payload);
    } catch (e) {
      await databases.createDocument(DB_ID, MONTHLY_STATS_COL, docId, payload);
    }
  } catch (err) {
    console.error('Failed updating monthlyAttendanceStats in user-manage function:', err);
  }
};
