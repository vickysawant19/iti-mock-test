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

export const bulkUpsertDocuments = async (tablesDB, databases, DB_ID, collectionId, documents, log = console.log) => {
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

  // 1. Try native bulk databases.upsertDocuments first (single request for up to 100 docs)
  if (databases && typeof databases.upsertDocuments === 'function') {
    try {
      const savedDocs = [];
      for (let i = 0; i < sanitizedDocs.length; i += 100) {
        const chunk = sanitizedDocs.slice(i, i + 100);
        const res = await databases.upsertDocuments({
          databaseId: DB_ID,
          collectionId,
          documents: chunk,
        });
        if (res && res.documents) {
          savedDocs.push(...res.documents);
        } else if (Array.isArray(res)) {
          savedDocs.push(...res);
        } else {
          savedDocs.push(...chunk);
        }
      }
      logger(`[bulkUpsert:${collectionId}] Native databases.upsertDocuments saved ${savedDocs.length} items in ${Date.now() - t0}ms`);
      return savedDocs;
    } catch (bulkErr) {
      logger(`[bulkUpsert:${collectionId}] databases.upsertDocuments notice: ${bulkErr.message}, running optimized parallel writes...`);
    }
  }

  // 2. High-speed parallel fallback: determine existing docs with 1 list query
  const targetIds = sanitizedDocs.map((d) => d.$id).filter(Boolean);
  const existingIds = new Set();

  if (targetIds.length > 0 && databases) {
    try {
      for (let i = 0; i < targetIds.length; i += 100) {
        const chunkIds = targetIds.slice(i, i + 100);
        const existingDocs = await databases.listDocuments(DB_ID, collectionId, [
          Query.equal('$id', chunkIds),
          Query.limit(100),
        ]);
        (existingDocs.documents || []).forEach((doc) => existingIds.add(doc.$id));
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
            return await databases.createDocument(DB_ID, collectionId, targetId, data, permissions);
          } else {
            return await databases.updateDocument(DB_ID, collectionId, targetId, data, permissions);
          }
        } catch (err) {
          logger(`[bulkUpsert:${collectionId}] Item write failed (${err.message}), attempting recovery...`);
          try {
            if (isCreate) {
              return await databases.updateDocument(DB_ID, collectionId, targetId, data, permissions);
            } else {
              return await databases.createDocument(DB_ID, collectionId, targetId, data, permissions);
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

export const deleteTableRows = async (tablesDB, databases, DB_ID, collectionId, queries, rowIds = [], log = console.log) => {
  const logger = typeof log === 'function' ? log : console.log;
  const t0 = Date.now();

  // 1. Try native atomic databases.deleteDocuments if queries provided
  if (databases && typeof databases.deleteDocuments === 'function' && Array.isArray(queries) && queries.length > 0) {
    try {
      await databases.deleteDocuments({
        databaseId: DB_ID,
        collectionId,
        queries,
      });
      logger(`[deleteTableRows:${collectionId}] Native databases.deleteDocuments finished in ${Date.now() - t0}ms`);
      return;
    } catch (bulkErr) {
      logger(`[deleteTableRows:${collectionId}] databases.deleteDocuments notice: ${bulkErr.message}, deleting by IDs...`);
    }
  }

  // 2. Parallel ID deletion fallback
  let targetIds = Array.isArray(rowIds) ? [...rowIds] : [];
  if (targetIds.length === 0 && Array.isArray(queries) && queries.length > 0 && databases) {
    try {
      const res = await databases.listDocuments(DB_ID, collectionId, [...queries, Query.limit(5000)]);
      targetIds = (res.documents || []).map((d) => d.$id);
    } catch (e) {
      logger(`[deleteTableRows:${collectionId}] Query error: ${e.message}`);
    }
  }

  if (targetIds.length === 0) return;

  logger(`[deleteTableRows:${collectionId}] Deleting ${targetIds.length} docs in parallel...`);
  const CONCURRENCY = 25;
  for (let i = 0; i < targetIds.length; i += CONCURRENCY) {
    const chunk = targetIds.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map((id) => databases.deleteDocument(DB_ID, collectionId, id).catch(() => null)));
  }

  logger(`[deleteTableRows:${collectionId}] Deleted ${targetIds.length} rows in ${Date.now() - t0}ms`);
};

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
  ).catch(() => ({ total: 0, documents: [] }));

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
  tablesDB,
  databases,
  batchId,
  date,
  statsDataList,
  log = console.log
) => {
  if (!statsDataList || statsDataList.length === 0) return;
  const logger = typeof log === 'function' ? log : console.log;
  const t0 = Date.now();

  const DB_ID = process.env.APPWRITE_DATABASE_ID || 'itimocktest';
  const STATS_COLLECTION_ID = 'userBatchStats';
  const monthKey = date.substring(0, 7); // YYYY-MM

  try {
    // Fetch all existing stats for this batch in 1 bulk query
    const existingDocsRes = await databases.listDocuments(
      DB_ID,
      STATS_COLLECTION_ID,
      [Query.equal('batchId', batchId), Query.limit(500)]
    ).catch(() => ({ documents: [] }));

    const existingStatsMap = new Map(
      (existingDocsRes.documents || []).map((doc) => [doc.userId, doc])
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

        return databases.updateDocument(DB_ID, STATS_COLLECTION_ID, existing.$id, {
          presentDays: Math.max(0, (existing.presentDays || 0) + isPresent),
          monthlyAttendance: JSON.stringify(monthlyData),
        }).catch((err) => {
          logger(`[userBatchStats] Update error on ${existing.$id}: ${err.message}`);
          return null;
        });
      } else {
        let monthlyData = {};
        monthlyData[monthKey] = isPresent;

        return databases.createDocument(DB_ID, STATS_COLLECTION_ID, ID.unique(), {
          userId: record.userId,
          batchId: batchId,
          totalWorkingDays: 0,
          presentDays: isPresent,
          monthlyAttendance: JSON.stringify(monthlyData),
          testsSubmitted: 0,
          cumulativeScore: 0,
          latestScore: 0,
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
  databases,
  batchId,
  yearMonth,
  affectedUserIds = null,
  latestRecords = null,
  log = console.log
) => {
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
    const bsRes = await databases.listDocuments(
      DB_ID,
      BATCH_STUDENTS_COL,
      [Query.equal('batchId', batchId), Query.limit(500)]
    ).catch(() => ({ documents: [] }));

    const enrollmentMap = new Map();
    const batchStudentUserIds = new Set();
    (bsRes.documents || []).forEach((row) => {
      const studentId = row.studentId || row.userId || row.student_id;
      const ed = getEnrollmentDateStr(row.enrollmentDate || row.joinedAt);
      if (studentId) {
        batchStudentUserIds.add(studentId);
        if (ed) enrollmentMap.set(studentId, ed);
      }
    });

    // 1b. Fetch active batch holidays for yearMonth from holidayDays collection
    const HOLIDAY_DAYS_COL = process.env.HOLIDAY_DAYS_COLLECTION_ID || 'holidayDays';
    const holidaysRes = await databases.listDocuments(
      DB_ID,
      HOLIDAY_DAYS_COL,
      [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(100),
      ]
    ).catch(() => ({ documents: [] }));

    const activeHolidayDates = new Set(
      (holidaysRes.documents || []).map((h) => String(h.date).substring(0, 10))
    );

    // 2. Fetch daily attendance records for this batch and month
    const attendanceRes = await databases.listDocuments(
      DB_ID,
      NEW_ATTENDANCE_COL,
      [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(5000),
      ]
    ).catch(() => ({ documents: [] }));

    // 3. Group by userId
    const userRecordsMap = new Map();

    // Ensure all batch students have an entry in userRecordsMap
    batchStudentUserIds.forEach((uid) => {
      if (!userFilterSet || userFilterSet.has(uid)) {
        userRecordsMap.set(uid, []);
      }
    });

    (attendanceRes.documents || []).forEach((doc) => {
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
    await bulkUpsertDocuments(tablesDB, databases, DB_ID, MONTHLY_STATS_COL, statsObjects, logger);
    logger(`[bulkUpdateMonthlyAttendanceStats] Finished in ${Date.now() - t0}ms`);
  } catch (err) {
    logger(`[bulkUpdateMonthlyAttendanceStats-ERROR] ${err.message}`);
  }
};

export const updateMonthlyAttendanceStatsHelper = async (
  tablesDB,
  databases,
  userId,
  batchId,
  date,
  log = console.log
) => {
  if (!userId || !batchId || !date) return;
  const yearMonth = String(date).substring(0, 7);
  await bulkUpdateMonthlyAttendanceStats(tablesDB, databases, batchId, yearMonth, [userId], null, log);
};

export const verifyBatchMonthlyStatsHelper = async (tablesDB, databases, batchId, yearMonth) => {
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
    const bsRes = await databases.listDocuments(
      DB_ID,
      BATCH_STUDENTS_COL,
      [Query.equal('batchId', batchId), Query.limit(500)]
    ).catch(() => ({ documents: [] }));

    const studentMap = new Map();
    (bsRes.documents || []).forEach((row) => {
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
    const storedStatsRes = await databases.listDocuments(
      DB_ID,
      MONTHLY_STATS_COL,
      [
        Query.equal('batchId', batchId),
        Query.equal('yearMonth', yearMonth),
        Query.limit(500),
      ]
    ).catch(() => ({ documents: [] }));

    const storedStatsMap = new Map();
    (storedStatsRes.documents || []).forEach((doc) => {
      storedStatsMap.set(doc.userId, doc);
    });

    // 3. Fetch active holidays for yearMonth
    const holidaysRes = await databases.listDocuments(
      DB_ID,
      HOLIDAY_DAYS_COL,
      [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(100),
      ]
    ).catch(() => ({ documents: [] }));

    const activeHolidayDates = new Set(
      (holidaysRes.documents || []).map((h) => String(h.date).substring(0, 10))
    );

    // 4. Fetch daily attendance records
    const attendanceRes = await databases.listDocuments(
      DB_ID,
      NEW_ATTENDANCE_COL,
      [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(5000),
      ]
    ).catch(() => ({ documents: [] }));

    const userRecordsMap = new Map();
    (attendanceRes.documents || []).forEach((doc) => {
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

export const decrementMonthlyStatsForAttendanceRecords = async (tablesDB, databases, DB_ID, batchId, yearMonth, records, log = console.log) => {
  if (!records || records.length === 0) return;
  const logger = typeof log === 'function' ? log : console.log;
  const t0 = Date.now();
  const MONTHLY_STATS_COL = 'monthlyAttendanceStats';

  // Fetch existing monthly stats for this batch and month in 1 single bulk query
  const existingStatsRes = await databases.listDocuments(
    DB_ID,
    MONTHLY_STATS_COL,
    [
      Query.equal('batchId', batchId),
      Query.equal('yearMonth', yearMonth),
      Query.limit(500),
    ]
  ).catch(() => ({ documents: [] }));

  const existingStatsMap = new Map(
    (existingStatsRes.documents || []).map((doc) => [doc.userId, { ...doc }])
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
    await bulkUpsertDocuments(tablesDB, databases, DB_ID, MONTHLY_STATS_COL, statsToUpsert, logger);
  }
  logger(`[decrementMonthlyStats] Done in ${Date.now() - t0}ms`);
};

export const updateIncrementalMonthlyAttendanceStats = async (
  tablesDB,
  databases,
  DB_ID,
  batchId,
  date,
  recordsToUpdate,
  existingRecordsMap = new Map(),
  log = console.log
) => {
  if (!recordsToUpdate || recordsToUpdate.length === 0) return;
  const logger = typeof log === 'function' ? log : console.log;
  const t0 = Date.now();

  const MONTHLY_STATS_COL = 'monthlyAttendanceStats';
  const yearMonth = String(date).substring(0, 7);

  // Fetch existing monthly stats documents for this batch and month in a single query
  const existingStatsRes = await databases.listDocuments(
    DB_ID,
    MONTHLY_STATS_COL,
    [
      Query.equal('batchId', batchId),
      Query.equal('yearMonth', yearMonth),
      Query.limit(500),
    ]
  ).catch(() => ({ documents: [] }));

  const existingStatsMap = new Map(
    (existingStatsRes.documents || []).map((doc) => [doc.userId, { ...doc }])
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
    await bulkUpsertDocuments(tablesDB, databases, DB_ID, MONTHLY_STATS_COL, statsToUpsert, logger);
  }
  logger(`[updateIncrementalMonthlyAttendanceStats] Done in ${Date.now() - t0}ms`);
};
