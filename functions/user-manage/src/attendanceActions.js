import { ID, Query } from 'node-appwrite';
import migrateAttendanceFunc from './migrateAttendance.js';
import migrateMonthlyStatsFunc from './migrateMonthlyStats.js';
import {
  updateBatchStatsHelper,
  bulkUpdateBatchStats,
  updateMonthlyAttendanceStatsHelper,
  bulkUpdateMonthlyAttendanceStats,
  verifyBatchMonthlyStatsHelper,
  bulkUpsertDocuments,
  deleteTableRows,
  decrementMonthlyStatsForAttendanceRecords,
  updateIncrementalMonthlyAttendanceStats,
} from './statsHelper.js';
import PermissionPolicy from './policies/permissionPolicy.js';

const getBatchTeamPermissions = async (tablesDB, DB_ID, batchId, fallbackTeamId = null) => {
  let teamId = fallbackTeamId;
  if (!teamId && batchId) {
    try {
      const BATCH_COL_ID = process.env.BATCH_COLLECTION_ID || '66936df000108d8e2364';
      const batchDoc = await tablesDB.getRow({
        databaseId: DB_ID,
        tableId: BATCH_COL_ID,
        rowId: batchId,
      }).catch(() => null);
      teamId = batchDoc?.teamId;
    } catch (e) {
      // ignore
    }
  }
  return teamId ? PermissionPolicy.attendance(teamId) : [];
};

export const handleAttendanceAction = async (action, req, res, client, tablesDB, log, error) => {
  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const NEW_ATTENDANCE_COL_ID = 'newAttendance';
  const STATS_COLLECTION_ID = 'userBatchStats';
  const logger = typeof log === 'function' ? log : console.log;

  switch (action) {
    case 'migrateAttendance': {
      return await migrateAttendanceFunc(tablesDB, logger, error);
    }
    case 'migrateMonthlyStats': {
      return await migrateMonthlyStatsFunc(tablesDB, tablesDB, logger, error);
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

      // Fetch existing stats
      const existingDocs = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: STATS_COLLECTION_ID,
        queries: [Query.equal('userId', userId), Query.equal('batchId', batchId)]
      });

      const rows = existingDocs.rows || existingDocs.documents || [];

      if ((existingDocs.total ?? rows.length) > 0 && rows.length > 0) {
        const existing = rows[0];
        const newTestsSubmitted = (existing.testsSubmitted || 0) + 1;
        const newCumulativeScore = (existing.cumulativeScore || 0) + score;

        await tablesDB.updateRow({
          databaseId: DB_ID,
          tableId: STATS_COLLECTION_ID,
          rowId: existing.$id,
          data: {
            testsSubmitted: newTestsSubmitted,
            cumulativeScore: newCumulativeScore,
            latestScore: score,
          }
        });
      } else {
        await tablesDB.createRow({
          databaseId: DB_ID,
          tableId: STATS_COLLECTION_ID,
          rowId: ID.unique(),
          data: {
            userId,
            batchId,
            totalWorkingDays: 0,
            presentDays: 0,
            monthlyAttendance: JSON.stringify({}),
            testsSubmitted: 1,
            cumulativeScore: score,
            latestScore: score,
          }
        });
      }

      return { success: true };
    }
    case 'updateBatchStatsWorkingDays': {
      const { batchId } = req.bodyJson;
      if (!batchId) {
        throw new Error('Missing batchId for updateBatchStatsWorkingDays');
      }

      const statsDocs = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: STATS_COLLECTION_ID,
        queries: [Query.equal('batchId', batchId), Query.limit(500)]
      });

      const rows = statsDocs.rows || statsDocs.documents || [];
      const promises = rows.map((doc) =>
        tablesDB.updateRow({
          databaseId: DB_ID,
          tableId: STATS_COLLECTION_ID,
          rowId: doc.$id,
          data: {
            totalWorkingDays: (doc.totalWorkingDays || 0) + 1,
          }
        })
      );

      await Promise.all(promises);
      return { success: true };
    }
    case 'markBatchAttendance': {
      const t0 = Date.now();
      const { batchId, date, attendanceData, teamId } = req.bodyJson;
      if (!batchId || !date || !attendanceData) {
        throw new Error('Missing required fields for markBatchAttendance');
      }

      logger(`[markBatchAttendance] START batch=${batchId}, date=${date}, items=${attendanceData.length}`);

      const teamPermissions = await getBatchTeamPermissions(tablesDB, DB_ID, batchId, teamId);

      // Fetch batchStudents for enrollment date validation
      const BATCH_STUDENTS_COL_ID = process.env.BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';
      const batchStudentsRes = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: BATCH_STUDENTS_COL_ID,
        queries: [Query.equal('batchId', batchId), Query.limit(500)]
      }).catch(() => ({ rows: [], documents: [] }));

      const bsRows = batchStudentsRes.rows || batchStudentsRes.documents || [];

      const getEnrollmentDateStr = (raw) => {
        if (!raw) return null;
        const m = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : null;
      };

      const enrollmentMap = new Map();
      bsRows.forEach((row) => {
        const ed = getEnrollmentDateStr(row.enrollmentDate || row.joinedAt);
        if (row.studentId && ed) {
          enrollmentMap.set(row.studentId, ed);
        }
      });

      logger(`[markBatchAttendance] Permissions & students loaded in ${Date.now() - t0}ms`);

      // 1. Fetch existing attendance docs for that batch and date
      const existingDocsRes = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        queries: [
          Query.equal('batchId', batchId),
          Query.equal('date', date),
          Query.limit(500),
        ]
      }).catch(() => ({ rows: [], documents: [] }));

      const existingRows = existingDocsRes.rows || existingDocsRes.documents || [];
      const existingRecordsMap = new Map(
        existingRows.map((doc) => [doc.userId, doc])
      );

      logger(`[markBatchAttendance] Existing docs loaded in ${Date.now() - t0}ms (found ${existingRecordsMap.size})`);

      const newRecords = [];
      const existingToUpdate = [];
      const statsToUpdate = [];

      attendanceData.forEach((record) => {
        // Skip marking attendance if date is prior to student's enrollment date
        const studentEnrollDate = enrollmentMap.get(record.userId);
        if (studentEnrollDate && date < studentEnrollDate) {
          logger(`Skipping attendance for user ${record.userId} on ${date}: date is before enrollment date ${studentEnrollDate}`);
          return;
        }

        const existing = existingRecordsMap.get(record.userId);
        const dayType = record.dayType || (record.isHoliday ? 'HOLIDAY' : 'WORKING');
        const attendanceStatus = record.attendanceStatus || (record.status ? record.status.toUpperCase() : 'PRESENT');
        const leaveType = record.leaveType || null;
        const source = record.source || 'MANUAL';
        const syncStatus = record.syncStatus || 'SYNCED';
        const holidayId = record.holidayId || null;
        const remarks = record.remarks || null;
        const status = record.status || attendanceStatus.toLowerCase();
        const isHoliday = record.isHoliday !== undefined ? record.isHoliday : (dayType === 'HOLIDAY');

        if (existing) {
          const needsUpdate =
            existing.status !== status ||
            existing.attendanceStatus !== attendanceStatus ||
            existing.dayType !== dayType ||
            existing.leaveType !== leaveType ||
            existing.remarks !== remarks;

          if (needsUpdate) {
            const nextRevision = (existing.revision || 1) + 1;
            existingToUpdate.push({
              $id: existing.$id,
              userId: existing.userId,
              batchId: existing.batchId,
              tradeId: existing.tradeId || null,
              date: existing.date,
              markedAt: new Date().toISOString(),
              status,
              dayType,
              attendanceStatus,
              leaveType,
              source,
              revision: nextRevision,
              syncStatus,
              holidayId,
              remarks,
              ...(teamPermissions.length > 0 ? { $permissions: teamPermissions } : {}),
            });
            statsToUpdate.push({ ...record, dayType, attendanceStatus, status, isHoliday });
          }
        } else {
          newRecords.push({
            $id: ID.unique(),
            userId: record.userId,
            batchId: batchId,
            tradeId: record.tradeId || null,
            date: date,
            status,
            dayType,
            attendanceStatus,
            leaveType,
            source,
            revision: 1,
            syncStatus,
            holidayId,
            remarks,
            markedAt: new Date().toISOString(),
            ...(teamPermissions.length > 0 ? { $permissions: teamPermissions } : {}),
          });
          statsToUpdate.push({ ...record, dayType, attendanceStatus, status, isHoliday });
        }
      });

      const results = {
        created: 0,
        updated: 0,
        errors: [],
        success: [],
      };

      const allRecordsToSave = [...newRecords, ...existingToUpdate];

      if (allRecordsToSave.length > 0) {
        logger(`[markBatchAttendance] Upserting ${allRecordsToSave.length} records (${newRecords.length} new, ${existingToUpdate.length} updates)...`);
        const savedDocs = await bulkUpsertDocuments(
          tablesDB,
          DB_ID,
          NEW_ATTENDANCE_COL_ID,
          allRecordsToSave,
          logger
        );
        results.created = newRecords.length;
        results.updated = existingToUpdate.length;
        results.success.push(...savedDocs);
        logger(`[markBatchAttendance] Saved ${savedDocs.length} attendance records in ${Date.now() - t0}ms`);
      }

      // Update stats fast & incrementally for all marked students via monthlyAttendanceStats
      if (statsToUpdate.length > 0) {
        try {
          logger(`[markBatchAttendance] Updating incremental monthly stats for ${statsToUpdate.length} students...`);
          await updateIncrementalMonthlyAttendanceStats(
            tablesDB,
            DB_ID,
            batchId,
            date,
            statsToUpdate,
            existingRecordsMap,
            logger
          );
          logger(`[markBatchAttendance] Stats update finished in ${Date.now() - t0}ms`);
        } catch (err) {
          logger(`Failed stats update: ${err.message}`);
        }
      }

      logger(`[markBatchAttendance] COMPLETE in ${Date.now() - t0}ms`);

      return {
        success: results.success,
        errors: [],
        total: attendanceData.length,
        created: results.created,
        updated: results.updated,
        unchanged: attendanceData.length - results.created - results.updated,
        failed: 0,
        durationMs: Date.now() - t0,
      };
    }
    case 'createMultipleAttendance': {
      const t0 = Date.now();
      const { attendanceRecords } = req.bodyJson;
      if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
        return { success: [], created: 0, total: 0 };
      }

      const batchId = attendanceRecords[0]?.batchId;
      const BATCH_STUDENTS_COL_ID = process.env.BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';
      const batchStudentsRes = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: BATCH_STUDENTS_COL_ID,
        queries: [Query.equal('batchId', batchId), Query.limit(500)]
      }).catch(() => ({ rows: [], documents: [] }));

      const bsRows = batchStudentsRes.rows || batchStudentsRes.documents || [];

      const getEnrollmentDateStr = (raw) => {
        if (!raw) return null;
        const m = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : null;
      };

      const enrollmentMap = new Map();
      bsRows.forEach((row) => {
        const ed = getEnrollmentDateStr(row.enrollmentDate || row.joinedAt);
        if (row.studentId && ed) {
          enrollmentMap.set(row.studentId, ed);
        }
      });

      const validRecords = attendanceRecords.filter((r) => {
        const studentEnrollDate = enrollmentMap.get(r.userId);
        if (studentEnrollDate && r.date < studentEnrollDate) {
          logger(`Skipping createMultipleAttendance for user ${r.userId} on ${r.date}: date is before enrollment date ${studentEnrollDate}`);
          return false;
        }
        return true;
      });

      if (validRecords.length === 0) {
        return { success: [], created: 0, total: attendanceRecords.length };
      }

      const recordsToInsert = validRecords.map((r) => ({
        $id: ID.unique(),
        userId: r.userId,
        batchId: r.batchId,
        tradeId: r.tradeId || null,
        date: r.date,
        status: r.status,
        remarks: r.remarks || null,
        markedAt: new Date().toISOString(),
      }));

      const createdDocs = await bulkUpsertDocuments(
        tablesDB,
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        recordsToInsert,
        logger
      );

      // Update stats fast & incrementally for all marked students
      if (recordsToInsert.length > 0) {
        try {
          await updateIncrementalMonthlyAttendanceStats(
            tablesDB,
            DB_ID,
            recordsToInsert[0].batchId,
            recordsToInsert[0].date,
            recordsToInsert,
            new Map(),
            logger
          );
          await bulkUpdateBatchStats(
            tablesDB,
            recordsToInsert[0].batchId,
            recordsToInsert[0].date,
            recordsToInsert,
            logger
          );
        } catch (err) {
          logger(`Failed bulk stats update: ${err.message}`);
        }
      }

      return {
        success: createdDocs,
        errors: [],
        total: attendanceRecords.length,
        created: createdDocs.length,
        failed: 0,
        durationMs: Date.now() - t0,
      };
    }
    case 'deleteMultipleAttendance': {
      const t0 = Date.now();
      const { documentIds } = req.bodyJson;
      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return { deletedIds: [] };
      }

      // Fetch records before deleting to get userId, batchId, date
      const existingDocs = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        queries: [Query.equal('$id', documentIds), Query.limit(500)]
      }).then((res) => res.rows || res.documents || []).catch(() => []);

      await deleteTableRows(
        tablesDB,
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        [Query.equal('$id', documentIds)],
        documentIds,
        logger
      );

      // Fast incremental monthly stats update for deleted attendance records
      try {
        const groupMap = new Map();
        existingDocs.forEach((doc) => {
          if (doc.userId && doc.batchId && doc.date) {
            const ym = String(doc.date).substring(0, 7);
            const key = `${doc.batchId}_${ym}`;
            if (!groupMap.has(key)) {
              groupMap.set(key, { batchId: doc.batchId, yearMonth: ym, records: [] });
            }
            groupMap.get(key).records.push(doc);
          }
        });

        for (const grp of groupMap.values()) {
          await decrementMonthlyStatsForAttendanceRecords(tablesDB, DB_ID, grp.batchId, grp.yearMonth, grp.records, logger);
        }
      } catch (err) {
        logger(`Failed stats update on deleteMultipleAttendance: ${err.message}`);
      }

      return { deletedIds: documentIds, durationMs: Date.now() - t0 };
    }
    case 'createAttendance': {
      const { userId, batchId, tradeId, date, status, attendanceStatus, dayType, leaveType, source, holidayId, remarks } = req.bodyJson;
      if (!userId || !batchId || !date) {
        throw new Error('Missing required fields for createAttendance');
      }

      const finalStatus = status || (attendanceStatus ? attendanceStatus.toLowerCase() : 'present');
      const finalAttendanceStatus = attendanceStatus || (status ? status.toUpperCase() : 'PRESENT');
      const finalDayType = dayType || 'WORKING';

      const result = await tablesDB.createRow({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        rowId: ID.unique(),
        data: {
          userId,
          batchId,
          tradeId: tradeId || null,
          date,
          status: finalStatus,
          attendanceStatus: finalAttendanceStatus,
          dayType: finalDayType,
          leaveType: leaveType || null,
          source: source || 'MANUAL',
          revision: 1,
          syncStatus: 'SYNCED',
          holidayId: holidayId || null,
          remarks: remarks || null,
          markedAt: req.bodyJson.markedAt || new Date().toISOString(),
        }
      });

      // Fast incremental updates to monthlyAttendanceStats
      try {
        await updateMonthlyAttendanceStatsHelper(tablesDB, userId, batchId, date, logger);
      } catch (err) {
        logger(`Failed stats update on createAttendance: ${err.message}`);
      }

      return result;
    }
    case 'updateAttendance': {
      const { documentId, updates } = req.bodyJson;
      if (!documentId || !updates) {
        throw new Error('Missing documentId or updates for updateAttendance');
      }

      const existingRecord = await tablesDB.getRow({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        rowId: documentId
      }).catch(() => null);

      const updatePayload = {
        ...updates,
        markedAt: updates.markedAt || new Date().toISOString(),
      };

      const result = await tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        rowId: documentId,
        data: updatePayload
      });

      if (existingRecord) {
        try {
          await bulkUpdateMonthlyAttendanceStats(tablesDB, existingRecord.batchId, String(existingRecord.date).substring(0, 7), [existingRecord.userId], null, logger);
        } catch (err) {
          logger(`Failed to update monthlyAttendanceStats on updateAttendance: ${err.message}`);
        }
      }

      return result;
    }
    case 'deleteAttendance': {
      const { documentId } = req.bodyJson;
      if (!documentId) {
        throw new Error('Missing documentId for deleteAttendance');
      }

      const existingRecord = await tablesDB.getRow({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        rowId: documentId
      }).catch(() => null);

      await tablesDB.deleteRow({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        rowId: documentId
      });

      if (existingRecord) {
        try {
          await bulkUpdateMonthlyAttendanceStats(tablesDB, existingRecord.batchId, String(existingRecord.date).substring(0, 7), [existingRecord.userId], null, logger);
        } catch (err) {
          logger(`Failed to update monthlyAttendanceStats on deleteAttendance: ${err.message}`);
        }
      }

      // Update stats
      if (existingRecord && existingRecord.status === 'present') {
        try {
          const monthKey = existingRecord.date.substring(0, 7);
          const existingDocs = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: STATS_COLLECTION_ID,
            queries: [Query.equal('userId', existingRecord.userId), Query.equal('batchId', existingRecord.batchId)]
          });
          const rows = existingDocs.rows || existingDocs.documents || [];
          if ((existingDocs.total ?? rows.length) > 0 && rows.length > 0) {
            const statsDoc = rows[0];
            let monthlyData = {};
            try {
              monthlyData = JSON.parse(statsDoc.monthlyAttendance || '{}');
            } catch (e) {}

            if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
            monthlyData[monthKey] = Math.max(0, monthlyData[monthKey] - 1);

            await tablesDB.updateRow({
              databaseId: DB_ID,
              tableId: STATS_COLLECTION_ID,
              rowId: statsDoc.$id,
              data: {
                presentDays: Math.max(0, statsDoc.presentDays - 1),
                monthlyAttendance: JSON.stringify(monthlyData),
              }
            });
          }
        } catch (err) {
          logger(`Failed to update batch stats on deleteAttendance: ${err.message}`);
        }
      }
      return { deletedId: documentId };
    }
    case 'addHoliday': {
      const t0 = Date.now();
      const { batchId, date, holidayText } = req.bodyJson;
      if (!batchId || !date) {
        throw new Error('Missing batchId or date for addHoliday');
      }

      const HOLIDAY_DAYS_COL_ID = process.env.HOLIDAY_DAYS_COLLECTION_ID || 'holidayDays';
      const formattedDate = String(date).substring(0, 10);

      // 1. Create or update holiday document
      let holidayDoc;
      try {
        const existing = await tablesDB.listRows({
          databaseId: DB_ID,
          tableId: HOLIDAY_DAYS_COL_ID,
          queries: [Query.equal('batchId', batchId), Query.equal('date', formattedDate), Query.limit(1)]
        });
        const rows = existing.rows || existing.documents || [];
        if (rows.length > 0) {
          holidayDoc = await tablesDB.updateRow({
            databaseId: DB_ID,
            tableId: HOLIDAY_DAYS_COL_ID,
            rowId: rows[0].$id,
            data: { holidayText: holidayText || 'Holiday' }
          });
        } else {
          holidayDoc = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: HOLIDAY_DAYS_COL_ID,
            rowId: ID.unique(),
            data: {
              batchId,
              date: formattedDate,
              holidayText: holidayText || 'Holiday',
            }
          });
        }
      } catch (err) {
        logger(`Error in addHoliday document write: ${err.message}`);
        throw err;
      }

      // 2. Fetch any existing daily attendance records for this batch and date
      try {
        const existingDocsRes = await tablesDB.listRows({
          databaseId: DB_ID,
          tableId: NEW_ATTENDANCE_COL_ID,
          queries: [Query.equal('batchId', batchId), Query.equal('date', formattedDate), Query.limit(500)]
        }).catch(() => ({ rows: [], documents: [] }));

        const docsList = existingDocsRes.rows || existingDocsRes.documents || [];
        if (docsList.length > 0) {
          // Decrement monthly stats for students who had attendance marked on this now-holiday date
          const yearMonth = formattedDate.substring(0, 7);
          await decrementMonthlyStatsForAttendanceRecords(
            tablesDB,
            DB_ID,
            batchId,
            yearMonth,
            docsList,
            logger
          ).catch((e) => logger(`Failed to decrement monthly stats on addHoliday: ${e.message}`));

          // Delete daily attendance records via deleteTableRows
          await deleteTableRows(
            tablesDB,
            DB_ID,
            NEW_ATTENDANCE_COL_ID,
            [Query.equal('batchId', batchId), Query.equal('date', formattedDate)],
            docsList.map((d) => d.$id),
            logger
          );
        }
      } catch (err) {
        logger(`Could not clear daily attendance for added holiday date: ${err.message}`);
      }

      return { ...holidayDoc, durationMs: Date.now() - t0 };
    }
    case 'clearDayAttendance': {
      const t0 = Date.now();
      const { batchId, date } = req.bodyJson;
      if (!batchId || !date) {
        throw new Error('Missing batchId or date for clearDayAttendance');
      }

      const formattedDate = String(date).substring(0, 10);
      logger(`[clearDayAttendance] START batch=${batchId}, date=${formattedDate}`);

      try {
        const existingDocsRes = await tablesDB.listRows({
          databaseId: DB_ID,
          tableId: NEW_ATTENDANCE_COL_ID,
          queries: [Query.equal('batchId', batchId), Query.equal('date', formattedDate), Query.limit(500)]
        }).catch(() => ({ rows: [], documents: [] }));

        const docsList = existingDocsRes.rows || existingDocsRes.documents || [];
        if (docsList.length > 0) {
          // Decrement monthly stats for students who had attendance marked on this date
          const yearMonth = formattedDate.substring(0, 7);
          await decrementMonthlyStatsForAttendanceRecords(
            tablesDB,
            DB_ID,
            batchId,
            yearMonth,
            docsList,
            logger
          ).catch((e) => logger(`Failed to decrement monthly stats on clearDayAttendance: ${e.message}`));

          // Delete daily attendance records via deleteTableRows
          await deleteTableRows(
            tablesDB,
            DB_ID,
            NEW_ATTENDANCE_COL_ID,
            [Query.equal('batchId', batchId), Query.equal('date', formattedDate)],
            docsList.map((d) => d.$id),
            logger
          );
        }

        logger(`[clearDayAttendance] COMPLETE: Cleared ${docsList.length} records in ${Date.now() - t0}ms`);
        return { success: true, batchId, date: formattedDate, clearedCount: docsList.length, durationMs: Date.now() - t0 };
      } catch (err) {
        logger(`Error in clearDayAttendance: ${err.message}`);
        throw err;
      }
    }
    case 'removeHoliday': {
      const t0 = Date.now();
      const { holidayId, batchId, date } = req.bodyJson;
      if (!holidayId && (!batchId || !date)) {
        throw new Error('Missing holidayId or (batchId and date) for removeHoliday');
      }

      const HOLIDAY_DAYS_COL_ID = process.env.HOLIDAY_DAYS_COLLECTION_ID || 'holidayDays';
      const formattedDate = date ? String(date).substring(0, 10) : null;

      // Delete holiday document(s) - fast execution without heavy recalculations
      try {
        if (holidayId) {
          await tablesDB.deleteRow({
            databaseId: DB_ID,
            tableId: HOLIDAY_DAYS_COL_ID,
            rowId: holidayId
          }).catch(() => null);
        }
        if (batchId && formattedDate) {
          await deleteTableRows(
            tablesDB,
            DB_ID,
            HOLIDAY_DAYS_COL_ID,
            [Query.equal('batchId', batchId), Query.equal('date', formattedDate)],
            [],
            logger
          );
        }
      } catch (err) {
        logger(`Could not delete holiday document: ${err.message}`);
      }

      return { success: true, holidayId, batchId, date: formattedDate, durationMs: Date.now() - t0 };
    }
    case 'recalculateMonthlyStats': {
      const { batchId, yearMonth } = req.bodyJson;
      if (!batchId || !yearMonth) {
        throw new Error('Missing batchId or yearMonth for recalculateMonthlyStats');
      }

      await bulkUpdateMonthlyAttendanceStats(tablesDB, batchId, yearMonth, null, null, logger);
      return { success: true, batchId, yearMonth };
    }
    case 'verifyBatchMonthlyStats': {
      const { batchId, yearMonth } = req.bodyJson;
      if (!batchId || !yearMonth) {
        throw new Error('Missing batchId or yearMonth for verifyBatchMonthlyStats');
      }

      return await verifyBatchMonthlyStatsHelper(tablesDB, batchId, yearMonth);
    }
    default:
      return null;
  }
};
