import { ID, Query } from 'node-appwrite';
import migrateAttendanceFunc from './migrateAttendance.js';
import { updateBatchStatsHelper, bulkUpdateBatchStats } from './statsHelper.js';
import PermissionPolicy from './policies/permissionPolicy.js';

const getBatchTeamPermissions = async (tablesDB, DB_ID, batchId, fallbackTeamId = null) => {
  let teamId = fallbackTeamId;
  if (!teamId && batchId) {
    try {
      const BATCH_COL_ID = process.env.BATCH_COLLECTION_ID || '66936df000108d8e2364';
      const batchRow = await tablesDB.getRow({ databaseId: DB_ID, tableId: BATCH_COL_ID, rowId: batchId });
      teamId = batchRow?.teamId;
    } catch (e) {
      // ignore
    }
  }
  return teamId ? PermissionPolicy.attendance(teamId) : [];
};

export const handleAttendanceAction = async (action, req, res, client, databases, tablesDB, log, error) => {
  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const NEW_ATTENDANCE_COL_ID = 'newAttendance';
  const STATS_COLLECTION_ID = 'userBatchStats';

  switch (action) {
    case 'migrateAttendance': {
      return await migrateAttendanceFunc(databases, log, error);
    }
    case 'updateBatchStatsFromTest': {
      const { userId, batchId, score, quesCount } = req.bodyJson;
      if (
        !userId ||
        !batchId ||
        score === undefined ||
        quesCount === undefined
      ) {
        throw new Error('Missing required fields for updateBatchStatsFromTest');
      }

      const percentageScore = quesCount > 0 ? (score / quesCount) * 100 : 0;

      // Fetch existing stats
      const existingDocs = await databases.listDocuments(
        DB_ID,
        STATS_COLLECTION_ID,
        [Query.equal('userId', userId), Query.equal('batchId', batchId)]
      );

      if (existingDocs.total > 0) {
        const existing = existingDocs.documents[0];
        log(`Updated test stats for user ${userId} in batch ${batchId}`);
        return await databases.updateDocument(
          DB_ID,
          STATS_COLLECTION_ID,
          existing.$id,
          {
            testsSubmitted: existing.testsSubmitted + 1,
            cumulativeScore: existing.cumulativeScore + percentageScore,
            latestScore: percentageScore,
          }
        );
      } else {
        log(`Created test stats for user ${userId} in batch ${batchId}`);
        return await databases.createDocument(
          DB_ID,
          STATS_COLLECTION_ID,
          ID.unique(),
          {
            userId,
            batchId,
            testsSubmitted: 1,
            cumulativeScore: percentageScore,
            latestScore: percentageScore,
            totalWorkingDays: 0,
            presentDays: 0,
            monthlyAttendance: '{}',
          }
        );
      }
    }
    case 'updateBatchStatsFromAttendance': {
      const { userId, batchId, status, date } = req.bodyJson;
      if (!userId || !batchId || !status || !date) {
        throw new Error(
          'Missing required fields for updateBatchStatsFromAttendance'
        );
      }
      await updateBatchStatsHelper(databases, userId, batchId, status, date);
      log(`Updated attendance stats for user ${userId} in batch ${batchId}`);
      return { updatedId: userId };
    }
    case 'bulkUpdateBatchStatsFromAttendance': {
      const { batchId, date, statsDataList } = req.bodyJson;
      if (!batchId || !date || !statsDataList) {
        throw new Error(
          'Missing required fields for bulkUpdateBatchStatsFromAttendance'
        );
      }
      await bulkUpdateBatchStats(databases, tablesDB, batchId, date, statsDataList);
      log(`Bulk updated attendance stats for batch ${batchId}`);
      return { success: true };
    }
    case 'markBatchAttendance': {
      const { batchId, date, attendanceData, teamId } = req.bodyJson;
      if (!batchId || !date || !attendanceData) {
        throw new Error('Missing required fields for markBatchAttendance');
      }

      const teamPermissions = await getBatchTeamPermissions(tablesDB, DB_ID, batchId, teamId);

      // 1. Fetch existing attendance docs for that batch and date
      const existingDocsRes = await databases.listDocuments(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        [
          Query.equal('batchId', batchId),
          Query.equal('date', date),
          Query.limit(500),
        ]
      );

      const existingRecordsMap = new Map(
        existingDocsRes.documents.map((doc) => [doc.userId, doc])
      );

      const newRecords = [];
      const existingToUpdate = [];
      const statsToUpdate = [];

      attendanceData.forEach((record) => {
        const existing = existingRecordsMap.get(record.userId);
        if (existing) {
          const needsUpdate =
            existing.status !== record.status ||
            existing.remarks !== record.remarks;
          if (needsUpdate) {
            existingToUpdate.push({
              $id: existing.$id,
              userId: existing.userId,
              batchId: existing.batchId,
              tradeId: existing.tradeId || null,
              date: existing.date,
              markedAt: existing.markedAt,
              status: record.status,
              remarks: record.remarks || null,
              ...(teamPermissions.length > 0 ? { $permissions: teamPermissions } : {}),
            });
            statsToUpdate.push(record);
          }
        } else {
          newRecords.push({
            $id: ID.unique(),
            userId: record.userId,
            batchId: batchId,
            tradeId: record.tradeId || null,
            date: date,
            status: record.status,
            remarks: record.remarks || null,
            markedAt: new Date().toISOString(),
            ...(teamPermissions.length > 0 ? { $permissions: teamPermissions } : {}),
          });
          statsToUpdate.push(record);
        }
      });

      const results = {
        created: 0,
        updated: 0,
        newDocs: [],
        updatedDocs: [],
        errors: [],
        success: [],
      };

      if (newRecords.length > 0) {
        const createdRes = await tablesDB.createRows(
          DB_ID,
          NEW_ATTENDANCE_COL_ID,
          newRecords
        );
        const createdDocs = Array.isArray(createdRes)
          ? createdRes
          : createdRes.rows || newRecords;
        results.created = createdDocs.length;
        results.newDocs = createdDocs;
        results.success.push(...createdDocs);
      }

      if (existingToUpdate.length > 0) {
        const updatedRes = await tablesDB.upsertRows(
          DB_ID,
          NEW_ATTENDANCE_COL_ID,
          existingToUpdate
        );
        const updatedDocs = Array.isArray(updatedRes)
          ? updatedRes
          : updatedRes.rows || existingToUpdate;
        results.updated = updatedDocs.length;
        results.updatedDocs = updatedDocs;
        results.success.push(...updatedDocs);
      }

      // Update stats
      try {
        await bulkUpdateBatchStats(databases, tablesDB, batchId, date, statsToUpdate);
      } catch (err) {
        log(`Failed bulk stats update: ${err.message}`);
      }

      return {
        success: results.success,
        errors: [],
        total: attendanceData.length,
        created: results.created,
        updated: results.updated,
        unchanged: attendanceData.length - results.created - results.updated,
        failed: 0,
      };
    }
    case 'createMultipleAttendance': {
      const { attendanceRecords } = req.bodyJson;
      const recordsToInsert = attendanceRecords.map((r) => ({
        $id: ID.unique(),
        userId: r.userId,
        batchId: r.batchId,
        tradeId: r.tradeId || null,
        date: r.date,
        status: r.status,
        remarks: r.remarks || null,
        markedAt: new Date().toISOString(),
      }));

      const createdRes = await tablesDB.createRows(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        recordsToInsert
      );
      const createdDocs = Array.isArray(createdRes)
        ? createdRes
        : createdRes.rows || recordsToInsert;

      // update stats in bulk
      if (recordsToInsert.length > 0) {
        try {
          await bulkUpdateBatchStats(
            databases,
            tablesDB,
            recordsToInsert[0].batchId,
            recordsToInsert[0].date,
            recordsToInsert
          );
        } catch (err) {
          log(`Failed bulk stats update: ${err.message}`);
        }
      }

      return {
        success: createdDocs,
        errors: [],
        total: attendanceRecords.length,
        created: createdDocs.length,
        failed: 0,
      };
    }
    case 'deleteMultipleAttendance': {
      const { documentIds } = req.bodyJson;
      if (!documentIds || !Array.isArray(documentIds)) {
        throw new Error('Missing documentIds for deleteMultipleAttendance');
      }

      const chunkedQueries = [
        Query.equal('$id', documentIds)
      ];

      await tablesDB.deleteRows(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        chunkedQueries
      );
      return { deletedIds: documentIds };
    }
    case 'createAttendance': {
      const { userId, batchId, tradeId, date, status, remarks, markedAt, markedBy } = req.bodyJson;
      if (!userId || !batchId || !date || !status) {
        throw new Error('Missing required fields for createAttendance');
      }

      const result = await databases.createDocument(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        ID.unique(),
        {
          userId,
          batchId,
          tradeId: tradeId || null,
          date,
          status,
          remarks: remarks || null,
          markedAt: markedAt || new Date().toISOString(),
          markedBy: markedBy || null,
        }
      );

      // Update stats
      try {
        await updateBatchStatsHelper(databases, userId, batchId, status, date);
      } catch (err) {
        log(`Failed stats update: ${err.message}`);
      }
      return result;
    }
    case 'updateAttendance': {
      const { documentId, updates } = req.bodyJson;
      if (!documentId || !updates) {
        throw new Error('Missing required fields for updateAttendance');
      }

      const existingRecord = await databases.getDocument(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        documentId
      ).catch(() => null);

      const result = await databases.updateDocument(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        documentId,
        updates
      );

      // If status changed, update stats
      if (existingRecord && updates.status && existingRecord.status !== updates.status) {
        try {
          const monthKey = existingRecord.date.substring(0, 7);
          const existingDocs = await databases.listDocuments(
            DB_ID,
            STATS_COLLECTION_ID,
            [Query.equal('userId', existingRecord.userId), Query.equal('batchId', existingRecord.batchId)]
          );
          if (existingDocs.total > 0) {
            const statsDoc = existingDocs.documents[0];
            let monthlyData = {};
            try {
              monthlyData = JSON.parse(statsDoc.monthlyAttendance || '{}');
            } catch (e) {}

            let diff = 0;
            if (existingRecord.status === 'present') diff -= 1;
            if (updates.status === 'present') diff += 1;

            if (diff !== 0) {
              if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
              monthlyData[monthKey] = Math.max(0, monthlyData[monthKey] + diff);

              await databases.updateDocument(DB_ID, STATS_COLLECTION_ID, statsDoc.$id, {
                presentDays: Math.max(0, statsDoc.presentDays + diff),
                monthlyAttendance: JSON.stringify(monthlyData),
              });
            }
          }
        } catch (err) {
          log(`Failed to update batch stats on updateAttendance: ${err.message}`);
        }
      }
      return result;
    }
    case 'deleteAttendance': {
      const { documentId } = req.bodyJson;
      if (!documentId) {
        throw new Error('Missing documentId for deleteAttendance');
      }

      const existingRecord = await databases.getDocument(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        documentId
      ).catch(() => null);

      await databases.deleteDocument(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        documentId
      );

      // Update stats
      if (existingRecord && existingRecord.status === 'present') {
        try {
          const monthKey = existingRecord.date.substring(0, 7);
          const existingDocs = await databases.listDocuments(
            DB_ID,
            STATS_COLLECTION_ID,
            [Query.equal('userId', existingRecord.userId), Query.equal('batchId', existingRecord.batchId)]
          );
          if (existingDocs.total > 0) {
            const statsDoc = existingDocs.documents[0];
            let monthlyData = {};
            try {
              monthlyData = JSON.parse(statsDoc.monthlyAttendance || '{}');
            } catch (e) {}

            if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
            monthlyData[monthKey] = Math.max(0, monthlyData[monthKey] - 1);

            await databases.updateDocument(DB_ID, STATS_COLLECTION_ID, statsDoc.$id, {
              presentDays: Math.max(0, statsDoc.presentDays - 1),
              monthlyAttendance: JSON.stringify(monthlyData),
            });
          }
        } catch (err) {
          log(`Failed to update batch stats on deleteAttendance: ${err.message}`);
        }
      }
      return { deletedId: documentId };
    }
    default:
      return null;
  }
};
