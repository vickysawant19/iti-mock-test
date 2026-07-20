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

  let isPresent = status === 'present' ? 1 : 0;

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

  statsDataList.forEach((record) => {
    let isPresent = record.status === 'present' ? 1 : 0;
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
