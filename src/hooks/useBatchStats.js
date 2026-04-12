import { useState, useEffect, useMemo, useCallback } from "react";
import { Query } from "appwrite";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import batchStudentService from "@/appwrite/batchStudentService";
import userProfileService from "@/appwrite/userProfileService";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import questionpaperservice from "@/appwrite/mockTest";
import holidayService from "@/appwrite/holidaysService";

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
  const [allAttendance, setAllAttendance] = useState([]);
  const [mockTests, setMockTests] = useState([]);
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
      const studentDocs = await batchStudentService.getBatchStudents(batchId);
      setStudents(studentDocs);
      const studentIds = studentDocs.map((s) => s.studentId);

      if (studentIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // 2. Fetch profiles, attendance, mock tests, holidays in parallel
      const [profileDocs, attendanceDocs, holidayDocs, ...testBatches] =
        await Promise.all([
          // Profiles
          userProfileService.getBatchUserProfile([
            Query.equal("userId", studentIds),
            Query.limit(100),
          ]),
          // ALL attendance for this batch (capped to batch date range)
          newAttendanceService.getAllBatchAttendance(batchId).then((r) => r.documents),
          // Holidays
          holidayService.getBatchHolidays(batchId),
          // Mock tests — fetch per-student in chunks of 100 IDs
          ...chunkArray(studentIds, 100).map((chunk) =>
            questionpaperservice.listQuestions([
              Query.equal("userId", chunk),
              Query.equal("submitted", true),
              Query.select(["userId", "score", "quesCount", "paperId", "$createdAt"]),
            ])
          ),
        ]);

      // Build profile map
      const profileMap = {};
      profileDocs.forEach((p) => {
        profileMap[p.userId] = p;
      });
      setProfiles(profileMap);

      // Attendance
      setAllAttendance(attendanceDocs || []);

      // Holidays set
      const hSet = new Set();
      (holidayDocs || []).forEach((h) => {
        if (h?.date) hSet.add(h.date.substring(0, 10));
      });
      setHolidays(hSet);

      // Mock tests — flatten
      setMockTests(testBatches.flat().filter(Boolean));
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

    // Selected month range
    let monthStart = null;
    let monthEnd = null;
    let monthWorkingDays = 0;
    if (selectedMonth) {
      const d = new Date(selectedMonth + "-01");
      monthStart = startOfMonth(d);
      monthEnd = endOfMonth(d);
      // Clamp to batch range
      const clampedStart = new Date(
        Math.max(monthStart.getTime(), batchStart?.getTime() || 0)
      );
      const clampedEnd = new Date(
        Math.min(monthEnd.getTime(), effectiveEnd.getTime())
      );
      monthWorkingDays = countWorkingDays(clampedStart, clampedEnd, holidays);
    }

    // Group attendance by userId
    const attendanceByUser = {};
    allAttendance.forEach((rec) => {
      if (!attendanceByUser[rec.userId]) {
        attendanceByUser[rec.userId] = { present: 0, total: 0, monthPresent: 0, monthTotal: 0 };
      }
      const u = attendanceByUser[rec.userId];
      if (rec.status === "present") u.present++;
      u.total++;

      // Monthly
      if (monthStart && monthEnd && rec.date) {
        const recDate = rec.date.substring(0, 10);
        const mStart = format(monthStart, "yyyy-MM-dd");
        const mEnd = format(monthEnd, "yyyy-MM-dd");
        if (recDate >= mStart && recDate <= mEnd) {
          if (rec.status === "present") u.monthPresent++;
          u.monthTotal++;
        }
      }
    });

    // Group mock tests by userId
    const testsByUser = {};
    mockTests.forEach((t) => {
      if (!testsByUser[t.userId]) testsByUser[t.userId] = [];
      testsByUser[t.userId].push(t);
    });

    return students.map((s) => {
      const sid = s.studentId;
      const profile = profiles[sid] || {};
      const att = attendanceByUser[sid] || { present: 0, total: 0, monthPresent: 0, monthTotal: 0 };
      const tests = testsByUser[sid] || [];

      const totalAtt = totalWorkingDays > 0
        ? parseFloat(((att.present / totalWorkingDays) * 100).toFixed(1))
        : 0;
      const monthAtt = monthWorkingDays > 0
        ? parseFloat(((att.monthPresent / monthWorkingDays) * 100).toFixed(1))
        : 0;

      const avgScore =
        tests.length > 0
          ? parseFloat(
              (
                tests.reduce(
                  (sum, t) =>
                    sum + (t.quesCount > 0 ? (t.score / t.quesCount) * 100 : 0),
                  0
                ) / tests.length
              ).toFixed(1)
            )
          : 0;

      let status = "active";
      if (totalAtt < 50) status = "critical";
      else if (totalAtt < 75) status = "warning";

      return {
        studentId: sid,
        userName: profile.userName || "Unknown",
        profileImage: profile.profileImage || null,
        registerId: profile.registerId || null,
        totalAttendancePercent: totalAtt,
        monthlyAttendancePercent: monthAtt,
        presentDays: att.present,
        totalWorkingDays,
        testsSubmitted: tests.length,
        avgScore,
        status,
        joinedAt: s.joinedAt,
      };
    });
  }, [students, profiles, allAttendance, mockTests, batchData, holidays, selectedMonth]);

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
    if (!batchData?.start_date || allAttendance.length === 0) return [];

    const monthMap = {};
    allAttendance.forEach((rec) => {
      const month = rec.date?.substring(0, 7); // "YYYY-MM"
      if (!month) return;
      if (!monthMap[month]) monthMap[month] = { present: 0, total: 0 };
      if (rec.status === "present") monthMap[month].present++;
      monthMap[month].total++;
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        label: format(new Date(month + "-01"), "MMM yy"),
        percentage: data.total > 0
          ? parseFloat(((data.present / data.total) * 100).toFixed(1))
          : 0,
      }));
  }, [allAttendance, batchData]);

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
