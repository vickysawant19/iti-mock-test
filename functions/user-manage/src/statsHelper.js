import { ID, Query } from 'node-appwrite';
import { createHash } from 'crypto';

export const generateShortStatId = (userId, batchId, suffix = '') => {
  const raw = suffix ? `${userId}_${batchId}_${suffix}` : `${userId}_${batchId}`;
  return createHash('md5').update(raw).digest('hex'); // 32 chars (Appwrite max limit is 36 chars)
};

export const cleanDocumentData = (doc) => {
  if (!doc || typeof doc !== 'object') return {};
  const {
    $id,
    $permissions,
    $collectionId,
    $databaseId,
    $createdAt,
    $updatedAt,
    $sequence,
    ...clean
  } = doc;
  return clean;
};

export const bulkUpsertDocuments = async (tablesDB, DB_ID_OR_DATABASES, DB_ID_OR_COLLECTION, collectionIdOrDocs, documentsOrLog, maybeLog) => {
  // Support both (tablesDB, DB_ID, collectionId, documents, log) and legacy (tablesDB, databases, DB_ID, collectionId, documents, log)
  let DB_ID, collectionId, documents, log;
  if (typeof collectionIdOrDocs === 'string') {
    // legacy (tablesDB, databases, DB_ID, collectionId, documents, log)
    DB_ID = DB_ID_OR_COLLECTION;
    collectionId = collectionIdOrDocs;
    documents = documentsOrLog;
    log = maybeLog;
  } else {
    // (tablesDB, DB_ID, collectionId, documents, log)
    DB_ID = DB_ID_OR_DATABASES;
    collectionId = DB_ID_OR_COLLECTION;
    documents = collectionIdOrDocs;
    log = documentsOrLog;
  }

  if (!documents || documents.length === 0) return [];
  const t0 = Date.now();
  const logger = typeof log === 'function' ? log : console.log;

  // Build clean sanitized payload (pure data + $id + $permissions)
  const sanitizedDocs = documents.map((doc) => {
    const clean = cleanDocumentData(doc);
    const row = { ...clean };
    if (doc.$id) row.$id = doc.$id;
    if (Array.isArray(doc.$permissions) && doc.$permissions.length > 0) {
      row.$permissions = doc.$permissions;
    }
    return row;
  });

  // 1. Try native bulk tablesDB.upsertRows first if available
  if (tablesDB && typeof tablesDB.upsertRows === 'function') {
    try {
      const savedDocs = [];
      for (let i = 0; i < sanitizedDocs.length; i += 100) {
        const chunk = sanitizedDocs.slice(i, i + 100);
        const res = await tablesDB.upsertRows({
          databaseId: DB_ID,
          tableId: collectionId,
          rows: chunk,
        });
        const rows = res?.rows || res?.documents || (Array.isArray(res) ? res : chunk);
        savedDocs.push(...rows);
      }
      logger(`[bulkUpsert:${collectionId}] Native tablesDB.upsertRows saved ${savedDocs.length} items in ${Date.now() - t0}ms`);
      return savedDocs;
    } catch (bulkErr) {
      logger(`[bulkUpsert:${collectionId}] tablesDB.upsertRows notice: ${bulkErr.message}, running optimized parallel writes...`);
    }
  }

  // 2. High-speed parallel fallback: determine existing docs with 1 list query
  const targetIds = sanitizedDocs.map((d) => d.$id).filter(Boolean);
  const existingIds = new Set();

  if (targetIds.length > 0 && tablesDB) {
    try {
      for (let i = 0; i < targetIds.length; i += 100) {
        const chunkIds = targetIds.slice(i, i + 100);
        const existingDocs = await tablesDB.listRows({
          databaseId: DB_ID,
          tableId: collectionId,
          queries: [
            Query.equal('$id', chunkIds),
            Query.limit(100),
          ]
        });
        const rows = existingDocs.rows || existingDocs.documents || [];
        rows.forEach((doc) => existingIds.add(doc.$id));
      }
    } catch (e) {
      logger(`[bulkUpsert:${collectionId}] list query warning: ${e.message}`);
    }
  }

  const toCreate = [];
  const toUpdate = [];

  sanitizedDocs.forEach((doc) => {
    const { $id, $permissions, ...data } = doc;
    const targetId = $id || ID.unique();
    const permissions = Array.isArray($permissions) && $permissions.length > 0 ? $permissions : undefined;

    if (existingIds.has(targetId)) {
      toUpdate.push({ targetId, data, permissions });
    } else {
      toCreate.push({ targetId, data, permissions });
    }
  });

  logger(`[bulkUpsert:${collectionId}] ${sanitizedDocs.length} items (${toCreate.length} create, ${toUpdate.length} update), idCheck took ${Date.now() - t0}ms`);

  const CONCURRENCY = 20;
  const savedResults = [];

  const runConcurrentBatch = async (items, isCreate) => {
    for (let i = 0; i < items.length; i += CONCURRENCY) {
      const chunk = items.slice(i, i + CONCURRENCY);
      const chunkPromises = chunk.map(async ({ targetId, data, permissions }) => {
        try {
          if (isCreate) {
            return await tablesDB.createRow({
              databaseId: DB_ID,
              tableId: collectionId,
              rowId: targetId,
              data,
              permissions,
            });
          } else {
            return await tablesDB.updateRow({
              databaseId: DB_ID,
              tableId: collectionId,
              rowId: targetId,
              data,
              permissions,
            });
          }
        } catch (err) {
          logger(`[bulkUpsert:${collectionId}] Item write failed (${err.message}), attempting recovery...`);
          try {
            if (isCreate) {
              return await tablesDB.updateRow({
                databaseId: DB_ID,
                tableId: collectionId,
                rowId: targetId,
                data,
                permissions,
              });
            } else {
              return await tablesDB.createRow({
                databaseId: DB_ID,
                tableId: collectionId,
                rowId: targetId,
                data,
                permissions,
              });
            }
          } catch (retryErr) {
            logger(`[bulkUpsert:${collectionId}] Recovery failed on doc ${targetId}: ${retryErr.message}`);
            return null;
          }
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      savedResults.push(...chunkResults.filter(Boolean));
    }
  };

  await Promise.all([
    runConcurrentBatch(toCreate, true),
    runConcurrentBatch(toUpdate, false)
  ]);

  logger(`[bulkUpsert:${collectionId}] Done: ${savedResults.length}/${sanitizedDocs.length} saved in ${Date.now() - t0}ms`);
  return savedResults;
};

export const deleteTableRows = async (tablesDB, DB_ID_OR_DATABASES, DB_ID_OR_COLLECTION, collectionIdOrQueries, queriesOrRowIds, rowIdsOrLog = [], maybeLog) => {
  // Support both (tablesDB, DB_ID, collectionId, queries, rowIds, log) and legacy (tablesDB, databases, DB_ID, collectionId, queries, rowIds, log)
  let DB_ID, collectionId, queries, rowIds, log;
  if (typeof DB_ID_OR_COLLECTION === 'string' && typeof collectionIdOrQueries === 'string') {
    // legacy (tablesDB, databases, DB_ID, collectionId, queries, rowIds, log)
    DB_ID = DB_ID_OR_COLLECTION;
    collectionId = collectionIdOrQueries;
    queries = queriesOrRowIds;
    rowIds = Array.isArray(rowIdsOrLog) ? rowIdsOrLog : [];
    log = maybeLog || (typeof rowIdsOrLog === 'function' ? rowIdsOrLog : console.log);
  } else {
    // (tablesDB, DB_ID, collectionId, queries, rowIds, log)
    DB_ID = DB_ID_OR_DATABASES;
    collectionId = DB_ID_OR_COLLECTION;
    queries = collectionIdOrQueries;
    rowIds = Array.isArray(queriesOrRowIds) ? queriesOrRowIds : [];
    log = rowIdsOrLog;
  }

  const logger = typeof log === 'function' ? log : console.log;
  const t0 = Date.now();

  // 1. Try native atomic tablesDB.deleteRows if queries provided and supported
  if (tablesDB && typeof tablesDB.deleteRows === 'function' && Array.isArray(queries) && queries.length > 0) {
    try {
      await tablesDB.deleteRows({
        databaseId: DB_ID,
        tableId: collectionId,
        queries,
      });
      logger(`[deleteTableRows:${collectionId}] Native tablesDB.deleteRows finished in ${Date.now() - t0}ms`);
      return;
    } catch (bulkErr) {
      logger(`[deleteTableRows:${collectionId}] tablesDB.deleteRows notice: ${bulkErr.message}, deleting by IDs...`);
    }
  }

  // 2. Parallel ID deletion fallback
  let targetIds = Array.isArray(rowIds) ? [...rowIds] : [];
  if (targetIds.length === 0 && Array.isArray(queries) && queries.length > 0 && tablesDB) {
    try {
      const res = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: collectionId,
        queries: [...queries, Query.limit(5000)],
      });
      const rows = res.rows || res.documents || [];
      targetIds = rows.map((d) => d.$id);
    } catch (e) {
      logger(`[deleteTableRows:${collectionId}] Query error: ${e.message}`);
    }
  }

  if (targetIds.length === 0) return;

  logger(`[deleteTableRows:${collectionId}] Deleting ${targetIds.length} docs in parallel...`);
  const CONCURRENCY = 25;
  for (let i = 0; i < targetIds.length; i += CONCURRENCY) {
    const chunk = targetIds.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map((id) => tablesDB.deleteRow({
      databaseId: DB_ID,
      tableId: collectionId,
      rowId: id,
    }).catch(() => null)));
  }

  logger(`[deleteTableRows:${collectionId}] Deleted ${targetIds.length} rows in ${Date.now() - t0}ms`);
};

export const updateBatchStatsHelper = async (
  tablesDB,
  userId,
  batchId,
  status,
  date
) => {
  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const STATS_COLLECTION_ID = 'userBatchStats';
  const monthKey = date.substring(0, 7); // YYYY-MM

  // Fetch existing stats
  const existingDocs = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: STATS_COLLECTION_ID,
    queries: [Query.equal('userId', userId), Query.equal('batchId', batchId)]
  }).catch(() => ({ total: 0, rows: [], documents: [] }));

  const rows = existingDocs.rows || existingDocs.documents || [];

  const getIsPresent = (recordOrStatus, dayTypeParam, isHolidayParam) => {
    let dayType = dayTypeParam;
    let st = typeof recordOrStatus === 'string' ? recordOrStatus : recordOrStatus?.attendanceStatus || recordOrStatus?.status;
    let isHoliday = isHolidayParam;

    if (typeof recordOrStatus === 'object' && recordOrStatus !== null) {
      dayType = recordOrStatus.dayType || (recordOrStatus.isHoliday ? 'HOLIDAY' : 'WORKING');
      isHoliday = recordOrStatus.isHoliday;
    } else {
      dayType = dayType || (isHoliday ? 'HOLIDAY' : 'WORKING');
    }

    if (dayType !== 'WORKING') return 0;

    const normalizedStatus = String(st || '').trim().toUpperCase();
    return normalizedStatus === 'PRESENT' ? 1 : 0;
  };

  let isPresent = getIsPresent(status, null, false);

  if ((existingDocs.total ?? rows.length) > 0 && rows.length > 0) {
    const existing = rows[0];

    let monthlyData = {};
    try {
      monthlyData = JSON.parse(existing.monthlyAttendance || '{}');
    } catch (e) { }

    if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
    monthlyData[monthKey] += isPresent;

    await tablesDB.updateRow({
      databaseId: DB_ID,
      tableId: STATS_COLLECTION_ID,
      rowId: existing.$id,
      data: {
        presentDays: existing.presentDays + isPresent,
        monthlyAttendance: JSON.stringify(monthlyData),
      }
    });
  } else {
    let monthlyData = {};
    monthlyData[monthKey] = isPresent;

    await tablesDB.createRow({
      databaseId: DB_ID,
      tableId: STATS_COLLECTION_ID,
      rowId: ID.unique(),
      data: {
        userId,
        batchId,
        totalWorkingDays: 0,
        presentDays: isPresent,
        monthlyAttendance: JSON.stringify(monthlyData),
        testsSubmitted: 0,
        cumulativeScore: 0,
        latestScore: 0,
      }
    });
  }
};

export const bulkUpdateBatchStats = async (
  tablesDB,
  databasesOrBatchId,
  batchIdOrDate,
  dateOrStatsList,
  statsDataListOrLog,
  maybeLog = console.log
) => {
  let batchId, date, statsDataList, log;
  if (Array.isArray(dateOrStatsList)) {
    // (tablesDB, batchId, date, statsDataList, log)
    batchId = databasesOrBatchId;
    date = batchIdOrDate;
    statsDataList = dateOrStatsList;
    log = statsDataListOrLog;
  } else {
    // legacy (tablesDB, databases, batchId, date, statsDataList, log)
    batchId = batchIdOrDate;
    date = dateOrStatsList;
    statsDataList = statsDataListOrLog;
    log = maybeLog;
  }

  if (!statsDataList || statsDataList.length === 0) return;
  const logger = typeof log === 'function' ? log : console.log;
  const t0 = Date.now();

  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const STATS_COLLECTION_ID = 'userBatchStats';
  const monthKey = date.substring(0, 7); // YYYY-MM

  try {
    // Fetch all existing stats for this batch in 1 bulk query
    const existingDocsRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: STATS_COLLECTION_ID,
      queries: [Query.equal('batchId', batchId), Query.limit(500)]
    }).catch(() => ({ rows: [], documents: [] }));

    const existingRows = existingDocsRes.rows || existingDocsRes.documents || [];
    const existingStatsMap = new Map(
      existingRows.map((doc) => [doc.userId, doc])
    );

    const getIsPresent = (record) => {
      const dayType = record.dayType || (record.isHoliday ? 'HOLIDAY' : 'WORKING');
      if (dayType !== 'WORKING') return 0;
      const status = String(record.attendanceStatus || record.status || '').trim().toUpperCase();
      return status === 'PRESENT' ? 1 : 0;
    };

    const tasks = statsDataList.map((record) => {
      const isPresent = getIsPresent(record);
      const existing = existingStatsMap.get(record.userId);

      if (existing) {
        let monthlyData = {};
        try {
          monthlyData = JSON.parse(existing.monthlyAttendance || '{}');
        } catch (e) { }

        if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
        monthlyData[monthKey] += isPresent;

        return tablesDB.updateRow({
          databaseId: DB_ID,
          tableId: STATS_COLLECTION_ID,
          rowId: existing.$id,
          data: {
            presentDays: Math.max(0, (existing.presentDays || 0) + isPresent),
            monthlyAttendance: JSON.stringify(monthlyData),
          }
        }).catch((err) => {
          logger(`[userBatchStats] Update error on ${existing.$id}: ${err.message}`);
          return null;
        });
      } else {
        let monthlyData = {};
        monthlyData[monthKey] = isPresent;

        return tablesDB.createRow({
          databaseId: DB_ID,
          tableId: STATS_COLLECTION_ID,
          rowId: ID.unique(),
          data: {
            userId: record.userId,
            batchId: batchId,
            totalWorkingDays: 0,
            presentDays: isPresent,
            monthlyAttendance: JSON.stringify(monthlyData),
            testsSubmitted: 0,
            cumulativeScore: 0,
            latestScore: 0,
          }
        }).catch((err) => {
          logger(`[userBatchStats] Create error for ${record.userId}: ${err.message}`);
          return null;
        });
      }
    });

    await Promise.all(tasks);
    logger(`[bulkUpdateBatchStats] Done for ${tasks.length} students in ${Date.now() - t0}ms`);
  } catch (err) {
    logger(`[bulkUpdateBatchStats] Non-blocking warning: ${err.message}`);
  }
};

export const bulkUpdateMonthlyAttendanceStats = async (
  tablesDB,
  databasesOrBatchId,
  batchIdOrYearMonth,
  yearMonthOrAffectedUsers,
  affectedUserIdsOrLatestRecords = null,
  latestRecordsOrLog = null,
  maybeLog = console.log
) => {
  let batchId, yearMonth, affectedUserIds, latestRecords, log;
  if (typeof batchIdOrYearMonth === 'string' && /^\d{4}-\d{2}$/.test(batchIdOrYearMonth)) {
    // (tablesDB, batchId, yearMonth, affectedUserIds, latestRecords, log)
    batchId = databasesOrBatchId;
    yearMonth = batchIdOrYearMonth;
    affectedUserIds = yearMonthOrAffectedUsers;
    latestRecords = affectedUserIdsOrLatestRecords;
    log = latestRecordsOrLog;
  } else {
    // legacy (tablesDB, databases, batchId, yearMonth, affectedUserIds, latestRecords, log)
    batchId = batchIdOrYearMonth;
    yearMonth = yearMonthOrAffectedUsers;
    affectedUserIds = affectedUserIdsOrLatestRecords;
    latestRecords = latestRecordsOrLog;
    log = maybeLog;
  }

  if (!batchId || !yearMonth) return;
  const t0 = Date.now();
  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const MONTHLY_STATS_COL = 'monthlyAttendanceStats';
  const NEW_ATTENDANCE_COL = 'newAttendance';
  const BATCH_STUDENTS_COL = process.env.BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';

  const logger = typeof log === 'function' ? log : console.log;

  try {
    logger(`[bulkUpdateMonthlyAttendanceStats] START batchId=${batchId}, yearMonth=${yearMonth}`);
    const userFilterSet = affectedUserIds && affectedUserIds.length > 0 ? new Set(affectedUserIds) : null;

    const getEnrollmentDateStr = (raw) => {
      if (!raw) return null;
      const str = String(raw).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      try {
        const d = new Date(str);
        if (isNaN(d.getTime())) {
          const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
          return m ? m[1] : null;
        }
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        return formatter.format(d);
      } catch (e) {
        const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : null;
      }
    };

    // 1. Fetch enrollment dates and all batch students
    const bsRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: BATCH_STUDENTS_COL,
      queries: [Query.equal('batchId', batchId), Query.limit(500)]
    }).catch(() => ({ rows: [], documents: [] }));

    const bsRows = bsRes.rows || bsRes.documents || [];
    const enrollmentMap = new Map();
    const batchStudentUserIds = new Set();
    bsRows.forEach((row) => {
      const studentId = row.studentId || row.userId || row.student_id;
      const ed = getEnrollmentDateStr(row.enrollmentDate || row.joinedAt);
      if (studentId) {
        batchStudentUserIds.add(studentId);
        if (ed) enrollmentMap.set(studentId, ed);
      }
    });

    // 1b. Fetch active batch holidays for yearMonth from holidayDays collection
    const HOLIDAY_DAYS_COL = process.env.HOLIDAY_DAYS_COLLECTION_ID || 'holidayDays';
    const holidaysRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: HOLIDAY_DAYS_COL,
      queries: [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(100),
      ]
    }).catch(() => ({ rows: [], documents: [] }));

    const holidayRows = holidaysRes.rows || holidaysRes.documents || [];
    const activeHolidayDates = new Set(
      holidayRows.map((h) => String(h.date).substring(0, 10))
    );

    // 2. Fetch daily attendance records for this batch and month
    const attendanceRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: NEW_ATTENDANCE_COL,
      queries: [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(5000),
      ]
    }).catch(() => ({ rows: [], documents: [] }));

    const attendanceRows = attendanceRes.rows || attendanceRes.documents || [];

    // 3. Group by userId
    const userRecordsMap = new Map();

    // Ensure all batch students have an entry in userRecordsMap
    batchStudentUserIds.forEach((uid) => {
      if (!userFilterSet || userFilterSet.has(uid)) {
        userRecordsMap.set(uid, []);
      }
    });

    attendanceRows.forEach((doc) => {
      if (!doc.userId) return;
      if (userFilterSet && !userFilterSet.has(doc.userId)) return;

      const enrollStr = enrollmentMap.get(doc.userId);
      if (enrollStr && doc.date < enrollStr) return;

      if (!userRecordsMap.has(doc.userId)) {
        userRecordsMap.set(doc.userId, []);
      }
      userRecordsMap.get(doc.userId).push({ ...doc });
    });

    // Merge latest in-memory records
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
        const dateStr = String(r.date).substring(0, 10);
        if (activeHolidayDates.has(dateStr)) return;

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
        $id: generateShortStatId(userId, batchId, yearMonth),
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

    // 5. Bulk Upsert
    await bulkUpsertDocuments(tablesDB, DB_ID, MONTHLY_STATS_COL, statsObjects, logger);
    logger(`[bulkUpdateMonthlyAttendanceStats] Finished in ${Date.now() - t0}ms`);
  } catch (err) {
    logger(`[bulkUpdateMonthlyAttendanceStats-ERROR] ${err.message}`);
  }
};

export const updateMonthlyAttendanceStatsHelper = async (
  tablesDB,
  databasesOrUserId,
  userIdOrBatchId,
  batchIdOrDate,
  dateOrLog,
  maybeLog = console.log
) => {
  let userId, batchId, date, log;
  if (typeof dateOrLog === 'string') {
    // legacy (tablesDB, databases, userId, batchId, date, log)
    userId = userIdOrBatchId;
    batchId = batchIdOrDate;
    date = dateOrLog;
    log = maybeLog;
  } else {
    // (tablesDB, userId, batchId, date, log)
    userId = databasesOrUserId;
    batchId = userIdOrBatchId;
    date = batchIdOrDate;
    log = dateOrLog;
  }

  if (!userId || !batchId || !date) return;
  const yearMonth = String(date).substring(0, 7);
  await bulkUpdateMonthlyAttendanceStats(tablesDB, batchId, yearMonth, [userId], null, log);
};

export const verifyBatchMonthlyStatsHelper = async (tablesDB, databasesOrBatchId, batchIdOrYearMonth, maybeYearMonth) => {
  let batchId, yearMonth;
  if (typeof maybeYearMonth === 'string') {
    // legacy (tablesDB, databases, batchId, yearMonth)
    batchId = batchIdOrYearMonth;
    yearMonth = maybeYearMonth;
  } else {
    // (tablesDB, batchId, yearMonth)
    batchId = databasesOrBatchId;
    yearMonth = batchIdOrYearMonth;
  }

  if (!batchId || !yearMonth) return { hasDiscrepancies: false, mismatches: [], totalChecked: 0 };
  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const MONTHLY_STATS_COL = 'monthlyAttendanceStats';
  const NEW_ATTENDANCE_COL = 'newAttendance';
  const BATCH_STUDENTS_COL = process.env.BATCH_STUDENTS_COLLECTION_ID || 'batchStudents';
  const HOLIDAY_DAYS_COL = process.env.HOLIDAY_DAYS_COLLECTION_ID || 'holidayDays';

  const getEnrollmentDateStr = (raw) => {
    if (!raw) return null;
    const str = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) {
        const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : null;
      }
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d);
    } catch (e) {
      const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : null;
    }
  };

  try {
    // 1. Fetch batch students
    const bsRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: BATCH_STUDENTS_COL,
      queries: [Query.equal('batchId', batchId), Query.limit(500)]
    }).catch(() => ({ rows: [], documents: [] }));

    const bsRows = bsRes.rows || bsRes.documents || [];
    const studentMap = new Map();
    bsRows.forEach((row) => {
      const studentId = row.studentId || row.userId || row.student_id;
      if (studentId) {
        studentMap.set(studentId, {
          userId: studentId,
          userName: row.userName || row.name || `Student (${studentId.substring(0, 6)})`,
          rollNumber: row.rollNumber || row.registerId || '-',
          enrollmentDate: getEnrollmentDateStr(row.enrollmentDate || row.joinedAt),
        });
      }
    });

    // 2. Fetch stored monthlyAttendanceStats
    const storedStatsRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: MONTHLY_STATS_COL,
      queries: [
        Query.equal('batchId', batchId),
        Query.equal('yearMonth', yearMonth),
        Query.limit(500),
      ]
    }).catch(() => ({ rows: [], documents: [] }));

    const storedRows = storedStatsRes.rows || storedStatsRes.documents || [];
    const storedStatsMap = new Map();
    storedRows.forEach((doc) => {
      storedStatsMap.set(doc.userId, doc);
    });

    // 3. Fetch active holidays for yearMonth
    const holidaysRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: HOLIDAY_DAYS_COL,
      queries: [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(100),
      ]
    }).catch(() => ({ rows: [], documents: [] }));

    const holidayRows = holidaysRes.rows || holidaysRes.documents || [];
    const activeHolidayDates = new Set(
      holidayRows.map((h) => String(h.date).substring(0, 10))
    );

    // 4. Fetch daily attendance records
    const attendanceRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: NEW_ATTENDANCE_COL,
      queries: [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(5000),
      ]
    }).catch(() => ({ rows: [], documents: [] }));

    const attendanceRows = attendanceRes.rows || attendanceRes.documents || [];
    const userRecordsMap = new Map();
    attendanceRows.forEach((doc) => {
      if (!doc.userId) return;
      if (!userRecordsMap.has(doc.userId)) {
        userRecordsMap.set(doc.userId, []);
      }
      userRecordsMap.get(doc.userId).push(doc);
    });

    const mismatches = [];

    // 5. Compare each student's expected stats with stored stats
    studentMap.forEach((student, uid) => {
      const enrollStr = student.enrollmentDate;
      const allUserRecords = userRecordsMap.get(uid) || [];

      const validMonthRecords = (enrollStr && enrollStr.substring(0, 7) === yearMonth)
        ? allUserRecords.filter((doc) => doc.date >= enrollStr)
        : allUserRecords;

      let presentDays = 0, absentDays = 0, casualLeaves = 0;
      let sickLeaves = 0, specialLeaves = 0, onDutyLeaves = 0, halfDays = 0, lateDays = 0;

      validMonthRecords.forEach((r) => {
        const dateStr = String(r.date).substring(0, 10);
        if (activeHolidayDates.has(dateStr)) return;

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

      const storedDoc = storedStatsMap.get(uid);

      if (!storedDoc && workingDays === 0) {
        return;
      }

      const storedWorking = storedDoc?.workingDays || 0;
      const storedPresent = storedDoc?.presentDays || 0;
      const storedPercentage = storedDoc?.attendancePercentage || 0;

      const isMismatch =
        !storedDoc ||
        storedWorking !== workingDays ||
        storedPresent !== presentDays ||
        (storedDoc?.absentDays || 0) !== absentDays ||
        (storedDoc?.totalPresent || 0) !== totalPresent ||
        storedPercentage !== attendancePercentage;

      if (isMismatch) {
        mismatches.push({
          userId: uid,
          userName: student.userName,
          rollNumber: student.rollNumber,
          enrollmentDate: enrollStr,
          stored: {
            workingDays: storedWorking,
            presentDays: storedPresent,
            totalPresent: storedDoc?.totalPresent || 0,
            percentage: storedPercentage,
          },
          actual: {
            workingDays,
            presentDays,
            absentDays,
            totalPresent,
            percentage: attendancePercentage,
          },
        });
      }
    });

    return {
      hasDiscrepancies: mismatches.length > 0,
      mismatches,
      totalChecked: studentMap.size,
    };
  } catch (err) {
    console.error('Failed in verifyBatchMonthlyStatsHelper:', err);
    return { hasDiscrepancies: false, mismatches: [], totalChecked: 0 };
  }
};

export const decrementMonthlyStatsForAttendanceRecords = async (tablesDB, DB_ID_OR_DATABASES, DB_ID_OR_BATCH, batchIdOrYearMonth, yearMonthOrRecords, recordsOrLog = [], maybeLog = console.log) => {
  let DB_ID, batchId, yearMonth, records, log;
  if (Array.isArray(recordsOrLog)) {
    // (tablesDB, databases, DB_ID, batchId, yearMonth, records, log)
    DB_ID = DB_ID_OR_BATCH;
    batchId = batchIdOrYearMonth;
    yearMonth = yearMonthOrRecords;
    records = recordsOrLog;
    log = maybeLog;
  } else {
    // (tablesDB, DB_ID, batchId, yearMonth, records, log)
    DB_ID = DB_ID_OR_DATABASES;
    batchId = DB_ID_OR_BATCH;
    yearMonth = batchIdOrYearMonth;
    records = yearMonthOrRecords;
    log = recordsOrLog;
  }

  if (!records || records.length === 0) return;
  const logger = typeof log === 'function' ? log : console.log;
  const t0 = Date.now();
  const MONTHLY_STATS_COL = 'monthlyAttendanceStats';

  // Fetch existing monthly stats for this batch and month in 1 single bulk query
  const existingStatsRes = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: MONTHLY_STATS_COL,
    queries: [
      Query.equal('batchId', batchId),
      Query.equal('yearMonth', yearMonth),
      Query.limit(500),
    ]
  }).catch(() => ({ rows: [], documents: [] }));

  const existingRows = existingStatsRes.rows || existingStatsRes.documents || [];
  const existingStatsMap = new Map(
    existingRows.map((doc) => [doc.userId, { ...doc }])
  );

  const modifiedStatsMap = new Map();

  records.forEach((r) => {
    const userId = r.userId;
    if (!userId) return;

    const doc = modifiedStatsMap.get(userId) || existingStatsMap.get(userId);
    if (!doc) return; 

    const s = String(r.status || r.attendanceStatus || '').toLowerCase();

    let workingDays = Math.max(0, (doc.workingDays || 0) - 1);
    let presentDays = doc.presentDays || 0;
    let absentDays = doc.absentDays || 0;
    let casualLeaves = doc.casualLeaves || 0;
    let sickLeaves = doc.sickLeaves || 0;
    let specialLeaves = doc.specialLeaves || 0;
    let onDutyLeaves = doc.onDutyLeaves || 0;
    let halfDays = doc.halfDays || 0;
    let lateDays = doc.lateDays || 0;

    if (s === 'present' || s === 'p') presentDays = Math.max(0, presentDays - 1);
    else if (s === 'absent' || s === 'a') absentDays = Math.max(0, absentDays - 1);
    else if (s === 'casual' || s === 'cl') casualLeaves = Math.max(0, casualLeaves - 1);
    else if (s === 'sick' || s === 'sl') sickLeaves = Math.max(0, sickLeaves - 1);
    else if (s === 'special' || s === 'spl') specialLeaves = Math.max(0, specialLeaves - 1);
    else if (s === 'on_duty' || s === 'od') onDutyLeaves = Math.max(0, onDutyLeaves - 1);
    else if (s === 'half_day' || s === 'hd') halfDays = Math.max(0, halfDays - 1);
    else if (s === 'late' || s === 'l') lateDays = Math.max(0, lateDays - 1);

    const totalPresent = presentDays + casualLeaves + sickLeaves + specialLeaves + onDutyLeaves;
    const attendancePercentage = workingDays > 0 ? parseFloat(((totalPresent / workingDays) * 100).toFixed(1)) : 0;

    doc.workingDays = workingDays;
    doc.presentDays = presentDays;
    doc.absentDays = absentDays;
    doc.casualLeaves = casualLeaves;
    doc.sickLeaves = sickLeaves;
    doc.specialLeaves = specialLeaves;
    doc.onDutyLeaves = onDutyLeaves;
    doc.halfDays = halfDays;
    doc.lateDays = lateDays;
    doc.totalPresent = totalPresent;
    doc.attendancePercentage = attendancePercentage;
    doc.updatedAt = new Date().toISOString();

    modifiedStatsMap.set(userId, doc);
  });

  const statsToUpsert = Array.from(modifiedStatsMap.values());
  if (statsToUpsert.length > 0) {
    await bulkUpsertDocuments(tablesDB, DB_ID, MONTHLY_STATS_COL, statsToUpsert, logger);
  }
  logger(`[decrementMonthlyStats] Done in ${Date.now() - t0}ms`);
};

export const updateIncrementalMonthlyAttendanceStats = async (
  tablesDB,
  DB_ID_OR_DATABASES,
  DB_ID_OR_BATCH,
  batchIdOrDate,
  dateOrRecords,
  recordsToUpdateOrExistingMap = [],
  existingRecordsMapOrLog = new Map(),
  maybeLog = console.log
) => {
  let DB_ID, batchId, date, recordsToUpdate, existingRecordsMap, log;
  if (Array.isArray(recordsToUpdateOrExistingMap)) {
    // (tablesDB, databases, DB_ID, batchId, date, recordsToUpdate, existingRecordsMap, log)
    DB_ID = DB_ID_OR_BATCH;
    batchId = batchIdOrDate;
    date = dateOrRecords;
    recordsToUpdate = recordsToUpdateOrExistingMap;
    existingRecordsMap = existingRecordsMapOrLog instanceof Map ? existingRecordsMapOrLog : new Map();
    log = maybeLog;
  } else {
    // (tablesDB, DB_ID, batchId, date, recordsToUpdate, existingRecordsMap, log)
    DB_ID = DB_ID_OR_DATABASES;
    batchId = DB_ID_OR_BATCH;
    date = batchIdOrDate;
    recordsToUpdate = dateOrRecords;
    existingRecordsMap = recordsToUpdateOrExistingMap instanceof Map ? recordsToUpdateOrExistingMap : new Map();
    log = existingRecordsMapOrLog;
  }

  if (!recordsToUpdate || recordsToUpdate.length === 0) return;
  const logger = typeof log === 'function' ? log : console.log;
  const t0 = Date.now();

  const MONTHLY_STATS_COL = 'monthlyAttendanceStats';
  const yearMonth = String(date).substring(0, 7);

  // Fetch existing monthly stats documents for this batch and month in a single query
  const existingStatsRes = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: MONTHLY_STATS_COL,
    queries: [
      Query.equal('batchId', batchId),
      Query.equal('yearMonth', yearMonth),
      Query.limit(500),
    ]
  }).catch(() => ({ rows: [], documents: [] }));

  const existingRows = existingStatsRes.rows || existingStatsRes.documents || [];
  const existingStatsMap = new Map(
    existingRows.map((doc) => [doc.userId, { ...doc }])
  );

  const modifiedStatsMap = new Map();

  const applyStatusChange = (statDoc, statusStr, delta) => {
    const s = String(statusStr || '').toLowerCase();
    if (s === 'present' || s === 'p') statDoc.presentDays = Math.max(0, (statDoc.presentDays || 0) + delta);
    else if (s === 'absent' || s === 'a') statDoc.absentDays = Math.max(0, (statDoc.absentDays || 0) + delta);
    else if (s === 'casual' || s === 'cl') statDoc.casualLeaves = Math.max(0, (statDoc.casualLeaves || 0) + delta);
    else if (s === 'sick' || s === 'sl') statDoc.sickLeaves = Math.max(0, (statDoc.sickLeaves || 0) + delta);
    else if (s === 'special' || s === 'spl') statDoc.specialLeaves = Math.max(0, (statDoc.specialLeaves || 0) + delta);
    else if (s === 'on_duty' || s === 'od') statDoc.onDutyLeaves = Math.max(0, (statDoc.onDutyLeaves || 0) + delta);
    else if (s === 'half_day' || s === 'hd') statDoc.halfDays = Math.max(0, (statDoc.halfDays || 0) + delta);
    else if (s === 'late' || s === 'l') statDoc.lateDays = Math.max(0, (statDoc.lateDays || 0) + delta);
  };

  recordsToUpdate.forEach((r) => {
    const userId = r.userId;
    if (!userId) return;

    const newStatus = String(r.status || r.attendanceStatus || '').toLowerCase();
    const existingRec = existingRecordsMap.get(userId);
    const prevStatus = existingRec ? String(existingRec.status || existingRec.attendanceStatus || '').toLowerCase() : null;

    if (prevStatus && prevStatus === newStatus) {
      return;
    }

    const statDoc = modifiedStatsMap.get(userId) || existingStatsMap.get(userId) || {
      $id: generateShortStatId(userId, batchId, yearMonth),
      userId,
      batchId,
      yearMonth,
      workingDays: 0,
      presentDays: 0,
      absentDays: 0,
      casualLeaves: 0,
      sickLeaves: 0,
      specialLeaves: 0,
      onDutyLeaves: 0,
      halfDays: 0,
      lateDays: 0,
      totalPresent: 0,
      attendancePercentage: 0,
    };

    if (prevStatus) {
      applyStatusChange(statDoc, prevStatus, -1);
    } else {
      statDoc.workingDays = (statDoc.workingDays || 0) + 1;
    }

    applyStatusChange(statDoc, newStatus, 1);

    const totalPresent = (statDoc.presentDays || 0) + (statDoc.casualLeaves || 0) + (statDoc.sickLeaves || 0) + (statDoc.specialLeaves || 0) + (statDoc.onDutyLeaves || 0);
    const workingDays = statDoc.workingDays || 0;
    const attendancePercentage = workingDays > 0 ? parseFloat(((totalPresent / workingDays) * 100).toFixed(1)) : 0;

    statDoc.totalPresent = totalPresent;
    statDoc.attendancePercentage = attendancePercentage;
    statDoc.updatedAt = new Date().toISOString();

    modifiedStatsMap.set(userId, statDoc);
  });

  const statsToUpsert = Array.from(modifiedStatsMap.values());
  if (statsToUpsert.length > 0) {
    await bulkUpsertDocuments(tablesDB, DB_ID, MONTHLY_STATS_COL, statsToUpsert, logger);
  }
  logger(`[updateIncrementalMonthlyAttendanceStats] Done in ${Date.now() - t0}ms`);
};
