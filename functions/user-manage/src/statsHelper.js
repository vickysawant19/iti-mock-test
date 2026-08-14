import { ID, Query } from 'node-appwrite';

export const bulkUpsertDocuments = async (databases, DB_ID, collectionId, documents) => {
  if (!documents || documents.length === 0) return [];
  const results = [];
  const CHUNK_SIZE = 10;
  for (let i = 0; i < documents.length; i += CHUNK_SIZE) {
    const chunk = documents.slice(i, i + CHUNK_SIZE);
    const promises = chunk.map(async (doc) => {
      const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...data } = doc;
      const targetId = $id || ID.unique();
      try {
        return await databases.updateDocument(DB_ID, collectionId, targetId, data);
      } catch (err) {
        try {
          return await databases.createDocument(DB_ID, collectionId, targetId, data);
        } catch (createErr) {
          return await databases.updateDocument(DB_ID, collectionId, targetId, data).catch(() => null);
        }
      }
    });
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults.filter(Boolean));
  }
  return results;
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
        $id: `${record.userId}_${batchId}`,
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

  const allStatsToSave = [...statsToCreate, ...statsToUpdate];
  if (allStatsToSave.length > 0) {
    await bulkUpsertDocuments(databases, DB_ID, STATS_COLLECTION_ID, allStatsToSave);
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
      queries: [Query.equal('batchId', batchId), Query.limit(500)],
    }).catch(() => ({ rows: [] }));

    const enrollmentMap = new Map();
    const batchStudentUserIds = new Set();
    (bsRes.rows || []).forEach((row) => {
      const studentId = row.studentId || row.userId || row.student_id;
      const ed = getEnrollmentDateStr(row.enrollmentDate || row.joinedAt);
      if (studentId) {
        batchStudentUserIds.add(studentId);
        if (ed) enrollmentMap.set(studentId, ed);
      }
    });

    logger(`[bulkUpdateMonthlyAttendanceStats] Batch students count: ${batchStudentUserIds.size}`);

    // 1b. Fetch active batch holidays for yearMonth from holidayDays collection
    const HOLIDAY_DAYS_COL = process.env.HOLIDAY_DAYS_COLLECTION_ID || 'holidayDays';
    const holidaysRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: HOLIDAY_DAYS_COL,
      queries: [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(100),
      ],
    }).catch(() => ({ rows: [] }));

    const activeHolidayDates = new Set(
      (holidaysRes.rows || []).map((h) => String(h.date).substring(0, 10))
    );
    logger(`[bulkUpdateMonthlyAttendanceStats] Active holidays count: ${activeHolidayDates.size}`);

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

    logger(`[bulkUpdateMonthlyAttendanceStats] Fetched daily attendance rows count: ${attendanceRes.rows?.length || 0}`);

    // 3. Group by userId
    const userRecordsMap = new Map();

    // Ensure all batch students have an entry in userRecordsMap
    batchStudentUserIds.forEach((uid) => {
      if (!userFilterSet || userFilterSet.has(uid)) {
        userRecordsMap.set(uid, []);
      }
    });

    (attendanceRes.rows || []).forEach((doc) => {
      if (!doc.userId) return;
      if (userFilterSet && !userFilterSet.has(doc.userId)) return;

      const enrollStr = enrollmentMap.get(doc.userId);
      if (enrollStr && doc.date < enrollStr) {
        logger(`[bulkUpdateMonthlyAttendanceStats-SKIP] userId=${doc.userId}, doc.date=${doc.date} < enrollStr=${enrollStr}`);
        return;
      }

      if (!userRecordsMap.has(doc.userId)) {
        userRecordsMap.set(doc.userId, []);
      }
      userRecordsMap.get(doc.userId).push({ ...doc });
    });

    // Merge latest in-memory records (in case listRows didn't return newly inserted/upserted rows yet)
    if (Array.isArray(latestRecords) && latestRecords.length > 0) {
      logger(`[bulkUpdateMonthlyAttendanceStats] Merging ${latestRecords.length} latest in-memory records...`);
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

      logger(`[bulkUpdateMonthlyAttendanceStats-RESULT] userId=${userId}, workingDays=${workingDays}, presentDays=${presentDays}, rowsCount=${rows.length}`);

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

    if (statsObjects.length === 0) {
      logger(`[bulkUpdateMonthlyAttendanceStats] END: No statsObjects built.`);
      return;
    }

    logger(`[bulkUpdateMonthlyAttendanceStats] Writing ${statsObjects.length} statsObjects via bulkUpsertDocuments...`);

    // 5. Bulk Upsert
    const res = await bulkUpsertDocuments(databases, DB_ID, MONTHLY_STATS_COL, statsObjects);
    logger(`[bulkUpdateMonthlyAttendanceStats] bulkUpsertDocuments finished successfully. Response count: ${res.length}`);
  } catch (err) {
    logger(`[bulkUpdateMonthlyAttendanceStats-ERROR] ${err.message}`);
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
    const bsRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: BATCH_STUDENTS_COL,
      queries: [Query.equal('batchId', batchId), Query.limit(500)],
    }).catch(() => ({ rows: [] }));

    const studentMap = new Map();
    (bsRes.rows || []).forEach((row) => {
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
      ],
    }).catch(() => ({ rows: [] }));

    const storedStatsMap = new Map();
    (storedStatsRes.rows || []).forEach((doc) => {
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
      ],
    }).catch(() => ({ rows: [] }));

    const activeHolidayDates = new Set(
      (holidaysRes.rows || []).map((h) => String(h.date).substring(0, 10))
    );

    // 4. Fetch daily attendance records
    const attendanceRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: NEW_ATTENDANCE_COL,
      queries: [
        Query.equal('batchId', batchId),
        Query.startsWith('date', yearMonth),
        Query.limit(5000),
      ],
    }).catch(() => ({ rows: [] }));

    const userRecordsMap = new Map();
    (attendanceRes.rows || []).forEach((doc) => {
      if (!doc.userId) return;
      if (!userRecordsMap.has(doc.userId)) {
        userRecordsMap.set(doc.userId, []);
      }
      userRecordsMap.get(doc.userId).push(doc);
    });

    const mismatches = [];

    // 5. Compare per student
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
      const storedWorking = storedDoc?.workingDays || 0;
      const storedPresent = storedDoc?.presentDays || 0;
      const storedPercentage = storedDoc?.attendancePercentage || 0;

      const isMismatch =
        !storedDoc ||
        storedWorking !== workingDays ||
        storedPresent !== presentDays ||
        storedDoc.absentDays !== absentDays ||
        storedDoc.totalPresent !== totalPresent ||
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
