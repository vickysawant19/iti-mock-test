import { ID, Query } from 'node-appwrite';
import migrateAttendanceFunc from './migrateAttendance.js';
import migrateMonthlyStatsFunc from './migrateMonthlyStats.js';
import { updateBatchStatsHelper, bulkUpdateBatchStats, updateMonthlyAttendanceStatsHelper, bulkUpdateMonthlyAttendanceStats, verifyBatchMonthlyStatsHelper, bulkUpsertDocuments, decrementMonthlyStatsForAttendanceRecords, updateIncrementalMonthlyAttendanceStats } from './statsHelper.js';
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
    case 'migrateMonthlyStats': {
      return await migrateMonthlyStatsFunc(databases, tablesDB, log, error);
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

      // Fetch batchStudents for enrollment date validation
      const BATCH_STUDENTS_COL_ID = process.env.BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';
      const batchStudentsRes = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: BATCH_STUDENTS_COL_ID,
        queries: [Query.equal('batchId', batchId), Query.limit(500)],
      }).catch(() => ({ rows: [] }));

      const getEnrollmentDateStr = (raw) => {
        if (!raw) return null;
        const m = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : null;
      };

      const enrollmentMap = new Map();
      (batchStudentsRes.rows || []).forEach((row) => {
        const ed = getEnrollmentDateStr(row.enrollmentDate || row.joinedAt);
        if (row.studentId && ed) {
          enrollmentMap.set(row.studentId, ed);
        }
      });

      // 1. Fetch existing attendance docs for that batch and date
      const existingDocsRes = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        queries: [
          Query.equal('batchId', batchId),
          Query.equal('date', date),
          Query.limit(500),
        ],
      }).catch(() => ({ rows: [] }));

      const existingRecordsMap = new Map(
        (existingDocsRes.rows || existingDocsRes.documents || []).map((doc) => [doc.userId, doc])
      );

      const newRecords = [];
      const existingToUpdate = [];
      const statsToUpdate = [];

      attendanceData.forEach((record) => {
        // Skip marking attendance if date is prior to student's enrollment date
        const studentEnrollDate = enrollmentMap.get(record.userId);
        if (studentEnrollDate && date < studentEnrollDate) {
          log(`Skipping attendance for user ${record.userId} on ${date}: date is before enrollment date ${studentEnrollDate}`);
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
              markedAt: existing.markedAt,
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
        newDocs: [],
        updatedDocs: [],
        errors: [],
        success: [],
      };

      const allRecordsToSave = [...newRecords, ...existingToUpdate];

      if (allRecordsToSave.length > 0) {
        const savedDocs = await tablesDB.upsertRows({
          databaseId: DB_ID,
          tableId: NEW_ATTENDANCE_COL_ID,
          rows: allRecordsToSave,
        });
        results.created = newRecords.length;
        results.updated = existingToUpdate.length;
        results.success.push(...(Array.isArray(savedDocs) ? savedDocs : savedDocs.rows || allRecordsToSave));
      }

      // Update stats fast & incrementally for all marked students
      if (statsToUpdate.length > 0) {
        try {
          await updateIncrementalMonthlyAttendanceStats(
            tablesDB,
            DB_ID,
            batchId,
            date,
            statsToUpdate,
            existingRecordsMap
          );
          await bulkUpdateBatchStats(databases, tablesDB, batchId, date, statsToUpdate);
        } catch (err) {
          log(`Failed bulk stats update: ${err.message}`);
        }
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
      if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
        return { success: [], created: 0, total: 0 };
      }

      const batchId = attendanceRecords[0]?.batchId;
      const BATCH_STUDENTS_COL_ID = process.env.BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';
      const batchStudentsRes = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: BATCH_STUDENTS_COL_ID,
        queries: [Query.equal('batchId', batchId), Query.limit(500)],
      }).catch(() => ({ rows: [] }));

      const getEnrollmentDateStr = (raw) => {
        if (!raw) return null;
        const m = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : null;
      };

      const enrollmentMap = new Map();
      (batchStudentsRes.rows || []).forEach((row) => {
        const ed = getEnrollmentDateStr(row.enrollmentDate || row.joinedAt);
        if (row.studentId && ed) {
          enrollmentMap.set(row.studentId, ed);
        }
      });

      const validRecords = attendanceRecords.filter((r) => {
        const studentEnrollDate = enrollmentMap.get(r.userId);
        if (studentEnrollDate && r.date < studentEnrollDate) {
          log(`Skipping createMultipleAttendance for user ${r.userId} on ${r.date}: date is before enrollment date ${studentEnrollDate}`);
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


      const createdRes = await tablesDB.createRows({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        rows: recordsToInsert,
      });
      const createdDocs = Array.isArray(createdRes)
        ? createdRes
        : createdRes.rows || recordsToInsert;

      // Update stats fast & incrementally for all marked students
      if (recordsToInsert.length > 0) {
        try {
          await updateIncrementalMonthlyAttendanceStats(
            tablesDB,
            DB_ID,
            recordsToInsert[0].batchId,
            recordsToInsert[0].date,
            recordsToInsert
          );
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
      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return { deletedIds: [] };
      }

      // Fetch records before deleting to get userId, batchId, date
      const existingDocs = await databases.listDocuments(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        [Query.equal('$id', documentIds), Query.limit(500)]
      ).then((res) => res.documents || []).catch(() => []);

      const chunkedQueries = [
        Query.equal('$id', documentIds)
      ];

      await tablesDB.deleteRows({
        databaseId: DB_ID,
        tableId: NEW_ATTENDANCE_COL_ID,
        queries: chunkedQueries,
      });

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
          await decrementMonthlyStatsForAttendanceRecords(tablesDB, DB_ID, grp.batchId, grp.yearMonth, grp.records);
        }
      } catch (err) {
        log(`Failed stats update on deleteMultipleAttendance: ${err.message}`);
      }

      return { deletedIds: documentIds };
    }
    case 'createAttendance': {
      const {
        userId,
        batchId,
        tradeId,
        date,
        status,
        remarks,
        markedAt,
        markedBy,
        dayType: inputDayType,
        attendanceStatus: inputAttendanceStatus,
        leaveType,
        source,
        holidayId,
      } = req.bodyJson;

      if (!userId || !batchId || !date || (!status && !inputAttendanceStatus)) {
        throw new Error('Missing required fields for createAttendance');
      }

      const dayType = inputDayType || 'WORKING';
      const attendanceStatus = inputAttendanceStatus || (status ? status.toUpperCase() : 'PRESENT');
      const finalStatus = status || attendanceStatus.toLowerCase();
      const isHoliday = dayType === 'HOLIDAY';

      const result = await databases.createDocument(
        DB_ID,
        NEW_ATTENDANCE_COL_ID,
        ID.unique(),
        {
          userId,
          batchId,
          tradeId: tradeId || null,
          date,
          status: finalStatus,
          dayType,
          attendanceStatus,
          leaveType: leaveType || null,
          source: source || 'MANUAL',
          revision: 1,
          syncStatus: 'SYNCED',
          holidayId: holidayId || null,
          remarks: remarks || null,
          markedAt: markedAt || new Date().toISOString(),
          markedBy: markedBy || null,
        }
      );

      // Update stats
      try {
        await updateBatchStatsHelper(databases, userId, batchId, { dayType, attendanceStatus, status: finalStatus, isHoliday }, date);
        await bulkUpdateMonthlyAttendanceStats(tablesDB, databases, batchId, String(date).substring(0, 7), [userId]);
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

      if (existingRecord) {
        try {
          await bulkUpdateMonthlyAttendanceStats(tablesDB, databases, existingRecord.batchId, String(existingRecord.date).substring(0, 7), [existingRecord.userId]);
        } catch (err) {
          log(`Failed to update monthlyAttendanceStats on updateAttendance: ${err.message}`);
        }
      }

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

      if (existingRecord) {
        try {
          await bulkUpdateMonthlyAttendanceStats(tablesDB, databases, existingRecord.batchId, String(existingRecord.date).substring(0, 7), [existingRecord.userId]);
        } catch (err) {
          log(`Failed to update monthlyAttendanceStats on deleteAttendance: ${err.message}`);
        }
      }

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
    case 'addHoliday': {
      const { batchId, date, holidayText } = req.bodyJson;
      if (!batchId || !date) {
        throw new Error('Missing batchId or date for addHoliday');
      }

      const HOLIDAY_DAYS_COL_ID = process.env.HOLIDAY_DAYS_COLLECTION_ID || 'holidayDays';
      const formattedDate = String(date).substring(0, 10);

      // 1. Create or update holiday document
      let holidayDoc;
      try {
        const existing = await databases.listDocuments(
          DB_ID,
          HOLIDAY_DAYS_COL_ID,
          [Query.equal('batchId', batchId), Query.equal('date', formattedDate), Query.limit(1)]
        );
        if (existing.documents?.length > 0) {
          holidayDoc = await databases.updateDocument(
            DB_ID,
            HOLIDAY_DAYS_COL_ID,
            existing.documents[0].$id,
            { holidayText: holidayText || 'Holiday' }
          );
        } else {
          holidayDoc = await databases.createDocument(
            DB_ID,
            HOLIDAY_DAYS_COL_ID,
            ID.unique(),
            {
              batchId,
              date: formattedDate,
              holidayText: holidayText || 'Holiday',
            }
          );
        }
      } catch (err) {
        log(`Error in addHoliday document write: ${err.message}`);
        throw err;
      }

      // 2. Fetch any existing daily attendance records for this batch and date
      try {
        const existingDocsRes = await tablesDB.listRows({
          databaseId: DB_ID,
          tableId: NEW_ATTENDANCE_COL_ID,
          queries: [Query.equal('batchId', batchId), Query.equal('date', formattedDate), Query.limit(500)],
        });

        const docsList = existingDocsRes.rows || existingDocsRes.documents || [];
        if (docsList.length > 0) {
          // Decrement monthly stats for students who had attendance marked on this now-holiday date
          const yearMonth = formattedDate.substring(0, 7);
          await decrementMonthlyStatsForAttendanceRecords(
            tablesDB,
            DB_ID,
            batchId,
            yearMonth,
            docsList
          ).catch((e) => log(`Failed to decrement monthly stats on addHoliday: ${e.message}`));

          // Delete daily attendance records in 1 native bulk call
          await tablesDB.deleteRows({
            databaseId: DB_ID,
            tableId: NEW_ATTENDANCE_COL_ID,
            queries: [Query.equal('batchId', batchId), Query.equal('date', formattedDate)],
          }).catch(() => null);
        }
      } catch (err) {
        log(`Could not clear daily attendance for added holiday date: ${err.message}`);
      }

      return holidayDoc;
    }
    case 'clearDayAttendance': {
      const { batchId, date } = req.bodyJson;
      if (!batchId || !date) {
        throw new Error('Missing batchId or date for clearDayAttendance');
      }

      const formattedDate = String(date).substring(0, 10);

      try {
        const existingDocsRes = await tablesDB.listRows({
          databaseId: DB_ID,
          tableId: NEW_ATTENDANCE_COL_ID,
          queries: [Query.equal('batchId', batchId), Query.equal('date', formattedDate), Query.limit(500)],
        });

        const docsList = existingDocsRes.rows || existingDocsRes.documents || [];
        if (docsList.length > 0) {
          // Decrement monthly stats for students who had attendance marked on this date
          const yearMonth = formattedDate.substring(0, 7);
          await decrementMonthlyStatsForAttendanceRecords(
            tablesDB,
            DB_ID,
            batchId,
            yearMonth,
            docsList
          ).catch((e) => log(`Failed to decrement monthly stats on clearDayAttendance: ${e.message}`));

          // Delete daily attendance records in 1 native bulk call
          await tablesDB.deleteRows({
            databaseId: DB_ID,
            tableId: NEW_ATTENDANCE_COL_ID,
            queries: [Query.equal('batchId', batchId), Query.equal('date', formattedDate)],
          }).catch(() => null);
        }

        log(`Successfully cleared ${docsList.length} daily attendance records for batch ${batchId} on ${formattedDate}`);
        return { success: true, batchId, date: formattedDate, clearedCount: docsList.length };
      } catch (err) {
        log(`Error in clearDayAttendance: ${err.message}`);
        throw err;
      }
    }
    case 'removeHoliday': {
      const { holidayId, batchId, date } = req.bodyJson;
      if (!holidayId && (!batchId || !date)) {
        throw new Error('Missing holidayId or (batchId and date) for removeHoliday');
      }

      const HOLIDAY_DAYS_COL_ID = process.env.HOLIDAY_DAYS_COLLECTION_ID || 'holidayDays';
      const formattedDate = date ? String(date).substring(0, 10) : null;

      // Delete holiday document(s) - fast execution without heavy recalculations
      try {
        if (holidayId) {
          await databases.deleteDocument(DB_ID, HOLIDAY_DAYS_COL_ID, holidayId).catch(() => null);
        }
        if (batchId && formattedDate) {
          const existingHolidays = await databases.listDocuments(
            DB_ID,
            HOLIDAY_DAYS_COL_ID,
            [Query.equal('batchId', batchId), Query.equal('date', formattedDate), Query.limit(100)]
          );
          if (existingHolidays.documents?.length > 0) {
            await Promise.all(
              existingHolidays.documents.map((h) =>
                databases.deleteDocument(DB_ID, HOLIDAY_DAYS_COL_ID, h.$id).catch(() => null)
              )
            );
          }
        }
      } catch (err) {
        log(`Could not delete holiday document: ${err.message}`);
      }

      return { success: true, holidayId, batchId, date: formattedDate };
    }
    case 'recalculateMonthlyStats': {
      const { batchId, yearMonth } = req.bodyJson;
      if (!batchId || !yearMonth) {
        throw new Error('Missing batchId or yearMonth for recalculateMonthlyStats');
      }

      await bulkUpdateMonthlyAttendanceStats(tablesDB, databases, batchId, yearMonth, null);
      return { success: true, batchId, yearMonth };
    }
    case 'verifyBatchMonthlyStats': {
      const { batchId, yearMonth } = req.bodyJson;
      if (!batchId || !yearMonth) {
        throw new Error('Missing batchId or yearMonth for verifyBatchMonthlyStats');
      }

      return await verifyBatchMonthlyStatsHelper(tablesDB, databases, batchId, yearMonth);
    }
    default:
      return null;
  }
};
