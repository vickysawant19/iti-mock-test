import { useState, useEffect, useMemo, useCallback } from "react";
import { Query } from "appwrite";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay, subMonths } from "date-fns";
import batchStudentService from "@/appwrite/batchStudentService";
import userProfileService from "@/appwrite/userProfileService";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import mockTestService from "@/services/mocktest.service";
import holidayService from "@/appwrite/holidaysService";
import conf from "@/config/config";

/**
 * Computes per-student stats for a given batch:
 *  - attendance % (overall + selected month)
 *  - mock test count + avg score
 *  - status badge
 *
 * All data is fetched once, then aggregated via useMemo.
 */

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

export const useBatchStats = (batchId, batchData, selectedMonth) => {
  const [students, setStudents] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [studentStats, setStudentStats] = useState({}); // studentId -> { overall, monthly }
  const [rawTests, setRawTests] = useState([]);
  const [rawTrend, setRawTrend] = useState({}); // monthKey -> { count, label }
  const [holidays, setHolidays] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all raw data in parallel
  const fetchData = useCallback(async () => {
    if (!batchId) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get batch students
      const studentDocs = await batchStudentService.getBatchStudents(batchId, [
        Query.select(["studentId", "joinedAt", "rollNumber", "registerId"]),
      ]);
      setStudents(studentDocs);
      const studentIds = studentDocs.map((s) => s.studentId);

      if (studentIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Calculate month range if selectedMonth is set
      let monthStartStr = null;
      let monthEndStr = null;
      if (selectedMonth) {
        const d = new Date(selectedMonth + "-01");
        monthStartStr = format(startOfMonth(d), "yyyy-MM-dd");
        monthEndStr = format(endOfMonth(d), "yyyy-MM-dd");
      }

      // 2. Fetch profiles, holidays, and raw tests in parallel
      const [profileDocs, holidayDocs, testsDocsRes] =
        await Promise.all([
          // Profiles
          userProfileService.getBatchUserProfile([
            Query.equal("userId", studentIds),
            Query.limit(100),
            Query.select(["userId", "userName", "profileImage"]),
          ]),
          // Holidays
          holidayService.getBatchHolidays(batchId, [Query.select(["date"])]),
          // Raw Mock Tests
          mockTestService.listQuestions([
            Query.equal("userId", studentIds),
            Query.equal("submitted", true),
            Query.select(["userId", "score", "quesCount"])
          ]).catch(err => {
            console.error("Error fetching raw tests:", err);
            return [];
          }),
        ]);

      // Build profile map
      const profileMap = {};
      profileDocs.forEach((p) => {
        profileMap[p.userId] = p;
      });
      setProfiles(profileMap);

      // Store raw tests
      setRawTests(testsDocsRes || []);

      // Holidays set
      const hSet = new Set();
      (holidayDocs || []).forEach((h) => {
        if (h?.date) hSet.add(h.date.substring(0, 10));
      });
      setHolidays(hSet);

      // 3. Fetch present-day counts using N concurrent limit-1 count queries
      //    (each response is ~1.5 kB). Absent is derived from calendar working days,
      //    so we never need a second round of N queries for absent status.
      const statsMap = {};
      const trendMap = {};

      // Compute monthly working days for percentage calculation in the hook
      let monthlyWorkingDays = 0;
      if (monthStartStr && monthEndStr) {
        const mStart = startOfDay(new Date(monthStartStr));
        const mEnd = endOfDay(new Date(monthEndStr));
        monthlyWorkingDays = countWorkingDays(mStart, mEnd, hSet);
      }

      const now = new Date();
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(now, i);
        return {
          monthKey: format(d, "yyyy-MM"),
          label: format(d, "MMM yy"),
          start: format(startOfMonth(d), "yyyy-MM-dd"),
          end: format(endOfMonth(d), "yyyy-MM-dd"),
        };
      }).reverse();

      // Fire all requests in parallel:
      //   - N count queries for overall present (one per student)
      //   - N count queries for monthly present (only if month selected)
      //   - 6 count queries for trend
      const [overallCounts, monthlyCounts, ...trendResults] = await Promise.all([
        newAttendanceService.getBatchPresentCountsForStudents(studentIds, batchId),
        monthStartStr && monthEndStr
          ? newAttendanceService.getBatchPresentCountsForStudents(studentIds, batchId, monthStartStr, monthEndStr)
          : Promise.resolve({}),
        ...last6Months.map((m) =>
          newAttendanceService.database.listRows({
            databaseId: conf.databaseId,
            tableId: conf.newAttendanceCollectionId,
            queries: [
              Query.equal("batchId", batchId),
              Query.equal("status", "present"),
              Query.greaterThanEqual("date", m.start),
              Query.lessThanEqual("date", m.end),
              Query.limit(1),
            ]
          })
          .then((res) => ({ monthKey: m.monthKey, label: m.label, count: res.total }))
          .catch(() => ({ monthKey: m.monthKey, label: m.label, count: 0 }))
        ),
      ]);

      // Build statsMap — percentages are computed in studentRows using calendar days
      for (const sid of studentIds) {
        statsMap[sid] = {
          overallPresentDays: (overallCounts[sid] || {}).presentDays || 0,
          monthlyPresentDays: (monthlyCounts[sid] || {}).presentDays || 0,
          monthlyWorkingDays,
        };
      }

      // Build trendMap
      for (const result of trendResults) {
        trendMap[result.monthKey] = result;
      }

      setStudentStats(statsMap);
      setRawTrend(trendMap);

    } catch (err) {
      console.error("[useBatchStats] Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [batchId, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregated student rows
  const studentRows = useMemo(() => {
    if (students.length === 0) return [];

    const batchStart = batchData?.start_date
      ? startOfDay(new Date(batchData.start_date))
      : null;
    const batchEnd = batchData?.end_date
      ? endOfDay(new Date(batchData.end_date))
      : endOfDay(new Date());
    const today = endOfDay(new Date());
    const effectiveEnd = new Date(Math.min(batchEnd?.getTime() || today.getTime(), today.getTime()));

    // Total working days for batch
    const totalWorkingDays = batchStart
      ? countWorkingDays(batchStart, effectiveEnd, holidays)
      : 0;

    // Group mock tests by userId
    const testsByUser = {};
    rawTests.forEach((t) => {
      const uid = t.userId;
      if (!testsByUser[uid]) {
        testsByUser[uid] = [];
      }
      testsByUser[uid].push(t);
    });

    return students.map((s) => {
      const sid = s.studentId;
      const profile = profiles[sid] || {};
      const stat = studentStats[sid] || {
        overallPresentDays: 0,
        monthlyPresentDays: 0,
        monthlyWorkingDays: 0,
      };

      const presentDays = stat.overallPresentDays || 0;
      // Derive attendance % from calendar working days (no absent query needed)
      const totalAtt = totalWorkingDays > 0
        ? parseFloat(((presentDays / totalWorkingDays) * 100).toFixed(1))
        : 0;
      const monthlyPresentDays = stat.monthlyPresentDays || 0;
      const mWorkingDays = stat.monthlyWorkingDays || 0;
      const monthAtt = mWorkingDays > 0
        ? parseFloat(((monthlyPresentDays / mWorkingDays) * 100).toFixed(1))
        : 0;

      // Compute mock test stats from raw tests
      const studentTests = testsByUser[sid] || [];
      const testsSubmitted = studentTests.length;
      
      let cumulativeScore = 0;
      studentTests.forEach((t) => {
        const score = t.score || 0;
        const qCount = t.quesCount || 0;
        const percentageScore = qCount > 0 ? (score / qCount) * 100 : 0;
        cumulativeScore += percentageScore;
      });

      const avgScore = testsSubmitted > 0 ? parseFloat((cumulativeScore / testsSubmitted).toFixed(1)) : 0;

      let status = "active";
      if (totalAtt < 50) status = "critical";
      else if (totalAtt < 75) status = "warning";

      return {
        studentId: sid,
        userName: profile.userName || "Unknown",
        profileImage: profile.profileImage || null,
        registerId: s.registerId || null,
        rollNumber: s.rollNumber || null,
        totalAttendancePercent: totalAtt,
        monthlyAttendancePercent: monthAtt,
        presentDays,
        totalWorkingDays,
        monthlyPresentDays,
        monthlyWorkingDays: mWorkingDays,
        testsSubmitted,
        avgScore,
        status,
        joinedAt: s.joinedAt,
      };
    });
  }, [students, profiles, studentStats, rawTests, batchData, holidays]);

  // Aggregated batch overview
  const batchOverview = useMemo(() => {
    if (studentRows.length === 0) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        avgAttendance: 0,
        avgScore: 0,
        lowAttendanceCount: 0,
      };
    }

    const total = studentRows.length;
    const active = studentRows.filter((s) => s.status !== "critical").length;
    const avgAttendance = parseFloat(
      (studentRows.reduce((s, r) => s + r.totalAttendancePercent, 0) / total).toFixed(1)
    );
    const avgScore = parseFloat(
      (studentRows.reduce((s, r) => s + r.avgScore, 0) / total).toFixed(1)
    );
    const lowAttendanceCount = studentRows.filter(
      (s) => s.totalAttendancePercent < 75
    ).length;

    return { totalStudents: total, activeStudents: active, avgAttendance, avgScore, lowAttendanceCount };
  }, [studentRows]);

  // Monthly attendance trend (last 6 months)
  const attendanceTrend = useMemo(() => {
    if (!batchData?.start_date || students.length === 0) return [];

    return Object.values(rawTrend)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((m) => {
        const d = new Date(m.monthKey + "-01");
        const mStart = startOfMonth(d);
        const mEnd = endOfMonth(d);
        const batchStart = batchData.start_date ? new Date(batchData.start_date) : mStart;
        const effectiveStart = new Date(Math.max(mStart.getTime(), batchStart.getTime()));
        
        let monthWorkingDays = countWorkingDays(effectiveStart, mEnd, holidays);
        // Average attendance for the month is (total presents / (working days * total students))
        let totalPossible = monthWorkingDays * students.length;

        return {
          month: m.monthKey,
          label: m.label,
          percentage: totalPossible > 0
            ? parseFloat(((m.count / totalPossible) * 100).toFixed(1))
            : 0,
        };
      });
  }, [rawTrend, batchData, holidays, students]);

  return {
    studentRows,
    batchOverview,
    attendanceTrend,
    isLoading,
    error,
    refetch: fetchData,
  };
};

// Utility: split array into chunks
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default useBatchStats;
