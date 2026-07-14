import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Query } from "appwrite";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay, subMonths } from "date-fns";
import batchStudentService from "@/appwrite/batchStudentService";
import userProfileService from "@/appwrite/userProfileService";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import mockTestService from "@/services/mocktest.service";
import holidayService from "@/appwrite/holidaysService";
import userStatsService from "@/appwrite/userStats";
import conf from "@/config/config";

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
  const [studentStats, setStudentStats] = useState(null); // studentId -> stats object
  const [holidays, setHolidays] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Spanning reload prevention (refreshes within 10 seconds are ignored unless forced)
  const lastFetchRef = useRef({});

  const fetchData = useCallback(async (force = false) => {
    if (!batchId) return;

    const nowMs = Date.now();
    if (!force && lastFetchRef.current[batchId] && (nowMs - lastFetchRef.current[batchId] < 10000)) {
      console.log("[useBatchStats] Throttling fast reload to prevent API spam");
      return;
    }
    lastFetchRef.current[batchId] = nowMs;

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
        setStudentStats({});
        setIsLoading(false);
        return;
      }

      // 2. Fetch userBatchStats records, profiles, and holidays in parallel
      const [statsDocsRes, profileDocs, holidayDocs] = await Promise.all([
        userStatsService.getAllStats([
          Query.equal("batchId", batchId),
          Query.limit(100),
        ]),
        userProfileService.getBatchUserProfile([
          Query.equal("userId", studentIds),
          Query.limit(100),
          Query.select(["userId", "userName", "profileImage"]),
        ]),
        holidayService.getBatchHolidays(batchId, [Query.select(["date"])]),
      ]);

      // Map profiles and holidays
      const profileMap = {};
      profileDocs.forEach((p) => {
        profileMap[p.userId] = p;
      });
      setProfiles(profileMap);

      const hSet = new Set();
      (holidayDocs || []).forEach((h) => {
        if (h?.date) hSet.add(h.date.substring(0, 10));
      });
      setHolidays(hSet);

      // Map existing cached stats
      const cachedStatsMap = {};
      (statsDocsRes.rows || []).forEach((d) => {
        cachedStatsMap[d.userId] = d;
      });

      // 3. Separate students into fresh and stale/missing
      const cacheDurationMs = 24 * 60 * 60 * 1000; // 24-hour TTL
      const staleStudentIds = [];
      const freshStats = {};

      studentIds.forEach((sid) => {
        const doc = cachedStatsMap[sid];
        if (!doc || (nowMs - new Date(doc.$updatedAt || doc.$createdAt).getTime()) > cacheDurationMs) {
          staleStudentIds.push(sid);
        } else {
          freshStats[sid] = {
            userId: sid,
            presentDays: doc.presentDays ?? 0,
            totalWorkingDays: doc.totalWorkingDays ?? 0,
            testsSubmitted: doc.testsSubmitted ?? 0,
            cumulativeScore: doc.cumulativeScore ?? 0,
            latestScore: doc.latestScore ?? 0,
            monthlyAttendance: JSON.parse(doc.monthlyAttendance || "{}"),
          };
        }
      });

      // 4. Recalculate stats for stale/missing students only
      const staleCalculatedStats = {};
      if (staleStudentIds.length > 0) {
        console.log(`[useBatchStats] Recalculating stats for ${staleStudentIds.length} stale/missing students`);

        let monthStartStr = null;
        let monthEndStr = null;
        if (selectedMonth) {
          const d = new Date(selectedMonth + "-01");
          monthStartStr = format(startOfMonth(d), "yyyy-MM-dd");
          monthEndStr = format(endOfMonth(d), "yyyy-MM-dd");
        }

        const [overallCounts, testsDocsRes, staleAttendanceDocs] = await Promise.all([
          // Present days count
          newAttendanceService.getBatchPresentCountsForStudents(staleStudentIds, batchId),
          // Mock test submissions
          mockTestService.listQuestions([
            Query.equal("userId", staleStudentIds),
            Query.equal("submitted", true),
            Query.select(["userId", "score", "quesCount"]),
          ]).catch((err) => {
            console.error("Error fetching raw tests for stale students:", err);
            return [];
          }),
          // Raw attendance rows to build monthly attendance map
          newAttendanceService.database.listRows({
            databaseId: conf.databaseId,
            tableId: conf.newAttendanceCollectionId,
            queries: [
              Query.equal("batchId", batchId),
              Query.equal("userId", staleStudentIds),
              Query.equal("status", "present"),
              Query.limit(500),
            ],
          }).then((res) => res.rows || []).catch(() => []),
        ]);

        // Group tests by student
        const testsByUser = {};
        (testsDocsRes || []).forEach((t) => {
          const uid = t.userId;
          if (!testsByUser[uid]) testsByUser[uid] = [];
          testsByUser[uid].push(t);
        });

        // Group monthly attendance by student
        const staleMonthlyMap = {};
        staleStudentIds.forEach((sid) => {
          staleMonthlyMap[sid] = {};
        });
        staleAttendanceDocs.forEach((doc) => {
          if (doc.userId && doc.date) {
            const m = doc.date.substring(0, 7); // "yyyy-MM"
            if (!staleMonthlyMap[doc.userId]) staleMonthlyMap[doc.userId] = {};
            staleMonthlyMap[doc.userId][m] = (staleMonthlyMap[doc.userId][m] || 0) + 1;
          }
        });

        // Perform calculation and save back to userBatchStats
        const batchStart = batchData?.start_date ? startOfDay(new Date(batchData.start_date)) : null;
        const today = endOfDay(new Date());
        const batchEnd = batchData?.end_date ? endOfDay(new Date(batchData.end_date)) : today;
        const effectiveEnd = new Date(Math.min(batchEnd.getTime(), today.getTime()));
        const calculatedWorkingDays = batchStart ? countWorkingDays(batchStart, effectiveEnd, hSet) : 0;

        for (const sid of staleStudentIds) {
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
            totalWorkingDays: calculatedWorkingDays,
            presentDays,
            monthlyAttendance: staleMonthlyMap[sid] || {},
            testsSubmitted,
            cumulativeScore,
            latestScore,
          };

          staleCalculatedStats[sid] = {
            userId: sid,
            ...payload,
          };

          // Background silent write to database
          userStatsService.upsertUserStats(sid, batchId, payload)
            .catch((err) => console.error(`[useBatchStats] Failed to upsert stats for ${sid}:`, err));
        }
      }

      // Merge and save in state
      setStudentStats({
        ...freshStats,
        ...staleCalculatedStats,
      });

    } catch (err) {
      console.error("[useBatchStats] Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [batchId, batchData, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregated student rows
  const studentRows = useMemo(() => {
    if (students.length === 0 || !studentStats) return [];

    let monthlyWorkingDays = 0;
    if (selectedMonth) {
      const d = new Date(selectedMonth + "-01");
      const mStart = startOfDay(startOfMonth(d));
      const mEnd = endOfDay(endOfMonth(d));
      monthlyWorkingDays = countWorkingDays(mStart, mEnd, holidays);
    }

    return students.map((s) => {
      const sid = s.studentId;
      const profile = profiles[sid] || {};
      const stat = studentStats[sid] || {
        presentDays: 0,
        totalWorkingDays: 0,
        testsSubmitted: 0,
        cumulativeScore: 0,
        monthlyAttendance: {},
      };

      const presentDays = stat.presentDays || 0;
      const totalWorkingDays = stat.totalWorkingDays || 0;

      // Attendance percentage
      const totalAtt = totalWorkingDays > 0
        ? parseFloat(((presentDays / totalWorkingDays) * 100).toFixed(1))
        : 0;

      // Monthly present days from JSON map
      const monthlyMap = stat.monthlyAttendance || {};
      const monthlyPresentDays = monthlyMap[selectedMonth] || 0;
      const monthAtt = monthlyWorkingDays > 0
        ? parseFloat(((monthlyPresentDays / monthlyWorkingDays) * 100).toFixed(1))
        : 0;

      const testsSubmitted = stat.testsSubmitted || 0;
      const avgScore = testsSubmitted > 0 ? parseFloat((stat.cumulativeScore / testsSubmitted).toFixed(1)) : 0;

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
        monthlyWorkingDays,
        testsSubmitted,
        avgScore,
        status,
        joinedAt: s.joinedAt,
      };
    });
  }, [students, profiles, studentStats, selectedMonth, holidays]);

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
    if (!batchData?.start_date || students.length === 0 || !studentStats) return [];

    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, i);
      return {
        monthKey: format(d, "yyyy-MM"),
        label: format(d, "MMM yy"),
      };
    }).reverse();

    return last6Months.map((m) => {
      const d = new Date(m.monthKey + "-01");
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const batchStart = batchData.start_date ? new Date(batchData.start_date) : mStart;
      const effectiveStart = new Date(Math.max(mStart.getTime(), batchStart.getTime()));
      
      const monthWorkingDays = countWorkingDays(effectiveStart, mEnd, holidays);
      const totalPossible = monthWorkingDays * students.length;

      // Sum monthly attendance from combined stats
      let presentCount = 0;
      Object.values(studentStats).forEach((s) => {
        const monthlyMap = s.monthlyAttendance || {};
        presentCount += monthlyMap[m.monthKey] || 0;
      });

      return {
        month: m.monthKey,
        label: m.label,
        percentage: totalPossible > 0
          ? parseFloat(((presentCount / totalPossible) * 100).toFixed(1))
          : 0,
      };
    });
  }, [studentStats, batchData, holidays, students]);

  return {
    studentRows,
    batchOverview,
    attendanceTrend,
    isLoading: isLoading || studentStats === null,
    error,
    refetch: () => fetchData(true), // Force refresh bypassing the throttle
  };
};

export default useBatchStats;
