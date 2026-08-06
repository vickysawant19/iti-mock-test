import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Query } from "appwrite";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay, subMonths } from "date-fns";
import batchStudentService from "@/appwrite/batchStudentService";
import userProfileService from "@/appwrite/userProfileService";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import mockTestService from "@/services/mocktest.service";
import holidayService from "@/appwrite/holidaysService";
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
  const [rawMonthlyStatsRows, setRawMonthlyStatsRows] = useState([]);
  const [holidays, setHolidays] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Spanning reload prevention (refreshes within 5 seconds are ignored unless forced)
  const lastFetchRef = useRef({});

  const fetchData = useCallback(async (force = false) => {
    if (!batchId) return;

    const nowMs = Date.now();
    if (!force && lastFetchRef.current[batchId] && (nowMs - lastFetchRef.current[batchId] < 5000)) {
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
        setRawMonthlyStatsRows([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch profiles, holidays, monthlyAttendanceStats, and mock tests in parallel
      const [profileDocs, holidayDocs, monthlyStatsRes, testsDocsRes] = await Promise.all([
        userProfileService.getBatchUserProfile([
          Query.equal("userId", studentIds),
          Query.limit(100),
          Query.select(["userId", "userName", "profileImage"]),
        ]),
        holidayService.getBatchHolidays(batchId, [Query.select(["date"])]).catch(() => []),
        newAttendanceService.database.listRows({
          databaseId: conf.databaseId,
          tableId: conf.monthlyAttendanceStatsCollectionId || "monthlyAttendanceStats",
          queries: [
            Query.equal("batchId", batchId),
            Query.limit(1000),
            Query.select([
              "userId",
              "batchId",
              "yearMonth",
              "workingDays",
              "presentDays",
              "absentDays",
              "casualLeaves",
              "sickLeaves",
              "specialLeaves",
              "onDutyLeaves",
              "totalPresent",
              "attendancePercentage",
            ]),
          ],
        }).catch(() => ({ rows: [] })),
        mockTestService.listQuestions([
          Query.equal("userId", studentIds),
          Query.equal("submitted", true),
          Query.select(["userId", "score", "quesCount"]),
        ]).catch((err) => {
          console.error("Error fetching raw tests for batch stats:", err);
          return [];
        }),
      ]);

      // Map profiles
      const profileMap = {};
      (profileDocs || []).forEach((p) => {
        profileMap[p.userId] = p;
      });
      setProfiles(profileMap);

      // Map holidays
      const hSet = new Set();
      (holidayDocs || []).forEach((h) => {
        if (h?.date) hSet.add(h.date.substring(0, 10));
      });
      setHolidays(hSet);

      const rows = monthlyStatsRes?.rows || [];
      setRawMonthlyStatsRows(rows);

      // Group mock tests by student
      const testsByUser = {};
      (testsDocsRes || []).forEach((t) => {
        const uid = t.userId;
        if (!testsByUser[uid]) testsByUser[uid] = [];
        testsByUser[uid].push(t);
      });

      // Group monthlyAttendanceStats by student
      const statsMap = {};
      studentIds.forEach((sid) => {
        statsMap[sid] = {
          userId: sid,
          workingDays: 0,
          presentDays: 0,
          absentDays: 0,
          casualLeaves: 0,
          sickLeaves: 0,
          specialLeaves: 0,
          onDutyLeaves: 0,
          totalPresent: 0,
          byMonth: {},
          testsSubmitted: 0,
          cumulativeScore: 0,
          latestScore: 0,
        };
      });

      rows.forEach((row) => {
        const sid = row.userId;
        if (!sid || !statsMap[sid]) return;

        const wDays = row.workingDays || 0;
        const pDays = row.presentDays || 0;
        const aDays = row.absentDays || 0;
        const cl = row.casualLeaves || 0;
        const sl = row.sickLeaves || 0;
        const spl = row.specialLeaves || 0;
        const od = row.onDutyLeaves || 0;
        const totP = row.totalPresent !== undefined ? row.totalPresent : (pDays + cl + sl + spl + od);

        statsMap[sid].workingDays += wDays;
        statsMap[sid].presentDays += pDays;
        statsMap[sid].absentDays += aDays;
        statsMap[sid].casualLeaves += cl;
        statsMap[sid].sickLeaves += sl;
        statsMap[sid].specialLeaves += spl;
        statsMap[sid].onDutyLeaves += od;
        statsMap[sid].totalPresent += totP;

        if (row.yearMonth) {
          statsMap[sid].byMonth[row.yearMonth] = {
            workingDays: wDays,
            presentDays: pDays,
            absentDays: aDays,
            casualLeaves: cl,
            sickLeaves: sl,
            specialLeaves: spl,
            onDutyLeaves: od,
            totalPresent: totP,
            percentage: row.attendancePercentage !== undefined ? row.attendancePercentage : (wDays > 0 ? parseFloat(((totP / wDays) * 100).toFixed(1)) : 0),
          };
        }
      });

      // Attach test scores
      studentIds.forEach((sid) => {
        const studentTests = testsByUser[sid] || [];
        statsMap[sid].testsSubmitted = studentTests.length;

        let cumulativeScore = 0;
        let latestScore = 0;
        studentTests.forEach((t) => {
          const score = t.score || 0;
          const qCount = t.quesCount || 0;
          const percentageScore = qCount > 0 ? (score / qCount) * 100 : 0;
          cumulativeScore += percentageScore;
          latestScore = percentageScore;
        });

        statsMap[sid].cumulativeScore = cumulativeScore;
        statsMap[sid].latestScore = latestScore;
      });

      setStudentStats(statsMap);

    } catch (err) {
      console.error("[useBatchStats] Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregated student rows
  const studentRows = useMemo(() => {
    if (students.length === 0 || !studentStats) return [];

    return students.map((s) => {
      const sid = s.studentId;
      const profile = profiles[sid] || {};
      const stat = studentStats[sid] || {
        workingDays: 0,
        presentDays: 0,
        absentDays: 0,
        totalPresent: 0,
        byMonth: {},
        testsSubmitted: 0,
        cumulativeScore: 0,
      };

      const totalWorkingDays = stat.workingDays || 0;
      const totalPresentDays = stat.totalPresent || 0;
      const absentDays = stat.absentDays || 0;

      // Cumulative overall percentage (includes Present + CL + SL + SPL + OD)
      const totalAtt = totalWorkingDays > 0
        ? parseFloat(((totalPresentDays / totalWorkingDays) * 100).toFixed(1))
        : 0;

      // Selected month stats
      const monthObj = selectedMonth ? stat.byMonth[selectedMonth] : null;
      const monthlyWorkingDays = monthObj?.workingDays || 0;
      const monthlyPresentDays = monthObj?.totalPresent || 0;
      const monthAtt = monthObj?.percentage !== undefined
        ? monthObj.percentage
        : (monthlyWorkingDays > 0 ? parseFloat(((monthlyPresentDays / monthlyWorkingDays) * 100).toFixed(1)) : 0);

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
        presentDays: totalPresentDays,
        rawPresentDays: stat.presentDays || 0,
        absentDays,
        totalWorkingDays,
        monthlyPresentDays,
        monthlyWorkingDays,
        casualLeaves: stat.casualLeaves || 0,
        sickLeaves: stat.sickLeaves || 0,
        specialLeaves: stat.specialLeaves || 0,
        onDutyLeaves: stat.onDutyLeaves || 0,
        testsSubmitted,
        avgScore,
        status,
        joinedAt: s.joinedAt,
      };
    });
  }, [students, profiles, studentStats, selectedMonth]);

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
    if (students.length === 0 || !rawMonthlyStatsRows || rawMonthlyStatsRows.length === 0) return [];

    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, i);
      return {
        monthKey: format(d, "yyyy-MM"),
        label: format(d, "MMM yy"),
      };
    }).reverse();

    return last6Months.map((m) => {
      const monthRows = rawMonthlyStatsRows.filter((r) => r.yearMonth === m.monthKey);

      let sumWorking = 0;
      let sumPresent = 0;

      monthRows.forEach((r) => {
        sumWorking += (r.workingDays || 0);
        sumPresent += (r.totalPresent !== undefined ? r.totalPresent : ((r.presentDays || 0) + (r.casualLeaves || 0) + (r.sickLeaves || 0) + (r.specialLeaves || 0) + (r.onDutyLeaves || 0)));
      });

      const percentage = sumWorking > 0
        ? parseFloat(((sumPresent / sumWorking) * 100).toFixed(1))
        : 0;

      return {
        month: m.monthKey,
        label: m.label,
        percentage,
      };
    });
  }, [students, rawMonthlyStatsRows]);

  return {
    studentRows,
    batchOverview,
    attendanceTrend,
    isLoading: isLoading || studentStats === null,
    error,
    refetch: () => fetchData(true), // Force refresh bypassing throttle
  };
};

export default useBatchStats;
