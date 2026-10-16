import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { selectActiveBatchId, selectActiveBatchData } from "@/store/activeBatchSlice";
import {
  format,
  parseISO,
  parse,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  eachDayOfInterval,
  getDay,
  isAfter,
  isBefore,
  isToday,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  CheckCheck,
  XCircle,
  UserX,
  AlertCircle,
  Trash2,
  LoaderCircle,
  History,
  Palmtree,
  ShieldAlert,
  Award,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  Calendar as CalendarIcon,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  FileText,
  User,
  GraduationCap,
  Building,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userProfileService } from "@/services/auth/userProfileService";
import batchStudentService from "@/services/batch/batchStudentService";
import { batchService } from "@/services/batch/batchService";
import { newAttendanceService } from "@/services/attendance/newAttendanceService";
import holidayService from "@/services/attendance/holidaysService";
import {
  attendanceTrackingService,
  formatAttendanceTime,
} from "@/services/attendance/attendanceTrackingService";
import { StudentLeaveQuotaBadges } from "@/private/Attendance/components/StudentLeaveQuotaBadges";
import { toast } from "react-toastify";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const REJECTION_PRESETS = [
  "No medical certificate / doctor proof provided",
  "Unexcused absence / no prior intimation",
  "Did not attend workshop or practicals",
  "Annual quota limit for this category reached",
  "Request submitted outside acceptable window",
];

const StudentIndividualAttendancePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentUser = useSelector(selectUser);
  const activeBatchId = useSelector(selectActiveBatchId);
  const activeBatchData = useSelector(selectActiveBatchData);

  // Batch query param or fallback to activeBatchId
  const queryBatchId = searchParams.get("batchId");
  const [selectedBatchId, setSelectedBatchId] = useState(queryBatchId || activeBatchId || "");

  // Student details state
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentRecord, setStudentRecord] = useState(null);
  const [studentBatches, setStudentBatches] = useState([]);
  const [batchData, setBatchData] = useState(activeBatchData || null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  // Month & view navigation state
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(format(new Date(), "yyyy-MM-dd"));
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "list"

  // Attendance & stats state
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [annualAttendance, setAnnualAttendance] = useState([]);
  const [holidays, setHolidays] = useState(new Map());
  const [cumulativeStats, setCumulativeStats] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [updatingDateKey, setUpdatingDateKey] = useState(null);
  const [isVerifyingAction, setIsVerifyingAction] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState(null);
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");

  // Sync selectedBatchId with searchParams
  useEffect(() => {
    if (queryBatchId && queryBatchId !== selectedBatchId) {
      setSelectedBatchId(queryBatchId);
    }
  }, [queryBatchId]);

  // Fetch student profile, batches, and enrollment record
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    setLoadingStudent(true);

    const loadStudentData = async () => {
      try {
        const [profile, batchesRes] = await Promise.all([
          userProfileService.getUserProfile(userId),
          batchStudentService.getStudentBatches(userId).catch(() => []),
        ]);

        if (!isMounted) return;
        setStudentProfile(profile);
        setStudentBatches(batchesRes || []);

        // Resolve effective batch ID
        let effectiveBatchId = selectedBatchId;
        if (!effectiveBatchId && batchesRes?.length > 0) {
          effectiveBatchId = batchesRes[0].batchId || batchesRes[0].$id;
          setSelectedBatchId(effectiveBatchId);
          setSearchParams({ batchId: effectiveBatchId }, { replace: true });
        }

        // Fetch enrollment record in effective batch
        if (effectiveBatchId) {
          const [rec, bData] = await Promise.all([
            batchStudentService.getStudentRecord(effectiveBatchId, userId).catch(() => null),
            (effectiveBatchId === activeBatchData?.$id ? Promise.resolve(activeBatchData) : batchService.getBatch(effectiveBatchId)).catch(() => null),
          ]);
          if (!isMounted) return;
          setStudentRecord(rec);
          if (bData) setBatchData(bData);
        }
      } catch (err) {
        console.error("Error loading student profile:", err);
        toast.error("Failed to load student details");
      } finally {
        if (isMounted) setLoadingStudent(false);
      }
    };

    loadStudentData();
    return () => {
      isMounted = false;
    };
  }, [userId, selectedBatchId]);

  // When teacher switches batch dropdown
  const handleBatchChange = (newBatchId) => {
    setSelectedBatchId(newBatchId);
    setSearchParams({ batchId: newBatchId });
  };

  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);
  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );
  const leadingBlankDays = getDay(monthStart);

  // Student enrollment date bounds
  const studentEnrollDateStr = studentRecord?.enrollmentDate
    ? String(studentRecord.enrollmentDate).substring(0, 10)
    : studentProfile?.enrollmentDate
    ? String(studentProfile.enrollmentDate).substring(0, 10)
    : null;

  const rawBatchStartDate = batchData?.start_date
    ? String(batchData.start_date).substring(0, 10)
    : null;
  const rawBatchEndDate = batchData?.end_date
    ? String(batchData.end_date).substring(0, 10)
    : null;

  // Fetch Attendance Records & Holidays for selected month & year
  const fetchMonthData = useCallback(async () => {
    if (!userId || !selectedBatchId) return;

    setLoadingAttendance(true);
    try {
      const monthStartStr = format(monthStart, "yyyy-MM-dd");
      const monthEndStr = format(monthEnd, "yyyy-MM-dd");
      const curYear = selectedMonth.getFullYear();
      const annualStartStr = `${curYear}-01-01`;
      const annualEndStr = `${curYear}-12-31`;

      const [monthAttRes, annualAttRes, holidaysRes] = await Promise.all([
        newAttendanceService.getStudentAttendanceByDateRange(
          userId,
          selectedBatchId,
          monthStartStr,
          monthEndStr
        ),
        newAttendanceService.getStudentAttendanceByDateRange(
          userId,
          selectedBatchId,
          annualStartStr,
          annualEndStr
        ).catch(() => ({ documents: [] })),
        holidayService.getBatchHolidaysByDateRange(
          selectedBatchId,
          monthStartStr,
          monthEndStr
        ).catch(() => []),
      ]);

      setMonthlyAttendance(monthAttRes?.documents || []);
      setAnnualAttendance(annualAttRes?.documents || []);

      const hMap = new Map();
      (holidaysRes || []).forEach((h) => {
        const d = String(h.date || "").substring(0, 10);
        if (d) hMap.set(d, h);
      });
      setHolidays(hMap);
    } catch (err) {
      console.error("Error fetching month attendance:", err);
      toast.error("Failed to load attendance records");
    } finally {
      setLoadingAttendance(false);
    }
  }, [userId, selectedBatchId, selectedMonth, monthStart, monthEnd]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  // Fetch Cumulative Inception Stats (Batch start → End of previous month)
  const fetchCumulativeInceptionStats = useCallback(async () => {
    if (!userId || !selectedBatchId) return;

    setLoadingStats(true);
    try {
      const effectiveStart = studentEnrollDateStr || rawBatchStartDate;
      const prevMonthEnd = format(endOfMonth(subMonths(selectedMonth, 1)), "yyyy-MM-dd");

      const stats = await newAttendanceService.getStudentAttendanceStats(
        userId,
        selectedBatchId,
        effectiveStart,
        prevMonthEnd
      );
      setCumulativeStats(stats);
    } catch (err) {
      console.error("Error fetching cumulative stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [userId, selectedBatchId, selectedMonth, studentEnrollDateStr, rawBatchStartDate]);

  useEffect(() => {
    fetchCumulativeInceptionStats();
  }, [fetchCumulativeInceptionStats]);

  // Map of raw attendance record by date string
  const rawAttendanceMap = useMemo(() => {
    const map = new Map();
    (monthlyAttendance || []).forEach((att) => {
      if (att.date) {
        map.set(att.date, att);
      }
    });
    return map;
  }, [monthlyAttendance]);

  // Map of status string by date string
  const attendanceStatusMap = useMemo(() => {
    const map = new Map();
    monthlyAttendance.forEach((att) => {
      if (att.date) {
        map.set(att.date, att.status || (att.attendanceStatus ? att.attendanceStatus.toLowerCase() : ""));
      }
    });
    return map;
  }, [monthlyAttendance]);

  // List of pending verification requests in selected month
  const pendingRequests = useMemo(() => {
    const list = [];
    rawAttendanceMap.forEach((att) => {
      if (att.verificationStatus === "PENDING") {
        list.push(att);
      }
    });
    return list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [rawAttendanceMap]);

  // Default selected date initialization: preserve current date if within month, only readjust on month change or initial load
  const prevMonthKeyRef = useRef(null);
  const hasInitializedPendingRef = useRef(false);

  useEffect(() => {
    const curMonthKey = format(selectedMonth, "yyyy-MM");
    const isMonthChanged = prevMonthKeyRef.current !== curMonthKey;
    prevMonthKeyRef.current = curMonthKey;

    const monthStartStr = format(monthStart, "yyyy-MM-dd");
    const monthEndStr = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
    const todayStr = format(new Date(), "yyyy-MM-dd");

    // On initial page load: if there are pending requests, default to first pending request once
    if (!hasInitializedPendingRef.current && pendingRequests.length > 0) {
      hasInitializedPendingRef.current = true;
      setSelectedDateKey(pendingRequests[0].date);
      return;
    }

    setSelectedDateKey((prevDate) => {
      // If previous date is valid in this month, PRESERVE IT!
      if (prevDate && prevDate >= monthStartStr && prevDate <= monthEndStr && !isMonthChanged) {
        return prevDate;
      }
      if (todayStr >= monthStartStr && todayStr <= monthEndStr) {
        return todayStr;
      }
      return monthStartStr;
    });
  }, [selectedMonth, monthStart]);

  // Annual Leave Quotas calculation
  const leaveQuota = useMemo(() => {
    const targetYear = selectedMonth.getFullYear();
    return attendanceTrackingService.calculateLeaveQuotas(annualAttendance || [], targetYear);
  }, [annualAttendance, selectedMonth]);

  // Monthly summary stats calculation
  const monthStats = useMemo(() => {
    const today = new Date();
    let workingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let holidaysCount = 0;
    let leaveDays = 0;
    let clCount = 0;
    let slCount = 0;
    let splCount = 0;
    let odCount = 0;

    monthDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      const isFuture = isAfter(day, today);

      if (studentEnrollDateStr && key < studentEnrollDateStr) {
        return;
      }
      if (holidays.has(key)) {
        holidaysCount += 1;
        return;
      }
      if (isFuture) return;

      workingDays += 1;
      const rec = rawAttendanceMap.get(key);
      const status = String(rec?.status || attendanceStatusMap.get(key) || "").toLowerCase();
      const leaveType = String(rec?.leaveType || "").toUpperCase();

      if (status === "present" || status === "p") {
        presentDays += 1;
      } else if (status === "absent" || status === "a") {
        absentDays += 1;
      } else if (["casual", "cl"].includes(status) || leaveType === "CASUAL") {
        leaveDays += 1;
        presentDays += 1;
        clCount += 1;
      } else if (["sick", "sl"].includes(status) || leaveType === "SICK") {
        leaveDays += 1;
        presentDays += 1;
        slCount += 1;
      } else if (["special", "spl"].includes(status) || leaveType === "SPECIAL") {
        leaveDays += 1;
        presentDays += 1;
        splCount += 1;
      } else if (["on_duty", "od"].includes(status) || leaveType === "ON_DUTY") {
        leaveDays += 1;
        presentDays += 1;
        odCount += 1;
      } else if (["half_day", "hd", "late", "l", "leave"].includes(status)) {
        leaveDays += 1;
        presentDays += 1;
      }
    });

    const percentage = workingDays > 0 ? parseFloat(((presentDays / workingDays) * 100).toFixed(1)) : 0;
    return {
      workingDays,
      presentDays,
      absentDays,
      holidaysCount,
      leaveDays,
      clCount,
      slCount,
      splCount,
      odCount,
      percentage,
    };
  }, [monthDays, holidays, attendanceStatusMap, rawAttendanceMap, studentEnrollDateStr]);

  // Overall combined stats (Inception + Current Month to date)
  const combinedOverallStats = useMemo(() => {
    const ovPresent = cumulativeStats?.presentDays || 0;
    const ovAbsent = cumulativeStats?.absentDays || 0;
    const curPresent = monthStats.presentDays || 0;
    const curAbsent = monthStats.absentDays || 0;

    const totalPresent = ovPresent + curPresent;
    const totalAbsent = ovAbsent + curAbsent;
    const totalWorking = totalPresent + totalAbsent;
    const totalRate = totalWorking > 0 ? parseFloat(((totalPresent / totalWorking) * 100).toFixed(1)) : 0;
    const isGoodStanding = totalRate >= 75;

    return {
      totalWorking,
      totalPresent,
      totalAbsent,
      totalRate,
      isGoodStanding,
    };
  }, [cumulativeStats, monthStats]);

  // Selected date details
  const selectedDateObj = parseISO(selectedDateKey);
  const selectedStatus = attendanceStatusMap.get(selectedDateKey);
  const selectedRawRecord = rawAttendanceMap.get(selectedDateKey);
  const isSelectedHoliday = holidays.has(selectedDateKey);
  const isSelectedFuture = isAfter(selectedDateObj, new Date());
  const isSelectedBeforeBatch = rawBatchStartDate && isBefore(selectedDateObj, new Date(rawBatchStartDate));
  const isSelectedAfterBatch = rawBatchEndDate && isAfter(selectedDateObj, new Date(rawBatchEndDate));
  const isSelectedBeforeEnrollment = studentEnrollDateStr ? selectedDateKey < studentEnrollDateStr : false;
  const canEditSelected = !isSelectedHoliday && !isSelectedFuture && !isSelectedBeforeBatch && !isSelectedAfterBatch && !isSelectedBeforeEnrollment;
  const isSelectedPending = selectedRawRecord?.verificationStatus === "PENDING";
  const isSelectedRejected = selectedRawRecord?.verificationStatus === "REJECTED";

  const getStatusBadge = (statusStr) => {
    const config = attendanceTrackingService.getStatusConfig(statusStr);
    return {
      label: config.label,
      badge: config.code,
      cls: config.badgeClass,
    };
  };
  const selectedBadgeInfo = getStatusBadge(selectedStatus);

  // Teacher Action: Approve Single Pending Request (supports status override)
  const handleApprovePending = async (targetRecord = null, overrideStatus = null) => {
    const rec = targetRecord || selectedRawRecord;
    if (!rec || isVerifyingAction) return;
    setIsVerifyingAction(true);
    try {
      const finalStatus = overrideStatus || rec.status || "present";
      const badgeConf = attendanceTrackingService.getStatusConfig(finalStatus);
      const leaveTypeVal = ["casual", "cl"].includes(finalStatus)
        ? "CASUAL"
        : ["sick", "sl"].includes(finalStatus)
        ? "SICK"
        : ["special", "spl"].includes(finalStatus)
        ? "SPECIAL"
        : null;

      await newAttendanceService.verifyAttendanceRequests({
        requests: [
          {
            documentId: rec.$id,
            action: "APPROVE",
            status: finalStatus,
            attendanceStatus: badgeConf.code || finalStatus.toUpperCase(),
            leaveType: leaveTypeVal,
          },
        ],
        teacherId: currentUser?.$id,
        batchId: selectedBatchId,
      });
      toast.success(`Approved attendance for ${rec.date} as ${badgeConf.label} (${badgeConf.code})!`);
      await fetchMonthData();
      await fetchCumulativeInceptionStats();
    } catch (err) {
      console.error("Error approving request:", err);
      toast.error(err.message || "Failed to approve request");
    } finally {
      setIsVerifyingAction(false);
    }
  };

  // Teacher Action: Batch Approve ALL Pending Requests
  const handleApproveAllPending = async () => {
    if (pendingRequests.length === 0 || isVerifyingAction) return;
    setIsVerifyingAction(true);
    try {
      const requests = pendingRequests.map((req) => ({
        documentId: req.$id,
        action: "APPROVE",
        status: req.status || "present",
        attendanceStatus: req.attendanceStatus || (req.status ? req.status.toUpperCase() : "PRESENT"),
        leaveType: req.leaveType || null,
      }));

      await newAttendanceService.verifyAttendanceRequests({
        requests,
        teacherId: currentUser?.$id,
        batchId: selectedBatchId,
      });
      toast.success(`Approved all ${requests.length} pending requests for ${studentName}!`);
      await fetchMonthData();
      await fetchCumulativeInceptionStats();
    } catch (err) {
      console.error("Error approving all requests:", err);
      toast.error(err.message || "Failed to approve all requests");
    } finally {
      setIsVerifyingAction(false);
    }
  };

  // Teacher Action: Confirm Reject for single or bulk requests
  const handleConfirmReject = async () => {
    if (isVerifyingAction) return;
    setIsVerifyingAction(true);
    const reasonToUse = rejectionReasonText.trim() || "Rejected by instructor in individual student log";

    try {
      if (isBulkRejecting) {
        const requests = pendingRequests.map((req) => ({
          documentId: req.$id,
          action: "REJECT",
          rejectionReason: reasonToUse,
        }));
        await newAttendanceService.verifyAttendanceRequests({
          requests,
          teacherId: currentUser?.$id,
          batchId: selectedBatchId,
        });
        toast.info(`Rejected ${requests.length} attendance requests. Marked as Absent.`);
      } else if (rejectingRecord || selectedRawRecord) {
        const target = rejectingRecord || selectedRawRecord;
        await newAttendanceService.verifyAttendanceRequests({
          requests: [
            {
              documentId: target.$id,
              action: "REJECT",
              rejectionReason: reasonToUse,
            },
          ],
          teacherId: currentUser?.$id,
          batchId: selectedBatchId,
        });
        toast.info(`Rejected request for ${target.date}. Marked as Absent.`);
      }
      setRejectingRecord(null);
      setIsBulkRejecting(false);
      setRejectionReasonText("");
      await fetchMonthData();
      await fetchCumulativeInceptionStats();
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.error(err.message || "Failed to reject request");
    } finally {
      setIsVerifyingAction(false);
    }
  };

  // Teacher Action: Apply Single Attendance Status (or Clear)
  const handleApplyStatus = async (newStatus) => {
    if (!canEditSelected || updatingDateKey) return;

    setUpdatingDateKey(selectedDateKey);
    try {
      if (newStatus === "clear" || newStatus === "undo" || !newStatus) {
        if (selectedRawRecord?.$id) {
          await newAttendanceService.deleteAttendance(selectedRawRecord.$id);
          toast.success(`Cleared attendance for ${selectedDateKey}`);
        }
      } else {
        const payload = attendanceTrackingService.createAttendancePayload({
          userId,
          batchId: selectedBatchId,
          tradeId: batchData?.tradeId?.$id || batchData?.tradeId || null,
          date: selectedDateKey,
          status: newStatus,
          verificationStatus: "VERIFIED",
          verifiedBy: currentUser?.$id,
          verifiedAt: new Date().toISOString(),
          rejectionReason: null,
        });

        if (selectedRawRecord?.$id) {
          await newAttendanceService.updateAttendance(selectedRawRecord.$id, payload);
          toast.success(`Updated attendance to ${newStatus.toUpperCase()}`);
        } else {
          await newAttendanceService.createAttendance(payload);
          toast.success(`Marked attendance as ${newStatus.toUpperCase()}`);
        }
      }

      await fetchMonthData();
      await fetchCumulativeInceptionStats();
    } catch (err) {
      console.error("Error setting attendance:", err);
      toast.error(err.message || "Failed to update attendance");
    } finally {
      setUpdatingDateKey(null);
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => setSelectedMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth((prev) => addMonths(prev, 1));
  const handleSelectMonth = (e) => {
    const monthIdx = parseInt(e.target.value, 10);
    const newDate = new Date(selectedMonth);
    newDate.setMonth(monthIdx);
    setSelectedMonth(newDate);
  };
  const handleSelectYear = (e) => {
    const yearVal = parseInt(e.target.value, 10);
    const newDate = new Date(selectedMonth);
    newDate.setFullYear(yearVal);
    setSelectedMonth(newDate);
  };
  const handleResetToCurrentMonth = () => setSelectedMonth(new Date());

  // Performance Donut circumference
  const R = 38;
  const CIRC = 2 * Math.PI * R;
  const dash = (combinedOverallStats.totalRate / 100) * CIRC;

  if (loadingStudent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <LoaderCircle className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
          Loading student attendance profile...
        </p>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-lg space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Student Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Could not find an enrolled student with ID <code className="font-mono text-indigo-600">{userId}</code>.
          </p>
          <button
            onClick={() => navigate("/attendance/register")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
          >
            ← Return to Attendance Register
          </button>
        </div>
      </div>
    );
  }

  const studentInitial = studentProfile?.userName?.charAt(0)?.toUpperCase() || studentProfile?.name?.charAt(0)?.toUpperCase() || "S";
  const rollNo = studentRecord?.rollNumber || studentProfile?.rollNo || studentProfile?.rollNumber || "N/A";
  const studentName = studentProfile?.userName || studentProfile?.name || "Student";

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
      {/* ── TOP HERO HEADER BAR ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/40 text-white p-4 sm:p-6 shadow-md">
        {/* Ambient glow effects */}
        <div className="absolute top-[-80px] right-[-40px] w-[260px] h-[260px] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[220px] h-[220px] rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col gap-4 relative z-10">
          
          {/* Top Row: Back button & Batch Context */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/attendance/register")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-white transition-all border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Attendance Register</span>
            </button>

            {/* Batch Selector (if student is in multiple batches or teacher wants to switch) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-200/80 font-medium hidden sm:inline">Active Batch:</span>
              {studentBatches.length > 1 ? (
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="bg-slate-800/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-400/30 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                >
                  {studentBatches.map((b) => (
                    <option key={b.batchId || b.$id} value={b.batchId || b.$id}>
                      {b.batchName || b.BatchName || `Batch ${b.batchId || b.$id}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-200 text-xs font-bold border border-indigo-400/30 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  {batchData?.BatchName || batchData?.batchName || "Assigned Batch"}
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  fetchMonthData();
                  fetchCumulativeInceptionStats();
                }}
                disabled={loadingAttendance}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition cursor-pointer"
                title="Refresh student attendance data"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAttendance ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Profile & Identity Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-indigo-400/50 shadow-md">
                <AvatarImage src={studentProfile.profileImage} alt={studentName} />
                <AvatarFallback className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xl">
                  {studentInitial}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {studentName}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/15 text-indigo-200 border border-white/20">
                    Roll #{rollNo}
                  </span>
                  {studentProfile.isTeacher && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      Instructor
                    </span>
                  )}
                </div>

                <div className="text-xs text-indigo-200/80 flex items-center gap-2 flex-wrap">
                  {batchData?.tradeId?.tradeName && (
                    <span className="text-slate-300 font-medium">
                      {batchData.tradeId.tradeName}
                    </span>
                  )}
                  {studentEnrollDateStr && (
                    <>
                      <span className="opacity-40">•</span>
                      <span>Enrolled: <strong className="text-white font-mono">{studentEnrollDateStr}</strong></span>
                    </>
                  )}
                  {rawBatchStartDate && (
                    <>
                      <span className="opacity-40">•</span>
                      <span>Batch: <strong className="text-white font-mono">{rawBatchStartDate}</strong> → <strong className="text-white font-mono">{rawBatchEndDate || "Ongoing"}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Quick Standing Badge */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 px-4 backdrop-blur-xs self-start md:self-auto">
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r={R} fill="none" className="stroke-white/10" strokeWidth="8" />
                  <circle
                    cx="44" cy="44" r={R} fill="none"
                    className={`transition-all duration-700 ease-out ${combinedOverallStats.isGoodStanding ? "stroke-emerald-400" : "stroke-rose-400"}`}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${dash} 999`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-black text-xs ${combinedOverallStats.isGoodStanding ? "text-emerald-400" : "text-rose-400"}`}>
                    {combinedOverallStats.totalRate}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Cumulative Standing
                </span>
                <span className={`text-xs font-black inline-flex items-center gap-1 ${combinedOverallStats.isGoodStanding ? "text-emerald-400" : "text-rose-400"}`}>
                  <Award className="w-3.5 h-3.5" />
                  {combinedOverallStats.isGoodStanding ? "Good Standing (≥75%)" : "Risk Warning (<75%)"}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Month Navigation & View Mode Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Month / Year Pickers */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month Select */}
            <select
              value={selectedMonth.getMonth()}
              onChange={handleSelectMonth}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>{name}</option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedMonth.getFullYear()}
              onChange={handleSelectYear}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {[-2, -1, 0, 1].map((offset) => {
                const yr = new Date().getFullYear() + offset;
                return <option key={yr} value={yr}>{yr}</option>;
              })}
            </select>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition cursor-pointer"
            >
              Current Month
            </button>
          </div>

          {/* Right: View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Calendar Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Log View</span>
            </button>
          </div>

        </div>

        {/* ── 2-COLUMN MAIN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          
          {/* LEFT COLUMN: Actions Toolbar & Calendar / Log View */}
          <div className="flex flex-col gap-4 min-w-0">
            
            {/* Comprehensive Student Pending Verification Hub */}
            {pendingRequests.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/10 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 animate-in fade-in">
                {/* Hub Header & Batch Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Clock className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 flex items-center gap-2">
                        <span>Pending Attendance Verification</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-950 border border-amber-300 dark:bg-amber-900 dark:text-amber-200">
                          {pendingRequests.length} Request{pendingRequests.length > 1 ? "s" : ""}
                        </span>
                      </h4>
                      <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 font-medium">
                        Student submitted past attendance/leaves awaiting your review.
                      </p>
                    </div>
                  </div>

                  {/* Batch Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleApproveAllPending}
                      disabled={isVerifyingAction}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      title={`Approve all ${pendingRequests.length} pending requests`}
                    >
                      {isVerifyingAction ? (
                        <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Approve All ({pendingRequests.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkRejecting(true);
                        setRejectingRecord(null);
                        setRejectionReasonText("");
                      }}
                      disabled={isVerifyingAction}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      title="Reject all pending requests"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject All</span>
                    </button>
                  </div>
                </div>

                {/* Compact List of Pending Request Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {pendingRequests.map((req) => {
                    const isSelected = selectedDateKey === req.date;
                    const info = getStatusBadge(req.status || req.leaveType || "present");
                    let formattedDate = req.date;
                    try {
                      formattedDate = format(parseISO(req.date), "EEE, MMM d");
                    } catch (e) {}

                    return (
                      <div
                        key={req.$id || req.date}
                        onClick={() => setSelectedDateKey(req.date)}
                        className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? "bg-amber-100/90 dark:bg-amber-950/80 border-amber-500 ring-2 ring-amber-400 shadow-xs"
                            : "bg-white/90 dark:bg-slate-800/90 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                            {formattedDate}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${info.cls}`}>
                            {info.badge} ({info.label})
                          </span>
                        </div>

                        {req.remarks ? (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-1" title={req.remarks}>
                            "{req.remarks}"
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">No remarks provided</p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                          <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {req.markedAt ? formatAttendanceTime(req, "hh:mm a") : "Awaiting review"}
                          </span>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleApprovePending(req)}
                              disabled={isVerifyingAction}
                              className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
                              title="Approve this request"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingRecord(req);
                                setIsBulkRejecting(false);
                                setRejectionReasonText("");
                              }}
                              disabled={isVerifyingAction}
                              className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold flex items-center gap-0.5 cursor-pointer"
                              title="Reject this request"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Direct Status Action Toolbar */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/60 dark:bg-indigo-950/40 p-4 space-y-3 shadow-xs">
              
              {/* Selected date title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CalendarIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Selected: {format(selectedDateObj, "EEEE, MMMM d, yyyy")}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${selectedBadgeInfo.cls}`}>
                    {selectedBadgeInfo.label} ({selectedBadgeInfo.badge})
                  </span>
                </div>

                {updatingDateKey === selectedDateKey && (
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </span>
                )}
              </div>

              {/* Dedicated Review & Approve/Reject Card (For Pending Requests) */}
              {isSelectedPending && selectedRawRecord && (
                <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/90 dark:border-amber-600 dark:bg-amber-950/70 p-3.5 sm:p-4 space-y-3 shadow-md animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                      <span className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100">
                        Review Attendance Request for {selectedDateKey}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-amber-200 text-amber-950 border border-amber-300 dark:bg-amber-900 dark:text-amber-200">
                      Requested: {selectedBadgeInfo.label} ({selectedBadgeInfo.badge})
                    </span>
                  </div>

                  {/* Quota Context Banner */}
                  {["cl", "casual"].includes(String(selectedRawRecord.status || "").toLowerCase()) && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs flex items-center justify-between">
                      <span className="text-indigo-900 dark:text-indigo-200 font-semibold">
                        Casual Leave (CL) Quota:
                      </span>
                      <span className={`font-mono font-black text-xs ${leaveQuota.isClExceeded ? "text-rose-600 dark:text-rose-400" : "text-indigo-800 dark:text-indigo-300"}`}>
                        {leaveQuota.clRemaining} / 12 days remaining {leaveQuota.isClExceeded ? "(Limit Exceeded!)" : "Available"}
                      </span>
                    </div>
                  )}

                  {["sl", "sick"].includes(String(selectedRawRecord.status || "").toLowerCase()) && (
                    <div className="p-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs flex items-center justify-between">
                      <span className="text-amber-950 dark:text-amber-200 font-semibold">
                        Sick Leave (SL) Quota:
                      </span>
                      <span className={`font-mono font-black text-xs ${leaveQuota.isSlDaysExceeded ? "text-rose-600 dark:text-rose-400" : "text-amber-900 dark:text-amber-300"}`}>
                        {leaveQuota.slDaysRemaining} / 15 days remaining ({leaveQuota.slSpellsRemaining}/2 spells) {leaveQuota.isSlDaysExceeded ? "(Limit Exceeded!)" : "Available"}
                      </span>
                    </div>
                  )}

                  <div className="text-xs space-y-1.5 bg-white/90 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>Requested Date: <strong className="text-slate-900 dark:text-white font-mono">{selectedDateKey}</strong></span>
                      {selectedRawRecord.markedAt && (
                        <span>Submitted At: <strong className="text-slate-900 dark:text-white">{formatAttendanceTime(selectedRawRecord, "MMM d, hh:mm a")}</strong></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 pt-1">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Student's Reason / Remarks: </span>
                      <span className="italic font-medium">"{selectedRawRecord.remarks || "No reason specified"}"</span>
                    </p>
                  </div>

                  {/* Immediate Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleApprovePending(selectedRawRecord)}
                      disabled={isVerifyingAction}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isVerifyingAction ? (
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Approve Request ({selectedBadgeInfo.badge})</span>
                    </button>

                    {/* Alternative Approval as Present if requested something else */}
                    {selectedBadgeInfo.badge !== "P" && (
                      <button
                        type="button"
                        onClick={() => handleApprovePending(selectedRawRecord, "present")}
                        disabled={isVerifyingAction}
                        className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 border border-emerald-300 dark:border-emerald-800"
                        title="Approve as Present instead"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Approve as Present (P)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setRejectingRecord(selectedRawRecord);
                        setIsBulkRejecting(false);
                        setRejectionReasonText("");
                      }}
                      disabled={isVerifyingAction}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Reject (Mark Absent)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Inline Rejection Reason Modal / Drawer */}
              {(rejectingRecord || isBulkRejecting) && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/90 border-2 border-rose-300 dark:border-rose-800 animate-in slide-in-from-bottom duration-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-100">
                        {isBulkRejecting
                          ? `Rejecting All ${pendingRequests.length} Requests (Mark as Absent)`
                          : `Reject Request for ${rejectingRecord?.date || selectedDateKey} (Mark as Absent)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingRecord(null);
                        setIsBulkRejecting(false);
                      }}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Quick Reason Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {REJECTION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectionReasonText(preset)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-medium hover:bg-rose-100 transition cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    placeholder="Provide a reason for the student..."
                    className="w-full text-xs p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingRecord(null);
                        setIsBulkRejecting(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReject}
                      disabled={isVerifyingAction}
                      className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingAction && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
                      <span>Confirm Rejection</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Rejected Notice */}
              {isSelectedRejected && selectedRawRecord && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-2.5 px-3 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Request Rejected:</strong> "{selectedRawRecord.rejectionReason || "Rejected by instructor"}" (Marked as Absent)
                  </span>
                </div>
              )}

              {/* Status Action Buttons Toolbar */}
              {canEditSelected ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 block sm:inline">Set Status:</span>
                  
                  {/* Present */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("present")}
                    disabled={updatingDateKey === selectedDateKey}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      String(selectedStatus || "").toLowerCase() === "present" || String(selectedStatus || "").toLowerCase() === "p"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-emerald-800 hover:bg-emerald-100 border-emerald-300 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-800"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> Present (P)
                  </button>

                  {/* Absent */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("absent")}
                    disabled={updatingDateKey === selectedDateKey}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      String(selectedStatus || "").toLowerCase() === "absent" || String(selectedStatus || "").toLowerCase() === "a"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white text-rose-800 hover:bg-rose-100 border-rose-300 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-800"
                    }`}
                  >
                    <UserX className="h-3.5 w-3.5" /> Absent (A)
                  </button>

                  {/* Casual Leave */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("casual")}
                    disabled={updatingDateKey === selectedDateKey}
                    title={leaveQuota.isClExceeded ? "Warning: CL Quota Exceeded (12/yr)" : "Casual Leave"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      String(selectedStatus || "").toLowerCase() === "casual" || String(selectedStatus || "").toLowerCase() === "cl"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-white text-amber-800 hover:bg-amber-100 border-amber-300 dark:bg-slate-900 dark:text-amber-300 dark:border-amber-800"
                    }`}
                  >
                    <span>CL ({leaveQuota.clRemaining} left)</span>
                    {leaveQuota.isClExceeded && <AlertCircle className="w-3.5 h-3.5 text-rose-300" />}
                  </button>

                  {/* Sick Leave */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("sick")}
                    disabled={updatingDateKey === selectedDateKey}
                    title={leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded ? "Warning: SL Limit Exceeded" : "Sick Leave"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      String(selectedStatus || "").toLowerCase() === "sick" || String(selectedStatus || "").toLowerCase() === "sl"
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-white text-sky-800 hover:bg-sky-100 border-sky-300 dark:bg-slate-900 dark:text-sky-300 dark:border-sky-800"
                    }`}
                  >
                    <span>SL ({leaveQuota.slDaysRemaining}d left)</span>
                    {(leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded) && <AlertCircle className="w-3.5 h-3.5 text-rose-300" />}
                  </button>

                  {/* Special Leave */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("special")}
                    disabled={updatingDateKey === selectedDateKey}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      String(selectedStatus || "").toLowerCase() === "special" || String(selectedStatus || "").toLowerCase() === "spl"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-white text-purple-800 hover:bg-purple-100 border-purple-300 dark:bg-slate-900 dark:text-purple-300 dark:border-purple-800"
                    }`}
                  >
                    <span>SPL</span>
                  </button>

                  {/* On Duty */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("on_duty")}
                    disabled={updatingDateKey === selectedDateKey}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      String(selectedStatus || "").toLowerCase() === "on_duty" || String(selectedStatus || "").toLowerCase() === "od"
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-white text-teal-800 hover:bg-teal-100 border-teal-300 dark:bg-slate-900 dark:text-teal-300 dark:border-teal-800"
                    }`}
                  >
                    <span>OD</span>
                  </button>

                  {/* Half Day */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("half_day")}
                    disabled={updatingDateKey === selectedDateKey}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      String(selectedStatus || "").toLowerCase() === "half_day" || String(selectedStatus || "").toLowerCase() === "hd"
                        ? "bg-yellow-500 text-white border-yellow-500 shadow-xs"
                        : "bg-white text-yellow-800 hover:bg-yellow-100 border-yellow-300 dark:bg-slate-900 dark:text-yellow-300 dark:border-yellow-800"
                    }`}
                  >
                    <span>HD</span>
                  </button>

                  {/* Late */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("late")}
                    disabled={updatingDateKey === selectedDateKey}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      String(selectedStatus || "").toLowerCase() === "late" || String(selectedStatus || "").toLowerCase() === "l"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-indigo-800 hover:bg-indigo-100 border-indigo-300 dark:bg-slate-900 dark:text-indigo-300 dark:border-indigo-800"
                    }`}
                  >
                    <span>L</span>
                  </button>

                  {/* Undo / Clear */}
                  <button
                    type="button"
                    onClick={() => handleApplyStatus("clear")}
                    disabled={updatingDateKey === selectedDateKey}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border bg-slate-100 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-900 flex items-center gap-1 ml-auto cursor-pointer"
                    title="Undo / Clear attendance for this date"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Clear</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                  {isSelectedHoliday
                    ? `Exempted: ${holidays.get(selectedDateKey)?.holidayText || "Campus Holiday"}`
                    : isSelectedFuture
                    ? "Future date — Attendance marking disabled."
                    : isSelectedBeforeEnrollment
                    ? `Date is before student's enrollment date (${studentEnrollDateStr}).`
                    : "Date outside batch operational period."}
                </p>
              )}

            </div>

            {/* ── MODE A: CALENDAR GRID VIEW ── */}
            {viewMode === "calendar" ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{format(selectedMonth, "MMMM yyyy")} Attendance Matrix</span>
                  </h3>
                  <span className="text-xs text-slate-400">Click any date to inspect or mark</span>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-xs text-slate-500 dark:text-slate-400 py-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                  {WEEK_DAYS.map((wd) => (
                    <div key={wd}>{wd}</div>
                  ))}
                </div>

                {/* Grid cells */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {Array.from({ length: leadingBlankDays }).map((_, idx) => (
                    <div
                      key={`blank-${idx}`}
                      className="h-[68px] rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-transparent"
                    />
                  ))}

                  {monthDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const status = attendanceStatusMap.get(dateKey);
                    const isHoliday = holidays.has(dateKey);
                    const isFuture = isAfter(day, new Date());
                    const isBeforeBatch = rawBatchStartDate && isBefore(day, new Date(rawBatchStartDate));
                    const isAfterBatch = rawBatchEndDate && isAfter(day, new Date(rawBatchEndDate));
                    const isBeforeEnrollment = studentEnrollDateStr ? dateKey < studentEnrollDateStr : false;
                    const canEdit = !isHoliday && !isFuture && !isBeforeBatch && !isAfterBatch && !isBeforeEnrollment;

                    const isUpdating = updatingDateKey === dateKey;
                    const badgeInfo = getStatusBadge(status);
                    const isSelected = selectedDateKey === dateKey;
                    const rawRec = rawAttendanceMap.get(dateKey);
                    const markedAtTime = rawRec ? formatAttendanceTime(rawRec, "hh:mm a") : null;
                    const isCellPending = rawRec?.verificationStatus === "PENDING";

                    return (
                      <button
                        key={dateKey}
                        disabled={!canEdit || isUpdating}
                        onClick={() => setSelectedDateKey(dateKey)}
                        className={`h-[68px] rounded-xl border text-left p-1.5 transition disabled:cursor-not-allowed disabled:opacity-60 flex flex-col justify-between relative cursor-pointer ${
                          isSelected ? "ring-2 ring-indigo-500 border-indigo-500 shadow-md scale-[1.02] z-10" : ""
                        } ${
                          isBeforeEnrollment
                            ? "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700"
                            : isHoliday
                            ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                            : isBeforeBatch || isAfterBatch
                            ? "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700"
                            : isCellPending
                            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400"
                            : badgeInfo.cls
                        }`}
                        title={
                          isBeforeEnrollment
                            ? `Date is before student's enrollment (${studentEnrollDateStr})`
                            : isHoliday
                            ? holidays.get(dateKey)?.holidayText || "Campus Holiday"
                            : isCellPending
                            ? `⏳ Pending Approval: ${badgeInfo.label}${markedAtTime ? ` • Marked at ${markedAtTime}` : ""} - Click to review request`
                            : `${badgeInfo.label}${markedAtTime ? ` • Marked at ${markedAtTime}` : ""}`
                        }
                      >
                        <div className="flex justify-between items-start">
                          <p className={`text-xs font-extrabold ${isAfterBatch || isBeforeEnrollment ? "line-through opacity-50" : ""}`}>
                            {format(day, "d")}
                          </p>
                          {isUpdating ? (
                            <LoaderCircle className="h-3 w-3 animate-spin text-indigo-500" />
                          ) : isCellPending ? (
                            <span className="flex h-2 w-2 relative" title="Pending Verification">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide font-black truncate">
                          <span>
                            {isBeforeEnrollment
                              ? "X"
                              : isHoliday
                              ? "Holiday"
                              : isBeforeBatch
                              ? "Pre-Batch"
                              : isAfterBatch
                              ? "Post-Batch"
                              : isFuture
                              ? "Future"
                              : isCellPending
                              ? `⏳ ${badgeInfo.badge}`
                              : badgeInfo.badge}
                          </span>
                          {markedAtTime && !isCellPending && (
                            <span className="text-[9px] font-mono font-normal opacity-70 hidden sm:inline">
                              {markedAtTime}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Grid Legend */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Legend:</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present (P)</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent (A)</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Leaves (CL/SL/SPL)</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> Pending Request</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Campus Holiday</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Not Enrolled (X)</span>
                </div>
              </div>
            ) : (
              /* ── MODE B: DETAILED CHRONOLOGICAL LOG VIEW ── */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Daily Attendance Audit Log ({format(selectedMonth, "MMMM yyyy")})</span>
                  </h3>
                  <span className="text-xs text-slate-400">{monthDays.length} Days in Period</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Verification</th>
                        <th className="py-2.5 px-3">Marked At</th>
                        <th className="py-2.5 px-3">Source</th>
                        <th className="py-2.5 px-3">Remarks</th>
                        <th className="py-2.5 px-3 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {monthDays.map((day) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const status = attendanceStatusMap.get(dateKey);
                        const isHoliday = holidays.has(dateKey);
                        const isFuture = isAfter(day, new Date());
                        const isBeforeEnrollment = studentEnrollDateStr ? dateKey < studentEnrollDateStr : false;
                        const rawRec = rawAttendanceMap.get(dateKey);
                        const badgeInfo = getStatusBadge(status);
                        const isPending = rawRec?.verificationStatus === "PENDING";
                        const isRejected = rawRec?.verificationStatus === "REJECTED";

                        return (
                          <tr
                            key={dateKey}
                            onClick={() => setSelectedDateKey(dateKey)}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                              selectedDateKey === dateKey ? "bg-indigo-50/50 dark:bg-indigo-950/30" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {format(day, "MMM d, yyyy")} ({format(day, "EEE")})
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isBeforeEnrollment ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Not Enrolled</span>
                              ) : isHoliday ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  {holidays.get(dateKey)?.holidayText || "Holiday"}
                                </span>
                              ) : isFuture ? (
                                <span className="text-slate-400 italic text-[11px]">Future</span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeInfo.cls}`}>
                                  {badgeInfo.label} ({badgeInfo.badge})
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isPending ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse">
                                  ⏳ PENDING
                                </span>
                              ) : isRejected ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  ✕ REJECTED
                                </span>
                              ) : rawRec ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  ✓ VERIFIED
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                              {rawRec ? formatAttendanceTime(rawRec, "hh:mm a") : "—"}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px] uppercase">
                              {rawRec?.source || "—"}
                            </td>

                            <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-600 dark:text-slate-300 text-[11px]" title={rawRec?.remarks}>
                              {rawRec?.remarks || "—"}
                            </td>

                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDateKey(dateKey);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[10px] hover:bg-amber-600 transition"
                                >
                                  Review
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDateKey(dateKey);
                                  }}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                >
                                  Select
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Analytics, Stats & Annual Quotas */}
          <div className="flex flex-col gap-4">
            
            {/* ── CARD 1: Overall Attendance Performance Ring ── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-[84px] h-[84px] flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r={R} fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="9" />
                    <circle
                      cx="44" cy="44" r={R} fill="none"
                      className={`transition-all duration-1000 ease-out ${combinedOverallStats.isGoodStanding ? "stroke-indigo-600 dark:stroke-indigo-400" : "stroke-rose-500 dark:stroke-rose-400"}`}
                      strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${dash} 999`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col justify-center items-center">
                    <span className={`font-black text-base leading-none ${combinedOverallStats.isGoodStanding ? "text-indigo-600 dark:text-indigo-400" : "text-rose-500"}`}>
                      {combinedOverallStats.totalRate}%
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Overall</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-0.5">
                    Attendance Performance
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-2 leading-snug">
                    {studentEnrollDateStr || rawBatchStartDate || "Start"} → {format(new Date(), "dd MMM yyyy")}
                  </p>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${combinedOverallStats.isGoodStanding ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}>
                    <Award size={11} />
                    {combinedOverallStats.isGoodStanding ? "Good Standing (≥75%)" : "Risk Warning (<75%)"}
                  </div>
                </div>
              </div>

              {/* Quick 3-metric numbers */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-center">
                <div>
                  <div className="text-lg font-black text-slate-700 dark:text-slate-200">{combinedOverallStats.totalWorking}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Working</div>
                </div>
                <div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{combinedOverallStats.totalPresent}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Present</div>
                </div>
                <div>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400">{combinedOverallStats.totalAbsent}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Absent</div>
                </div>
              </div>
            </div>

            {/* ── CARD 2: Current Month Attendance Summary ── */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-3xl p-4 border border-indigo-100 dark:border-indigo-900/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                    {format(selectedMonth, "MMMM yyyy")} Stats
                  </h4>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${monthStats.percentage >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {monthStats.percentage >= 75 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {monthStats.percentage}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Working</span>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">{monthStats.workingDays}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{monthStats.presentDays}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400">{monthStats.absentDays}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Holidays</span>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">{monthStats.holidaysCount}</div>
                </div>
              </div>

              {/* Month Leaves Breakdown */}
              <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                <div className="bg-white/80 dark:bg-slate-900 p-1 rounded border border-amber-200/50">
                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 block">CL</span>
                  <span className="text-xs font-black">{monthStats.clCount}</span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900 p-1 rounded border border-sky-200/50">
                  <span className="text-[9px] font-bold text-sky-700 dark:text-sky-400 block">SL</span>
                  <span className="text-xs font-black">{monthStats.slCount}</span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900 p-1 rounded border border-purple-200/50">
                  <span className="text-[9px] font-bold text-purple-700 dark:text-purple-400 block">SPL</span>
                  <span className="text-xs font-black">{monthStats.splCount}</span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900 p-1 rounded border border-teal-200/50">
                  <span className="text-[9px] font-bold text-teal-700 dark:text-teal-400 block">OD</span>
                  <span className="text-xs font-black">{monthStats.odCount}</span>
                </div>
              </div>
            </div>

            {/* ── CARD 3: Cumulative Performance (Batch Start → Previous Month) ── */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-indigo-500" />
                  Cumulative (Pre-{format(selectedMonth, "MMM")})
                </span>
                <button
                  type="button"
                  onClick={fetchCumulativeInceptionStats}
                  disabled={loadingStats}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {loadingStats ? <LoaderCircle className="h-3 w-3 animate-spin" /> : "Refresh"}
                </button>
              </div>

              {cumulativeStats ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] block font-semibold">Prev Working</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cumulativeStats.workingDays || 0}</span>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] block font-semibold">Total Present</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {cumulativeStats.totalPresent !== undefined ? cumulativeStats.totalPresent : (cumulativeStats.presentDays || 0)}
                    </span>
                  </div>
                  <div className="bg-rose-50/50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-100 dark:border-rose-900/50">
                    <span className="text-rose-600 dark:text-rose-400 text-[10px] block font-semibold">Prev Absent</span>
                    <span className="font-bold text-rose-700 dark:text-rose-300">{cumulativeStats.absentDays || 0}</span>
                  </div>
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-indigo-600 dark:text-indigo-400 text-[10px] block font-semibold">Prev Rate %</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-300">{cumulativeStats.percentage || 0}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No historical records prior to this month.
                </p>
              )}
            </div>

            {/* ── CARD 4: Annual Leave Quotas Card ── */}
            <div className="rounded-3xl border border-amber-200/80 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Palmtree className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Annual Leave Quotas ({selectedMonth.getFullYear()})
                </span>
                {(leaveQuota.isClExceeded || leaveQuota.isSlDaysExceeded || leaveQuota.isSlSpellsExceeded) && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Exceeded
                  </span>
                )}
              </div>

              <StudentLeaveQuotaBadges quota={leaveQuota} layout="grid" />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentIndividualAttendancePage;
