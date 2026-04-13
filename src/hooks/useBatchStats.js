import { useState, useEffect, useMemo, useCallback } from "react";
import { Query } from "appwrite";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import batchStudentService from "@/appwrite/batchStudentService";
import userProfileService from "@/appwrite/userProfileService";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import mockTestService from "@/services/mocktest.service";
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
      const studentDocs = await batchStudentService.getBatchStudents(batchId, [
        Query.select(["studentId", "joinedAt"]),
      ]);
      setStudents(studentDocs);
      const studentIds = studentDocs.map((s) => s.studentId);

      if (studentIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // 2. Fetch profiles, stats, and holidays
      const [profileDocs, statsDocs, holidayDocs] =
        await Promise.all([
          // Profiles
          userProfileService.getBatchUserProfile([
            Query.equal("userId", studentIds),
            Query.limit(100),
            Query.select(["userId", "userName", "profileImage", "registerId"]),
          ]),
          // Precomputed Stats
          (async () => {
             // We can just use databases.listDocuments here manually or let's import it
             const { appwriteService } = await import("@/services/appwriteClient");
             const conf = (await import("@/config/config")).default;
             return appwriteService.getDatabases().listDocuments(
                 conf.databaseId,
                 "userBatchStats",
                 [Query.equal("batchId", batchId), Query.limit(100)]
             ).then(r => r.documents);
          })(),
          // Holidays
          holidayService.getBatchHolidays(batchId, [Query.select(["date"])]),
        ]);

      // Build profile map
      const profileMap = {};
      profileDocs.forEach((p) => {
        profileMap[p.userId] = p;
      });
      setProfiles(profileMap);

      // Build stats map
      const precomputedStatsMap = {};
      statsDocs.forEach((s) => {
        precomputedStatsMap[s.userId] = s;
      });
      setAllAttendance(statsDocs); // We'll loosely store stats in allAttendance state variable for now

      // Holidays set
      const hSet = new Set();
      (holidayDocs || []).forEach((h) => {
        if (h?.date) hSet.add(h.date.substring(0, 10));
      });
      setHolidays(hSet);
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

    // Here, allAttendance is actually precomputed stats
    const statsMap = {};
    allAttendance.forEach((s) => {
      statsMap[s.userId] = s;
    });

    return students.map((s) => {
      const sid = s.studentId;
      const profile = profiles[sid] || {};
      const stat = statsMap[sid] || { presentDays: 0, monthlyAttendance: "{}", testsSubmitted: 0, latestScore: 0, cumulativeScore: 0 };
      
      let monthPresent = 0;
      if (selectedMonth) {
        try {
          const mData = JSON.parse(stat.monthlyAttendance || "{}");
          monthPresent = mData[selectedMonth] || 0;
        } catch(e) {}
      }

      const totalAtt = totalWorkingDays > 0
        ? parseFloat(((stat.presentDays / totalWorkingDays) * 100).toFixed(1))
        : 0;
      const monthAtt = monthWorkingDays > 0
        ? parseFloat(((monthPresent / monthWorkingDays) * 100).toFixed(1))
        : 0;

      const avgScore = stat.testsSubmitted > 0 ? parseFloat((stat.cumulativeScore / stat.testsSubmitted).toFixed(1)) : 0;

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
        presentDays: stat.presentDays,
        totalWorkingDays,
        testsSubmitted: stat.testsSubmitted,
        avgScore,
        status,
        joinedAt: s.joinedAt,
      };
    });
  }, [students, profiles, allAttendance, batchData, holidays, selectedMonth]);

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
    // since allAttendance contains stats map and not raw attendance
    // we need to aggregate the individual monthly sums from JSON.
    const monthMap = {};
    
    allAttendance.forEach((s) => {
      let mData = {};
      try { mData = JSON.parse(s.monthlyAttendance || "{}"); } catch(e) {}
      
      Object.entries(mData).forEach(([m, present]) => {
         if (!monthMap[m]) monthMap[m] = { present: 0, total: 0 };
         monthMap[m].present += present;
         // Total working days per month is not strictly saved per student in userBatchStats, 
         // so we rely on holidays and date fns here to compute totalWorkingDays for that month.
         monthMap[m].total++; 
      })
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => {
        // compute working days for this month
        const d = new Date(month + "-01");
        const mStart = startOfMonth(d);
        const mEnd = endOfMonth(d);
        const batchStart = batchData.start_date ? new Date(batchData.start_date) : mStart;
        const effectiveStart = new Date(Math.max(mStart.getTime(), batchStart.getTime()));
        
        let monthWorkingDays = countWorkingDays(effectiveStart, mEnd, holidays);
        // Student's sum of present divided by student working days sum 
        // Here `data.total` is the number of students who had an entry for this month
        // Average attendance for the month is (total presents / (working days * total students))
        // But a simpler approach is calculating the total max possible present and dividing.
        let totalPossible = monthWorkingDays * data.total;

        return {
          month,
          label: format(d, "MMM yy"),
          percentage: totalPossible > 0
            ? parseFloat(((data.present / totalPossible) * 100).toFixed(1))
            : 0,
        };
     });
  }, [allAttendance, batchData, holidays]);

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
