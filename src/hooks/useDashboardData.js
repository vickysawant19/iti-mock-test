import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import {
  selectActiveBatchId,
  selectActiveBatchData,
  selectUserBatches,
  selectActiveBatchLoading,
} from "@/store/activeBatchSlice";
import { useGetTradeQuery } from "@/store/api/tradeApi";
import { useGetCollegeQuery } from "@/store/api/collegeApi";
import { useBatchStats } from "./useBatchStats";

/**
 * Orchestrates dashboard data for both Teacher and Student roles.
 * Provides a single, unified interface for the dashboard page.
 */
export const useDashboardData = () => {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const activeBatchId = useSelector(selectActiveBatchId);
  const activeBatchData = useSelector(selectActiveBatchData);
  const userBatches = useSelector(selectUserBatches);
  const isBatchLoading = useSelector(selectActiveBatchLoading);

  const isTeacher = user?.labels?.includes("Teacher");
  const isAdmin = user?.labels?.includes("admin");
  const isStudent = user && !isTeacher && !isAdmin;

  // Selected month for the teacher dashboard (default: current month)
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );

  // Trade + College context
  const { data: tradeData } = useGetTradeQuery(activeBatchData?.tradeId, {
    skip: !activeBatchData?.tradeId,
  });
  const { data: collegeData } = useGetCollegeQuery(activeBatchData?.collegeId, {
    skip: !activeBatchData?.collegeId,
  });

  // Teacher: batch stats (only fetch when teacher has a batch)
  const {
    studentRows,
    batchOverview,
    attendanceTrend,
    isLoading: isStatsLoading,
    error: statsError,
    refetch,
  } = useBatchStats(
    isTeacher ? activeBatchId : null,
    activeBatchData,
    selectedMonth
  );

  // Batch context shared between teacher & student
  const batchContext = useMemo(
    () => ({
      batchId: activeBatchId,
      batchName: activeBatchData?.BatchName || "No Batch",
      tradeName: tradeData?.tradeName || "",
      collegeName: collegeData?.collageName || "",
      startDate: activeBatchData?.start_date || null,
      endDate: activeBatchData?.end_date || null,
      teacherName: activeBatchData?.teacherName || "",
    }),
    [activeBatchId, activeBatchData, tradeData, collegeData]
  );

  const role = isAdmin ? "admin" : isTeacher ? "teacher" : "student";

  return {
    // Identity
    role,
    user,
    profile,
    isTeacher,
    isStudent,
    isAdmin,

    // Batch
    batchContext,
    userBatches,
    activeBatchId,
    activeBatchData,
    isBatchLoading,

    // Teacher-specific
    studentRows: isTeacher ? studentRows : [],
    batchOverview: isTeacher ? batchOverview : null,
    attendanceTrend: isTeacher ? attendanceTrend : [],

    // Filters
    selectedMonth,
    setSelectedMonth,

    // Loading / Error
    isLoading: isBatchLoading || isStatsLoading,
    error: statsError,
    refetch,
  };
};

export default useDashboardData;
