import { fetchHolidaysForDate } from '../utils/holidays.js';
import {
  fetchActiveBatches,
  extractUserIdsFromBatchDoc,
  fetchExistingAttendanceForBatchDate,
  bulkCreateAttendance,
  getIndianTime,
} from '../utils/index.js';

export default async function autoMarkAbsentees(
  payload,
  { database, log, error, today }
) {
  const limitBatches = Number(payload.limitBatches || 0);
  const [batches, holidaysByBatch] = await Promise.all([
    fetchActiveBatches(database),
    fetchHolidaysForDate(database, today),
  ]);

  const batchesToProcess =
    limitBatches > 0 ? batches.slice(0, limitBatches) : batches;

  log(`Found ${batchesToProcess.length} active batches to process.`);

  let totalStudentsChecked = 0;
  let totalMarkedAbsent = 0;
  const summary = [];

  for (const batch of batchesToProcess) {
    const batchId = batch.$id;
    const batchName = batch.BatchName;
    if (holidaysByBatch.has(batchId)) {
      log(`Skipping batch ${batchId} due to a holiday.`);
      summary.push({
        batchName,
        batchId,
        status: 'skipped_holiday',
        holiday: holidaysByBatch.get(batchId),
      });
      continue;
    }

    const studentUserIds = extractUserIdsFromBatchDoc(batch);
    if (!studentUserIds.length) {
      log(`Batch ${batchId} has 0 student userIds, skipping.`);
      continue;
    }

    totalStudentsChecked += studentUserIds.length;
    const existingMap = await fetchExistingAttendanceForBatchDate(
      database,
      batchId,
      today
    );

    const toCreate = [];
    for (const userId of studentUserIds) {
      if (!existingMap.has(userId)) {
        toCreate.push({
          userId,
          batchId,
          tradeId: batch.tradeId,
          date: today,
          status: 'absent',
          markedBy: 'system',
          remarks: 'Auto-marked absent',
          markedAt: getIndianTime(),
        });
      }
    }

    if (toCreate.length > 0) {
      const createdInfo = await bulkCreateAttendance(
        toCreate,
        database,
        log,
        error
      );
      totalMarkedAbsent += createdInfo.created || 0;
      summary.push({
        batchName,
        batchId,
        students: studentUserIds.length,
        toMark: toCreate.length,
        created: createdInfo.created || 0,
      });
    } else {
      summary.push({
        batchName,
        batchId,
        students: studentUserIds.length,
        toMark: 0,
        created: 0,
      });
    }
  }

  return {
    totalBatches: batchesToProcess.length,
    totalStudentsChecked,
    totalMarkedAbsent,
    perBatch: summary,
  };
}
