import { Query } from "appwrite";
import conf from "../config/config";
import { appwriteClientService as appwriteService } from "../services/appwriteClient";
import { newAttendanceService } from "./newAttendanceService";
import mockTestService from "../services/mocktest.service";
import holidayService from "./holidaysService";
import { BatchService } from "./batchService";
import { format, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";

const isSecondOrFourthSaturday = (d) => {
  if (d.getDay() !== 6) return false;
  const wk = Math.ceil(d.getDate() / 7);
  return wk === 2 || wk === 4;
};

const countWorkingDays = (start, end, holidaySet) => {
  if (!start || !end || start > end) return 0;
  return eachDayOfInterval({ start, end }).filter((d) => {
    const key = format(d, "yyyy-MM-dd");
    if (holidaySet.has(key)) return false;
    if (d.getDay() === 0) return false; // Sunday
    if (isSecondOrFourthSaturday(d)) return false;
    return true;
  }).length;
};

export class UserStatsService {
  constructor() {
    this.client = appwriteService.getClient();
    this.database = appwriteService.getTablesDB();
  }

  async getAllStats(queries = [Query.orderDesc("$updatedAt")]) {
    try {
      return await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.userStatsCollectionId,
        queries: queries
      });
    } catch (error) {
      console.error("Appwrite error: fetching all user stats:", error);
      throw new Error(`Error: ${error.message.split(".")[0]}`);
    }
  }

  async getUserStats(userId) {
    try {
      const userStats = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.userStatsCollectionId,
        queries: [Query.equal("userId", userId)]
      });

      if (userStats.total === 0) {
        return false;
      }

      return userStats.rows[0]; // Assuming user stats are unique per userId
    } catch (error) {
      console.log("Appwrite error: get user stats:", error);
      return false;
    }
  }

  /**
   * Creates or updates stats for a user in a given batch.
   */
  async upsertUserStats(userId, batchId, data) {
    if (!userId || !batchId) return false;
    try {
      const response = await this.database.listRows({
        databaseId: conf.databaseId,
        tableId: conf.userStatsCollectionId,
        queries: [Query.equal("userId", userId), Query.equal("batchId", batchId), Query.limit(1)]
      });

      const payload = {
        userId,
        batchId,
        totalWorkingDays: data.totalWorkingDays ?? 0,
        presentDays: data.presentDays ?? 0,
        monthlyAttendance: typeof data.monthlyAttendance === 'string'
          ? data.monthlyAttendance
          : JSON.stringify(data.monthlyAttendance ?? {}),
        testsSubmitted: data.testsSubmitted ?? 0,
        cumulativeScore: parseFloat(Number(data.cumulativeScore ?? 0).toFixed(2)),
        latestScore: parseFloat(Number(data.latestScore ?? 0).toFixed(2))
      };

      if (response.total > 0) {
        const doc = response.rows[0];
        return await this.database.updateRow({
          databaseId: conf.databaseId,
          tableId: conf.userStatsCollectionId,
          rowId: doc.$id,
          data: payload
        });
      } else {
        return await this.database.createRow({
          databaseId: conf.databaseId,
          tableId: conf.userStatsCollectionId,
          rowId: "unique()",
          data: payload
        });
      }
    } catch (error) {
      console.error("Appwrite error upserting user stats:", error);
      return false;
    }
  }

  /**
   * Recalculates stats for specific student IDs in a batch from raw DB data and saves to userBatchStats.
   */
  async recalculateStudentsStats(studentIds, batchId) {
    if (!studentIds || studentIds.length === 0 || !batchId) return false;
    try {
      const batchService = new BatchService();
      const batchData = await batchService.getBatch(batchId);

      const [overallCounts, testsDocsRes, staleAttendanceDocs, holidayDocs] = await Promise.all([
        newAttendanceService.getBatchPresentCountsForStudents(studentIds, batchId),
        mockTestService.listQuestions([
          Query.equal("userId", studentIds),
          Query.equal("submitted", true),
          Query.select(["userId", "score", "quesCount"]),
        ]).catch((err) => {
          console.error("Error fetching raw tests for recalculation:", err);
          return [];
        }),
        this.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.newAttendanceCollectionId,
          queries: [
            Query.equal("batchId", batchId),
            Query.equal("userId", studentIds),
            Query.equal("status", "present"),
            Query.limit(500),
          ],
        }).then((res) => res.rows || []).catch(() => []),
        holidayService.getBatchHolidays(batchId, [Query.select(["date"])]).catch(() => []),
      ]);

      const hSet = new Set();
      (holidayDocs || []).forEach((h) => {
        if (h?.date) hSet.add(h.date.substring(0, 10));
      });

      // Group tests by student
      const testsByUser = {};
      (testsDocsRes || []).forEach((t) => {
        const uid = t.userId;
        if (!testsByUser[uid]) testsByUser[uid] = [];
        testsByUser[uid].push(t);
      });

      // Group monthly attendance by student
      const monthlyMap = {};
      studentIds.forEach((sid) => {
        monthlyMap[sid] = {};
      });
      staleAttendanceDocs.forEach((doc) => {
        if (doc.userId && doc.date) {
          const m = doc.date.substring(0, 7); // "yyyy-MM"
          if (!monthlyMap[doc.userId]) monthlyMap[doc.userId] = {};
          monthlyMap[doc.userId][m] = (monthlyMap[doc.userId][m] || 0) + 1;
        }
      });

      // Calculate working days
      const batchStart = batchData?.start_date ? startOfDay(new Date(batchData.start_date)) : null;
      const today = endOfDay(new Date());
      const batchEnd = batchData?.end_date ? endOfDay(new Date(batchData.end_date)) : today;
      const effectiveEnd = new Date(Math.min(batchEnd.getTime(), today.getTime()));
      
      const totalWorkingDays = batchStart ? countWorkingDays(batchStart, effectiveEnd, hSet) : 0;

      // Update all students in database
      await Promise.all(
        studentIds.map(async (sid) => {
          const studentTests = testsByUser[sid] || [];
          const testsSubmitted = studentTests.length;

          let cumulativeScore = 0;
          let latestScore = 0;
          studentTests.forEach((t) => {
            const score = t.score || 0;
            const qCount = t.quesCount || 0;
            const percentageScore = qCount > 0 ? (score / qCount) * 100 : 0;
            cumulativeScore += percentageScore;
            latestScore = percentageScore;
          });

          const presentDays = (overallCounts[sid] || {}).presentDays || 0;

          const payload = {
            totalWorkingDays,
            presentDays,
            monthlyAttendance: monthlyMap[sid] || {},
            testsSubmitted,
            cumulativeScore,
            latestScore,
          };

          return this.upsertUserStats(sid, batchId, payload);
        })
      );

      return true;
    } catch (error) {
      console.error("[UserStatsService] Recalculate stats failed:", error);
      return false;
    }
  }
}

const userStatsService = new UserStatsService();

export default userStatsService;
